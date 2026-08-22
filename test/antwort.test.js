import "./setup.js";
import test from "node:test";
import assert from "node:assert/strict";

import { normalisiere, rechnungPasst } from "../js/antwort.js";

test("Leerzeichen und Schreibweise entscheiden nicht über richtig/falsch", () => {
  assert.equal(normalisiere("  Ja  "), "ja");
  assert.equal(normalisiere("Drei   Ecken"), "drei ecken");
});

test("eine selbst getippte Rechnung wird großzügig, aber richtig verglichen", () => {
  const loesung = "4 − 1 = 3";
  // Genau so, ohne Leerzeichen, mit Bindestrich von der Tastatur.
  assert.ok(rechnungPasst("4 − 1 = 3", loesung));
  assert.ok(rechnungPasst("4−1=3", loesung));
  assert.ok(rechnungPasst("4-1=3", loesung));
  assert.ok(rechnungPasst("  4 - 1 = 3  ", loesung));
  // Auch die langen Striche, die manche Tastaturen liefern.
  assert.ok(rechnungPasst("4–1=3", loesung));

  // Falsches Ergebnis, falsche Zahlen, falsches Zeichen.
  assert.ok(!rechnungPasst("4−1=4", loesung));
  assert.ok(!rechnungPasst("4−2=3", loesung));
  assert.ok(!rechnungPasst("4+1=3", loesung));
  // Nur das Ergebnis genügt nicht – die ganze Rechnung ist gefragt.
  assert.ok(!rechnungPasst("3", loesung));
  assert.ok(!rechnungPasst("", loesung));
  // Minus ist NICHT vertauschbar.
  assert.ok(!rechnungPasst("1−4=3", loesung));
});

test("beim Plus darf die Reihenfolge vertauscht sein", () => {
  assert.ok(rechnungPasst("3 + 4 = 7", "4 + 3 = 7"));
  assert.ok(rechnungPasst("4+3=7", "4 + 3 = 7"));
  // Aber nicht mit falschem Ergebnis.
  assert.ok(!rechnungPasst("3 + 4 = 8", "4 + 3 = 7"));
  // Und die Vertauschung erfindet keine neue Rechnung.
  assert.ok(!rechnungPasst("7 + 4 = 3", "4 + 3 = 7"));
});

test("mehrstellige Zahlen werden nicht verwechselt", () => {
  assert.ok(rechnungPasst("40−10=30", "40 − 10 = 30"));
  assert.ok(!rechnungPasst("4−1=3", "40 − 10 = 30"));
  assert.ok(!rechnungPasst("40−10=3", "40 − 10 = 30"));
  assert.ok(rechnungPasst("10+40=50", "40 + 10 = 50"));
});
