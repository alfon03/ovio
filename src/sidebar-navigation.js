// Menús de OVIO. La visibilidad en la interfaz no sustituye los permisos RLS.
export const EXPLORE_ITEMS = Object.freeze([
  {id:'home',label:'Inicio',icon:'home'},
  {id:'search',label:'Buscar',icon:'search'},
  {id:'explore',label:'Descubrir',icon:'compass'},
  {id:'library',label:'Tu biblioteca',icon:'library'},
  {id:'community',label:'Comunidad',icon:'users'},
  {id:'charts',label:'Top OVIO',icon:'trophy'},
  {id:'recap',label:'Mi año en OVIO',icon:'calendar'},
  {id:'pilot-start',label:'Primeros pasos',icon:'checklist'},
  {id:'feedback',label:'Ayuda y sugerencias',icon:'feedback'}
]);

export function getNavigationGroups({approvedArtist=false,isAdmin=false}={}) {
  const creators = [
    {id:'studio',label:'OVIO Studio',icon:'studio'},
    ...(approvedArtist ? [
      {id:'lyric-drafts',label:'Mis letras privadas',icon:'lyrics'},
      {id:'insights',label:'Mis estadísticas',icon:'stats'}
    ] : []),
    {id:'notifications',label:'Notificaciones',icon:'bell'}
  ];
  return [
    {id:'explore',label:'Explorar',icon:'compass',items:EXPLORE_ITEMS},
    {id:'creators',label:'Creadores',icon:'studio',items:creators},
    ...(isAdmin ? [{id:'moderation',label:'Moderación',icon:'shield',items:[
      {id:'admin',label:'Revisión de contenido',icon:'shield'},
      {id:'feedback-admin',label:'Comentarios beta',icon:'feedback'},
      {id:'pilot-admin',label:'Panel del piloto',icon:'checklist'}
    ]}] : [])
  ];
}

export function groupForPage(page,options={}) {
  return getNavigationGroups(options).find(group=>group.items.some(item=>item.id===page))?.id ?? null;
}
