// Datos de un piloto: no estimar usuarios no consentidos como si no escucharan música.
export const PILOT_STEPS = Object.freeze([
  {id:'profile',title:'Personaliza tu perfil',description:'Elige un nombre de usuario único para tu cuenta.',destination:'profile'},
  {id:'favorite',title:'Guarda una canción',description:'Explora artistas emergentes y marca una canción como favorita.',destination:'explore'},
  {id:'playlist',title:'Crea tu primera playlist',description:'Reúne música de OVIO en una lista pública o privada.',destination:'library'},
  {id:'follow',title:'Sigue a un artista',description:'Sus lanzamientos aparecerán entre tus recomendaciones.',destination:'explore'}
]);
export function pilotStepStatus({username='',favoriteCount=0,playlistCount=0,followCount=0}={}){
  const profile=Boolean(username && !/^u_[0-9a-f-]{32,}$/i.test(username));
  return {profile,favorite:favoriteCount>0,playlist:playlistCount>0,follow:followCount>0};
}
export function pilotProgress(status){
  return PILOT_STEPS.reduce((total,step)=>total+(status?.[step.id]?1:0),0);
}
export function pilotMetrics(raw){
  const n=(key)=>{
    const value=Number(raw?.[key]);
    return Number.isFinite(value)&&value>=0?Math.floor(value):0;
  };
  return {
    registeredUsers:n('registered_users'),newUsers7d:n('new_users_7d'),
    approvedArtists:n('artists_approved'),pendingArtists:n('artists_pending'),
    approvedTracks:n('tracks_approved'),pendingTracks:n('tracks_pending'),
    openFeedback:n('feedback_open'),reviewingFeedback:n('feedback_reviewing'),resolvedFeedback:n('feedback_resolved'),
    listeningMinutes7d:n('listening_minutes_7d'),validPlays7d:n('valid_plays_7d'),
    activeListeners7d:n('active_listeners_7d')
  };
}
