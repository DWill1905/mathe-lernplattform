import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

/*
 * Der Kontrast-Wächter.
 *
 * Die README verspricht WCAG AA („nachgemessen“) – aber bis hierher wachte
 * niemand darüber: Eine einzige gut gemeinte Farbänderung in `style.css`
 * konnte Text unlesbar machen, und die CI blieb grün. Dieser Test rechnet
 * die versprochenen Verhältnisse für beide Farbschemata wirklich nach.
 *
 * Geprüft werden die PAARUNGEN, wie die App sie benutzt (Text auf seiner
 * Fläche), nicht einzelne Farben: Eine Farbe ist nie „zu hell“ – nur eine
 * Kombination.
 */

const CSS = readFileSync(new URL("../style.css", import.meta.url), "utf8");

/** Alle `--name: wert;`-Paare eines CSS-Textstücks. */
function variablen(text) {
  const gefunden = {};
  for (const t of text.matchAll(/--([\w-]+):\s*([^;]+);/g)) gefunden[t[1]] = t[2].trim();
  return gefunden;
}

/*
 * Hell und Dunkel trennen: Alles in `@media (prefers-color-scheme: dark)`
 * ist die dunkle Fassung; jeder andere `:root`-Block gehört zur hellen.
 * Dunkel ERBT von Hell – genau wie im Browser.
 */
const dunkelBloecke = [...CSS.matchAll(/@media \(prefers-color-scheme: dark\)\s*\{\s*:root[^{]*\{([^}]*)\}/g)];
const ohneDunkel = CSS.replace(/@media \(prefers-color-scheme: dark\)\s*\{\s*:root[^{]*\{[^}]*\}\s*\}/g, "");
const hellBloecke = [...ohneDunkel.matchAll(/:root[^{]*\{([^}]*)\}/g)];

const HELL = Object.assign({}, ...hellBloecke.map((t) => variablen(t[1])));
const DUNKEL = { ...HELL, ...Object.assign({}, ...dunkelBloecke.map((t) => variablen(t[1]))) };

/** #rgb oder #rrggbb → [r, g, b] in 0–255. Alles andere ist hier ein Fehler. */
function kanaele(schema, name) {
  const wert = schema[name];
  assert.ok(wert, `Variable --${name} fehlt in style.css`);
  const treffer = wert.match(/^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/);
  assert.ok(treffer, `--${name} ist keine einfache Hex-Farbe: „${wert}“ – der Kontrast wäre unprüfbar`);
  let hex = treffer[1];
  if (hex.length === 3) hex = [...hex].map((z) => z + z).join("");
  return [0, 2, 4].map((i) => parseInt(hex.slice(i, i + 2), 16));
}

/** Relative Luminanz nach WCAG 2.x. */
function luminanz([r, g, b]) {
  const linear = [r, g, b].map((wert) => {
    const c = wert / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * linear[0] + 0.7152 * linear[1] + 0.0722 * linear[2];
}

function kontrast(vorne, hinten) {
  const [a, b] = [luminanz(vorne), luminanz(hinten)].sort((x, y) => y - x);
  return (a + 0.05) / (b + 0.05);
}

/** Farbliche Mitte eines Verlaufs, kanalweise – für Schrift AUF dem Verlauf. */
function mitte(a, b) {
  return a.map((wert, i) => Math.round((wert + b[i]) / 2));
}

/*
 * Die Paarliste: Vordergrund, Hintergrund, Mindestverhältnis.
 * 4.5 ist WCAG AA für normalen Text, 3.0 für große Schrift und Grafik.
 */
const PAARE = [
  ["text", "karte", 4.5],
  ["text", "grund", 4.5],
  ["text", "grund-oben", 4.5],
  ["text", "weich-a", 4.5],
  ["text", "weich-b", 4.5],
  ["text-leise", "karte", 4.5],
  ["haupt-text", "haupt-hell", 4.5],
  ["richtig", "richtig-hell", 4.5],
  ["falsch", "falsch-hell", 4.5],
  // UI-Grafik: Icons, Ränder, Fokusrahmen.
  ["haupt", "karte", 3.0],
  // Illustrations-Tinte auf dem Zeichengrund.
  ["bild-strich", "bild-grund", 3.0],
];

for (const [vorne, hinten, minimum] of PAARE) {
  test(`Kontrast --${vorne} auf --${hinten} erreicht ${minimum}:1 in beiden Schemata`, () => {
    for (const [name, schema] of [["hell", HELL], ["dunkel", DUNKEL]]) {
      const wert = kontrast(kanaele(schema, vorne), kanaele(schema, hinten));
      assert.ok(
        wert >= minimum,
        `${name}: --${vorne} auf --${hinten} = ${wert.toFixed(2)}:1, gefordert ${minimum}:1`
      );
    }
  });
}

/*
 * Der Markenverlauf trägt seine Schrift selbst (`--verlauf-text`). Die muss
 * an BEIDEN Enden lesbar sein, nicht nur im Mittel – ein Knopf ist links so
 * violett wie rechts rosa. Die Mitte wird trotzdem mitgeprüft: Sie fiele
 * durch, wenn beide Enden je knapp bestehen, die Formel aber kippt.
 */
test("die Schrift auf dem Markenverlauf ist an beiden Enden lesbar", () => {
  for (const [name, schema] of [["hell", HELL], ["dunkel", DUNKEL]]) {
    const schrift = kanaele(schema, "verlauf-text");
    const a = kanaele(schema, "verlauf-a");
    const b = kanaele(schema, "verlauf-b");
    for (const [stelle, flaeche] of [["Anfang", a], ["Ende", b], ["Mitte", mitte(a, b)]]) {
      const wert = kontrast(schrift, flaeche);
      assert.ok(
        wert >= 4.5,
        `${name}, ${stelle} des Verlaufs: ${wert.toFixed(2)}:1, gefordert 4.5:1`
      );
    }
  }
});

/*
 * Wächter für den Wächter: Wenn die Blöcke nicht mehr gefunden werden
 * (umbenannt, umsortiert), liefe jeder Test oben gegen leere Maps und wäre
 * grün, WEIL er nichts misst. Genau dieser Fehler ist im Projekt schon
 * zweimal passiert (siehe CLAUDE.md, Abschnitt Tests).
 */
test("beide Farbschemata wurden wirklich gefunden", () => {
  assert.ok(hellBloecke.length >= 2, "heller :root-Block (Basis + Illustrationen) nicht gefunden");
  assert.ok(dunkelBloecke.length >= 2, "dunkle :root-Blöcke nicht gefunden");
  assert.ok(Object.keys(HELL).length >= 20, "zu wenige helle Variablen – Parser kaputt?");
  // Stichprobe: Dunkel muss sich von Hell unterscheiden UND von ihm erben.
  assert.notEqual(HELL["text"], DUNKEL["text"], "Dunkel überschreibt --text nicht mehr");
  assert.equal(HELL["radius-gross"], DUNKEL["radius-gross"], "Vererbung Hell → Dunkel ist gebrochen");
});
