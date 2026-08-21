import "./setup.js";
import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

import {
  PUZZLE_TEILE,
  motivNamen,
  puzzleBild,
  themenbild,
  themenbildKennungen,
  waehleMotiv,
} from "../js/bilder.js";
import { THEMEN } from "../js/topics.js";

const CSS = readFileSync(new URL("../style.css", import.meta.url), "utf8");

test("jedes Thema hat ein eigenes Bild", () => {
  const vorhanden = new Set(themenbildKennungen());
  for (const t of THEMEN) {
    assert.ok(vorhanden.has(t.id), `Themenbild fehlt: ${t.id}`);
  }
  // Die drei Schnellstart-Knöpfe brauchen ebenfalls eines.
  for (const k of ["mix", "puzzle", "meister"]) {
    assert.ok(vorhanden.has(k), `Bild fehlt: ${k}`);
  }
});

test("kein Themenbild gleicht einem anderen", () => {
  const gesehen = new Map();
  for (const k of themenbildKennungen()) {
    const svg = themenbild(k);
    assert.ok(!gesehen.has(svg), `${k} sieht aus wie ${gesehen.get(svg)}`);
    gesehen.set(svg, k);
  }
});

test("Bilder tragen keine Farbe im SVG – sonst bricht der Dunkelmodus", () => {
  const alle = [
    ...themenbildKennungen().map((k) => themenbild(k)),
    ...motivNamen().map((_, i) => waehleMotiv(i).svg),
  ];
  for (const svg of alle) {
    assert.ok(!/fill="(?!none)/.test(svg), `feste Füllfarbe: ${svg.slice(0, 120)}`);
    assert.ok(!/stroke="(?!none)/.test(svg), `feste Strichfarbe: ${svg.slice(0, 120)}`);
    assert.ok(!/#[0-9a-fA-F]{3,6}/.test(svg), `Farbwert im SVG: ${svg.slice(0, 120)}`);
    assert.match(svg, /^<svg viewBox="0 0 \d+ \d+" class="illu"/);
    assert.match(svg, /<\/svg>$/);
    assert.ok(svg.includes('aria-hidden="true"'), "Bild muss für Screenreader unsichtbar sein");
  }
});

test("jede benutzte bild-Klasse steht auch im Stylesheet", () => {
  const benutzt = new Set();
  const alle = [
    ...themenbildKennungen().map((k) => themenbild(k)),
    ...motivNamen().map((_, i) => waehleMotiv(i).svg),
  ];
  for (const svg of alle) {
    for (const treffer of svg.matchAll(/class="([^"]+)"/g)) {
      for (const klasse of treffer[1].split(/\s+/)) if (klasse.startsWith("bild")) benutzt.add(klasse);
    }
  }
  assert.ok(benutzt.size > 5, "es sollten mehrere Farbklassen vorkommen");
  for (const klasse of benutzt) {
    assert.ok(CSS.includes(`.${klasse} {`), `Klasse ${klasse} fehlt in style.css`);
  }
});

test("alle Motive sind verschieden und haben einen Namen", () => {
  const namen = motivNamen();
  assert.ok(namen.length >= 8, "zu wenige Motive – dann wiederholt sich das Puzzle zu schnell");
  assert.equal(new Set(namen).size, namen.length, "doppelter Motivname");
  for (const name of namen) assert.match(name, /^[A-ZÄÖÜ][\wäöüß]+$/);

  // waehleMotiv muss über alle Motive streuen und mit jeder Zahl klarkommen.
  const getroffen = new Set();
  for (let i = 0; i < 500; i++) getroffen.add(waehleMotiv(i * 7919).name);
  assert.equal(getroffen.size, namen.length, "nicht jedes Motiv wird gezogen");
  for (const zahl of [0, -5, 2 ** 31, 0.5]) {
    assert.ok(motivNamen().includes(waehleMotiv(zahl).name), `waehleMotiv(${zahl}) kaputt`);
  }
});

test("das Puzzle deckt genau die richtigen Teile auf", () => {
  const puzzle = waehleMotiv(3);
  assert.equal(puzzle.spalten * puzzle.zeilen, PUZZLE_TEILE);

  // Ganz zu: ein Deckel je Teil.
  const zu = puzzleBild(puzzle, new Array(PUZZLE_TEILE).fill("zu"));
  assert.equal([...zu.matchAll(/class="puzzle-zu"/g)].length, PUZZLE_TEILE);
  assert.equal([...zu.matchAll(/class="puzzle-grau"/g)].length, 0);

  // Ganz auf: kein Deckel mehr, aber das Motiv ist noch da.
  const auf = puzzleBild(puzzle, new Array(PUZZLE_TEILE).fill("auf"));
  assert.equal([...auf.matchAll(/class="puzzle-(zu|grau)"/g)].length, 0);
  assert.ok(auf.includes("bild-gruen") || auf.length > 200, "Motiv fehlt");

  // Gemischt: jede Sorte genau so oft, wie sie im Stand steht.
  const stand = ["auf", "grau", "zu", "auf", "grau", "zu", "auf", "auf", "zu", "zu", "grau", "auf"];
  const gemischt = puzzleBild(puzzle, stand);
  assert.equal([...gemischt.matchAll(/class="puzzle-zu"/g)].length, 4);
  assert.equal([...gemischt.matchAll(/class="puzzle-grau"/g)].length, 3);

  // Ein zu kurzer Stand darf nicht durchfallen – fehlende Teile gelten als zu.
  const kurz = puzzleBild(puzzle, ["auf"]);
  assert.equal([...kurz.matchAll(/class="puzzle-zu"/g)].length, PUZZLE_TEILE - 1);
});

test("die Deckel decken die Bildfläche lückenlos ab", () => {
  const puzzle = waehleMotiv(1);
  const svg = puzzleBild(puzzle, new Array(PUZZLE_TEILE).fill("zu"));
  let flaeche = 0;
  const ecken = new Set();
  for (const t of svg.matchAll(/<rect x="([\d.]+)" y="([\d.]+)" width="([\d.]+)" height="([\d.]+)" rx="3"/g)) {
    flaeche += Number(t[3]) * Number(t[4]);
    ecken.add(`${t[1]}/${t[2]}`);
  }
  assert.equal(flaeche, 120 * 90, "die Deckel füllen das Bild nicht aus");
  assert.equal(ecken.size, PUZZLE_TEILE, "zwei Deckel liegen aufeinander");
});

/*
 * Regressionsschutz für einen Fehler, der zweimal auf dieselbe Art auftrat:
 * Ein Inline-SVG hat nur eine `viewBox` und sonst keine eigene Größe. Sobald
 * seine Höhe (oder Breite) am Elternteil hängt und dessen Größe wiederum am
 * Inhalt, löst der Browser das mit NULL auf – Rechenrad, Rechenkasten und
 * Zahlenmauer verschwanden dadurch spurlos aus der Übung.
 */
test("das Erklärbild der Übung kann nicht auf null zusammenfallen", () => {
  const regeln = [...CSS.matchAll(/\.karte-aufgabe[^{}]*\.bild\s+svg\s*\{([^}]*)\}/g)].map((t) => t[1]);
  assert.ok(regeln.length > 0, "keine Regel für das Erklärbild gefunden");
  for (const regel of regeln) {
    assert.ok(
      !/width:\s*auto/.test(regel),
      "width: auto nimmt einem Inline-SVG jede Bezugsgröße – es fällt auf 0 zusammen"
    );
    // Hängt die Höhe am Elternteil, muss der Elternteil eine eigene Höhe haben.
    if (/height:\s*100%/.test(regel)) {
      const eltern = [...CSS.matchAll(/\.karte-aufgabe\s+\.bild\s*\{([^}]*)\}/g)].map((t) => t[1]);
      assert.ok(
        eltern.some((e) => /flex:\s*1\s/.test(e)),
        "height: 100% braucht einen Elternteil mit eigener Höhe (flex-grow), sonst wird es 0"
      );
    }
  }

  // Und in jedem Fall ein Mindestmaß, damit bei wenig Platz etwas übrig bleibt.
  const eltern = [...CSS.matchAll(/body\.uebung-laeuft\s+\.karte-aufgabe\s+\.bild\s*\{([^}]*)\}/g)].map((t) => t[1]);
  assert.ok(eltern.length > 0, "keine Flexregel für das Erklärbild gefunden");
  for (const regel of eltern) {
    const treffer = regel.match(/min-height:\s*(\d+)px/);
    assert.ok(treffer, "dem Erklärbild fehlt ein Mindestmaß");
    assert.ok(Number(treffer[1]) >= 40, `Mindestmaß ${treffer[1]}px ist zu klein zum Erkennen`);
  }
});
