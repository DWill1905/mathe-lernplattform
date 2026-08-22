import "./setup.js";
import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";

import { ladeFortschritt } from "../js/state.js";
import { schwerpunkte, werteRundeAus } from "../js/gamification.js";
import { fehlerText } from "../js/views/eltern.js";
import { THEMEN } from "../js/topics.js";

const SCHLUESSEL = "mathe2:fortschritt";

/**
 * Der gesamte Angriffsweg dieses Projekts führt über den gespeicherten
 * Zustand: `localStorage` ist von Hand editierbar. Diese Tests halten fest,
 * dass jeder Wert beim Laden geprüft wird.
 */
test.beforeEach(() => localStorage.clear());

const boesartig = [
  ["Prototype Pollution im Fehlerobjekt", { fehler: { __proto__: { schadcode: 1 }, constructor: 9 } }],
  ["Prototype Pollution in den Themen", { themen: { __proto__: { schadcode: 1 }, plusminus: { __proto__: { schadcode: 1 } } } }],
  ["Prototype Pollution auf oberster Ebene", '{"__proto__":{"schadcode":"ja"},"punkte":5}'],
  ["Riesenzahlen", { punkte: 1e308, streakTage: 1e12, herzen: Number.MAX_SAFE_INTEGER,
    meister: { besteZeit: 1e15, besteTreffer: 1e9 },
    themen: { plusminus: { stufe: 1e9, gesamt: 1e12, richtig: 1e12, sterne: 99, besteSerie: 1e12 } } }],
  ["NaN und Infinity", { punkte: null, streakTage: "Infinity", themen: { geld: { stufe: NaN, gesamt: null, richtig: [], sterne: {} } } }],
  ["falsche Typen überall", { name: {}, punkte: [], themen: [], erfolge: {}, verlauf: {}, fehler: [], meister: "x", herzen: {}, letzterTag: 5 }],
  ["überlange Listen", { verlauf: Array.from({ length: 5000 }, () => ({ tag: "2026-01-01", gesamt: 1, richtig: 1 })),
    fehler: Object.fromEntries(Array.from({ length: 5000 }, (_, i) => [`t${i}`, 5])) }],
  ["kaputtes JSON", "{nicht wirklich json"],
  ["leerer Inhalt", ""],
  ["null", "null"],
];

for (const [name, nutzlast] of boesartig) {
  test(`manipulierter Spielstand: ${name}`, () => {
    localStorage.setItem(SCHLUESSEL, typeof nutzlast === "string" ? nutzlast : JSON.stringify(nutzlast));
    const f = ladeFortschritt();

    assert.equal({}.schadcode, undefined, "der Object-Prototyp wurde verändert");
    assert.equal([].schadcode, undefined, "der Array-Prototyp wurde verändert");

    assert.ok(Number.isSafeInteger(f.punkte) && f.punkte >= 0, `punkte=${f.punkte}`);
    assert.equal(Object.keys(f.themen).length, THEMEN.length, "unbekannte Themen sind durchgerutscht");
    for (const [id, stand] of Object.entries(f.themen)) {
      assert.ok([1, 2, 3].includes(stand.stufe), `${id}: Stufe ${stand.stufe}`);
      assert.ok(stand.sterne >= 0 && stand.sterne <= 3, `${id}: ${stand.sterne} Sterne`);
      assert.ok(stand.richtig <= stand.gesamt, `${id}: mehr richtig als gestellt`);
    }
    assert.ok(f.verlauf.length <= 90, `verlauf=${f.verlauf.length}`);
    assert.ok(Object.keys(f.fehler).length <= 300, `fehler=${Object.keys(f.fehler).length}`);
    assert.equal(typeof f.name, "string");
    assert.ok(f.name.length <= 20);

    // Die Weiterverarbeitung muss den geprüften Stand ebenfalls überstehen.
    schwerpunkte(f);
    Object.keys(f.fehler).forEach((typ) => assert.equal(typeof fehlerText(typ), "string"));
    werteRundeAus(f, {
      thema: "plusminus", stufe: 2, richtig: 5, gesamt: 10, besteSerie: 2,
      fehlerTypen: ["plusminus/tabelle"], richtigeTypen: [], herzen: 0,
    });
  });
}

test("Markup in gespeicherten Werten bleibt reiner Text", () => {
  const angriff = "<img src=x onerror=alert(1)>";
  localStorage.setItem(SCHLUESSEL, JSON.stringify({ name: angriff, fehler: { "</text><script>alert(1)</script>": 3 } }));
  const f = ladeFortschritt();
  // Der Wert wird nicht umgeschrieben, sondern nur auf die Namenslänge gekürzt.
  // Entscheidend ist, dass er als reiner TEXT in den DOM geht – dafür sorgt die
  // el()-Regel, die der nächste Test absichert.
  assert.ok(f.name.length <= 20, "der Name wird auf 20 Zeichen begrenzt");
  assert.ok(angriff.startsWith(f.name), "der Name wurde verfälscht statt gekürzt");
  assert.equal(typeof Object.keys(f.fehler)[0], "string");
  assert.ok(Object.keys(f.fehler)[0].length <= 60, "Fehlerschlüssel werden begrenzt");
});

test("innerHTML kommt ausschließlich in dom.ts vor", () => {
  // Rohes Markup ist allein für die SVG-Zeichenketten aus figures.ts erlaubt.
  // Jede weitere Fundstelle wäre ein möglicher Weg für gespeicherte Daten.
  const dateien = [];
  const sammeln = (verzeichnis) => {
    for (const eintrag of readdirSync(verzeichnis)) {
      const pfad = join(verzeichnis, eintrag);
      if (statSync(pfad).isDirectory()) sammeln(pfad);
      else if (pfad.endsWith(".ts")) dateien.push(pfad);
    }
  };
  sammeln("src");
  const treffer = dateien.filter((pfad) => /innerHTML|outerHTML|insertAdjacentHTML|document\.write/.test(readFileSync(pfad, "utf8")));
  assert.deepEqual(treffer, ["src/dom.ts"], `unerwartete Markup-Zuweisung in: ${treffer.join(", ")}`);
});

test("der Service Worker bedient nur die eigene Herkunft", () => {
  const quelle = readFileSync("sw.js", "utf8");
  const eigeneHerkunft = new Function(
    "self",
    `${quelle.match(/function eigeneHerkunft[\s\S]*?\n}/)[0]}; return eigeneHerkunft;`
  )({ location: { origin: "https://mathe.example.com" } });

  assert.equal(eigeneHerkunft("https://mathe.example.com/js/app.js"), true);
  // Ein Präfixvergleich würde hier fälschlich zustimmen:
  assert.equal(eigeneHerkunft("https://mathe.example.com.angreifer.tld/x.js"), false);
  assert.equal(eigeneHerkunft("http://mathe.example.com/x"), false, "anderes Schema, andere Herkunft");
  assert.equal(eigeneHerkunft("https://boese.tld/?r=https://mathe.example.com"), false);
  assert.equal(eigeneHerkunft("kein-url"), false);
});

test("die Seite lädt keine fremden Ressourcen und spricht nicht mit dem Netz", () => {
  const html = readFileSync("index.html", "utf8");
  assert.match(html, /Content-Security-Policy/);
  assert.match(html, /default-src 'self'/);
  assert.ok(!/'unsafe-inline'|'unsafe-eval'/.test(html), "die CSP wurde aufgeweicht");
  assert.ok(!/<script(?![^>]*\ssrc=)/.test(html), "Inline-Skript im HTML");
  assert.ok(!/\sstyle="/.test(html), "Inline-Style im HTML (verstößt gegen style-src)");

  const paket = JSON.parse(readFileSync("package.json", "utf8"));
  assert.deepEqual(paket.dependencies ?? {}, {}, "eine Laufzeit-Abhängigkeit ist dazugekommen");
});

/*
 * Die Synchronisierung spricht mit einer fremden Adresse – die CSP muss das
 * erlauben, sonst scheitert sie STILL. Genau das ist beim Bauen passiert:
 * Der Abgleich lief fehlerfrei durch, der Browser verwarf die Anfrage aber
 * wegen `connect-src 'self'`, und nichts wurde übertragen.
 */
test("die CSP erlaubt genau die Gegenstelle der Synchronisierung – und nichts sonst", () => {
  const html = readFileSync(new URL("../index.html", import.meta.url), "utf8");
  const regel = html.match(/connect-src ([^;"]+)/);
  assert.ok(regel, "es gibt keine connect-src-Regel");
  const quellen = regel[1].trim().split(/\s+/);

  assert.ok(quellen.includes("'self'"), "die eigene Herkunft muss erlaubt bleiben");
  assert.ok(
    quellen.some((q) => q === "https://*.workers.dev"),
    "die Gegenstelle der Synchronisierung fehlt – der Abgleich scheiterte sonst still"
  );
  // Kein Platzhalter für alles und keine unverschlüsselte Verbindung.
  for (const quelle of quellen) {
    assert.notEqual(quelle, "*", "die CSP darf nicht alles erlauben");
    assert.ok(!quelle.startsWith("http://"), `unverschlüsselte Quelle in der CSP: ${quelle}`);
  }
});

test("in der App steht kein Zugangsschlüssel", () => {
  const sync = readFileSync(new URL("../src/sync.ts", import.meta.url), "utf8");
  // Die Adresse ist noch ein Platzhalter …
  assert.ok(sync.includes("HIER-EINTRAGEN"), "eine echte Adresse gehört nicht ins Repository");
  // … und einen Schlüssel gibt es beim Worker gar nicht. Käme je einer dazu,
  // läge er öffentlich im Repository – deshalb dieser Wächter.
  assert.ok(!/apikey|anon_key|Bearer|secret|token/i.test(sync), "hier steht ein Zugangsschlüssel");
});

test("der Worker prüft Code, Größe und Bindung", () => {
  const worker = readFileSync(new URL("../cloudflare/worker.js", import.meta.url), "utf8");
  assert.match(worker, /CODE_MUSTER\s*=\s*\/\^\[A-Z0-9\]\{8\}\$\/|CODE_MUSTER/, "keine Codeprüfung");
  assert.ok(worker.includes("MAX_BYTES"), "keine Größengrenze – der Speicher ließe sich vollschreiben");
  // Beide Bindungsnamen müssen gehen – Cloudflares Beispiel nennt sie `KV`.
  assert.ok(
    /umgebung\.STAND\s*\?\?\s*umgebung\.KV/.test(worker),
    "der Worker akzeptiert nicht beide Bindungsnamen"
  );
  assert.ok(worker.includes("access-control-allow-origin"), "ohne CORS-Kopf antwortet der Worker dem Browser nicht");
  // Nicht auf alle Herkünfte öffnen.
  assert.ok(!/allow-origin[^,]*"\*"/.test(worker), "der Worker antwortet jeder Herkunft");
});
