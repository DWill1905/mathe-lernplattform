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
  assert.equal(geladen.herzen, 0, "negative Herzen gibt es nicht");
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
