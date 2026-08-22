import test from "node:test";
import assert from "node:assert/strict";

import { antwort, ladeServiceWorker } from "./sw-lauf.js";

const SEITE = "https://beispiel.test/index.html";

/**
 * Der schlimmste Fall ist NICHT „kein Netz“ – da scheitert `fetch()` sofort.
 * Es ist die halb vorhandene Verbindung: im Zug, bei schwachem WLAN oder an
 * einer Hotel-Anmeldeseite hängt die Anfrage, bis der Browser nach einer
 * halben Minute aufgibt. Ohne Frist sitzt ein Kind so lange vor einer weißen
 * Seite, obwohl die ganze App längst auf dem Gerät liegt.
 */
test("hängt das Netz, kommt die Seite aus dem Vorrat", async () => {
  const nieFertig = () => new Promise(() => {});
  const { anfragen } = ladeServiceWorker(nieFertig, { [SEITE]: antwort("aus dem Vorrat") });

  const start = Date.now();
  const { ergebnis } = anfragen(SEITE);
  // Ohne Frist käme die Antwort NIE – der Test dürfte darauf nicht ewig
  // warten, sondern muss mit einer klaren Meldung scheitern.
  const geliefert = await mitFrist(
    ergebnis,
    6000,
    "der Service Worker wartet endlos auf ein hängendes Netz"
  );
  const gedauert = Date.now() - start;

  assert.equal(geliefert.text, "aus dem Vorrat");
  assert.ok(gedauert < 6000, `hat ${gedauert} ms gewartet – das ist keine Frist`);
});

/** Wartet höchstens `ms` und scheitert dann mit einer sprechenden Meldung. */
async function mitFrist(versprechen, ms, meldung) {
  let uhr;
  try {
    return await Promise.race([
      versprechen,
      new Promise((_, ablehnen) => {
        uhr = setTimeout(() => ablehnen(new Error(meldung)), ms);
      }),
    ]);
  } finally {
    clearTimeout(uhr);
  }
}

test("ist das Netz da, gewinnt die frische Fassung", async () => {
  const { anfragen, cache } = ladeServiceWorker(async () => antwort("frisch"), {
    [SEITE]: antwort("alt"),
  });
  const { ergebnis } = anfragen(SEITE);
  assert.equal((await ergebnis).text, "frisch");
  // Und sie liegt danach im Vorrat, damit der nächste Start ohne Netz stimmt.
  assert.equal((await cache.match(SEITE)).text, "frisch");
});

test("ohne Netz kommt alles aus dem Vorrat", async () => {
  const { anfragen } = ladeServiceWorker(
    async () => {
      throw new Error("kein Netz");
    },
    { [SEITE]: antwort("aus dem Vorrat") }
  );
  assert.equal((await anfragen(SEITE).ergebnis).text, "aus dem Vorrat");
});

/**
 * Ein Serverfehler ist schlechter als eine Datei, die sicher auf dem Gerät
 * liegt. Vorher wurde der 500er durchgereicht und die App blieb schwarz,
 * obwohl der Vorrat vollständig war.
 */
test("ein Serverfehler verdrängt den Vorrat nicht", async () => {
  const { anfragen, cache } = ladeServiceWorker(
    async () => antwort("Serverfehler", { ok: false, status: 500 }),
    { [SEITE]: antwort("aus dem Vorrat") }
  );
  assert.equal((await anfragen(SEITE).ergebnis).text, "aus dem Vorrat");
  assert.equal((await cache.match(SEITE)).text, "aus dem Vorrat", "ein 500er darf nie in den Vorrat");
});

/**
 * Ein tiefer Link auf eine Datei, die es nicht im Vorrat gibt, darf nicht ins
 * Nichts führen – die Startseite lädt den Rest per Hash-Router nach.
 */
test("ohne Vorrat und ohne Netz bleibt die Startseite", async () => {
  const { anfragen } = ladeServiceWorker(
    async () => {
      throw new Error("kein Netz");
    },
    { "./index.html": antwort("Startseite") }
  );
  const geliefert = await anfragen("https://beispiel.test/js/views/uebung.js").ergebnis;
  assert.equal(geliefert.text, "Startseite");
});

test("fremde Herkunft und Schreibzugriffe bedient der Service Worker nicht", async () => {
  const { anfragen } = ladeServiceWorker(async () => antwort("egal"));
  // Der Präfixvergleich war einmal die Lücke: Diese Adresse BEGINNT mit der
  // eigenen Herkunft, gehört aber jemand anderem.
  assert.equal(anfragen("https://beispiel.test.angreifer.tld/böse.js").ergebnis, null);
  assert.equal(anfragen("https://andere.tld/x.js").ergebnis, null);
  assert.equal(anfragen(SEITE, "POST").ergebnis, null);
});
