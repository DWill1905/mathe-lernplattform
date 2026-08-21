import "./setup.js";
import test from "node:test";
import assert from "node:assert/strict";

import { mulberry32 } from "../js/random.js";
import { MIX_TOPF, RUNDENLAENGE, aufgabenSchluessel, gemischteRunde, runde } from "../js/tasks/index.js";
import { THEMEN } from "../js/topics.js";
import { ladeFortschritt, merkeGestellteAufgaben, speichereFortschritt, standardFortschritt } from "../js/state.js";

const MAX_LETZTE = 60;

/** Spielt mehrere Runden hintereinander – wie ein Kind, das weiterübt. */
function uebeMehrereRunden(thema, stufe, runden) {
  const gestellt = [];
  let letzte = [];
  for (let r = 0; r < runden; r++) {
    const aufgaben = runde(thema, mulberry32(4711 + r * 97), stufe, RUNDENLAENGE, new Set(), new Set(letzte));
    gestellt.push(...aufgaben);
    letzte = [...letzte, ...aufgaben.map(aufgabenSchluessel)].slice(-MAX_LETZTE);
  }
  return gestellt;
}

test("Kurzschlüssel ist kurz, stabil und unterscheidet Aufgaben", () => {
  const a = runde("plusminus", mulberry32(1), 2)[0];
  const b = runde("plusminus", mulberry32(1), 2)[0];
  assert.equal(aufgabenSchluessel(a), aufgabenSchluessel(b), "gleiche Aufgabe, gleicher Schlüssel");
  assert.ok(aufgabenSchluessel(a).length <= 8, "Schlüssel muss in den Speicher passen");

  // Über viele Aufgaben hinweg darf der Schlüssel nicht dauernd kollidieren.
  const rng = mulberry32(99);
  const aufgaben = runde("mauern", rng, 3, 200);
  const kennungen = new Set(aufgaben.map((x) => `${x.frage}|${x.rechnung ?? ""}|${x.loesung}`));
  const schluessel = new Set(aufgaben.map(aufgabenSchluessel));
  assert.ok(schluessel.size >= kennungen.size * 0.99, "zu viele Kollisionen");
});

test("Aufgaben der letzten Runden kommen nicht sofort wieder", () => {
  // Themen mit genug Vielfalt müssen sich über fünf Runden gar nicht wiederholen.
  for (const thema of ["plusminus", "familien", "mauern", "geld", "zahlenraum", "analogie"]) {
    for (const stufe of [1, 2, 3]) {
      const gestellt = uebeMehrereRunden(thema, stufe, 5);
      const einzeln = new Set(gestellt.map(aufgabenSchluessel));
      const wiederholt = gestellt.length - einzeln.size;
      assert.ok(
        wiederholt <= 2,
        `${thema} Stufe ${stufe}: ${wiederholt} von ${gestellt.length} Aufgaben wiederholt`
      );
    }
  }
});

test("Der Verlauf ist ein Wunsch, keine Sperre", () => {
  // Uhrzeit Stufe 1 kennt nur die vollen Stunden. Selbst wenn ALLE davon schon
  // dran waren, muss die Runde vollständig gefüllt werden statt abzubrechen.
  const alle = new Set(runde("uhrzeit", mulberry32(5), 1, 300).map(aufgabenSchluessel));
  const aufgaben = runde("uhrzeit", mulberry32(7), 1, RUNDENLAENGE, new Set(), alle);
  assert.equal(aufgaben.length, RUNDENLAENGE, "Runde muss trotzdem voll werden");
  // Und innerhalb der Runde bleibt die Frische Pflicht.
  assert.equal(new Set(aufgaben.map(aufgabenSchluessel)).size, RUNDENLAENGE);
});

test("Auch das gemischte Training nutzt den Verlauf", () => {
  const stufen = {};
  for (const t of THEMEN) stufen[t.id] = 2;
  let letzte = [];
  const gestellt = [];
  for (let r = 0; r < 4; r++) {
    const eintraege = gemischteRunde(mulberry32(31 + r), stufen, RUNDENLAENGE, MIX_TOPF, new Set(), new Set(letzte));
    gestellt.push(...eintraege.map((e) => aufgabenSchluessel(e.aufgabe)));
    letzte = [...letzte, ...eintraege.map((e) => aufgabenSchluessel(e.aufgabe))].slice(-MAX_LETZTE);
  }
  const wiederholt = gestellt.length - new Set(gestellt).size;
  assert.ok(wiederholt <= 1, `${wiederholt} Wiederholungen im gemischten Training`);
});

test("Der gespeicherte Verlauf wird geprüft", () => {
  const kaputt = [
    { letzteAufgaben: "keine Liste" },
    { letzteAufgaben: [1, 2, 3] },
    { letzteAufgaben: [{ boese: true }] },
    { letzteAufgaben: ["x".repeat(5000)] },
    { letzteAufgaben: null },
  ];
  for (const daten of kaputt) {
    localStorage.setItem("mathe2:fortschritt", JSON.stringify({ ...standardFortschritt(), ...daten }));
    const geladen = ladeFortschritt();
    assert.ok(Array.isArray(geladen.letzteAufgaben), "muss immer eine Liste sein");
    for (const e of geladen.letzteAufgaben) {
      assert.equal(typeof e, "string");
      assert.ok(e.length <= 8, "überlange Einträge müssen raus");
    }
  }
});

test("Der Verlauf wächst nicht unbegrenzt", () => {
  speichereFortschritt(standardFortschritt());
  for (let r = 0; r < 30; r++) {
    merkeGestellteAufgaben(Array.from({ length: 10 }, (_, i) => `r${r}n${i}`));
  }
  const geladen = ladeFortschritt();
  assert.equal(geladen.letzteAufgaben.length, MAX_LETZTE, "muss bei der Obergrenze gedeckelt sein");
  // Gemerkt wird das Neueste, nicht das Älteste.
  assert.ok(geladen.letzteAufgaben.includes("r29n9"));
  assert.ok(!geladen.letzteAufgaben.includes("r0n0"));
});
