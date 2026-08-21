import "./setup.js";
import test from "node:test";
import assert from "node:assert/strict";

import {
  ERFOLGE,
  schwerpunkte,
  HERZ_PUNKTE,
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
import { HEFT_THEMEN } from "../js/topics.js";

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
    richtigeTypen: [],
    herzen: 0,
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
    richtigeTypen: [],
    herzen: 0,
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
    richtigeTypen: [],
    herzen: 0,
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
    richtigeTypen: [],
    herzen: 0,
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
    richtigeTypen: [],
    besteSerie: 10,
    herzen: 0,
  });
  assert.equal(fortschritt.themen.geometrie.stufe, 2);
  assert.equal(fortschritt.themen.geometrie.sterne, 0, "eine Mischrunde vergibt keine Sterne");
  assert.equal(fortschritt.themen.geometrie.richtig, 5);
  assert.equal(fortschritt.themen.knobeln.gesamt, 5);
});

test("die Empfehlung bleibt bei den Themen aus dem Übungsheft", () => {
  const fortschritt = standardFortschritt();
  assert.equal(empfehlung(fortschritt), "plusminus", "das erste Heft-Thema kommt zuerst");

  for (const eintrag of Object.values(fortschritt.themen)) {
    eintrag.gesamt = 10;
    eintrag.richtig = 9;
  }
  fortschritt.themen.mauern.richtig = 2;
  assert.equal(empfehlung(fortschritt), "mauern", "das schwächste Heft-Thema wird empfohlen");

  // Ein schwaches Zusatzthema darf die Heft-Themen nicht verdrängen.
  fortschritt.themen.uhrzeit.richtig = 0;
  assert.equal(empfehlung(fortschritt), "mauern");
});

test("nur Heft-Themen werden empfohlen", () => {
  const heft = new Set(HEFT_THEMEN.map((t) => t.id));
  const fortschritt = standardFortschritt();
  for (const [id, eintrag] of Object.entries(fortschritt.themen)) {
    eintrag.gesamt = 10;
    eintrag.richtig = heft.has(id) ? 10 : 0;
  }
  assert.ok(heft.has(empfehlung(fortschritt)), "ein Zusatzthema wurde empfohlen");
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

test("Herzen zählen extra Punkte und werden dauerhaft gesammelt", () => {
  const fortschritt = standardFortschritt();
  const ergebnis = werteRundeAus(fortschritt, {
    thema: "analogie",
    stufe: 1,
    richtig: 5,
    gesamt: 10,
    besteSerie: 3,
    fehlerTypen: [],
    richtigeTypen: [],
    herzen: 4,
  });
  assert.equal(ergebnis.herzen, 4);
  assert.equal(fortschritt.herzen, 4);
  assert.equal(ergebnis.punkte, 5 * 10 + 4 * HERZ_PUNKTE, "Herzen kommen zu den Rundenpunkten dazu");

  werteMixAus(fortschritt, {
    richtig: 2,
    gesamt: 10,
    proThema: [{ thema: "analogie", richtig: 2, gesamt: 10 }],
    fehlerTypen: [],
    richtigeTypen: [],
    besteSerie: 2,
    herzen: 3,
  });
  assert.equal(fortschritt.herzen, 7, "Herzen aus dem gemischten Training zählen mit");
});

test("das Herzensache-Abzeichen gibt es ab 25 Hilfsaufgaben", () => {
  const fortschritt = standardFortschritt();
  const abzeichen = ERFOLGE.find((e) => e.id === "herzen25");
  fortschritt.herzen = 24;
  assert.equal(abzeichen.erreicht(fortschritt), false);
  fortschritt.herzen = 25;
  assert.equal(abzeichen.erreicht(fortschritt), true);
});

test("richtige Antworten bauen die Fehlerbilanz wieder ab", () => {
  const fortschritt = standardFortschritt();
  const runde = (falsch, richtig) =>
    werteRundeAus(fortschritt, {
      thema: "plusminus",
      stufe: 2,
      richtig: richtig.length,
      gesamt: falsch.length + richtig.length,
      besteSerie: 1,
      fehlerTypen: falsch,
      richtigeTypen: richtig,
      herzen: 0,
    });

  runde(["plusminus/ergaenzen", "plusminus/ergaenzen", "plusminus/tabelle"], []);
  assert.deepEqual(fortschritt.fehler, { "plusminus/ergaenzen": 2, "plusminus/tabelle": 1 });

  runde([], ["plusminus/tabelle"]);
  assert.ok(!("plusminus/tabelle" in fortschritt.fehler), "auf 0 gefallene Typen verschwinden ganz");

  runde([], ["plusminus/ergaenzen"]);
  assert.deepEqual(fortschritt.fehler, { "plusminus/ergaenzen": 1 });

  // Ein Typ, der nie falsch war, taucht durch eine richtige Antwort nicht auf.
  runde([], ["plusminus/mehrere-summanden"]);
  assert.ok(!("plusminus/mehrere-summanden" in fortschritt.fehler));
});

test("Schwerpunkte sind die häufigsten aktuellen Fehlerarten", () => {
  const fortschritt = standardFortschritt();
  assert.equal(schwerpunkte(fortschritt).size, 0, "ohne Fehler gibt es keine Schwerpunkte");

  fortschritt.fehler = {
    "plusminus/ergaenzen": 5,
    "familien/luecke": 3,
    "geld/rueckgeld": 1,
  };
  const gefunden = schwerpunkte(fortschritt);
  assert.ok(gefunden.has("plusminus/ergaenzen"));
  assert.ok(gefunden.has("familien/luecke"));
  assert.ok(!gefunden.has("geld/rueckgeld"), "ein einzelner Fehler reicht noch nicht");

  // Es werden höchstens die stärksten Schwerpunkte zurückgegeben.
  for (let i = 0; i < 20; i++) fortschritt.fehler[`typ${i}`] = 2 + i;
  assert.equal(schwerpunkte(fortschritt).size, 8);
  assert.equal(schwerpunkte(fortschritt, 3).size, 3);
});
