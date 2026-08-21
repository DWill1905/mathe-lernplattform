import "./setup.js";
import test from "node:test";
import assert from "node:assert/strict";

import { mulberry32 } from "../js/random.js";
import { puzzleHoehen, puzzleteil } from "../js/figures.js";
import { verteile } from "../js/tasks/mauern.js";
import { zerlegeEuro } from "../js/tasks/groessen.js";
import { GENERATOREN } from "../js/tasks/index.js";

test("verteile zerlegt eine Summe restlos in nicht-negative Teile", () => {
  const rng = mulberry32(4);
  for (let i = 0; i < 300; i++) {
    const summe = rng.int(0, 100);
    const teile = verteile(rng, summe, 4);
    assert.equal(teile.length, 4);
    assert.equal(
      teile.reduce((a, b) => a + b, 0),
      summe
    );
    for (const teil of teile) assert.ok(teil >= 0);
  }
});

test("im Rechenkasten passen die vier Zahlen zum Fähnchen", () => {
  for (const stufe of [1, 2, 3]) {
    const rng = mulberry32(515 + stufe);
    let kaesten = 0;
    for (let i = 0; i < 600; i++) {
      const aufgabe = GENERATOREN.mauern(rng, stufe);
      if (!aufgabe.typ.startsWith("mauern/kasten")) continue;
      kaesten++;

      const luecken = aufgabe.bild.svg.match(/>\?</g) ?? [];
      assert.equal(luecken.length, 1, "es darf genau ein Feld fehlen");

      const felder = [...aufgabe.bild.svg.matchAll(/font-size="23">([\d?]+)</g)].map((t) => t[1]);
      const fahne = aufgabe.bild.svg.match(/font-size="22">([\d?]+)</)[1];
      assert.equal(felder.length, 4, "der Kasten hat vier Felder");

      const zahlen = felder.map((f) => (f === "?" ? Number(aufgabe.loesung) : Number(f)));
      const summe = fahne === "?" ? Number(aufgabe.loesung) : Number(fahne);
      assert.equal(
        zahlen.reduce((a, b) => a + b, 0),
        summe,
        `${zahlen.join(" + ")} ergibt nicht ${summe}`
      );
      assert.ok(summe <= 100, "der Kasten verlässt den Zahlenraum");
    }
    assert.ok(kaesten > 80, `Stufe ${stufe}: zu wenige Kästen gezogen`);
  }
});

test("die Pfeilfolge passt zu ihren Pfeilen und bleibt bis 100", () => {
  for (const stufe of [2, 3]) {
    const rng = mulberry32(88 + stufe);
    let folgen = 0;
    for (let i = 0; i < 800; i++) {
      const aufgabe = GENERATOREN.zahlenraum(rng, stufe);
      if (aufgabe.typ !== "zahlenraum/pfeilfolge") continue;
      folgen++;

      const kaesten = [...aufgabe.bild.svg.matchAll(/font-size="22">([\d?]+)</g)].map((t) => t[1]);
      const pfeile = [...aufgabe.bild.svg.matchAll(/font-size="19">([+−]\d+)</g)].map((t) => t[1]);
      assert.equal(kaesten.length, 6);
      assert.equal(pfeile.length, 5);
      assert.equal(kaesten.filter((k) => k === "?").length, 1, "genau ein Kästchen ist leer");

      const werte = kaesten.map((k) => (k === "?" ? Number(aufgabe.loesung) : Number(k)));
      for (let n = 0; n < pfeile.length; n++) {
        const schritt = Number(pfeile[n].replace("−", "-").replace("+", ""));
        assert.equal(werte[n] + schritt, werte[n + 1], `Pfeil ${pfeile[n]} passt nicht`);
      }
      for (const wert of werte) assert.ok(wert >= 0 && wert <= 100);
    }
    assert.ok(folgen > 40, `Stufe ${stufe}: zu wenige Pfeilfolgen gezogen`);
  }
});

test("die beiden Puzzleteile teilen sich genau eine Schnittlinie", () => {
  const rng = mulberry32(31);
  for (let i = 0; i < 200; i++) {
    const hoehen = puzzleHoehen(() => rng.next());
    // Keine zwei gleichen Stufen hintereinander – sonst wäre die Kante gerade.
    for (let n = 1; n < hoehen.length; n++) assert.notEqual(hoehen[n], hoehen[n - 1]);

    const punkteVon = (svg) => new Set(svg.match(/points="([^"]+)"/)[1].split(" "));
    const oben = punkteVon(puzzleteil(hoehen, true));
    const unten = punkteVon(puzzleteil(hoehen, false));
    const gemeinsam = [...oben].filter((punkt) => unten.has(punkt));
    assert.equal(gemeinsam.length, hoehen.length * 2, "die Schnittkante stimmt nicht überein");
  }
});

test("das Puzzle bietet vier verschiedene Teile und genau ein passendes", () => {
  const rng = mulberry32(777);
  let puzzles = 0;
  for (let i = 0; i < 400; i++) {
    const aufgabe = GENERATOREN.geometrie(rng, 1);
    if (aufgabe.typ !== "geometrie/puzzle") continue;
    puzzles++;
    const optionen = aufgabe.antwortfeld.optionen;
    assert.equal(optionen.length, 4);
    assert.deepEqual(
      optionen.map((o) => o.kennung),
      ["A", "B", "C", "D"]
    );

    // Nur das richtige Teil ergänzt das obere Teil zu einem vollen Rechteck.
    const kante = (svg) => svg.match(/points="([^"]+)"/)[1].split(" ");
    const obenPunkte = new Set(kante(aufgabe.bild.svg));
    const passend = optionen.filter((o) => kante(o.svg).filter((p) => obenPunkte.has(p)).length >= 8);
    assert.equal(passend.length, 1, "es passt nicht genau ein Teil");
    assert.equal(passend[0].kennung, aufgabe.loesung);
  }
  assert.ok(puzzles > 50, "zu wenige Puzzles gezogen");
});

test("zerlegeEuro ergibt zusammen wieder den Betrag", () => {
  for (let betrag = 1; betrag <= 60; betrag++) {
    const summe = zerlegeEuro(betrag)
      .split(" + ")
      .reduce((a, teil) => a + Number(teil.replace(" €", "")), 0);
    assert.equal(summe, betrag);
  }
});

test("beim Geldlegen führt nur eine Auswahl zum Preis", () => {
  const rng = mulberry32(1212);
  let aufgaben = 0;
  for (let i = 0; i < 600; i++) {
    const aufgabe = GENERATOREN.geld(rng, 3);
    if (aufgabe.typ !== "geld/betrag-legen") continue;
    aufgaben++;
    const ziel = Number(aufgabe.frage.match(/genau (\d+) €/)[1]);
    const summen = aufgabe.antwortfeld.optionen.map((o) =>
      o.split(" + ").reduce((a, teil) => a + Number(teil.replace(" €", "")), 0)
    );
    assert.equal(summen.filter((s) => s === ziel).length, 1, "mehr als eine Auswahl passt");
    const richtigeSumme = aufgabe.loesung
      .split(" + ")
      .reduce((a, teil) => a + Number(teil.replace(" €", "")), 0);
    assert.equal(richtigeSumme, ziel);
  }
  assert.ok(aufgaben > 60, "zu wenige Geldaufgaben gezogen");
});
