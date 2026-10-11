// Algoritmo beta transparente. No usa pagos, publicidad ni datos ajenos de escucha.
export function recommendTracks({tracks=[],likes=[],listens=[],follows=[],followerCounts=[],limit=30}) {
  const safeTracks = tracks.filter(t=>t.status==='approved');
  const byId = new Map(safeTracks.map(t=>[t.id,t]));
  const genreWeights = new Map();
  const heard = new Set();
  const add=(genre,n)=>genreWeights.set(genre,(genreWeights.get(genre)||0)+n);
  for (const item of listens) {
    const t=byId.get(item.track_id);if(t){add(t.genre,2);heard.add(t.id);}
  }
  for (const item of likes) {
    const t=byId.get(item.track_id);if(t)add(t.genre,4);
  }
  const followed = new Set(follows.map(f=>f.artist_id));
  const followerMap = new Map(followerCounts.map(f=>[f.artist_id,Number(f.follower_count)||0]));
  const latest = Date.now();
  const ranked = safeTracks.map((track,i)=>{
    const ageDays=Math.max(0,(latest-new Date(track.created_at).getTime())/86400000);
    const recency=Number.isFinite(ageDays)?Math.max(0,6-ageDays/12):0;
    const emerging=Math.max(0,4-Math.log2((followerMap.get(track.artist_id)||0)+1));
    return {track, i, score:(genreWeights.get(track.genre)||0)*1.6 +
      (followed.has(track.artist_id)?12:0) + recency + emerging - (heard.has(track.id)?7:0)};
  }).sort((a,b)=>b.score-a.score||a.i-b.i);
  // Evita monopolizar el inicio con un único creador cuando existe oferta variada.
  const picked=[], deferred=[], perArtist=new Map();
  for(const item of ranked){
    const count=perArtist.get(item.track.artist_id)||0;
    if(count<2){picked.push(item.track);perArtist.set(item.track.artist_id,count+1);}
    else deferred.push(item.track);
  }
  return [...picked,...deferred].slice(0,Math.max(0,limit));
}

export function latestFromFollowed({tracks=[],follows=[],limit=6}) {
  const ids=new Set(follows.map(f=>f.artist_id));
  return tracks.filter(t=>t.status==='approved'&&ids.has(t.artist_id))
    .sort((a,b)=>new Date(b.created_at)-new Date(a.created_at)).slice(0,limit);
}
