/*
 * Service Worker (Network-First mit Cache als Rückfall).
 *
 * Die einzige handgeschriebene JavaScript-Datei des Projekts: Ein Service
 * Worker gilt nur für seinen eigenen Auslieferungspfad, deshalb muss er im
 * Wurzelverzeichnis liegen und darf nicht aus `src/` kompiliert werden.
 */

const CACHE = "mathe-schule-v1";

const KERN = [
  "./",
  "./index.html",
  "./style.css",
  "./manifest.webmanifest",
  "./icons/icon.svg",
  "./js/app.js",
];

self.addEventListener("install", (ereignis) => {
  ereignis.waitUntil(
    caches
      .open(CACHE)
      .then((cache) => cache.addAll(KERN))
      .then(() => self.skipWaiting())
      .catch(() => undefined)
  );
});

self.addEventListener("activate", (ereignis) => {
  ereignis.waitUntil(
    caches
      .keys()
      .then((namen) => Promise.all(namen.filter((name) => name !== CACHE).map((name) => caches.delete(name))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (ereignis) => {
  const anfrage = ereignis.request;
  if (anfrage.method !== "GET" || !anfrage.url.startsWith(self.location.origin)) return;

  ereignis.respondWith(
    fetch(anfrage)
      .then((antwort) => {
        // Nur brauchbare Antworten in den Cache: Ein zwischengespeicherter 404
        // oder 500 würde offline dauerhaft statt der Seite ausgeliefert.
        if (antwort.ok && antwort.type === "basic") {
          const kopie = antwort.clone();
          caches
            .open(CACHE)
            .then((cache) => cache.put(anfrage, kopie))
            .catch(() => undefined);
        }
        return antwort;
      })
      .catch(() =>
        caches.match(anfrage).then((treffer) => treffer ?? caches.match("./index.html").then((s) => s ?? Response.error()))
      )
  );
});
