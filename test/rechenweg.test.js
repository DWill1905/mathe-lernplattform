import "./setup.js";
import test from "node:test";
import assert from "node:assert/strict";

import { mulberry32 } from "../js/random.js";
import { GENERATOREN } from "../js/tasks/index.js";

/** Rechnet eine Kette wie `33 − 20 + 4` von links nach rechts aus. */
function rechne(kette) {
  const teile = kette.split(" ");
  let wert = Number(teile[0]);
  for (let i = 1; i < teile.length; i += 2) {
    const zahl = Number(teile[i + 1]);
    if (teile[i] === "+") wert += zahl;
    else if (teile[i] === "−") wert -= zahl;
    else if (teile[i] === "·") wert *= zahl;
    else wert /= zahl;
  }
  return wert;
}

/** Alle Gleichungen `a op b … = c` aus einem Erklärtext (ohne „Rest"-Angaben). */
function gleichungen(text) {
  return [...text.matchAll(/(?<![\d,.:])(\d+(?: [+−·:] \d+)+) = (\d+)(?![\d,]| Rest)/g)];
}

test("jede Rechnung in einer Erklärung stimmt", () => {
  for (const [thema, generator] of Object.entries(GENERATOREN)) {
    for (const stufe of [1, 2, 3]) {
      const rng = mulberry32(70 + stufe);
      for (let i = 0; i < 300; i++) {
        const aufgabe = generator(rng, stufe);
        for (const text of [aufgabe.erklaerung ?? "", aufgabe.vorstufe?.erklaerung ?? ""]) {
          for (const [, kette, ergebnis] of gleichungen(text)) {
            assert.equal(rechne(kette), Number(ergebnis), `${thema}/${aufgabe.typ}: „${text}"`);
          }
        }
      }
    }
  }
});

test("Plus und Minus mit Übergang: erst die Zehner, dann über den Zehner", () => {
  const rng = mulberry32(3030);
  let gesehen = 0;
  for (let i = 0; i < 1500; i++) {
    const aufgabe = GENERATOREN.plusminus(rng, 3);
    if (aufgabe.typ !== "plusminus/mit-uebergang") continue;
    gesehen++;
    const [a, zeichen, b] = aufgabe.rechnung.split(" ");
    const zehnerVonB = Math.floor(Number(b) / 10) * 10;
    // Der erste Schritt nimmt die Zehner der zweiten Zahl, so wie der Tipp es sagt.
    assert.ok(
      aufgabe.erklaerung.startsWith(`Erst die Zehner: ${a} ${zeichen} ${zehnerVonB} = `),
      aufgabe.erklaerung
    );
    assert.ok(!/[+−] 0 = /.test(aufgabe.erklaerung), `leerer Schritt: ${aufgabe.erklaerung}`);
    // Die letzte Zahl der Erklärung ist das Ergebnis.
    assert.ok(aufgabe.erklaerung.endsWith(`= ${aufgabe.loesung}.`), aufgabe.erklaerung);
  }
  assert.ok(gesehen > 200, "zu wenige Aufgaben mit Übergang gezogen");
});

test("bis 20 rechnet die Erklärung mit Zahlen und der Tipp spricht nicht von Zehnern", () => {
  const rng = mulberry32(2020);
  let gesehen = 0;
  for (let i = 0; i < 800; i++) {
    const aufgabe = GENERATOREN.plusminus(rng, 1);
    if (aufgabe.typ !== "plusminus/bis20") continue;
    gesehen++;
    assert.ok(gleichungen(aufgabe.erklaerung).length > 0, `keine Rechnung in „${aufgabe.erklaerung}"`);
    assert.ok(aufgabe.erklaerung.endsWith(aufgabe.loesung) || aufgabe.erklaerung.endsWith(`${aufgabe.loesung}.`));
    assert.ok(!aufgabe.tipp.includes("Zehner, dann die Einer"), aufgabe.tipp);
  }
  assert.ok(gesehen > 100);
});

test("bei der 1 steht die Einzahl", () => {
  // Gefunden an „1 Striche“, „fehlen noch 1“, „Die 1 Zehner bleiben“,
  // „1 Reihen mit je …“ und „aus 1 Zehnern“. Die Liste enthält die Wörter,
  // die in den Generatoren hinter einer Zahl stehen.
  const falsch = [
    /(?<![\d,])\b1 (Striche|Reihen|Zehnern|Einern|Schritte|Kinder|Steine|Münzen|Scheine)\b/,
    /\b(fehlen|sind es|bleiben) (noch )?1\b(?! [€c])/,
    /\bDie 1 /,
  ];
  for (const [thema, generator] of Object.entries(GENERATOREN)) {
    for (const stufe of [1, 2, 3]) {
      const rng = mulberry32(110 + stufe);
      for (let i = 0; i < 1500; i++) {
        const a = generator(rng, stufe);
        for (const text of [a.frage, a.erklaerung, a.tipp, a.bild?.beschriftung].filter(Boolean)) {
          for (const muster of falsch) assert.ok(!muster.test(text), `${thema}/${a.typ}: „${text}"`);
        }
      }
    }
  }
});

test("Rechentricks: von einem glatten Zehner aus zurück", () => {
  const rng = mulberry32(404);
  for (let i = 0; i < 2000; i++) {
    const a = GENERATOREN.analogie(rng, 3);
    if (a.typ !== "analogie/tabelle" || !a.rechnung.includes("−")) continue;
    assert.match(a.erklaerung, /^Von \d+ aus \d+ zurück sind \d+\.$/);
  }
});
