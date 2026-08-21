import "./setup.js";
import test from "node:test";
import assert from "node:assert/strict";

import { mulberry32 } from "../js/random.js";
import { GENERATOREN, RUNDENLAENGE, gemischteRunde, runde } from "../js/tasks/index.js";
import { THEMEN } from "../js/topics.js";

const STUFEN = [1, 2, 3];

/** Prüft die Grundform jeder Aufgabe – unabhängig vom Thema. */
function pruefeAufgabe(aufgabe, kontext) {
  assert.ok(aufgabe.typ && typeof aufgabe.typ === "string", `${kontext}: Typ fehlt`);
  assert.ok(aufgabe.frage.length > 5, `${kontext}: Frage zu kurz`);
  assert.ok(typeof aufgabe.loesung === "string" && aufgabe.loesung.length > 0, `${kontext}: keine Lösung`);
  assert.ok(!/undefined|NaN|\[object/.test(JSON.stringify(aufgabe)), `${kontext}: kaputter Text`);

  if (aufgabe.antwortfeld.art === "zahl") {
    assert.match(aufgabe.loesung, /^\d+$/, `${kontext}: Zahlenantwort ist keine natürliche Zahl`);
    assert.ok(Number(aufgabe.loesung) <= 1000, `${kontext}: Lösung ${aufgabe.loesung} zu groß für Klasse 2`);
  } else if (aufgabe.antwortfeld.art === "bildauswahl") {
    const optionen = aufgabe.antwortfeld.optionen;
    const kennungen = optionen.map((o) => o.kennung);
    assert.ok(optionen.length >= 2, `${kontext}: zu wenige Bildkarten`);
    assert.equal(new Set(kennungen).size, kennungen.length, `${kontext}: doppelte Kennung`);
    assert.ok(kennungen.includes(aufgabe.loesung), `${kontext}: Lösung fehlt in der Bildauswahl`);
    for (const option of optionen) {
      assert.match(option.svg, /^<svg /, `${kontext}: Bildkarte ohne SVG`);
      assert.ok(option.beschriftung.length > 3, `${kontext}: Bildkarte ohne Beschreibung`);
    }
    // Zwei gleiche Bilder wären nicht entscheidbar.
    const bilder = optionen.map((o) => o.svg);
    assert.equal(new Set(bilder).size, bilder.length, `${kontext}: zwei Bildkarten sind identisch`);
  } else {
    const optionen = aufgabe.antwortfeld.optionen;
    assert.ok(optionen.length >= 2, `${kontext}: zu wenige Auswahlmöglichkeiten`);
    assert.equal(new Set(optionen).size, optionen.length, `${kontext}: doppelte Auswahlmöglichkeit`);
    assert.ok(optionen.includes(aufgabe.loesung), `${kontext}: Lösung fehlt in der Auswahl`);
  }
}

test("jeder Generator liefert auf jeder Stufe wohlgeformte Aufgaben", () => {
  for (const thema of THEMEN) {
    for (const stufe of STUFEN) {
      const rng = mulberry32(20260820 + stufe);
      for (let i = 0; i < 300; i++) {
        pruefeAufgabe(GENERATOREN[thema.id](rng, stufe), `${thema.id}/Stufe ${stufe}/Durchlauf ${i}`);
      }
    }
  }
});

test("Rechnungen stimmen mit der angegebenen Lösung überein", () => {
  const rechenthemen = ["plusminus", "einmaleins", "geteilt", "analogie", "familien"];
  for (const id of rechenthemen) {
    for (const stufe of STUFEN) {
      const rng = mulberry32(4711 + stufe);
      for (let i = 0; i < 400; i++) {
        const aufgabe = GENERATOREN[id](rng, stufe);
        if (aufgabe.antwortfeld.art !== "zahl") continue;
        const treffer = aufgabe.rechnung?.match(/^(\d+) ([+−·:]) (\d+) =$/);
        if (!treffer) continue;
        const [, a, zeichen, b] = treffer;
        const erwartet = {
          "+": Number(a) + Number(b),
          "−": Number(a) - Number(b),
          "·": Number(a) * Number(b),
          ":": Number(a) / Number(b),
        }[zeichen];
        assert.equal(
          Number(aufgabe.loesung),
          erwartet,
          `${id}/Stufe ${stufe}: ${aufgabe.rechnung} ${aufgabe.loesung}`
        );
      }
    }
  }
});

test("Plus und Minus bleiben im Zahlenraum bis 100", () => {
  for (const stufe of STUFEN) {
    const rng = mulberry32(99 + stufe);
    for (let i = 0; i < 500; i++) {
      const aufgabe = GENERATOREN.plusminus(rng, stufe);
      if (aufgabe.antwortfeld.art !== "zahl") continue;
      assert.ok(
        Number(aufgabe.loesung) <= 100,
        `Stufe ${stufe}: Ergebnis ${aufgabe.loesung} verlässt den Zahlenraum (${aufgabe.rechnung})`
      );
    }
  }
});

test("Stufe 2 von Plus/Minus kommt ohne Zehnerübergang aus", () => {
  const rng = mulberry32(2024);
  for (let i = 0; i < 500; i++) {
    const aufgabe = GENERATOREN.plusminus(rng, 2);
    const treffer = aufgabe.rechnung?.match(/^(\d+) ([+−]) (\d+) =$/);
    if (!treffer) continue;
    const [, a, zeichen, b] = treffer;
    const einerA = Number(a) % 10;
    const einerB = Number(b) % 10;
    if (zeichen === "+") assert.ok(einerA + einerB <= 9, `Zehnerübergang in ${aufgabe.rechnung}`);
    else assert.ok(einerA >= einerB, `Zehnerübergang in ${aufgabe.rechnung}`);
  }
});

test("Einmaleins Stufe 1 nutzt nur die einfachen Reihen", () => {
  const erlaubt = new Set([1, 2, 5, 10]);
  const rng = mulberry32(7);
  for (let i = 0; i < 400; i++) {
    const aufgabe = GENERATOREN.einmaleins(rng, 1);
    const treffer = aufgabe.rechnung?.match(/^(\d+) · (\d+) =$/);
    if (!treffer) continue;
    const [, a, b] = treffer;
    assert.ok(
      erlaubt.has(Number(a)) || erlaubt.has(Number(b)),
      `Unerwartete Reihe in ${aufgabe.rechnung}`
    );
  }
});

test("eine Runde hat zehn Aufgaben und ist bei gleichem Seed reproduzierbar", () => {
  for (const thema of THEMEN) {
    const eins = runde(thema.id, mulberry32(123), 2);
    const zwei = runde(thema.id, mulberry32(123), 2);
    assert.equal(eins.length, RUNDENLAENGE);
    assert.deepEqual(eins, zwei, `${thema.id}: Runde ist nicht reproduzierbar`);
  }
});

test("das gemischte Training zieht aus mehreren Themen", () => {
  const stufen = Object.fromEntries(THEMEN.map((t) => [t.id, 2]));
  const eintraege = gemischteRunde(mulberry32(555), stufen, RUNDENLAENGE);
  assert.equal(eintraege.length, RUNDENLAENGE);
  assert.ok(new Set(eintraege.map((e) => e.thema)).size >= 5, "zu wenig Abwechslung");
  for (const eintrag of eintraege) pruefeAufgabe(eintrag.aufgabe, `mix/${eintrag.thema}`);
});
