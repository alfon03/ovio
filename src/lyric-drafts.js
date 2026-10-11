// Validación de borradores de letras: la privacidad REAL la aplica RLS en Supabase.
export const LYRIC_TITLE_MAX = 120;
export const LYRIC_BODY_MAX = 30000;
export function validateLyricDraft({title='', body=''}) {
  if (!String(title).trim()) return 'Escribe un título para el borrador.';
  if (String(title).trim().length > LYRIC_TITLE_MAX) return `El título no puede superar ${LYRIC_TITLE_MAX} caracteres.`;
  if (String(body).length > LYRIC_BODY_MAX) return `La letra no puede superar ${LYRIC_BODY_MAX} caracteres.`;
  return '';
}
export function cleanLyricDraft({title='', body='', track_id=null}) {
  return {title: String(title).trim(), body: String(body).replace(/\r\n?/g,'\n'), track_id: track_id || null};
}
