import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

/**
 * Touch-Ziele bleiben mindestens 40 px hoch – auch im Querformat, wo lieber
 * Kopfzeile und Navigation weichen (siehe `CLAUDE.md`).
 *
 * Bei Kinderhänden ist das keine Stellschraube: Wer eine Taste nicht trifft,
 * tippt daneben, bekommt eine falsche Antwort gewertet und lernt, dass er es
 * nicht kann. Die Regel stand bisher nur in der Doku; hier wird sie geprüft.
 *
 * Geprüft werden die Regeln, die im Querformat und auf flachen Bildschirmen
 * bewusst NACH UNTEN korrigieren – dort ist die Versuchung am größten, „nur
 * ein paar Pixel“ zu opfern.
 */

const CSS = readFileSync(new URL("../style.css", import.meta.url), "utf8");
const MINDESTHOEHE = 40;

/** Alle `min-height`-Angaben einer Klasse, über das ganze Stylesheet. */
function mindesthoehen(klasse) {
  const gefunden = [];
  // Auch Regeln mit mehreren Wählern („.a, .b { … }“) und in Media-Queries.
  const muster = new RegExp(`(^|[,{}\\s])\\${klasse}\\b[^{}]*\\{([^{}]*)\\}`, "g");
  for (const treffer of CSS.matchAll(muster)) {
    const wert = treffer[2].match(/min-height:\s*([\d.]+)(px|rem)/);
    if (wert) gefunden.push(wert[2] === "rem" ? Number(wert[1]) * 16 : Number(wert[1]));
  }
  return gefunden;
}

/** Was ein Kind mit dem Finger trifft. */
const ZIELE = [".taste", ".knopf-auswahl", ".knopf-klein", ".knopf-vorlesen", ".mauer-stein"];

test("kein Touch-Ziel wird kleiner als 40 px", () => {
  for (const ziel of ZIELE) {
    const hoehen = mindesthoehen(ziel);
    assert.ok(hoehen.length > 0, `${ziel}: keine einzige min-height gefunden – die Regel greift nirgends`);
    for (const hoehe of hoehen) {
      assert.ok(
        hoehe >= MINDESTHOEHE,
        `${ziel}: ${hoehe}px ist unter der Grenze von ${MINDESTHOEHE}px – bei Kinderhänden keine Stellschraube`
      );
    }
  }
});

/**
 * Der Antwortbereich darf im Querformat nicht durch die Kopfzeile aus dem
 * Bild geschoben werden. Umgekehrt gilt aber: Wer Platzprobleme misst, muss
 * auch messen, dass noch etwas DA ist – sonst ist die Prüfung grün, WEIL das
 * Geprüfte fehlt.
 */
test("die Querformat-Regeln blenden Kopf und Navigation aus, statt Tasten zu schrumpfen", () => {
  const quer = CSS.match(/@media \(orientation: landscape\)[^{]*\{([\s\S]*)$/);
  assert.ok(quer, "die Querformat-Regeln fehlen ganz");
  assert.match(
    quer[1],
    /body\.uebung-laeuft[\s\S]*?\.kopf[\s\S]*?display:\s*none|\.kopf\s*\{[^}]*position:\s*static/,
    "im Querformat muss die Kopfzeile weichen, nicht das Tastenfeld"
  );
});
