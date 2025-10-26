const CACHE_NAME = "mandaditos-cache-v1";

// Archivos base que queremos cachear para que la app abra offline.
// Incluimos el index y los assets que Vite genera.
const CORE_ASSETS = [
  "/",
  "/index.html",
  "/manifest.webmanifest"
  // Vite va a generar /src/... .js y /assets/... .js con hash,
  // más adelante podemos hacer cache dinámico de esos.
];

// Install SW: cachea lo básico
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(CORE_ASSETS).catch((err) => {
        console.warn("No se pudieron cachear todos los assets base:", err);
      });
    })
  );
  self.skipWaiting();
});

// Activate SW: limpia caches viejos si cambiamos versión
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            return caches.delete(key);
          }
        })
      )
    )
  );
  self.clients.claim();
});

// Fetch: primero intentamos red online, si falla usamos cache
self.addEventListener("fetch", (event) => {
  const req = event.request;

  // Estrategia "network first, fallback cache" para HTML y datos
  if (req.mode === "navigate") {
    event.respondWith(
      fetch(req).catch(() => caches.match("/index.html"))
    );
    return;
  }

  // Estrategia "cache first, fallback network" para assets estáticos
  event.respondWith(
    caches.match(req).then((cached) => {
      if (cached) return cached;
      return fetch(req).then((res) => {
        // guardar dinámicamente cualquier cosa que pidamos
        const resClone = res.clone();
        caches.open(CACHE_NAME).then((cache) => {
          cache.put(req, resClone);
        });
        return res;
      });
    })
  );
});
