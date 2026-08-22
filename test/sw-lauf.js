/**
 * Führt `sw.js` in Node aus – mit Attrappen für `self`, `caches` und `fetch`.
 *
 * Bisher wurde der Service Worker nur als TEXT geprüft (steht die richtige
 * Datei in der Liste?). Sein eigentliches Verhalten – was bekommt ein Kind zu
 * sehen, wenn das Netz hängt? – blieb ungeprüft, obwohl genau daran der
 * Offline-Betrieb hängt.
 */

import { readFileSync } from "node:fs";

/** Eine Antwort-Attrappe mit dem, was der Service Worker davon anfasst. */
export function antwort(text, { ok = true, typ = "basic", status = 200 } = {}) {
  return {
    text,
    ok,
    status,
    type: typ,
    clone() {
      return antwort(text, { ok, typ, status });
    },
  };
}

/** Ein Cache im Speicher, so viel davon wie der Service Worker benutzt. */
function cacheAttrappe(vorbelegt = {}) {
  const inhalt = new Map(Object.entries(vorbelegt));
  return {
    inhalt,
    async match(anfrage) {
      return inhalt.get(schluessel(anfrage));
    },
    async put(anfrage, wert) {
      inhalt.set(schluessel(anfrage), wert);
    },
    async add(pfad) {
      inhalt.set(pfad, antwort(`Inhalt von ${pfad}`));
    },
    async delete() {
      return true;
    },
  };
}

function schluessel(anfrage) {
  return typeof anfrage === "string" ? anfrage : anfrage.url;
}

/**
 * Lädt den Service Worker in eine frische Umgebung.
 *
 * @param netz Was `fetch()` für eine Anfrage tun soll.
 * @param vorbelegt Was schon im Vorrat liegt (Pfad → Antwort).
 */
export function ladeServiceWorker(netz, vorbelegt = {}) {
  const quelle = readFileSync(new URL("../sw.js", import.meta.url), "utf8");
  const haken = new Map();
  const cache = cacheAttrappe(vorbelegt);

  const self = {
    location: { origin: "https://beispiel.test" },
    addEventListener: (name, haken_) => haken.set(name, haken_),
    skipWaiting: async () => undefined,
    clients: { claim: async () => undefined },
  };
  const caches = {
    async open() {
      return cache;
    },
    async match(anfrage) {
      return cache.match(anfrage);
    },
    async keys() {
      return ["zahleneule-v1"];
    },
    async delete() {
      return true;
    },
  };
  const Response = { error: () => antwort("Netzfehler", { ok: false, status: 0 }) };

  // eslint-disable-next-line no-new-func
  new Function("self", "caches", "fetch", "Response", quelle)(self, caches, netz, Response);

  /** Eine Anfrage durch den `fetch`-Haken schicken und die Antwort abwarten. */
  const anfragen = (url, methode = "GET") => {
    const haken_ = haken.get("fetch");
    let ergebnis = null;
    const offen = [];
    haken_({
      request: { url, method: methode },
      respondWith: (versprechen) => {
        ergebnis = versprechen;
      },
      waitUntil: (versprechen) => offen.push(versprechen),
    });
    return { ergebnis, offen };
  };

  return { anfragen, cache, haken };
}
