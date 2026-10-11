import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const load=p=>readFileSync(new URL(p,import.meta.url),'utf8');
const app=load('../src/App.jsx');
const turnstile=load('../src/TurnstileChallenge.jsx');
const pwd=load('../src/AccountPasswordRequest.jsx');
const sql=load('../sql/014_auditoria_beta_publica_SOLO_LECTURA.sql');
const vercel=JSON.parse(load('../vercel.json'));

test('registro público sigue disponible con correo verificado por Supabase',()=>{
  assert.match(app,/auth\.signUp\(/);
  assert.match(app,/emailRedirectTo:/);
});
test('CAPTCHA opcional cubre registro, inicio y recuperación, sin interceptar cuentas existentes',()=>{
  assert.match(app,/signUp\([\s\S]*?captchaToken/);
  assert.match(app,/signInWithPassword\(\{email,password,[\s\S]*?captchaToken/);
  assert.match(app,/resetPasswordForEmail\(email,[\s\S]*?captchaToken/);
  assert.match(app,/turnstileSiteKey\?\{captchaToken\}:\{\}/);
  assert.match(app,/turnstileSiteKey&&!captchaToken/);
});
test('petición de recuperación desde cuenta también admite CAPTCHA',()=>{
  assert.match(pwd,/resetPasswordForEmail/);
  assert.match(pwd,/captchaToken:token/);
  assert.match(pwd,/turnstileSiteKey&&!token/);
});
test('Turnstile nunca implementa verificación de token en cliente',()=>{
  assert.match(turnstile,/https:\/\/challenges\.cloudflare\.com\/turnstile\/v0\/api\.js/);
  assert.match(turnstile,/(?:turnstile|api)\.render/);
  assert.match(turnstile,/turnstile\.reset/);
  assert.match(turnstile,/expired-callback/);
  assert.doesNotMatch(turnstile,/siteverify|CLOUDFLARE_SECRET/);
});
test('auditoría SQL no modifica datos, políticas ni permisos',()=>{
  const runnable=sql.replace(/--[^\n]*/g,'');
  assert.doesNotMatch(runnable,/\b(insert|update|delete|alter|create|drop|revoke|grant|truncate)\s+(table|into|from|policy|index|function|bucket|on)\b/i);
  assert.match(runnable,/relrowsecurity/);
  assert.match(runnable,/storage\.buckets/);
  assert.match(runnable,/artist_lyric_drafts/);
});
test('cabeceras de seguridad añadidas sin bloquear la API de Supabase',()=>{
  const h=vercel.headers.flatMap(x=>x.headers||[]);
  for(const name of ['X-Frame-Options','X-Content-Type-Options','Referrer-Policy','Permissions-Policy']){
    assert.ok(h.some(x=>x.key===name),name);
  }
  assert.ok(!h.some(x=>x.key==='Content-Security-Policy'),'CSP requiere comprobar todos los orígenes antes de desplegar');
});
