// Validación de la interfaz. La base de datos repite los límites y valida permisos.
export const FEEDBACK_CATEGORIES = [
  {value:'error', label:'He encontrado un error'},
  {value:'usabilidad',label:'Algo resulta difícil de usar'},
  {value:'idea',label:'Tengo una sugerencia'},
  {value:'otro',label:'Otra consulta sobre la beta'}
];
export const FEEDBACK_SCREENS=['Inicio','Buscar','Reproductor','Playlists','Perfil','OVIO Studio','Otra'];
export const FEEDBACK_STATES={open:'Nuevo',reviewing:'En revisión',resolved:'Resuelto',dismissed:'Cerrado'};
export const FEEDBACK_PRIORITIES={normal:'Normal',high:'Importante'};
export function validateFeedback(values){
  const category=String(values.category||'');
  const screen=String(values.screen||'');
  const title=String(values.title||'').trim();
  const details=String(values.details||'').trim();
  const priority=String(values.priority||'normal');
  if(!FEEDBACK_CATEGORIES.some(x=>x.value===category)) return 'Selecciona un tipo de comentario válido.';
  if(!FEEDBACK_SCREENS.includes(screen))return 'Selecciona la sección de OVIO.';
  if(title.length<8||title.length>120)return 'El asunto debe tener entre 8 y 120 caracteres.';
  if(details.length<15||details.length>2000)return 'La descripción debe tener entre 15 y 2.000 caracteres.';
  if(!Object.keys(FEEDBACK_PRIORITIES).includes(priority))return 'Selecciona una prioridad válida.';
  return null;
}
