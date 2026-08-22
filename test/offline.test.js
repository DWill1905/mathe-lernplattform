import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";

/**
 * Die App muss nach dem ersten Aufruf vollständig ohne Netz laufen.
 *
 * Der Knackpunkt: Beim ersten Besuch lädt der Browser `index.html` und alle
 * statisch importierten Module, BEVOR der Service Worker die Kontrolle
 * übernimmt – diese Dateien kommen also nie über sein `fetch`. Sie müssen
 * deshalb in der Precache-Liste stehen, die beim `install` geladen wird.
 */

const sw = readFileSync("sw.js", "utf8");
/** Quelltext ohne Kommentare – sonst schlagen Prüfungen auf Erklärtexte an. */
const swCode = sw.replace(/\/\*[\s\S]*?\*\//g, "").replace(/\/\/[^\n]*/g, "");

/** Alle Dateien, die der Server ausliefert (ohne Quellcode und Werkzeuge). */
function ausgelieferteDateien() {
  // Dieselbe Liste wie in tools/sw-liste.mjs. `cloudflare/` läuft bei
  // Cloudflare, nicht im Browser – es gehört nicht in den Offline-Vorrat.
  const aussen = new Set(["node_modules", ".git", ".github", "src", "test", "tools", "cloudflare"]);
  const endungen = [".js", ".css", ".html", ".svg", ".png", ".webmanifest"];
  const gefunden = [];
  const sammeln = (verzeichnis) => {
    for (const eintrag of readdirSync(verzeichnis)) {
      if (aussen.has(eintrag) || eintrag.startsWith(".")) continue;
      const pfad = join(verzeichnis, eintrag);
      if (statSync(pfad).isDirectory()) sammeln(pfad);
      else if (endungen.some((e) => eintrag.endsWith(e))) gefunden.push(pfad);
    }
  };
  sammeln(".");
  return gefunden.filter((pfad) => pfad !== "sw.js");
}

function precacheListe() {
  const block = sw.match(/LISTE-ANFANG[^\n]*\*\/\s*const KERN = \[([\s\S]*?)\];/);
  assert.ok(block, "die Precache-Liste steht nicht zwischen ihren Marken");
  return [...block[1].matchAll(/"([^"]+)"/g)].map((t) => t[1]);
}

test("die Precache-Liste enthält jede ausgelieferte Datei", () => {
  const kern = new Set(precacheListe());
  const fehlend = ausgelieferteDateien().filter((pfad) => !kern.has(`./${pfad}`));
  assert.deepEqual(
    fehlend,
    [],
    `nicht im Precache – offline nach dem ersten Besuch nicht verfügbar: ${fehlend.join(", ")}`
  );
});

test("die Startseite selbst steht in der Precache-Liste", () => {
  const kern = precacheListe();
  // Ohne "./" schlägt ein direkter Aufruf der Adresse ohne Dateinamen fehl.
  assert.ok(kern.includes("./"), "der Wurzelpfad fehlt");
  assert.ok(kern.includes("./index.html"));
  assert.ok(kern.includes("./js/app.js"));
});

test("der Service Worker lädt die Liste einzeln statt als Ganzes", () => {
  // `cache.addAll` bricht komplett ab, sobald eine einzige Datei fehlt –
  // dann bliebe die App offline leer.
  assert.ok(
    !/\.addAll\s*\(/.test(swCode),
    "addAll würde die Installation an einer einzigen fehlenden Datei scheitern lassen"
  );
  assert.match(swCode, /cache\.add\(/);
});

test("eine neue Cache-Version räumt die alte weg", () => {
  const version = swCode.match(/const CACHE = "([^"]+)"/);
  assert.ok(version, "kein Cache-Name gefunden");
  assert.match(version[1], /-v\d+$/, "der Cache-Name braucht eine Versionsnummer");
  assert.match(swCode, /caches\.delete/, "alte Caches werden nicht aufgeräumt");
});

test("das Manifest macht die App installierbar", () => {
  const manifest = JSON.parse(readFileSync("manifest.webmanifest", "utf8"));
  const png = manifest.icons.filter((i) => i.type === "image/png");
  const groessen = png.map((i) => i.sizes);
  assert.ok(groessen.includes("192x192"), "ohne 192er-PNG bietet der Browser keine Installation an");
  assert.ok(groessen.includes("512x512"), "das 512er-PNG fehlt");
  assert.ok(
    manifest.icons.some((i) => (i.purpose ?? "").includes("maskable")),
    "ohne maskierbares Icon wird das Symbol auf Android beschnitten"
  );
  assert.equal(manifest.display, "standalone");
  assert.equal(manifest.start_url, "./");

  const kern = new Set(precacheListe());
  for (const icon of manifest.icons) {
    assert.ok(kern.has(`./${icon.src}`), `${icon.src} fehlt im Precache`);
  }
});
