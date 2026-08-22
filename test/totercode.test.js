import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";

/**
 * Kein Export ohne Benutzer.
 *
 * `tsc` merkt eine ungenutzte lokale Variable an, einen ungenutzten EXPORT
 * aber nie – er könnte ja von außen gebraucht werden. Bei einer Anwendung ohne
 * Bibliotheks-Charakter gibt es dieses „außen“ nicht, und so sammelt sich
 * stiller Ballast an. Gefunden wurden dabei unter anderem `Muenze` in
 * `figures.ts` (eine Schnittstelle, die nirgends vorkam und obendrein falsch
 * beschrieb, was `geldbild()` entgegennimmt) und `geheZu()` im Router.
 *
 * Ballast ist nicht nur Gewicht: Er wird mitgepflegt, mitgelesen und
 * mitgeprüft, und beim Lesen sieht er aus wie eine benutzte Schnittstelle.
 */

function dateien(verzeichnis, endung, gesammelt = []) {
  for (const eintrag of readdirSync(verzeichnis)) {
    const pfad = join(verzeichnis, eintrag);
    if (statSync(pfad).isDirectory()) dateien(pfad, endung, gesammelt);
    else if (eintrag.endsWith(endung)) gesammelt.push(pfad);
  }
  return gesammelt;
}

const QUELLEN = dateien("src", ".ts");
const ALLE = [...QUELLEN, ...dateien("test", ".js"), ...dateien("tools", ".mjs")].map((pfad) => ({
  pfad,
  text: readFileSync(pfad, "utf8"),
}));

test("jeder Export wird auch benutzt", () => {
  const unbenutzt = [];

  for (const pfad of QUELLEN) {
    const text = readFileSync(pfad, "utf8");
    const namen = [...text.matchAll(/^export (?:async )?(?:function|const|interface|type|class) (\w+)/gm)].map(
      (t) => t[1]
    );
    for (const name of namen) {
      // Alle Vorkommen zählen – die Definitionszeile selbst zieht ab.
      const muster = new RegExp(`\\b${name}\\b`, "g");
      let treffer = 0;
      for (const datei of ALLE) treffer += (datei.text.match(muster) ?? []).length;
      const eigene = (text.match(new RegExp(`^export (?:async )?(?:function|const|interface|type|class) ${name}\\b`, "gm")) ?? []).length;
      if (treffer - eigene === 0) unbenutzt.push(`${pfad}: ${name}`);
    }
  }

  assert.deepEqual(
    unbenutzt,
    [],
    `Exporte ohne jeden Benutzer – entweder benutzen oder streichen:\n  ${unbenutzt.join("\n  ")}`
  );
});
