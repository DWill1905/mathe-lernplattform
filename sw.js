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
  "./js/sync.js",
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

/**
 * So lange darf das Netz höchstens brauchen, bevor der Vorrat einspringt.
 *
 * „Network-First" hieß vorher: IMMER auf das Netz warten. Offline ist das kein
 * Problem – `fetch()` scheitert dann sofort. Der schlimme Fall ist die halb
 * vorhandene Verbindung (Zug, schwaches WLAN, Anmeldeseite im Hotel): Da hängt
 * die Anfrage, bis der Browser nach einer halben Minute aufgibt, und ein Kind
 * sitzt vor einer weißen Seite, obwohl alles längst auf dem Gerät liegt.
 */
const GEDULD_MS = 2500;

self.addEventListener("fetch", (ereignis) => {
  const anfrage = ereignis.request;
  if (anfrage.method !== "GET" || !eigeneHerkunft(anfrage.url)) return;
  ereignis.respondWith(antworte(ereignis, anfrage));
});

/**
 * Frisch aus dem Netz, sonst aus dem Vorrat – aber nie länger wartend als
 * `GEDULD_MS`, sofern es überhaupt einen Vorrat gibt.
 */
async function antworte(ereignis, anfrage) {
  const vorrat = await caches.match(anfrage);
  const ausDemNetz = holeUndLege(anfrage);

  if (!vorrat) {
    // Nichts auf dem Gerät: Es bleibt nur das Netz – und als letzter Ausweg
    // die Startseite, damit ein tiefer Link nicht ins Nichts führt.
    try {
      return await ausDemNetz;
    } catch {
      return (await caches.match("./index.html")) ?? Response.error();
    }
  }

  // Der Nachschlag läuft weiter, auch wenn wir gleich aus dem Vorrat
  // antworten – beim nächsten Mal ist die Datei dann aktuell.
  ereignis.waitUntil(ausDemNetz.catch(() => undefined));
  try {
    const antwort = await mitGeduld(ausDemNetz, GEDULD_MS);
    // Ein 404 oder 500 ist schlechter als der Vorrat, den wir sicher haben.
    return antwort.ok ? antwort : vorrat;
  } catch {
    return vorrat;
  }
}

/** Holt eine Datei und legt eine brauchbare Antwort in den Vorrat. */
function holeUndLege(anfrage) {
  return fetch(anfrage).then((antwort) => {
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
  });
}

/** Dasselbe Versprechen, aber mit Frist. */
function mitGeduld(versprechen, ms) {
  return new Promise((erfuellen, ablehnen) => {
    const uhr = setTimeout(() => ablehnen(new Error("Das Netz braucht zu lange")), ms);
    versprechen.then(
      (wert) => {
        clearTimeout(uhr);
        erfuellen(wert);
      },
      (fehler) => {
        clearTimeout(uhr);
        ablehnen(fehler);
      }
    );
  });
}
