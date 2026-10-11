// Los códigos MediaError son los definidos por HTMLMediaElement.error.
export function playbackErrorMessage(code, offline = false) {
  if (offline) return 'Sin conexión. Vuelve a conectarte para cargar la canción.';
  if (code === 2) return 'La conexión interrumpió la reproducción. Puedes reintentarla.';
  if (code === 3 || code === 4) return 'El navegador no pudo reproducir este audio.';
  return 'No se pudo cargar esta canción. Prueba de nuevo.';
}
export function canRetryPlayback(track, offline = false) {
  return Boolean(track?.audio_path && track?.status === 'approved' && !offline);
}
