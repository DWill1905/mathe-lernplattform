import test from "node:test";
import assert from "node:assert/strict";

import { mulberry32 } from "../js/random.js";
import { aufgabeFuerZahl, baueRaetsel } from "../js/raetsel.js";

test("jede Rätselaufgabe trifft ihre Zielzahl genau", () => {
  const rng = mulberry32(2024);
  for (let ziel = 0; ziel <= 20; ziel++) {
    for (let i = 0; i < 40; i++) {
      const aufgabe = aufgabeFuerZahl(rng, ziel, new Set());
      const treffer = aufgabe.rechnung.match(/^(\d+) ([+−]) (\d+) =$/);
      assert.ok(treffer, `unerwartete Rechnung: ${aufgabe.rechnung}`);
      const [, a, zeichen, b] = treffer;
      const ergebnis = zeichen === "+" ? Number(a) + Number(b) : Number(a) - Number(b);
      assert.equal(ergebnis, ziel);
      assert.equal(Number(aufgabe.loesung), ziel);
      assert.ok(Number(a) <= 20 && Number(b) <= 20, "die Rätselseite bleibt im Zahlenraum bis 20");
    }
  }
});

test("das Rätsel hat je Buchstabe eine Aufgabe mit passender Lösung", () => {
  for (let seed = 1; seed <= 60; seed++) {
    const raetsel = baueRaetsel(mulberry32(seed));
    assert.equal(raetsel.aufgaben.length, raetsel.wort.length);
    const nachBuchstabe = new Map(raetsel.code.map((e) => [e.buchstabe, e.zahl]));

    raetsel.wort.split("").forEach((buchstabe, i) => {
      assert.ok(nachBuchstabe.has(buchstabe), `Buchstabe ${buchstabe} fehlt in der Legende`);
      assert.equal(
        Number(raetsel.aufgaben[i].loesung),
        nachBuchstabe.get(buchstabe),
        `Aufgabe ${i + 1} führt nicht zu ${buchstabe}`
      );
    });
  }
});

test("die Legende ist eindeutig und alphabetisch sortiert", () => {
  for (let seed = 1; seed <= 60; seed++) {
    const { code, wort } = baueRaetsel(mulberry32(seed));
    const buchstaben = code.map((e) => e.buchstabe);
    const zahlen = code.map((e) => e.zahl);

    assert.deepEqual(buchstaben, [...buchstaben].sort(), "Buchstaben nicht alphabetisch");
    assert.deepEqual(zahlen, [...zahlen].sort((a, b) => a - b), "Zahlen nicht aufsteigend");
    assert.equal(new Set(zahlen).size, zahlen.length, "zwei Buchstaben teilen sich eine Zahl");
    assert.deepEqual(buchstaben, [...new Set(wort.split(""))].sort());
    for (const zahl of zahlen) assert.ok(zahl >= 0 && zahl <= 20);
  }
});

test("gleiche Buchstaben bekommen unterschiedliche Rechnungen", () => {
  for (let seed = 1; seed <= 60; seed++) {
    const raetsel = baueRaetsel(mulberry32(seed));
    const rechnungen = raetsel.aufgaben.map((a) => a.rechnung);
    assert.equal(new Set(rechnungen).size, rechnungen.length, `doppelte Rechnung bei Seed ${seed}`);
  }
});

test("Lösungswörter haben einen erklärenden Satz und keine Umlaute", () => {
  const gesehen = new Set();
  for (let seed = 1; seed <= 200; seed++) {
    const { wort, satz } = baueRaetsel(mulberry32(seed));
    gesehen.add(wort);
    assert.match(wort, /^[A-Z]{5,10}$/, `${wort} passt nicht ins Raster`);
    assert.ok(satz.length > 20 && satz.endsWith("."), `Satz zu ${wort} passt nicht`);
  }
  assert.ok(gesehen.size >= 8, "zu wenig Abwechslung bei den Lösungswörtern");
});

test("gleicher Seed liefert dasselbe Rätsel", () => {
  assert.deepEqual(baueRaetsel(mulberry32(7)), baueRaetsel(mulberry32(7)));
});
