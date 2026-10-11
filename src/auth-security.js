// OVIO v1.1 — helpers sin acceso a Supabase para facilitar pruebas.
export function passwordIssue(password){
  if(typeof password!=='string'||password.length<12)return 'Usa una contraseña de al menos 12 caracteres.';
  if(password.length>128)return 'La contraseña puede tener un máximo de 128 caracteres.';
  if(!/[A-Za-zÀ-ÿ]/.test(password)||!/[0-9\W_]/u.test(password))return 'Combina letras con un número o símbolo.';
  return '';
}
export function recoveryRedirectUrl(origin,pathname='/'){
  const url=new URL(pathname,origin);
  url.searchParams.set('recovery','1');
  url.hash='';
  return url.toString();
}
export function isRecoveryRoute(search='',hash=''){
  return new URLSearchParams(search).get('recovery')==='1'||new URLSearchParams(hash.replace(/^#/, '')).get('type')==='recovery';
}
