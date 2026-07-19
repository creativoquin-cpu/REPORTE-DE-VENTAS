// Service worker de Quin (paso 9.4). Deja abrir la app sin internet, guardando
// una copia de las páginas propias la primera vez que cargan bien. Los
// archivos de afuera (Chart.js, xlsx.js, Supabase) NO se tocan acá: van
// directo a la red como siempre, y si no hay internet fallan igual que antes
// de este paso — el guardado local de cada página ya sabe convivir con eso.
var CACHE = "quin-v1";
var ARCHIVOS = [
  "./",
  "./index.html",
  "./quin-admin.html",
  "./manifest.json",
  "./manifest-admin.json",
  "./iconos/icon-192.png",
  "./iconos/icon-512.png",
  "./iconos/apple-touch-icon.png",
  "./iconos/favicon-32.png"
];

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

// Primero la red (para que siempre llegue la versión más nueva si hay
// internet); si falla, se usa lo que quedó guardado la última vez.
self.addEventListener("fetch", function (e) {
  if (e.request.method !== "GET") return;
  if (new URL(e.request.url).origin !== location.origin) return;
  e.respondWith(
    fetch(e.request).then(function (r) {
      var copia = r.clone();
      caches.open(CACHE).then(function (c) { c.put(e.request, copia); });
      return r;
    }).catch(function () { return caches.match(e.request); })
  );
});
