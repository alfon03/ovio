import { createClient } from '@supabase/supabase-js';

const url = import.meta.env.VITE_SUPABASE_URL;
const key = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;
export const configured = Boolean(url && key && url.startsWith('https://') && !url.includes('tu-proyecto') && !key.startsWith('tu-clave'));
export const supabase = configured
  ? createClient(url, key, { auth: { autoRefreshToken: true, persistSession: true, detectSessionInUrl: true } })
  : null;

export function assetUrl(bucket, path) {
  if (!supabase || !path) return '';
  return supabase.storage.from(bucket).getPublicUrl(path).data.publicUrl;
}

export function safeError(error) {
  return error?.message || 'Ha ocurrido un error. Prueba de nuevo.';
}
