import test from "node:test";
import assert from "node:assert/strict";

import {
  ALLE_FORMEN,
  eckenZahl,
  form,
  formVariante,
  formenreihe,
  geldbild,
  hunderterfeld,
  hunderterfeldStueck,
  punktefeld,
  rechenstrich,
  spiegelachse,
  uhr,
  zahlenstrahl,
} from "../js/figures.js";

/** Alle Bilder, die im Projekt vorkommen – für die gemeinsamen Prüfungen. */
const ALLE_BILDER = [
  uhr(3, 30),
  uhr(12, 0),
  geldbild([200, 50, 10, 2]),
  geldbild([500, 100]),
  zahlenstrahl(100, 40),
  punktefeld(3, 4),
  spiegelachse("Quadrat", true),
  hunderterfeld([10, 20, 30], 44),
  hunderterfeldStueck([
    { zeile: 1, spalte: 2, wert: 13 },
    { zeile: 2, spalte: 2, wert: null },
  ]),
  rechenstrich(40, 50, 43, true),
  formenreihe(["Kreis", "Dreieck", null]),
  formVariante("Ellipse", { groesse: 0.7, drehung: 12 }),
  ...ALLE_FORMEN.map((name) => form(name)),
];

test("jedes Bild ist ein vollständiges SVG", () => {
  for (const bild of ALLE_BILDER) {
    assert.match(bild, /^<svg [^>]*viewBox="0 0 [\d.]+ [\d.]+"/);
    assert.ok(bild.endsWith("</svg>"));
    assert.ok(!bild.includes("NaN"), "kaputte Koordinate im SVG");
    assert.ok(!bild.includes("undefined"));
  }
});

test("Bilder färben nur über CSS-Klassen – sonst bricht der Dunkelmodus", () => {
  for (const bild of ALLE_BILDER) {
    assert.ok(!/(fill|stroke)="(#|rgb|hsl)/.test(bild), `feste Farbe im SVG: ${bild.slice(0, 120)}`);
  }
});

test("die Uhr zeichnet beide Zeiger und alle Ziffern", () => {
  const bild = uhr(7, 25);
  assert.ok(bild.includes("fig-zeiger-stunde"));
  assert.ok(bild.includes("fig-zeiger-minute"));
  for (let ziffer = 1; ziffer <= 12; ziffer++) {
    assert.ok(bild.includes(`>${ziffer}</text>`), `Ziffer ${ziffer} fehlt`);
  }
});

test("Vielecke haben genau so viele Punkte wie Ecken", () => {
  for (const name of ALLE_FORMEN) {
    const bild = form(name);
    const treffer = bild.match(/points="([^"]+)"/);
    if (!treffer) continue;
    assert.equal(treffer[1].trim().split(/\s+/).length, eckenZahl(name), `${name} hat falsch viele Ecken`);
  }
});

test("Scheine werden als Rechteck, Münzen als Kreis gezeichnet", () => {
  assert.ok(geldbild([500]).includes("<rect"), "5 € ist ein Schein");
  assert.ok(!geldbild([200]).includes("<rect"), "2 € ist eine Münze");
  assert.ok(geldbild([200, 100, 50]).includes("2 €"));
  assert.ok(geldbild([50]).includes("50 ct"));
});

test("das Punktefeld enthält Reihen mal Spalten Punkte", () => {
  const bild = punktefeld(4, 6);
  assert.equal(bild.match(/fig-punkt/g).length, 24);
});

test("der Zahlenstrahl markiert die gesuchte Stelle", () => {
  const bild = zahlenstrahl(100, 70);
  assert.ok(bild.includes("fig-marke"));
  assert.ok(bild.includes(">?</text>"));
  assert.ok(!zahlenstrahl(100, null).includes("fig-marke"));
});

test("die Spiegelachse liegt bei einer echten Achse mittig", () => {
  assert.ok(spiegelachse("Rechteck", true).includes('x1="100"'));
  assert.ok(!spiegelachse("Rechteck", false).includes('x1="100"'));
});
