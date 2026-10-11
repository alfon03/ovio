/** Anota localmente una escucha aceptada por Supabase, sin recargar todo el catálogo.
 * Nunca decide el conteo oficial: el servidor aplica unicidad y políticas RLS. */
export function appendListen(previous, accepted, maxItems=1000) {
  if (!accepted?.user_id || !accepted?.track_id) return previous;
  const items = Array.isArray(previous) ? previous : [];
  return [...items, accepted].slice(-Math.max(1,maxItems));
}
