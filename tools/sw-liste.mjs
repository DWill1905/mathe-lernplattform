/**
 * Schreibt die Precache-Liste des Service Workers aus den tatsächlich
 * ausgelieferten Dateien.
 *
 * Warum überhaupt: Beim ERSTEN Besuch lädt der Browser `index.html` und die
 * statisch importierten Module, bevor der Service Worker die Kontrolle
 * übernimmt. Diese Dateien landen also nie über `fetch` im Cache. Wer sich auf
 * Laufzeit-Caching verlässt, hat den App-Rumpf nach dem ersten Besuch NICHT
 * offline verfügbar. Deshalb muss die vollständige Liste beim `install`
 * geladen werden – und deshalb wird sie erzeugt statt von Hand gepflegt.
 *
 * Aufruf: `node tools/sw-liste.mjs` schreibt, `--pruefen` meldet nur.
 */

import { readFileSync, writeFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";

const ANFANG = "/* LISTE-ANFANG (erzeugt von tools/sw-liste.mjs) */";
const ENDE = "/* LISTE-ENDE */";

/** Verzeichnisse, die nicht ausgeliefert werden. */
const AUSSEN = new Set(["node_modules", ".git", ".github", "src", "test", "tools"]);
const ENDUNGEN = [".js", ".css", ".html", ".svg", ".png", ".webmanifest"];

function sammeln(verzeichnis = ".", gesammelt = []) {
  for (const eintrag of readdirSync(verzeichnis)) {
    if (AUSSEN.has(eintrag) || eintrag.startsWith(".")) continue;
    const pfad = join(verzeichnis, eintrag);
    if (statSync(pfad).isDirectory()) sammeln(pfad, gesammelt);
    else if (ENDUNGEN.some((e) => eintrag.endsWith(e))) gesammelt.push(pfad.replace(/\\/g, "/"));
  }
  return gesammelt;
}

// `sw.js` cacht sich nicht selbst – der Browser verwaltet ihn eigenständig.
const dateien = sammeln()
  .filter((pfad) => pfad !== "sw.js")
  .sort();

const liste = ["./", ...dateien.map((pfad) => `./${pfad}`)];
const block = `${ANFANG}\nconst KERN = [\n${liste.map((p) => `  "${p}",`).join("\n")}\n];\n${ENDE}`;

const quelle = readFileSync("sw.js", "utf8");
const anfang = quelle.indexOf(ANFANG);
const ende = quelle.indexOf(ENDE);
if (anfang === -1 || ende === -1) {
  console.error("sw.js: Die Marken LISTE-ANFANG/LISTE-ENDE fehlen.");
  process.exit(1);
}
const neu = quelle.slice(0, anfang) + block + quelle.slice(ende + ENDE.length);

if (process.argv.includes("--pruefen")) {
  if (neu !== quelle) {
    console.error(
      "sw.js: Die Precache-Liste ist veraltet. Bitte 'npm run build' ausführen und sw.js mitcommitten."
    );
    process.exit(1);
  }
  console.log(`sw.js: Precache-Liste aktuell (${liste.length} Einträge).`);
} else {
  if (neu !== quelle) writeFileSync("sw.js", neu);
  console.log(`sw.js: ${liste.length} Einträge in der Precache-Liste.`);
}
