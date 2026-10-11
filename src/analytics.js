// Helpers de estadísticas OVIO, sin datos personales ni llamadas a red.
// Ignora búsquedas rápidas y no suma tiempo de reproducción si el audio está pausado.
export function listenedDelta(mediaDelta, wallDelta) {
  if (!Number.isFinite(mediaDelta) || !Number.isFinite(wallDelta) || wallDelta < 0) return 0;
  if (mediaDelta <= 0 || mediaDelta > wallDelta * 1.5 + 0.6) return 0;
  return mediaDelta;
}
export function isQualifiedPlayback(seconds, duration) {
  if (!Number.isFinite(seconds) || !Number.isFinite(duration) || duration <= 0) return false;
  return seconds >= Math.min(30, Math.max(10, duration) * .5);
}
export function recapIsFinal(year, now = new Date()) {
  if (!Number.isInteger(year)) return false;
  return now.getTime() >= new Date(`${year}-11-25T00:00:00Z`).getTime();
}
