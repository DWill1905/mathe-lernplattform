import "./setup.js";
import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

import { EULEN_POSEN, euleFuerQuote, euleJubelGruppe, euleSvg } from "../js/eule.js";

const CSS = readFileSync(new URL("../style.css", import.meta.url), "utf8");

/*
 * Der Eulen-Baukasten folgt denselben Regeln wie `bilder.ts`: reine
 * SVG-Zeichenketten, Farben NUR über Klassen (sonst bricht der Dunkelmodus),
 * kein `style=` (CSP). Und: Die Eule ist die freundliche Begleiterin der
 * App – KEINE Pose darf strafen.
 */

test("jede Pose ist ein sauberes, klassenbasiertes SVG", () => {
  for (const pose of EULEN_POSEN) {
    const svg = euleSvg(pose);
    assert.match(svg, /^<svg viewBox="0 0 120 120" class="illu"/, `${pose}: falsche Hülle`);
    assert.match(svg, /<\/svg>$/, `${pose}: Hülle nicht geschlossen`);
    assert.ok(svg.includes('aria-hidden="true"'), `${pose}: muss für Screenreader unsichtbar sein`);
    assert.ok(!/#[0-9a-fA-F]{3,6}/.test(svg), `${pose}: Farbwert im SVG`);
    assert.ok(!/fill="(?!none)/.test(svg), `${pose}: feste Füllfarbe`);
    assert.ok(!/stroke="(?!none)/.test(svg), `${pose}: feste Strichfarbe`);
    assert.ok(!svg.includes("style="), `${pose}: style-Attribut verletzt die CSP`);
    assert.ok(!/undefined|NaN/.test(svg), `${pose}: kaputter Baustein`);
  }
});

test("jede benutzte Klasse steht auch im Stylesheet", () => {
  const benutzt = new Set();
  for (const pose of EULEN_POSEN) {
    for (const treffer of euleSvg(pose).matchAll(/class="([^"]+)"/g)) {
      for (const klasse of treffer[1].split(/\s+/)) if (klasse !== "illu") benutzt.add(klasse);
    }
  }
  assert.ok(benutzt.size >= 4, "es sollten mehrere Farbklassen vorkommen");
  for (const klasse of benutzt) {
    assert.ok(CSS.includes(`.${klasse} {`), `Klasse ${klasse} fehlt in style.css`);
  }
});

test("keine zwei Posen sehen gleich aus", () => {
  const gesehen = new Map();
  for (const pose of EULEN_POSEN) {
    const svg = euleSvg(pose);
    assert.ok(!gesehen.has(svg), `${pose} sieht aus wie ${gesehen.get(svg)}`);
    gesehen.set(svg, pose);
  }
});

test("die Größenklassen der Eule geben dem SVG feste Maße", () => {
  // Ein Inline-SVG hat nur seine viewBox – ohne Breite UND Höhe aus dem
  // Stylesheet fällt es auf null zusammen (bekannte Fehlerklasse, siehe
  // CLAUDE.md). Deshalb muss jede Größenstufe beides setzen.
  for (const stufe of ["eule-gross", "eule-mittel", "eule-klein"]) {
    const regel = CSS.match(new RegExp(`\\.${stufe} svg\\s*\\{([^}]*)\\}`));
    assert.ok(regel, `Regel .${stufe} svg fehlt in style.css`);
    assert.match(regel[1], /width:\s*\d+px/, `${stufe}: feste Breite fehlt`);
    assert.match(regel[1], /height:\s*\d+px/, `${stufe}: feste Höhe fehlt`);
  }
});

test("die Pose passt zur Trefferquote – und straft nie", () => {
  assert.equal(euleFuerQuote(5, 5), "jubelt");
  assert.equal(euleFuerQuote(10, 10), "jubelt");
  assert.equal(euleFuerQuote(4, 5), "freut");
  assert.equal(euleFuerQuote(7, 10), "freut");
  assert.equal(euleFuerQuote(2, 5), "mutmacht");
  // Auch null Treffer machen Mut – nie eine traurige oder schimpfende Eule.
  assert.equal(euleFuerQuote(0, 5), "mutmacht");
  // Ohne Aufgaben gibt es nichts zu bewerten: Die Eule winkt einfach.
  assert.equal(euleFuerQuote(0, 0), "winkt");

  for (const [richtig, gesamt] of [[0, 1], [1, 3], [9, 10], [10, 10], [0, 0]]) {
    assert.ok(EULEN_POSEN.includes(euleFuerQuote(richtig, gesamt)), "unbekannte Pose");
  }
});

/*
 * Die Posenliste ist fest verabredet: Wer eine ergänzt, muss hier bewusst
 * vorbeikommen – und dabei die Regel lesen, dass strafende Posen (traurig,
 * weinend, enttäuscht) in dieser App nichts verloren haben.
 */
test("es gibt genau die verabredeten, freundlichen Posen", () => {
  assert.deepEqual([...EULEN_POSEN], ["winkt", "jubelt", "freut", "mutmacht", "schlaeft"]);
});

test("die Jubelgruppe ist das Innere der Jubelpose", () => {
  const gruppe = euleJubelGruppe();
  assert.ok(!gruppe.startsWith("<svg"), "die Gruppe darf keine eigene Hülle mitbringen");
  assert.ok(euleSvg("jubelt").includes(gruppe), "Gruppe und Pose müssen dasselbe Bild zeigen");
});
