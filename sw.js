/*
 * Service Worker (Network-First mit Cache als Rückfall).
 *
 * Die einzige handgeschriebene JavaScript-Datei des Projekts: Ein Service
 * Worker gilt nur für seinen eigenen Auslieferungspfad, deshalb muss er im
 * Wurzelverzeichnis liegen und darf nicht aus `src/` kompiliert werden.
 */

const CACHE = "zahleneule-v1";

/*
 * Vollständige Liste der ausgelieferten Dateien. Sie wird beim `install`
 * komplett geladen – Laufzeit-Caching allein genügt nicht, weil die zuerst
 * angeforderten Dateien noch ohne Service Worker geladen werden.
 *
 * Nicht von Hand pflegen: `npm run build` erzeugt sie über
 * `tools/sw-liste.mjs` neu, die CI prüft sie mit `npm run sw:check`.
 */
/* LISTE-ANFANG (erzeugt von tools/sw-liste.mjs) */
const KERN = [
  "./",
  "./icons/apple-touch-icon.png",
  "./icons/icon-192.png",
  "./icons/icon-512.png",
  "./icons/icon-maskable-512.png",
  "./icons/icon-maskable.svg",
  "./icons/icon.svg",
  "./index.html",
  "./js/antwort.js",
  "./js/app.js",
  "./js/bilder.js",
  "./js/dom.js",
  "./js/figures.js",
  "./js/gamification.js",
  "./js/icons.js",
  "./js/jubel.js",
  "./js/random.js",
  "./js/router.js",
  "./js/shell.js",
  "./js/state.js",
  "./js/tasks/analogie.js",
  "./js/tasks/familien.js",
  "./js/tasks/geometrie.js",
  "./js/tasks/groessen.js",
  "./js/tasks/helpers.js",
  "./js/tasks/index.js",
  "./js/tasks/mauern.js",
  "./js/tasks/rechnen.js",
  "./js/tasks/sachaufgaben.js",
  "./js/tasks/zahlen.js",
  "./js/topics.js",
  "./js/types.js",
  "./js/views/eltern.js",
  "./js/views/fortschritt.js",
  "./js/views/start.js",
  "./js/views/uebung.js",
  "./manifest.webmanifest",
  "./style.css",
];
/* LISTE-ENDE */

self.addEventListener("install", (ereignis) => {
  ereignis.waitUntil(
    caches
      .open(CACHE)
      // Einzeln statt `addAll`: Sonst würde eine einzige fehlende Datei die
      // gesamte Installation scheitern lassen und die App bliebe offline leer.
      .then((cache) => Promise.all(KERN.map((pfad) => cache.add(pfad).catch(() => undefined))))
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

/**
 * Gehört die Anfrage zu dieser Seite? Ein Präfixvergleich reichte NICHT:
 * `https://beispiel.de.angreifer.tld/` beginnt mit `https://beispiel.de` und
 * würde sonst mitbedient. Deshalb die Herkunft sauber auslesen.
 */
function eigeneHerkunft(url) {
  try {
    return new URL(url).origin === self.location.origin;
  } catch {
    return false;
  }
}

self.addEventListener("fetch", (ereignis) => {
  const anfrage = ereignis.request;
  if (anfrage.method !== "GET" || !eigeneHerkunft(anfrage.url)) return;

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
