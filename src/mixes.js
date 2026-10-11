// OVIO Beta v0.9 — mixes transparentes basados en el catálogo aprobado y
// en señales del propio usuario (favoritos, artistas seguidos, escuchas).
// Sin anuncios, pagos, contenido pendiente ni acceso a historiales ajenos.
const timestamp = value => {
  const ms = Date.parse(value || '');
  return Number.isFinite(ms) ? ms : 0;
};
const unique = items => [...new Map(items.map(t => [t.id, t])).values()];

export function genrePreferences({ tracks = [], likes = [], listens = [], follows = [] } = {}) {
  const byId = new Map(tracks.filter(t => t.status === 'approved').map(t => [t.id, t]));
  const followed = new Set(follows.map(f => f.artist_id));
  const scores = new Map();
  const add = (name, points) => {
    if (name) scores.set(name, (scores.get(name) || 0) + points);
  };
  for (const item of likes) add(byId.get(item.track_id)?.genre, 5);
  // Una escucha antigua se cuenta una sola vez por canción en las preferencias.
  for (const id of new Set(listens.map(x => x.track_id))) add(byId.get(id)?.genre, 2);
  for (const t of byId.values()) if (followed.has(t.artist_id)) add(t.genre, 1);
  return [...scores].sort((a,b) => b[1]-a[1] || a[0].localeCompare(b[0]));
}

function diversified(items, limit, cap = 2) {
  const seen = new Map(), first = [], rest = [];
  for (const t of items) {
    if ((seen.get(t.artist_id) || 0) < cap) {
      first.push(t);
      seen.set(t.artist_id, (seen.get(t.artist_id) || 0) + 1);
    } else rest.push(t);
  }
  return [...first, ...rest].slice(0, limit);
}

export function buildPersonalizedMixes({ tracks = [], likes = [], listens = [], follows = [], followerCounts = [], limit = 12 } = {}) {
  const publicTracks = unique(tracks.filter(t => t.status === 'approved'));
  if (!publicTracks.length) return [];
  const max = Math.min(Math.max(Number(limit)||12,1), 30);
  const pref = genrePreferences({ tracks: publicTracks, likes, listens, follows });
  const weights = new Map(pref);
  const liked = new Set(likes.map(l => l.track_id));
  const heard = new Set(listens.map(l => l.track_id));
  const followed = new Set(follows.map(f => f.artist_id));
  const fans = new Map(followerCounts.map(f => [f.artist_id,Number(f.follower_count) || 0]));
  const now = Date.now();
  const freshness = t => Math.max(0, 5 - Math.max(0, (now - timestamp(t.created_at)) / 86400000) / 20);
  const stable = (list, score) => [...list].sort((a,b) => score(b)-score(a) || timestamp(b.created_at)-timestamp(a.created_at) || a.id.localeCompare(b.id));
  const forYou = diversified(stable(publicTracks, t =>
    (weights.get(t.genre) || 0) * 2 + (followed.has(t.artist_id) ? 10 : 0) +
    (liked.has(t.id) ? 4 : 0) + freshness(t) - (heard.has(t.id) ? 8 : 0)), max);
  // Este radar prima creadores pequeños y que el usuario aún no sigue;
  // no implica un ranking de popularidad ni acceso a métricas individuales.
  const radarCandidates = publicTracks.filter(t => !followed.has(t.artist_id) && !heard.has(t.id));
  const radar = diversified(stable(radarCandidates.length ? radarCandidates : publicTracks, t =>
    Math.max(0, 6 - Math.log2((fans.get(t.artist_id) || 0) + 1)) +
    (weights.get(t.genre) || 0) * .35 + freshness(t)), max);
  const fresh = diversified(stable(publicTracks, t =>
    (followed.has(t.artist_id) ? 4 : 0) + (weights.get(t.genre) || 0) * .25 + freshness(t)), max);
  return [
    { id:'para-ti', title:'A tu ritmo', detail:pref.length?`Basado en tu afinidad por ${pref.slice(0,2).map(([g])=>g).join(' y ')}.`:'Una selección para empezar a descubrir OVIO.', tracks:forYou },
    { id:'radar', title:'Fuera del radar', detail:'Artistas por descubrir, sin posiciones compradas.', tracks:radar },
    { id:'novedades', title:'Novedades para explorar', detail:'Lanzamientos recientes y música afín a tus gustos.', tracks:fresh }
  ].filter(m => m.tracks.length);
}

export function recommendAlbums({ releases = [], tracks = [], likes = [], listens = [], follows = [], savedIds = [], limit = 8 } = {}) {
  const publicTracks = tracks.filter(t => t.status === 'approved');
  const available = new Map();
  for (const t of publicTracks) if (t.release_id) {
    if (!available.has(t.release_id)) available.set(t.release_id, []);
    available.get(t.release_id).push(t);
  }
  const weights = new Map(genrePreferences({ tracks:publicTracks, likes, listens, follows }));
  const followed = new Set(follows.map(f => f.artist_id));
  const saved = new Set(savedIds);
  return releases.filter(r => available.has(r.id) && !saved.has(r.id)).sort((a,b) => {
    const score = r => {
      const a = available.get(r.id) || [];
      return Math.max(0,...a.map(t=>weights.get(t.genre)||0)) + (followed.has(r.artist_id)?8:0);
    };
    return score(b) - score(a) || timestamp(b.created_at) - timestamp(a.created_at) || a.id.localeCompare(b.id);
  }).slice(0,Math.max(0,limit));
}
