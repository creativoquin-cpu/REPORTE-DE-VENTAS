// Service worker de Quin (Fase 10). Deja abrir la app sin internet guardando
// una copia de las páginas propias la primera vez que cargan bien. Puerto de
// ../sw.js de la app vieja, con UNA diferencia de seguridad importante:
//
//   En la app vieja quin-admin.html era un archivo ESTÁTICO sin datos privados
//   (todo venía de Supabase en el cliente), así que se podía cachear sin riesgo.
//   Acá /admin/* son páginas renderizadas EN EL SERVIDOR con datos privados
//   (el correo del admin, las jornadas con ven/tie, etc.). Cachear esas
//   respuestas dejaría datos privados en el disco del dispositivo. Por eso el
//   service worker NUNCA cachea /admin: esas rutas van siempre a la red.
//
// Los recursos de afuera (Supabase, fuentes) tampoco se tocan: al filtrar por
// mismo origen, van directo a la red como siempre.
var CACHE = "quin-v1";
var ARCHIVOS = ["/", "/manifest.webmanifest", "/icon-192.png", "/icon-512.png", "/apple-touch-icon.png", "/favicon-32.png"];

self.addEventListener("install", function (e) {
  e.waitUntil(caches.open(CACHE).then(function (c) { return c.addAll(ARCHIVOS); }));
  self.skipWaiting();
});

self.addEventListener("activate", function (e) {
  e.waitUntil(caches.keys().then(function (claves) {
    return Promise.all(claves.filter(function (k) { return k !== CACHE; }).map(function (k) { return caches.delete(k); }));
  }));
  self.clients.claim();
});

// Primero la red (para que siempre llegue la versión más nueva si hay internet);
// si falla, se usa lo guardado. NUNCA se cachea /admin (datos privados) ni nada
// que no sea del mismo origen.
self.addEventListener("fetch", function (e) {
  if (e.request.method !== "GET") return;
  var url = new URL(e.request.url);
  if (url.origin !== location.origin) return;
  if (url.pathname === "/admin" || url.pathname.indexOf("/admin/") === 0) return;
  e.respondWith(
    fetch(e.request).then(function (r) {
      var copia = r.clone();
      caches.open(CACHE).then(function (c) { c.put(e.request, copia); });
      return r;
    }).catch(function () { return caches.match(e.request); })
  );
});
