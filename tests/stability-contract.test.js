import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const app=readFileSync(new URL('../src/App.jsx',import.meta.url),'utf8');
const main=readFileSync(new URL('../src/main.jsx',import.meta.url),'utf8');
const sw=readFileSync(new URL('../public/sw.js',import.meta.url),'utf8');

test('descarta respuestas antiguas si cambia la cuenta o hay otra recarga',()=>{
  assert.match(app,/dataLoadVersionRef/);
  assert.match(app,/activeAccountRef\.current===uid/);
  assert.match(app,/if\(!fresh\(\)\)return/);
});
test('cerrar sesión externamente detiene el audio y limpia datos de sesión',()=>{
  assert.match(app,/audioRef\.current\.removeAttribute\('src'\)/);
  assert.match(app,/setAnalyticsSettings\(\{country_code:'ZZ',analytics_enabled:false\}\)/);
});
test('un fallo de renderizado tiene pantalla de recuperación',()=>{
  assert.match(main,/<ErrorBoundary><App \/><\/ErrorBoundary>/);
});
test('la PWA cambia de versión sin cachear contenido privado',()=>{
  assert.match(sw,/ovio-pwa-static-v19/);
  assert.match(sw,/url\.origin !== self\.location\.origin/);
  assert.doesNotMatch(sw,/cache\.put\(.*supabase/);
});
