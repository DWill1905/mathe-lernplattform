import "./setup.js";
import test from "node:test";
import assert from "node:assert/strict";

import { mulberry32 } from "../js/random.js";
import { baueMauer } from "../js/tasks/mauern.js";
import { GENERATOREN } from "../js/tasks/index.js";

test("baueMauer stapelt jede Reihe als Summe der Reihe darunter", () => {
  assert.deepEqual(baueMauer([3, 4]), [[3, 4], [7]]);
  assert.deepEqual(baueMauer([1, 2, 5]), [
    [1, 2, 5],
    [3, 7],
    [10],
  ]);
  assert.deepEqual(baueMauer([9]), [[9]]);
});

test("in jeder Zahlenmauer fehlt genau ein Stein", () => {
  for (const stufe of [1, 2, 3]) {
    const rng = mulberry32(808 + stufe);
    let mauern = 0;
    for (let i = 0; i < 400; i++) {
      const aufgabe = GENERATOREN.mauern(rng, stufe);
      if (!aufgabe.typ.startsWith("mauern/mauer")) continue;
      mauern++;
      const luecken = aufgabe.bild.svg.match(/>\?<\/text>/g) ?? [];
      assert.equal(luecken.length, 1, `Stufe ${stufe}: ${luecken.length} Lücken statt einer`);
    }
    assert.ok(mauern > 50, `Stufe ${stufe}: zu wenige Mauern gezogen`);
  }
});

test("die Zahlenmauer bleibt im Zahlenraum bis 100", () => {
  for (const stufe of [1, 2, 3]) {
    const rng = mulberry32(31 + stufe);
    for (let i = 0; i < 400; i++) {
      const aufgabe = GENERATOREN.mauern(rng, stufe);
      if (!aufgabe.typ.startsWith("mauern/mauer")) continue;
      const zahlen = [...aufgabe.bild.svg.matchAll(/font-size="22">(\d+)</g)].map((t) => Number(t[1]));
      for (const zahl of zahlen) {
        assert.ok(zahl <= 100, `Stufe ${stufe}: Stein ${zahl} liegt über 100`);
      }
      assert.ok(Number(aufgabe.loesung) <= 100);
    }
  }
});

test("im Rechenrad ergeben außen und innen immer die Zahl der Mitte", () => {
  for (const stufe of [1, 2, 3]) {
    const rng = mulberry32(4242 + stufe);
    let raeder = 0;
    for (let i = 0; i < 400; i++) {
      const aufgabe = GENERATOREN.mauern(rng, stufe);
      if (aufgabe.typ !== "mauern/rechenrad") continue;
      raeder++;
      const mitte = Number(aufgabe.frage.match(/immer (\d+)\./)[1]);
      const zahlen = [...aufgabe.bild.svg.matchAll(/font-size="20">([\d?]+)</g)].map((t) => t[1]);
      // Die Beschriftungen kommen paarweise: außen, dann innen.
      assert.equal(zahlen.length, 12, "ein Rechenrad hat sechs Felder mit je zwei Zahlen");
      let luecken = 0;
      for (let feld = 0; feld < 6; feld++) {
        const aussen = Number(zahlen[feld * 2]);
        const innen = zahlen[feld * 2 + 1];
        if (innen === "?") {
          luecken++;
          assert.equal(aussen + Number(aufgabe.loesung), mitte, "die Lösung passt nicht zur Mitte");
        } else {
          assert.equal(aussen + Number(innen), mitte, `${aussen} + ${innen} ist nicht ${mitte}`);
        }
      }
      assert.equal(luecken, 1);
    }
    assert.ok(raeder > 30, `Stufe ${stufe}: zu wenige Räder gezogen`);
  }
});

test("die Hilfsaufgabe der Vorstufe stimmt selbst", () => {
  for (const id of ["analogie", "familien"]) {
    for (const stufe of [1, 2, 3]) {
      const rng = mulberry32(1234 + stufe);
      let vorstufen = 0;
      for (let i = 0; i < 400; i++) {
        const aufgabe = GENERATOREN[id](rng, stufe);
        if (!aufgabe.vorstufe) continue;
        vorstufen++;
        const treffer = aufgabe.vorstufe.rechnung.match(/^(\d+) ([+−]) (\d+) =$/);
        assert.ok(treffer, `unerwartete Hilfsaufgabe: ${aufgabe.vorstufe.rechnung}`);
        const [, a, zeichen, b] = treffer;
        const erwartet = zeichen === "+" ? Number(a) + Number(b) : Number(a) - Number(b);
        assert.equal(
          Number(aufgabe.vorstufe.loesung),
          erwartet,
          `falsche Hilfsaufgabe: ${aufgabe.vorstufe.rechnung} ${aufgabe.vorstufe.loesung}`
        );
        assert.ok(erwartet >= 0, "eine Hilfsaufgabe darf nie negativ werden");
        assert.ok(aufgabe.vorstufe.frage.length > 5);
      }
      assert.ok(vorstufen > 30, `${id}/Stufe ${stufe}: kaum Hilfsaufgaben gezogen`);
    }
  }
});

test("Aufgabenfamilien nennen nur stimmige Ausgangsaufgaben", () => {
  for (const stufe of [1, 2, 3]) {
    const rng = mulberry32(77 + stufe);
    for (let i = 0; i < 400; i++) {
      const aufgabe = GENERATOREN.familien(rng, stufe);
      for (const treffer of aufgabe.frage.matchAll(/(\d+) ([+−]) (\d+) = (\d+)/g)) {
        const [, a, zeichen, b, ergebnis] = treffer;
        const erwartet = zeichen === "+" ? Number(a) + Number(b) : Number(a) - Number(b);
        assert.equal(Number(ergebnis), erwartet, `falsche Angabe: ${aufgabe.frage}`);
      }
      if (aufgabe.antwortfeld.art === "auswahl") {
        for (const option of aufgabe.antwortfeld.optionen) {
          const treffer = option.match(/^(\d+) \+ (\d+) = (\d+)$/) ?? option.match(/^(\d+) − (\d+) = (\d+)$/);
          if (!treffer) continue;
          const zeichen = option.includes("+") ? 1 : -1;
          const erwartet = Number(treffer[1]) + zeichen * Number(treffer[2]);
          assert.equal(Number(treffer[3]), erwartet, `falsche Auswahl: ${option}`);
        }
      }
    }
  }
});
