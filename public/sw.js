// Service worker do Fila Zero: deixa o app abrir mesmo sem internet.
// - Páginas: tenta a rede primeiro (sempre a versão mais nova) e usa a cópia salva se estiver offline.
// - Arquivos do app, fotos das ofertas e fontes: usa a cópia salva na hora e atualiza em segundo plano.

const VERSION = "fila-zero-v1";
const SHELL = `${VERSION}-shell`;
const RUNTIME = `${VERSION}-runtime`;
const scope = new URL(self.registration.scope);
const INDEX = new URL("./", scope).href;
const PRECACHE = [
  INDEX,
  new URL("manifest.webmanifest", scope).href,
  new URL("favicon.svg", scope).href,
  new URL("icons/icon-192.png", scope).href,
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(SHELL)
      .then((cache) => cache.addAll(PRECACHE))
      .then(() => self.skipWaiting()),
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((key) => !key.startsWith(VERSION)).map((key) => caches.delete(key))))
      .then(() => self.clients.claim()),
  );
});

function isCacheable(url) {
  return (
    url.origin === scope.origin ||
    url.hostname === "images.unsplash.com" ||
    url.hostname === "fonts.googleapis.com" ||
    url.hostname === "fonts.gstatic.com"
  );
}

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;

  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request)
        .then((response) => {
          const copy = response.clone();
          caches.open(SHELL).then((cache) => cache.put(INDEX, copy));
          return response;
        })
        .catch(() => caches.match(INDEX)),
    );
    return;
  }

  const url = new URL(request.url);
  if (!isCacheable(url)) return;

  event.respondWith(
    caches.open(RUNTIME).then(async (cache) => {
      const cached = await cache.match(request);
      const fresh = fetch(request)
        .then((response) => {
          if (response.ok || response.type === "opaque") cache.put(request, response.clone());
          return response;
        })
        .catch(() => cached);
      return cached || fresh;
    }),
  );
});
