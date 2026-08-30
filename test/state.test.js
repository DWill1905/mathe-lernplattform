import "./setup.js";
import test from "node:test";
import assert from "node:assert/strict";

import { ladeFortschritt, speichereFortschritt, setzeZurueck, standardFortschritt } from "../js/state.js";
import { THEMEN } from "../js/topics.js";

const SCHLUESSEL = "mathe2:fortschritt";

test.beforeEach(() => localStorage.clear());

test("ohne gespeicherte Daten kommt ein vollständiger Standardstand", () => {
  const fortschritt = ladeFortschritt();
  assert.equal(fortschritt.punkte, 0);
  assert.equal(Object.keys(fortschritt.themen).length, THEMEN.length);
  for (const thema of THEMEN) assert.equal(fortschritt.themen[thema.id].stufe, 1);
});

test("Speichern und Laden erhält den Zustand", () => {
  const fortschritt = standardFortschritt();
  fortschritt.name = "Mia";
  fortschritt.punkte = 420;
  fortschritt.themen.einmaleins.stufe = 3;
  fortschritt.themen.einmaleins.richtig = 40;
  fortschritt.themen.einmaleins.gesamt = 50;
  speichereFortschritt(fortschritt);

  const geladen = ladeFortschritt();
  assert.equal(geladen.name, "Mia");
  assert.equal(geladen.punkte, 420);
  assert.equal(geladen.themen.einmaleins.stufe, 3);
  assert.equal(geladen.themen.einmaleins.richtig, 40);
});

test("kaputte oder manipulierte Daten werden geprüft statt übernommen", () => {
  localStorage.setItem(
    SCHLUESSEL,
    JSON.stringify({
      name: 12345,
      punkte: "ganz viele",
      streakTage: -8,
      letzterTag: "irgendwann",
      themen: {
        einmaleins: { stufe: 99, richtig: 500, gesamt: 10, sterne: 12, besteSerie: "x" },
        gibtesnicht: { stufe: 2 },
      },
      erfolge: ["start", "start", 42],
      verlauf: "kein Array",
      fehler: { "geld/rueckgeld": -3, "einmaleins/reihe-7": 4 },
      meister: { besteZeit: "schnell", besteTreffer: 9999 },
      herzen: -5,
    })
  );

  const geladen = ladeFortschritt();
  assert.equal(geladen.name, "");
  assert.equal(geladen.punkte, 0);
  assert.equal(geladen.streakTage, 0);
  assert.equal(geladen.letzterTag, "");
  assert.equal(geladen.themen.einmaleins.stufe, 1, "Stufe 99 darf nicht übernommen werden");
  assert.equal(geladen.themen.einmaleins.sterne, 0, "mehr als 3 Sterne gibt es nicht");
  assert.equal(geladen.themen.einmaleins.richtig, 10, "richtig kann nie über gesamt liegen");
  assert.equal(geladen.themen.einmaleins.besteSerie, 0);
  assert.ok(!("gibtesnicht" in geladen.themen), "unbekannte Themen werden verworfen");
  assert.deepEqual(geladen.erfolge, ["start"]);
  assert.deepEqual(geladen.verlauf, []);
  assert.deepEqual(geladen.fehler, { "einmaleins/reihe-7": 4 });
  assert.deepEqual(geladen.meister, { besteZeit: 0, besteTreffer: 0 });
  assert.equal(geladen.pferde, 0, "negative Pferde gibt es nicht");
});

test("fehlende Bestwerte des Rechenmeisters werden ergänzt", () => {
  localStorage.setItem(SCHLUESSEL, JSON.stringify({ punkte: 10 }));
  assert.deepEqual(ladeFortschritt().meister, { besteZeit: 0, besteTreffer: 0 });
});

test("unlesbares JSON führt nicht zum Absturz", () => {
  localStorage.setItem(SCHLUESSEL, "{kein json");
  assert.equal(ladeFortschritt().punkte, 0);
});

test("Zurücksetzen löscht den Spielstand", () => {
  const fortschritt = standardFortschritt();
  fortschritt.punkte = 100;
  speichereFortschritt(fortschritt);
  setzeZurueck();
  assert.equal(ladeFortschritt().punkte, 0);
});

/*
 * Aus Herzen wurden Pferde (1.35.0) – und kein Kind darf dabei sein
 * Gesammeltes verlieren.
 *
 * `pruefeFortschritt()` baut den Stand als WHITELIST neu auf: Ein Feld, das
 * niemand ausdrücklich liest, ist beim nächsten Laden spurlos weg. Ohne den
 * Rückfall auf das alte Feld stünde jeder bestehende Spielstand auf null.
 */
test("gesammelte Herzen kommen als Pferde zurück", () => {
  localStorage.setItem(SCHLUESSEL, JSON.stringify({ punkte: 100, herzen: 17 }));
  assert.equal(ladeFortschritt().pferde, 17, "der Rückfall auf das alte Feld fehlt");
});

test("steht das neue Feld da, gilt es – auch wenn es null ist", () => {
  localStorage.setItem(SCHLUESSEL, JSON.stringify({ pferde: 3, herzen: 17 }));
  assert.equal(ladeFortschritt().pferde, 3, "das neue Feld hat Vorrang");

  // Der Grund für `??` statt `||`: Eine echte 0 ist ein Wert, kein Fehlen.
  // Sonst holte ein zurückgesetzter Stand die alten Herzen zurück.
  localStorage.setItem(SCHLUESSEL, JSON.stringify({ pferde: 0, herzen: 17 }));
  assert.equal(ladeFortschritt().pferde, 0, "eine echte 0 darf nicht auf das alte Feld zurückfallen");
});

test("auch das alte Feld ist ungeprüfte Eingabe", () => {
  for (const kaputt of [-5, "viele", {}, Number.NaN, 1e308]) {
    localStorage.setItem(SCHLUESSEL, JSON.stringify({ herzen: kaputt }));
    assert.equal(ladeFortschritt().pferde, 0, `herzen: ${JSON.stringify(kaputt)} kam ungeprüft durch`);
  }
});

/*
 * Das Übergangsfeld: Der gespeicherte Stand trägt `herzen` als Spiegel von
 * `pferde`. Ein zweites Gerät, das noch die Fassung vor 1.35 im Vorrat hat,
 * kennt `pferde` nicht – ohne den Spiegel setzt es die Zahl beim nächsten
 * Abgleich auf seinen eigenen alten Stand zurück.
 */
test("der gespeicherte Stand trägt das Übergangsfeld", () => {
  const fortschritt = standardFortschritt();
  fortschritt.pferde = 9;
  speichereFortschritt(fortschritt);
  const roh = JSON.parse(localStorage.getItem(SCHLUESSEL));
  assert.equal(roh.pferde, 9);
  assert.equal(roh.herzen, 9, "ohne den Spiegel verliert ein Gerät mit der alten Fassung die Pferde");
});
