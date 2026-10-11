#!/usr/bin/env node
// Preflight local para OVIO: NO imprime valores de claves ni contacta servicios.
import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';

const cwd = process.cwd();
function readEnvFile(file) {
  const result = {};
  if (!fs.existsSync(file)) return result;
  for (const raw of fs.readFileSync(file, 'utf8').split(/\r?\n/)) {
    const match = raw.match(/^\s*(?:export\s+)?([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*?)\s*$/);
    if (!match) continue;
    const [, key, rawValue] = match;
    let value = rawValue;
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) value = value.slice(1,-1);
    result[key] = value;
  }
  return result;
}
const merged = {
  ...readEnvFile(path.join(cwd,'.env')),
  ...readEnvFile(path.join(cwd,'.env.local')),
  ...process.env,
};
const errors = [];
const warnings = [];
const url=String(merged.VITE_SUPABASE_URL || '').trim();
const key=String(merged.VITE_SUPABASE_PUBLISHABLE_KEY || '').trim();
if (!/^https:\/\/[a-z0-9-]+\.supabase\.co\/?$/i.test(url)) errors.push('Falta VITE_SUPABASE_URL o no parece una URL HTTPS válida de Supabase.');
if (!key || /tu-clave|YOUR_KEY|PLACEHOLDER/i.test(key)) errors.push('Falta VITE_SUPABASE_PUBLISHABLE_KEY.');
if (key.startsWith('sb_secret_')) errors.push('No se puede usar una clave sb_secret_ en el navegador.');
if (key.split('.').length === 3) {
  try {
    const payload = JSON.parse(Buffer.from(key.split('.')[1], 'base64url').toString('utf8'));
    if (payload.role === 'service_role') errors.push('No se puede exponer una clave service_role en el navegador.');
  } catch { /* no se analizan otros formatos de clave */ }
}
if (merged.SUPABASE_SERVICE_ROLE_KEY) warnings.push('Existe una service role en el entorno: nunca la prefijes con VITE_ ni la subas al repositorio.');
const node=process.versions.node.split('.').map(Number);
if (node[0]<20 || node[0]===20 && (node[1]<19)) errors.push('Node.js debe ser 20.19+ (o una versión mayor compatible).');
const vercelConfig=JSON.parse(fs.readFileSync(path.join(cwd,'vercel.json'),'utf8'));
if (!vercelConfig.rewrites?.some(x=>x.source==='/(.*)'&&x.destination==='/index.html')) errors.push('Falta rewrite SPA en vercel.json.');
if (errors.length) {
  console.error('OVIO · Comprobación previa: FALLO');
  for(const e of errors) console.error(' - '+e);
} else {
  console.log('OVIO · Comprobación local: OK (variables declaradas y rutas SPA configuradas).');
}
for(const w of warnings) console.warn('Aviso: '+w);
console.log('Esta comprobación no valida Supabase en vivo, SMTP, RLS ni privacidad.');
process.exitCode=errors.length?1:0;
