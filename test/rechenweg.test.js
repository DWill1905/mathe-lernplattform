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

test("Zeitspanne: Erklärung geht über die volle Stunde, Tipp nur wenn es eine gibt", () => {
  const rng = mulberry32(1815);
  let ueber = 0;
  let ohne = 0;
  for (let i = 0; i < 3000; i++) {
    const a = GENERATOREN.uhrzeit(rng, 3);
    if (a.typ !== "uhrzeit/zeitspanne") continue;
    const [, h1, , h2, m2] = a.frage.match(/um (\d+):(\d+) Uhr und endet um (\d+):(\d+) Uhr/).map(Number);
    const volleStunde = h2 > h1 && m2 !== 0 ? `${h1 + 1}:00` : null;
    assert.ok(a.erklaerung.endsWith(`${a.loesung} Minuten.`), a.erklaerung);
    assert.ok(!a.erklaerung.includes("Eine Stunde hat 60 Minuten"), a.erklaerung);
    assert.ok(!/Zusammen: \d+ =/.test(a.erklaerung), `nur ein Abschnitt: ${a.erklaerung}`);
    if (volleStunde) {
      ueber++;
      assert.ok(a.erklaerung.includes(`bis ${volleStunde} sind es`), a.erklaerung);
    }
    if (h2 === h1) {
      ohne++;
      assert.ok(!a.tipp.includes("volle"), `${a.frage} → ${a.tipp}`);
    }
  }
  assert.ok(ueber > 50 && ohne > 20, `zu wenige Zeitspannen (${ueber}/${ohne})`);
});

test("Längen: „Was ist länger?“ begründet mit beiden Zahlen", () => {
  const rng = mulberry32(214);
  for (let i = 0; i < 2000; i++) {
    const a = GENERATOREN.laengen(rng, 2);
    if (a.typ !== "laengen/vergleich") continue;
    assert.equal(a.frage, "Was ist länger?");
    assert.ok(a.erklaerung.endsWith(`also ist ${a.loesung} länger.`), a.erklaerung);
  }
});

test("Sachaufgaben: bezahlt wird mit einem passenden Schein, gefragt in ganzen Sätzen", () => {
  const rng = mulberry32(5050);
  let einkaeufe = 0;
  for (let i = 0; i < 4000; i++) {
    const a = GENERATOREN.sachaufgaben(rng, 3);
    assert.ok(!/mehr als \S+ sind das\?/.test(a.frage), a.frage);
    if (a.typ !== "sach/einkauf") continue;
    einkaeufe++;
    const [, kosten, gezahlt] = a.erklaerung.match(/= (\d+) €, dann (\d+) €/).map(Number);
    const passend = [10, 20, 50].filter((schein) => schein >= kosten);
    assert.ok(passend.indexOf(gezahlt) <= 1, `${kosten} € mit ${gezahlt} € bezahlt`);
    assert.ok(gezahlt === passend[0] || gezahlt < kosten * 5, `${kosten} € mit ${gezahlt} € bezahlt`);
  }
  assert.ok(einkaeufe > 200);
  const rng2 = mulberry32(5151);
  for (let i = 0; i < 3000; i++) {
    const a = GENERATOREN.sachaufgaben(rng2, 2);
    assert.ok(!a.frage.endsWith("Wie viele Runden sind das?"), a.frage);
  }
});

test("Knobeln: die Zahl ist weiblich", () => {
  const rng = mulberry32(1717);
  for (let i = 0; i < 2000; i++) {
    const a = GENERATOREN.knobeln(rng, 2);
    if (a.typ !== "knobeln/nachbarn") continue;
    assert.match(a.frage, /^Zähle die \d+ und ihre beiden Nachbarzahlen zusammen\.$/);
  }
});
