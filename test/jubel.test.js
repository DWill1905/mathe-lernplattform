import "./setup.js";
import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

import {
  ALLE_JUBEL_ARTEN,
  BONUS_JUBEL,
  JUBEL_ARTEN,
  jubelDauer,
  jubelSvg,
  quert,
  waehleJubel,
} from "../js/jubel.js";

const CSS = readFileSync(new URL("../style.css", import.meta.url), "utf8");

test("jede Jubelart baut ein vollständiges, farbloses SVG", () => {
  for (const art of ALLE_JUBEL_ARTEN) {
    const svg = jubelSvg(art);
    assert.match(svg, /^<svg viewBox="0 0 \d+ \d+" class="illu"/, `${art}: falsche Hülle`);
    assert.match(svg, /<\/svg>$/, `${art}: nicht geschlossen`);
    assert.ok(svg.includes('aria-hidden="true"'), `${art}: muss für Screenreader unsichtbar sein`);
    // Farben nur über Klassen – sonst bricht der Dunkelmodus.
    assert.ok(!/#[0-9a-fA-F]{3,6}/.test(svg), `${art}: Farbwert im SVG`);
    assert.ok(!/fill="(?!none)/.test(svg), `${art}: feste Füllfarbe`);
    // Inline-Styles verbietet die CSP dieser Seite.
    assert.ok(!svg.includes("style="), `${art}: Inline-Style ist durch die CSP gesperrt`);
    assert.ok(!/undefined|NaN/.test(svg), `${art}: kaputter Zahlenwert`);
  }
});

test("jede benutzte Klasse steht im Stylesheet", () => {
  for (const art of ALLE_JUBEL_ARTEN) {
    for (const treffer of jubelSvg(art).matchAll(/class="([^"]+)"/g)) {
      for (const klasse of treffer[1].split(/\s+/)) {
        if (klasse === "illu" || klasse.startsWith("bild")) continue;
        assert.ok(CSS.includes(`.${klasse} {`), `${art}: Klasse ${klasse} fehlt in style.css`);
      }
    }
  }
});

test("die Reihenfolge wechselt durch und wiederholt sich nie direkt", () => {
  const folge = [];
  for (let i = 0; i < 40; i++) folge.push(waehleJubel(i));
  for (let i = 1; i < folge.length; i++) {
    assert.notEqual(folge[i], folge[i - 1], `zweimal ${folge[i]} hintereinander`);
  }
  // Über eine ganze Runde kommt jede Art vor.
  assert.equal(new Set(folge).size, JUBEL_ARTEN.length);
});

test("waehleJubel kommt mit jeder Zahl klar", () => {
  for (const zahl of [0, -1, -99, 2 ** 31, 0.5, 123456789]) {
    assert.ok(JUBEL_ARTEN.includes(waehleJubel(zahl)), `waehleJubel(${zahl}) kaputt`);
  }
});

test("jede Art hat eine Dauer, die zur längsten Animation passt", () => {
  for (const art of ALLE_JUBEL_ARTEN) {
    const dauer = jubelDauer(art);
    assert.ok(dauer >= 800 && dauer <= 4000, `${art}: unplausible Dauer ${dauer}`);
  }
  // Die fliegenden Tiere brauchen am längsten – sie queren den ganzen Schirm.
  for (const art of ALLE_JUBEL_ARTEN.filter(quert)) {
    assert.ok(jubelDauer(art) >= 2200, `${art}: zu kurz für einen ganzen Flug`);
  }
});

test("genau diese vier queren den Schirm", () => {
  assert.deepEqual(ALLE_JUBEL_ARTEN.filter(quert), ["schwein", "biene", "vogel", "pferd"]);
});

test("die Jubelebene lässt Klicks durch und respektiert Bewegungswünsche", () => {
  // Ein Kind, das schnell weitertippt, darf nie von der Animation blockiert werden.
  const ebene = CSS.slice(CSS.indexOf(".jubel {"), CSS.indexOf(".jubel-buehne"));
  assert.match(ebene, /pointer-events:\s*none/);
  assert.ok(CSS.includes("@media (prefers-reduced-motion: reduce)"), "Ruhe-Modus fehlt");
  const ruhe = CSS.slice(CSS.lastIndexOf("@media (prefers-reduced-motion: reduce)"));
  assert.match(ruhe, /\.jubel \*[\s\S]*animation: none/, "im Ruhe-Modus muss die Bewegung aus sein");
});

/*
 * Das Pferd gehört ALLEIN der selbst gelösten Hilfsaufgabe.
 *
 * Stünde es in `JUBEL_ARTEN`, zöge `waehleJubel()` es auch bei ganz
 * gewöhnlichen richtigen Antworten – die Belohnung für den freiwilligen
 * Umweg wäre dann die neunte Überraschung von neun.
 */
test("der Bonus-Jubel kommt nie in der normalen Reihe", () => {
  assert.ok(!JUBEL_ARTEN.includes(BONUS_JUBEL), "das Pferd darf nicht regulär drankommen");
  assert.deepEqual([...ALLE_JUBEL_ARTEN], [...JUBEL_ARTEN, BONUS_JUBEL]);
  for (let i = -50; i < 200; i++) {
    assert.notEqual(waehleJubel(i), BONUS_JUBEL, `waehleJubel(${i}) zog den Bonus-Jubel`);
  }
});

test("das Pferd trägt eine Reiterin und läuft auf derselben Bahn", () => {
  const svg = jubelSvg(BONUS_JUBEL);
  assert.match(svg, /^<svg viewBox="0 0 120 80" class="illu"/, "gleiche Bahn wie die fliegenden Tiere");

  // Fell, Zopf und Hautton sind eigene Farbklassen – ohne sie fehlt entweder
  // das Pferd oder die Reiterin.
  for (const klasse of ["bild-fell", "bild-blond", "bild-haut"]) {
    assert.ok(svg.includes(klasse), `dem Bild fehlt ${klasse}`);
    assert.ok(CSS.includes(`.${klasse} {`), `${klasse} fehlt als eigene Regel in style.css`);
  }
});

/*
 * Beine, Mähne, Schweif und Zopf drehen um IHREN Ansatz. Ohne
 * `transform-box: fill-box` dreht der Browser um die Mitte der ganzen Bühne –
 * dann fällt das Pferd sichtbar auseinander.
 */
test("jedes bewegte Teil des Pferdes dreht um seinen eigenen Ansatz", () => {
  for (const klasse of [
    "jubel-galopp-vorn",
    "jubel-galopp-hinten",
    "jubel-maehne",
    "jubel-schweif",
    "jubel-haar",
  ]) {
    const anfang = CSS.indexOf(`.${klasse} {`);
    assert.ok(anfang >= 0, `${klasse} braucht eine EIGENE Regel – gruppierte Selektoren zählen nicht`);
    const regel = CSS.slice(anfang, CSS.indexOf("}", anfang));
    assert.match(regel, /transform-box:\s*fill-box/, `${klasse}: ohne fill-box dreht das Teil um die Bühnenmitte`);
    assert.match(regel, /animation:/, `${klasse}: keine Bewegung`);
  }
});

/*
 * Die Dauer steht doppelt – im Code und im Stylesheet. Laufen sie
 * auseinander, räumt die Anzeige mitten im Galopp ab (zu kurz) oder die Ebene
 * liegt zu lange über der Aufgabe (zu lang).
 */
test("die Galoppdauer ist im Code und im Stylesheet dieselbe", () => {
  const regel = CSS.match(/\.jubel-pferd \.jubel-buehne\s*\{([^}]*)\}/);
  assert.ok(regel, "die Bühne des Pferdes hat keine eigene Regel");
  const treffer = regel[1].match(/animation-duration:\s*([\d.]+)s/);
  assert.ok(treffer, "der Bühne des Pferdes fehlt die Dauer");
  assert.equal(
    jubelDauer(BONUS_JUBEL),
    Math.round(Number(treffer[1]) * 1000),
    "Code und Stylesheet nennen verschiedene Dauern"
  );
});
