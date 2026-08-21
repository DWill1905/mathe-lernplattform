import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";

import { ICON_NAMEN, iconSvg, istIconName } from "../js/icons.js";
import { THEMEN } from "../js/topics.js";
import { ERFOLGE } from "../js/gamification.js";

/**
 * Die App zeichnet ihre Symbole selbst statt Emojis zu verwenden: Emojis sehen
 * auf jedem Gerät anders aus, lassen sich nicht einfärben und werden von
 * Screenreadern eigenwillig vorgelesen.
 */

test("jedes Symbol ist ein vollständiges, einfärbbares SVG", () => {
  for (const name of ICON_NAMEN) {
    const svg = iconSvg(name);
    assert.match(svg, /^<svg viewBox="0 0 24 24"/, `${name}: kein 24er-Raster`);
    assert.ok(svg.endsWith("</svg>"), `${name}: unvollständig`);
    assert.match(svg, /aria-hidden="true"/, `${name}: nicht vor Screenreadern versteckt`);
    assert.ok(!svg.includes("undefined") && !svg.includes("NaN"), `${name}: kaputte Koordinate`);

    // Feste Farben würden den Dunkelmodus und die Themenfarben aushebeln.
    assert.ok(!/#[0-9a-fA-F]{3,6}/.test(svg), `${name}: enthält eine feste Farbe`);
    assert.ok(!/(fill|stroke)="(rgb|hsl)/.test(svg), `${name}: enthält eine feste Farbe`);
  }
});

test("jedes Symbol zeichnet auch wirklich etwas", () => {
  // Die tatsächliche Form ist am Bildschirm geprüft (Kontaktbogen beim Entwurf);
  // hier geht es darum, dass kein Eintrag leer oder verstümmelt ist. Absolute
  // Koordinaten lassen sich nicht sinnvoll prüfen, weil Pfade auch relative
  // Angaben enthalten dürfen.
  for (const name of ICON_NAMEN) {
    const svg = iconSvg(name);
    const formen = svg.match(/<(path|circle|rect|polygon|line)\b/g) ?? [];
    assert.ok(formen.length >= 1, `${name}: enthält keine Form`);
    assert.ok(svg.length > 60, `${name}: verdächtig kurz`);
  }
});

test("jedes Thema und jedes Abzeichen nutzt ein vorhandenes Symbol", () => {
  for (const thema of THEMEN) {
    assert.ok(istIconName(thema.symbol), `${thema.id}: unbekanntes Symbol „${thema.symbol}“`);
  }
  for (const erfolg of ERFOLGE) {
    assert.ok(istIconName(erfolg.symbol), `${erfolg.id}: unbekanntes Symbol „${erfolg.symbol}“`);
  }
});

test("kein Symbol liegt ungenutzt herum", () => {
  const genutzt = new Set([...THEMEN.map((t) => t.symbol), ...ERFOLGE.map((e) => e.symbol)]);
  const quellen = [];
  const sammeln = (verzeichnis) => {
    for (const eintrag of readdirSync(verzeichnis)) {
      const pfad = join(verzeichnis, eintrag);
      if (statSync(pfad).isDirectory()) sammeln(pfad);
      else if (pfad.endsWith(".ts") && !pfad.endsWith("icons.ts")) quellen.push(readFileSync(pfad, "utf8"));
    }
  };
  sammeln("src");
  const text = quellen.join("\n");
  const ungenutzt = ICON_NAMEN.filter((name) => !genutzt.has(name) && !text.includes(`"${name}"`));
  assert.deepEqual(ungenutzt, [], `nicht verwendete Symbole: ${ungenutzt.join(", ")}`);
});

test("im Quellcode stehen keine Emojis mehr", () => {
  const emoji = /[\u{1F000}-\u{1FAFF}\u{2600}-\u{27BF}\u{2B00}-\u{2BFF}\u{FE0F}]/u;
  const treffer = [];
  const pruefen = (verzeichnis) => {
    for (const eintrag of readdirSync(verzeichnis)) {
      const pfad = join(verzeichnis, eintrag);
      if (statSync(pfad).isDirectory()) pruefen(pfad);
      else if (pfad.endsWith(".ts")) {
        readFileSync(pfad, "utf8")
          .split("\n")
          .forEach((zeile, i) => {
            if (emoji.test(zeile)) treffer.push(`${pfad}:${i + 1} ${zeile.trim().slice(0, 60)}`);
          });
      }
    }
  };
  pruefen("src");
  assert.deepEqual(treffer, [], `Emojis gefunden:\n${treffer.join("\n")}`);
});
