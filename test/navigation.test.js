import "./setup.js";
import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

/**
 * Diese Seite wird vollständig über den Hash geroutet: `#/`, `#/uebung/geld`,
 * `#/eltern`. Jeder Hash, der NICHT mit `#/` anfängt, ist für den Router eine
 * unbekannte Ansicht und landet auf „Diese Seite gibt es nicht“.
 *
 * Genau daran ist die Sprungmarke gescheitert: `href="#inhalt"` sah aus wie
 * ein harmloser Sprunganker, warf aber ausgerechnet Tastatur- und
 * Screenreader-Nutzer auf die Fehlerseite. Sie ist deshalb ein Knopf, der den
 * Fokus selbst setzt (`shell.ts`).
 */

const HTML = readFileSync(new URL("../index.html", import.meta.url), "utf8");
/** Ohne Kommentare – sonst schlagen die Erklärtexte selbst an. */
const MARKUP = HTML.replace(/<!--[\s\S]*?-->/g, "");

test("kein Hash-Link in index.html umgeht den Router", () => {
  const ziele = [...MARKUP.matchAll(/href="(#[^"]*)"/g)].map((t) => t[1]);
  for (const ziel of ziele) {
    assert.ok(
      ziel === "#/" || ziel.startsWith("#/"),
      `href="${ziel}" ist keine Route – der Router zeigt darauf die Fehlerseite`
    );
  }
});

test("die Sprungmarke ist ein Knopf und wird verdrahtet", () => {
  const marke = MARKUP.match(/<(\w+)[^>]*class="sprungmarke"[^>]*>/);
  assert.ok(marke, "die Sprungmarke fehlt ganz – ohne sie tabbt man durch die ganze Kopfzeile");
  assert.equal(marke[1], "button", "als <a href=…> läuft die Sprungmarke in den Hash-Router");
  assert.ok(/id="sprungmarke"/.test(marke[0]), "ohne Id findet shell.ts sie nicht");

  const shell = readFileSync(new URL("../js/shell.js", import.meta.url), "utf8");
  assert.ok(
    shell.includes('getElementById("sprungmarke")'),
    "die Sprungmarke wird nirgends verdrahtet – als Knopf täte sie dann gar nichts"
  );
  assert.ok(/\.focus\(\)/.test(shell), "die Sprungmarke muss den Fokus tatsächlich setzen");
});

test("das Sprungziel ist fokussierbar", () => {
  const shell = readFileSync(new URL("../js/shell.js", import.meta.url), "utf8");
  assert.ok(
    /id:\s*"inhalt"[\s\S]{0,80}tabindex:\s*"-1"|tabindex:\s*"-1"[\s\S]{0,80}id:\s*"inhalt"/.test(shell),
    "das <main> braucht tabindex=\"-1\", sonst nimmt es den Fokus nicht an"
  );
});

/* ---------------------------------------------------- Bilder und Vorlesen */

/**
 * `role="img"` mit LEEREM `aria-label` ist der schlimmste aller Fälle: Der
 * Screenreader meldet ein Bild, kann es aber nicht benennen. Auf der
 * Startseite steht neben jedem Motiv ohnehin sein Titel – dort ist das Bild
 * Schmuck und muss ganz verschwinden.
 */
test("ein Bild ohne Beschriftung wird als Schmuck ausgeblendet", async () => {
  const { bildAttribute } = await import("../js/dom.js");

  const schmuck = bildAttribute("");
  assert.equal(schmuck["aria-hidden"], "true");
  assert.equal(schmuck["role"], undefined, "Schmuck darf keine Bildrolle behaupten");
  assert.equal(schmuck["aria-label"], undefined, "ein leerer Name ist schlimmer als gar keiner");

  // Leerzeichen sind auch keine Beschriftung.
  assert.equal(bildAttribute("   ")["aria-hidden"], "true");

  const echt = bildAttribute("Zahlenstrahl von 0 bis 100");
  assert.equal(echt["role"], "img");
  assert.equal(echt["aria-label"], "Zahlenstrahl von 0 bis 100");
  assert.equal(echt["aria-hidden"], undefined, "ein beschriftetes Bild darf nie versteckt werden");

  // Die Klasse trägt das Layout – sie muss in beiden Fällen dranbleiben.
  assert.equal(schmuck["class"], "bild");
  assert.equal(echt["class"], "bild");
});
