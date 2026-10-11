export const USERNAME_RE = /^[a-z][a-z0-9_]{2,23}$/;
export const RESERVED = new Set(['admin','administrator','soporte','support','ovio','oficial','official','moderador','moderator','staff','seguridad']);

export function normalizeUsername(value) {
  return String(value ?? '').trim().toLowerCase();
}
export function validateUsername(value) {
  const name = normalizeUsername(value);
  if (!USERNAME_RE.test(name)) return 'Utiliza de 3 a 24 caracteres: empieza por una letra y usa solo letras, números o _.';
  if (RESERVED.has(name)) return 'Este identificador está reservado.';
  return '';
}
export function normalizeArtistName(value) {
  return String(value ?? '').trim().replace(/\s+/g, ' ');
}
export function validateArtistName(value) {
  const name = normalizeArtistName(value);
  if (name.length < 2 || name.length > 70) return 'El nombre artístico debe tener de 2 a 70 caracteres.';
  return '';
}
export function validateEmail(value) {
  const email = String(value ?? '').trim();
  // Primer filtro; la prueba de control del buzón es el enlace de Supabase.
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 254) return 'Introduce una dirección de correo válida.';
  return '';
}
