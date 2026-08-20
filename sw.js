// Service Worker — Dialog Prestasi PPD
const CACHE = "dialog-prestasi-v20";
const ASSETS = ["./", "./index.html", "./manifest.json", "./logo.png"];

self.addEventListener("install", (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(ASSETS)));
  self.skipWaiting();
});

self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener("fetch", (e) => {
  const url = e.request.url;

  // GAS API — sentiasa dari rangkaian, jangan cache
  if (url.includes("script.google.com")) {
    e.respondWith(
      fetch(e.request).catch(
        () => new Response("{}", { headers: { "Content-Type": "application/json" } })
      )
    );
    return;
  }

  // HTML / navigasi — NETWORK-FIRST supaya kemaskini kod & config (API_URL) terus berkuat kuasa
  if (e.request.mode === "navigate" || url.endsWith("/index.html") || url.endsWith("/")) {
    e.respondWith(
      fetch(e.request)
        .then((r) => {
          const copy = r.clone();
          caches.open(CACHE).then((c) => c.put(e.request, copy));
          return r;
        })
        .catch(() => caches.match(e.request).then((r) => r || caches.match("./index.html")))
    );
    return;
  }

  // Aset lain (logo, manifest) — cache-first
  e.respondWith(caches.match(e.request).then((r) => r || fetch(e.request)));
});
