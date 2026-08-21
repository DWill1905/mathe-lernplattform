import "./setup.js";
import test from "node:test";
import assert from "node:assert/strict";

import {
  ERFOLGE,
  empfehlung,
  levelInfo,
  levelSchwelle,
  merkeMeisterErgebnis,
  punkteFuerRunde,
  sterneFuerRunde,
  werteMixAus,
  werteRundeAus,
  zeitText,
} from "../js/gamification.js";
import { standardFortschritt } from "../js/state.js";

test.beforeEach(() => localStorage.clear());

test("Sterne folgen der Trefferquote", () => {
  assert.equal(sterneFuerRunde(10, 10), 3);
  assert.equal(sterneFuerRunde(9, 10), 3);
  assert.equal(sterneFuerRunde(8, 10), 2);
  assert.equal(sterneFuerRunde(7, 10), 2);
  assert.equal(sterneFuerRunde(5, 10), 1);
  assert.equal(sterneFuerRunde(4, 10), 0);
  assert.equal(sterneFuerRunde(0, 0), 0);
});

test("schwerere Stufen geben mehr Punkte, fehlerfrei gibt Bonus", () => {
  assert.equal(punkteFuerRunde(5, 10, 1), 50);
  assert.equal(punkteFuerRunde(5, 10, 3), 100);
  assert.equal(punkteFuerRunde(10, 10, 1), 125);
});

test("Level steigen monoton und die Schwellen passen zusammen", () => {
  assert.equal(levelInfo(0).stufe, 1);
  for (let stufe = 1; stufe <= 12; stufe++) {
    assert.equal(levelInfo(levelSchwelle(stufe)).stufe, stufe);
    assert.equal(levelInfo(levelSchwelle(stufe + 1) - 1).stufe, stufe);
    assert.ok(levelSchwelle(stufe + 1) > levelSchwelle(stufe));
  }
  assert.ok(levelInfo(75).anteil > 0 && levelInfo(75).anteil < 1);
});

test("eine sehr gute Runde lässt aufsteigen, eine sehr schwache absteigen", () => {
  const auf = standardFortschritt();
  const ergebnisAuf = werteRundeAus(auf, {
    thema: "einmaleins",
    stufe: 1,
    richtig: 10,
    gesamt: 10,
    besteSerie: 10,
    fehlerTypen: [],
  });
  assert.equal(ergebnisAuf.sterne, 3);
  assert.equal(ergebnisAuf.stufeAufgestiegen, true);
  assert.equal(auf.themen.einmaleins.stufe, 2);
  assert.equal(auf.themen.einmaleins.richtig, 10);
  assert.equal(auf.punkte, 125);

  const ab = standardFortschritt();
  ab.themen.geld.stufe = 3;
  werteRundeAus(ab, {
    thema: "geld",
    stufe: 3,
    richtig: 2,
    gesamt: 10,
    besteSerie: 1,
    fehlerTypen: ["geld/rueckgeld", "geld/rueckgeld"],
  });
  assert.equal(ab.themen.geld.stufe, 2, "nach einer schwachen Runde wird es leichter");
  assert.equal(ab.fehler["geld/rueckgeld"], 2);
});

test("die erste Runde schaltet ein Abzeichen frei und startet die Serie", () => {
  const fortschritt = standardFortschritt();
  const ergebnis = werteRundeAus(fortschritt, {
    thema: "zahlenraum",
    stufe: 1,
    richtig: 7,
    gesamt: 10,
    besteSerie: 4,
    fehlerTypen: ["zahlenraum/runden"],
  });
  assert.ok(ergebnis.neueErfolge.includes("start"));
  assert.equal(fortschritt.streakTage, 1);
  assert.equal(fortschritt.verlauf.length, 1);
  assert.equal(fortschritt.verlauf[0].gesamt, 10);

  // Eine zweite Runde am selben Tag verlängert die Serie nicht.
  werteRundeAus(fortschritt, {
    thema: "zahlenraum",
    stufe: 1,
    richtig: 5,
    gesamt: 10,
    besteSerie: 2,
    fehlerTypen: [],
  });
  assert.equal(fortschritt.streakTage, 1);
  assert.equal(fortschritt.verlauf.length, 1);
  assert.equal(fortschritt.verlauf[0].gesamt, 20);
});

test("das gemischte Training verschiebt keine Stufen", () => {
  const fortschritt = standardFortschritt();
  fortschritt.themen.geometrie.stufe = 2;
  werteMixAus(fortschritt, {
    richtig: 10,
    gesamt: 10,
    proThema: [
      { thema: "geometrie", richtig: 5, gesamt: 5 },
      { thema: "knobeln", richtig: 5, gesamt: 5 },
    ],
    fehlerTypen: [],
    besteSerie: 10,
  });
  assert.equal(fortschritt.themen.geometrie.stufe, 2);
  assert.equal(fortschritt.themen.geometrie.sterne, 0, "eine Mischrunde vergibt keine Sterne");
  assert.equal(fortschritt.themen.geometrie.richtig, 5);
  assert.equal(fortschritt.themen.knobeln.gesamt, 5);
});

test("die Empfehlung zeigt auf ein noch nicht geübtes Thema", () => {
  const fortschritt = standardFortschritt();
  assert.equal(empfehlung(fortschritt), "zahlenraum");
  for (const eintrag of Object.values(fortschritt.themen)) {
    eintrag.gesamt = 10;
    eintrag.richtig = 9;
  }
  fortschritt.themen.uhrzeit.richtig = 2;
  assert.equal(empfehlung(fortschritt), "uhrzeit", "das schwächste Thema wird empfohlen");
});

test("jedes Abzeichen hat eine eindeutige Kennung", () => {
  const kennungen = ERFOLGE.map((e) => e.id);
  assert.equal(new Set(kennungen).size, kennungen.length);
});

test("der Rechenmeister wertet erst die Treffer und dann die Zeit", () => {
  const fortschritt = standardFortschritt();

  assert.equal(merkeMeisterErgebnis(fortschritt, 0, 30), false, "ein Lauf ohne Treffer ist keine Bestleistung");
  assert.deepEqual(fortschritt.meister, { besteZeit: 0, besteTreffer: 0 });

  assert.equal(merkeMeisterErgebnis(fortschritt, 14, 180), true, "der erste echte Lauf zählt");
  assert.deepEqual(fortschritt.meister, { besteZeit: 180, besteTreffer: 14 });

  assert.equal(merkeMeisterErgebnis(fortschritt, 12, 60), false, "schneller mit weniger Treffern zählt nicht");
  assert.deepEqual(fortschritt.meister, { besteZeit: 180, besteTreffer: 14 });

  assert.equal(merkeMeisterErgebnis(fortschritt, 14, 150), true, "gleiche Treffer, aber schneller");
  assert.equal(fortschritt.meister.besteZeit, 150);

  assert.equal(merkeMeisterErgebnis(fortschritt, 20, 400), true, "mehr Treffer schlagen die Zeit");
  assert.deepEqual(fortschritt.meister, { besteZeit: 400, besteTreffer: 20 });
});

test("das Blitzrechner-Abzeichen gibt es für 20 von 20", () => {
  const fortschritt = standardFortschritt();
  const blitz = ERFOLGE.find((e) => e.id === "rechenmeister");
  assert.equal(blitz.erreicht(fortschritt), false);
  merkeMeisterErgebnis(fortschritt, 20, 300);
  assert.equal(blitz.erreicht(fortschritt), true);
});

test("Zeiten werden als Minuten und Sekunden angezeigt", () => {
  assert.equal(zeitText(0), "0:00 min");
  assert.equal(zeitText(59), "0:59 min");
  assert.equal(zeitText(127), "2:07 min");
});
