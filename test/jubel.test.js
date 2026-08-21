import "./setup.js";
import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

import { JUBEL_ARTEN, fliegt, jubelDauer, jubelSvg, waehleJubel } from "../js/jubel.js";

const CSS = readFileSync(new URL("../style.css", import.meta.url), "utf8");

test("jede Jubelart baut ein vollständiges, farbloses SVG", () => {
  for (const art of JUBEL_ARTEN) {
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
  for (const art of JUBEL_ARTEN) {
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
  for (const art of JUBEL_ARTEN) {
    const dauer = jubelDauer(art);
    assert.ok(dauer >= 800 && dauer <= 4000, `${art}: unplausible Dauer ${dauer}`);
  }
  // Die fliegenden Tiere brauchen am längsten – sie queren den ganzen Schirm.
  for (const art of JUBEL_ARTEN.filter(fliegt)) {
    assert.ok(jubelDauer(art) >= 2200, `${art}: zu kurz für einen ganzen Flug`);
  }
});

test("nur die Tiere fliegen quer", () => {
  assert.deepEqual(JUBEL_ARTEN.filter(fliegt), ["schwein", "biene", "vogel"]);
});

test("die Jubelebene lässt Klicks durch und respektiert Bewegungswünsche", () => {
  // Ein Kind, das schnell weitertippt, darf nie von der Animation blockiert werden.
  const ebene = CSS.slice(CSS.indexOf(".jubel {"), CSS.indexOf(".jubel-buehne"));
  assert.match(ebene, /pointer-events:\s*none/);
  assert.ok(CSS.includes("@media (prefers-reduced-motion: reduce)"), "Ruhe-Modus fehlt");
  const ruhe = CSS.slice(CSS.lastIndexOf("@media (prefers-reduced-motion: reduce)"));
  assert.match(ruhe, /\.jubel \*[\s\S]*animation: none/, "im Ruhe-Modus muss die Bewegung aus sein");
});
