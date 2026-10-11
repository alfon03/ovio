// OVIO v2.0 · PWA instalable. Cachea SOLO recursos ESTÁTICOS del mismo origen.
// Nunca cachea consultas Supabase, respuestas API, sesiones, letras ni documentos privados.
const CACHE = 'ovio-pwa-static-v20';
const PRELOAD = ['/offline.html','/favicon.svg','/icons/icon-192.png','/icons/icon-512.png'];
self.addEventListener('install', event => {
  event.waitUntil(caches.open(CACHE).then(cache=>cache.addAll(PRELOAD)));
  self.skipWaiting();
});
self.addEventListener('activate', event => {
  event.waitUntil((async()=>{
    const names=await caches.keys();
    await Promise.all(names.filter(name=>name.startsWith('ovio-pwa-static-')&&name!==CACHE).map(name=>caches.delete(name)));
    await self.clients.claim();
  })());
});
self.addEventListener('fetch', event=>{
  const request=event.request;
  if(request.method !== 'GET')return;
  const url=new URL(request.url);
  if(url.origin !== self.location.origin)return; // Supabase y terceros siempre acceden directamente a la red
  if(request.mode==='navigate'){
    event.respondWith(fetch(request).catch(()=>caches.match('/offline.html')));
    return;
  }
  if(!url.pathname.startsWith('/assets/')&&!url.pathname.startsWith('/icons/')&&
     !['/favicon.svg','/favicon.ico','/favicon.png','/apple-touch-icon.png'].includes(url.pathname))return;
  event.respondWith(caches.match(request).then(cached=>cached||fetch(request).then(response=>{
    if(response.ok){const cloned=response.clone();void caches.open(CACHE).then(cache=>cache.put(request,cloned));}
    return response;
  })));
});
