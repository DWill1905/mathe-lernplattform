import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

import { ICON_NAMEN } from "../js/icons.js";
import { ERFOLGE } from "../js/gamification.js";
import { PUZZLE_TEILE, motivNamen } from "../js/bilder.js";
import { MEISTERLAENGE, RUNDENLAENGE } from "../js/tasks/index.js";
import { HEFT_THEMEN, THEMEN } from "../js/topics.js";

/**
 * Zahlen in der Doku müssen zum Code passen.
 *
 * `CLAUDE.md` sprach von „zehn Themen“, während `topics.ts` dreizehn führte,
 * und die README von „zwölf Abzeichen“ bei fünfzehn. Das ist nicht bloß
 * unordentlich: `CLAUDE.md` ist die Datei, die jede weitere Sitzung als
 * Wahrheit liest, und eine falsche Zahl darin führt aktiv in die Irre.
 *
 * Geprüft wird das Zahlwort im Text gegen den Wert im Code – so fällt beim
 * nächsten neuen Thema sofort auf, dass die Beschreibung nachgezogen werden
 * muss.
 */

const CLAUDE = readFileSync(new URL("../CLAUDE.md", import.meta.url), "utf8");
const README = readFileSync(new URL("../README.md", import.meta.url), "utf8");

const ZAHLWORT = [
  "null", "ein", "zwei", "drei", "vier", "fünf", "sechs", "sieben", "acht", "neun",
  "zehn", "elf", "zwölf", "dreizehn", "vierzehn", "fünfzehn", "sechzehn", "siebzehn",
  "achtzehn", "neunzehn", "zwanzig",
];

/** Kommt im Text ein FALSCHES Zahlwort vor dem Stichwort vor? */
function pruefeZahlwort(text, stichwort, erwartet, quelle) {
  // `\w` kennt kein ä, ö, ü, ß – „fünfzehn“ fiele damit durch.
  const treffer = [...text.matchAll(new RegExp(`([A-Za-zÄÖÜäöüß]+) ${stichwort}`, "gi"))]
    .map((t) => t[1].toLowerCase())
    .filter((wort) => ZAHLWORT.includes(wort));
  assert.ok(
    treffer.length > 0,
    `${quelle}: „${stichwort}“ wird nirgends mit einer Zahl beschrieben – der Test misst nichts`
  );
  for (const wort of treffer) {
    assert.equal(
      ZAHLWORT.indexOf(wort),
      erwartet,
      `${quelle}: „${wort} ${stichwort}“ – im Code sind es ${erwartet} (${ZAHLWORT[erwartet]})`
    );
  }
}

test("CLAUDE.md nennt die richtige Zahl der Themen", () => {
  pruefeZahlwort(CLAUDE, "Themen", THEMEN.length, "CLAUDE.md");
});

test("die README nennt die richtige Zahl der Abzeichen, Icons und Puzzleteile", () => {
  pruefeZahlwort(README, "Abzeichen", ERFOLGE.length, "README.md");
  pruefeZahlwort(README, "Teilen", PUZZLE_TEILE, "README.md");
  assert.match(
    README,
    new RegExp(`${ICON_NAMEN.length} selbst gezeichnete SVG-Icons`),
    `README.md: die Zahl der Icons stimmt nicht – es sind ${ICON_NAMEN.length}`
  );
  assert.match(
    README,
    new RegExp(`${MEISTERLAENGE} Aufgaben gegen die Uhr`),
    `README.md: der Rechenmeister hat ${MEISTERLAENGE} Aufgaben`
  );
  assert.match(
    README,
    new RegExp(`Übungsrunden mit ${ZAHLWORT[RUNDENLAENGE]} Aufgaben`, "i"),
    `README.md: eine Runde hat ${RUNDENLAENGE} Aufgaben`
  );
});

/** Jedes Thema soll auch irgendwo beschrieben sein – sonst findet es niemand. */
test("jedes Thema aus dem Übungsheft steht in der README", () => {
  for (const eintrag of HEFT_THEMEN) {
    assert.ok(
      README.includes(eintrag.titel),
      `„${eintrag.titel}“ ist ein Heft-Thema, kommt in der README aber nicht vor`
    );
  }
  assert.ok(motivNamen().length > 0);
});
