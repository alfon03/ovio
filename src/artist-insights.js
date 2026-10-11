// Formateo defensivo del resultado agregado de Supabase.
// No hay datos de oyentes individuales ni estadísticas simuladas.
export const intervals = [1, 3, 6, 12];
export function safeCount(input) {
  const value = Number(input);
  return Number.isFinite(value) && value > 0 ? Math.floor(value) : 0;
}
export function formatMonth(month) {
  if (!/^\d{4}-(0[1-9]|1[0-2])$/.test(String(month))) return String(month || '');
  const [year, m] = month.split('-').map(Number);
  return new Intl.DateTimeFormat('es-ES', { month:'short', year:'2-digit', timeZone:'UTC' })
    .format(new Date(Date.UTC(year, m-1, 1)));
}
export function normalizedInsights(data) {
  const summary = data?.summary && typeof data.summary === 'object' ? data.summary : {};
  const metricKeys = ['plays','listeners','minutes','approved_tracks','followers','current_followers_joined_last_30d'];
  const totals = Object.fromEntries(metricKeys.map(k => [k, safeCount(summary[k])]));
  const months = Array.isArray(data?.months) ? data.months.filter(row => /^\d{4}-(0[1-9]|1[0-2])$/.test(row?.month))
    .map(row => ({ month: row.month, plays: safeCount(row.plays), listeners: safeCount(row.listeners), minutes: safeCount(row.minutes) })) : [];
  const tracks = Array.isArray(data?.tracks) ? data.tracks
    .filter(row => typeof row?.title === 'string')
    .map(row => ({track_id: row.track_id, title: row.title, genre: row.genre || 'Otro', plays: safeCount(row.plays), listeners: safeCount(row.listeners), minutes: safeCount(row.minutes)})) : [];
  return {totals, months, tracks, from:data?.from || '', to:data?.to || ''};
}
