/* Doğukan'ın Yeri — elle yazılmış service worker (S8, mobile-production F2).
 *
 * Strateji tablosu:
 *   BASE + "_next/static/**", yazı tipleri, görseller, sesler  → cache-first  (VERSION-assets, en çok 80)
 *   gezinme (mode "navigate") ve RSC ".txt" yükleri            → network-first → önbellek → BASE + "offline/" (VERSION-pages, en çok 60)
 *   başka köken (Firebase), GET dışı istekler, Range istekleri → hiç dokunulmaz
 * Kurulumda VERSION-core önbelleğine kabuk + sw-precache.json listesi alınır.
 * BASE kayıt kapsamından gelir: geliştirmede "/", GitHub Pages'te "/dogukan/".
 * VERSION, `npm run deploy` sırasında kısa commit SHA'sıyla değiştirilir.
 */
const VERSION = "2760210";
const BASE = new URL(self.registration.scope).pathname;
const CORE = `${VERSION}-core`;
const ASSETS = `${VERSION}-assets`;
const PAGES = `${VERSION}-pages`;
const ASSET_CAP = 80;
const PAGE_CAP = 60;
const OFFLINE_URL = `${BASE}offline/`;
const SHELL = [BASE, OFFLINE_URL];

const STATIC_EXT = /\.(?:js|css|woff2?|png|jpe?g|webp|gif|svg|ico|m4a|mp3)$/i;

self.addEventListener("install", (event) => {
  event.waitUntil(
    (async () => {
      const core = await caches.open(CORE);
      // Kabuk zorunlu: başarısızsa kurulum düşer ve eski sürüm çalışmaya devam eder.
      await core.addAll(SHELL);
      let extra = [];
      try {
        const res = await fetch(`${BASE}sw-precache.json`, { cache: "no-store" });
        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data.files))
            extra = data.files.map((p) => `${BASE}${p}`);
        }
      } catch {
        /* liste yoksa yalnızca kabuk */
      }
      await Promise.all(extra.map((url) => core.add(url).catch(() => undefined)));
      // skipWaiting yok: güncelleme bildirimi (PwaRegister) çocuğun dokunuşunu bekler.
    })(),
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      const names = await caches.keys();
      await Promise.all(
        names
          .filter((n) => !n.startsWith(`${VERSION}-`))
          .map((n) => caches.delete(n)),
      );
      await self.clients.claim();
    })(),
  );
});

self.addEventListener("message", (event) => {
  if (event.data && event.data.type === "SKIP_WAITING") self.skipWaiting();
});

function isRscPayload(request, url) {
  return url.pathname.endsWith(".txt") || request.headers.get("RSC") === "1";
}

function isStaticAsset(url) {
  return (
    url.pathname.startsWith(`${BASE}_next/static/`) || STATIC_EXT.test(url.pathname)
  );
}

self.addEventListener("fetch", (event) => {
  const request = event.request;
  if (request.method !== "GET") return;
  if (request.headers.has("range")) return; // Safari ses akışı: tam yanıtla bozulur
  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return; // Firebase ve diğer kökenler
  if (!url.pathname.startsWith(BASE)) return;
  if (url.pathname === `${BASE}sw.js` || url.pathname === `${BASE}sw-precache.json`)
    return;

  if (request.mode === "navigate") {
    event.respondWith(networkFirst(event, true));
  } else if (isRscPayload(request, url)) {
    event.respondWith(networkFirst(event, false));
  } else if (isStaticAsset(url)) {
    event.respondWith(cacheFirst(event));
  }
});

async function matchAny(request, names, opts) {
  for (const name of names) {
    const cache = await caches.open(name);
    const hit = await cache.match(request, opts);
    if (hit) return hit;
  }
  return undefined;
}

async function cacheFirst(event) {
  const request = event.request;
  const hit = await matchAny(request, [CORE, ASSETS]);
  if (hit) return hit;
  const response = await fetch(request);
  if (response.ok && response.type === "basic") {
    const copy = response.clone();
    event.waitUntil(
      caches.open(ASSETS).then(async (cache) => {
        await cache.put(request, copy);
        await trim(cache, ASSET_CAP);
      }),
    );
  }
  return response;
}

async function networkFirst(event, isNavigation) {
  const request = event.request;
  try {
    const response = await fetch(request);
    if (response.ok && response.type === "basic") {
      const copy = response.clone();
      event.waitUntil(
        caches.open(PAGES).then(async (cache) => {
          await cache.put(request, copy);
          await trim(cache, PAGE_CAP);
        }),
      );
    }
    return response;
  } catch (err) {
    const hit =
      (await matchAny(request, [PAGES, CORE])) ||
      (await matchAny(request, [PAGES, CORE], { ignoreSearch: true }));
    if (hit) return hit;
    if (isNavigation) {
      const offline = await matchAny(OFFLINE_URL, [CORE, PAGES]);
      if (offline) return offline;
    }
    throw err;
  }
}

/** En eski kayıtları siler (Cache API ekleme sırasını korur). */
async function trim(cache, cap) {
  const keys = await cache.keys();
  for (let i = 0; i < keys.length - cap; i += 1) await cache.delete(keys[i]);
}
