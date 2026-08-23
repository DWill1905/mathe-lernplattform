import "./setup.js";
import test from "node:test";
import assert from "node:assert/strict";

import {
  SCHWERPUNKT_AB,
  TEMPO_AB,
  bucheTempo,
  muehsameTypen,
  schwerpunkte,
  werteRundeAus,
} from "../js/gamification.js";
import { TEMPO_MAX_SEKUNDEN, pruefeFortschritt, standardFortschritt } from "../js/state.js";
import { verschmelze } from "../js/sync.js";

/*
 * Die Tempo-Bilanz: Richtig ist nicht gleich sicher. Die App merkt sich je
 * Aufgabentyp, wie lange RICHTIGE Antworten dauern – der Elternbereich zeigt,
 * was nur mühsam richtig ist, und die Schwerpunkt-Wiederholung übt es öfter.
 */

/* ------------------------------------------------------------- Buchen */

test("die erste Messung setzt den Wert, weitere glätten ihn nur", () => {
  const f = standardFortschritt();
  bucheTempo(f, [{ typ: "einmaleins/reihe-7", sekunden: 4 }]);
  assert.deepEqual(f.tempo["einmaleins/reihe-7"], { sekunden: 4, anzahl: 1 });

  // Ein Ausreißer nach oben verschiebt den Mittelwert nur ein Stück –
  // er ersetzt ihn nicht (4 + 0,3 · (10 − 4) = 5,8).
  bucheTempo(f, [{ typ: "einmaleins/reihe-7", sekunden: 10 }]);
  assert.deepEqual(f.tempo["einmaleins/reihe-7"], { sekunden: 5.8, anzahl: 2 });
});

test("Pausen werden gekappt, Unsinn wird gar nicht gebucht", () => {
  const f = standardFortschritt();
  // Tablet weggelegt: Minuten sind keine Messung, sondern eine Pause.
  bucheTempo(f, [{ typ: "geld/wechseln", sekunden: 100000 }]);
  assert.equal(f.tempo["geld/wechseln"].sekunden, TEMPO_MAX_SEKUNDEN);

  // Verstellte Uhr oder kaputte Werte dürfen die Bilanz nicht anfassen.
  bucheTempo(f, [
    { typ: "geld/kaputt", sekunden: -5 },
    { typ: "geld/kaputt", sekunden: 0 },
    { typ: "geld/kaputt", sekunden: Number.NaN },
    { typ: "geld/kaputt", sekunden: Number.POSITIVE_INFINITY },
  ]);
  assert.equal(f.tempo["geld/kaputt"], undefined);
});

test("die Zeiten laufen über die Rundenauswertung in den Fortschritt", () => {
  const f = standardFortschritt();
  werteRundeAus(f, {
    thema: "plusminus",
    stufe: 1,
    richtig: 1,
    gesamt: 10,
    besteSerie: 1,
    fehlerTypen: [],
    richtigeTypen: ["plusminus/zehner"],
    herzen: 0,
    zeiten: [{ typ: "plusminus/zehner", sekunden: 7 }],
  });
  assert.deepEqual(f.tempo["plusminus/zehner"], { sekunden: 7, anzahl: 1 });

  // Ohne Zeiten (ältere Aufrufer, Tests) darf die Auswertung nicht stolpern.
  const g = standardFortschritt();
  werteRundeAus(g, {
    thema: "plusminus",
    stufe: 1,
    richtig: 1,
    gesamt: 10,
    besteSerie: 1,
    fehlerTypen: [],
    richtigeTypen: [],
    herzen: 0,
  });
  assert.deepEqual(g.tempo, {});
});

/* ----------------------------------------------------------- Auswerten */

/** Ein Fortschritt mit reifen Messungen: Die 7er-Reihe ist auffällig zäh. */
function mitMessungen() {
  const f = standardFortschritt();
  f.tempo = {
    "einmaleins/reihe-2": { sekunden: 3, anzahl: 10 },
    "einmaleins/reihe-5": { sekunden: 4, anzahl: 10 },
    "einmaleins/reihe-7": { sekunden: 12, anzahl: 10 },
    // Sachaufgaben brauchen auch flüssig gelöst lange – Lesen kostet Zeit.
    "sach/einkauf": { sekunden: 25, anzahl: 10 },
    "sach/tiere": { sekunden: 27, anzahl: 10 },
  };
  return f;
}

test("mühsam ist nur, wer deutlich über ähnlichen Aufgaben liegt", () => {
  const befunde = muehsameTypen(mitMessungen());
  assert.deepEqual(
    befunde.map((b) => b.typ),
    ["einmaleins/reihe-7"],
    "genau die zähe 7er-Reihe muss auffallen"
  );
  assert.equal(befunde[0].sekunden, 12);
  assert.equal(befunde[0].ueblich, 4, "üblich ist der Median des eigenen Bereichs");
});

test("verglichen wird nur innerhalb des eigenen Bereichs", () => {
  // 27 Sekunden je Sachaufgabe sind ein Vielfaches der Einmaleins-Zeiten –
  // gegen ihresgleichen gehalten aber völlig normal. Ein globaler Vergleich
  // würde hier JEDE Sachaufgabe als langsam brandmarken.
  const befunde = muehsameTypen(mitMessungen());
  assert.ok(
    befunde.every((b) => !b.typ.startsWith("sach/")),
    "Sachaufgaben dürfen nicht am Einmaleins gemessen werden"
  );
});

test("zu wenige Messungen sind keine Aussage – auch nicht für den Median", () => {
  const f = mitMessungen();
  // Noch nicht reif: darf weder auffallen noch den Median der anderen kippen.
  f.tempo["einmaleins/kernaufgabe"] = { sekunden: 30, anzahl: TEMPO_AB - 1 };
  const befunde = muehsameTypen(f);
  assert.deepEqual(befunde.map((b) => b.typ), ["einmaleins/reihe-7"]);
  assert.equal(befunde[0].ueblich, 4, "die unreife Messung darf den Median nicht verschieben");
});

test("ein Bereich mit nur einem Typ kann nicht auffallen", () => {
  const f = standardFortschritt();
  f.tempo = { "uhr/ablesen": { sekunden: 50, anzahl: 20 } };
  assert.deepEqual(muehsameTypen(f), [], "ohne Vergleichswert gibt es keinen Befund");
});

test("knapp über dem Üblichen ist noch nicht mühsam", () => {
  const f = standardFortschritt();
  f.tempo = {
    // Faktor 1,5 wäre erreicht, aber der Abstand von 3 Sekunden nicht.
    "einmaleins/reihe-2": { sekunden: 3, anzahl: 10 },
    "einmaleins/reihe-4": { sekunden: 3, anzahl: 10 },
    "einmaleins/reihe-6": { sekunden: 5, anzahl: 10 },
  };
  assert.deepEqual(muehsameTypen(f), [], "bei schnellen Typen ist der Faktor allein Rauschen");
});

/* --------------------------------------------------------- Schwerpunkte */

test("mühsame Typen füllen die freien Plätze der Schwerpunkte", () => {
  const f = mitMessungen();
  f.fehler = { "geld/rueckgeld": SCHWERPUNKT_AB };
  const gewaehlt = schwerpunkte(f);
  assert.ok(gewaehlt.has("geld/rueckgeld"), "Fehler bleiben Schwerpunkt");
  assert.ok(gewaehlt.has("einmaleins/reihe-7"), "die zähe Reihe kommt dazu");
  assert.equal(gewaehlt.size, 2);
});

test("Fehler gehen vor: Mühsames bekommt keinen Platz, den ein Fehler braucht", () => {
  const f = mitMessungen();
  f.fehler = { "geld/rueckgeld": 5, "uhr/ablesen": 4 };
  const gewaehlt = schwerpunkte(f, 2);
  assert.deepEqual([...gewaehlt].sort(), ["geld/rueckgeld", "uhr/ablesen"]);
});

test("ein Typ, der falsch UND langsam ist, belegt nur einen Platz", () => {
  const f = mitMessungen();
  f.fehler = { "einmaleins/reihe-7": SCHWERPUNKT_AB };
  assert.equal(schwerpunkte(f).size, 1);
});

/* ------------------------------------------------- Speicher und Abgleich */

test("die Prüfung wirft kaputte Tempo-Einträge weg und rundet echte", () => {
  const geprueft = pruefeFortschritt({
    tempo: {
      echt: { sekunden: 7.25, anzahl: 4 },
      negativ: { sekunden: -3, anzahl: 5 },
      null: { sekunden: 0, anzahl: 5 },
      riesig: { sekunden: 1e9, anzahl: 5 },
      text: { sekunden: "zwölf", anzahl: 5 },
      ohneAnzahl: { sekunden: 5 },
      anzahlKaputt: { sekunden: 5, anzahl: "viele" },
      kaputt: "hallo",
    },
  });
  assert.deepEqual(geprueft.tempo, { echt: { sekunden: 7.3, anzahl: 4 } });

  // Gar kein oder ein falsches Feld ergibt eine leere Bilanz, keinen Absturz.
  assert.deepEqual(pruefeFortschritt({}).tempo, {});
  assert.deepEqual(pruefeFortschritt({ tempo: [1, 2, 3] }).tempo, {});
  assert.deepEqual(pruefeFortschritt({ tempo: "schnell" }).tempo, {});
});

test("beim Kappen überleben die am besten belegten Einträge", () => {
  const tempo = {};
  for (let i = 0; i < 400; i++) tempo[`typ/${i}`] = { sekunden: 5, anzahl: i + 1 };
  const geprueft = pruefeFortschritt({ tempo });
  const schluessel = Object.keys(geprueft.tempo);
  assert.equal(schluessel.length, 300, "die Bilanz darf nicht unbegrenzt wachsen");
  assert.ok(!schluessel.includes("typ/0"), "die dünnste Messung fliegt zuerst");
  assert.ok(schluessel.includes("typ/399"), "die dickste Messung bleibt");

  // Überlange Typnamen werden gestutzt wie bei der Fehlerbilanz.
  const lang = pruefeFortschritt({ tempo: { ["x".repeat(90)]: { sekunden: 5, anzahl: 2 } } });
  assert.deepEqual(Object.keys(lang.tempo), ["x".repeat(60)]);
});

test("beim Abgleich kommt das Tempo vom zuletzt benutzten Gerät", () => {
  const frisch = standardFortschritt();
  frisch.letzterTag = "2026-08-23";
  frisch.tempo = { "einmaleins/reihe-7": { sekunden: 12, anzahl: 5 } };
  const alt = standardFortschritt();
  alt.letzterTag = "2026-08-01";
  alt.tempo = { "einmaleins/reihe-7": { sekunden: 30, anzahl: 2 } };

  // Wie Fehlerbilanz und Stufe: kein Maximum, sondern der aktuelle Stand –
  // in beiden Richtungen des Aufrufs.
  assert.deepEqual(verschmelze(frisch, alt).tempo, frisch.tempo);
  assert.deepEqual(verschmelze(alt, frisch).tempo, frisch.tempo);
});
