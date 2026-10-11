// Colecciones editoriales automáticas. Solo usan canciones ya aprobadas.
// No compran posiciones ni necesitan recopilar estadísticas privadas adicionales.
function dateValue(value) {
  const date = Date.parse(value || '');
  return Number.isFinite(date) ? date : 0;
}

function diverse(tracks, limit) {
  const selected = [];
  const deferred = [];
  const seen = new Set();
  for (const track of tracks) {
    if (seen.has(track.artist_id)) deferred.push(track);
    else { selected.push(track); seen.add(track.artist_id); }
  }
  return [...selected, ...deferred].slice(0, limit);
}

export function buildExploreCollections({tracks = [], followerCounts = [], limit = 8} = {}) {
  const approved = tracks.filter(track => track?.status === 'approved' && track.audio_path);
  const newestFirst = [...approved].sort((a, b) => dateValue(b.created_at) - dateValue(a.created_at) || String(a.id).localeCompare(String(b.id)));
  const followers = new Map(followerCounts.map(row => [row.artist_id, Number(row.follower_count) || 0]));
  const genreMap = new Map();
  for (const track of approved) {
    const name = String(track.genre || 'Otro').trim() || 'Otro';
    const previous = genreMap.get(name);
    genreMap.set(name, {genre: name, count: (previous?.count || 0) + 1, sample: previous?.sample || track});
  }
  const genres = [...genreMap.values()].sort((a, b) => b.count - a.count || a.genre.localeCompare(b.genre, 'es'));
  const underDiscovered = newestFirst.filter(track => followers.has(track.artist_id) && followers.get(track.artist_id) <= 5);
  return {
    latest: diverse(newestFirst, limit),
    hiddenGems: diverse(underDiscovered.sort((a, b) => (followers.get(a.artist_id) || 0) - (followers.get(b.artist_id) || 0) || dateValue(b.created_at) - dateValue(a.created_at)), limit),
    genres,
    total: approved.length
  };
}
