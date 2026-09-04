import "./setup.js";
import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

import { mulberry32 } from "../js/random.js";
import { GENERATOREN } from "../js/tasks/index.js";
import { ALLE_FORMEN, eckenZahl, form, formenreihe, hunderterfeld, hundertfeldStueck } from "../js/figures.js";

/**
 * Die Aufgabenformen der Heftseiten „Orientieren am Hunderterfeld“,
 * „am Zahlenstrahl“, „am Rechenstrich“, „Zahlen vergleichen und ordnen“ und
 * „Geometrische Formen, Muster“.
 *
 * Geprüft wird durchgehend aus dem ERGEBNIS: Das Hunderterfeld wird aus dem
 * Bild ausgelesen, das Muster aus der gezeichneten Reihe zusammengesetzt.
 * Ein Test, der die Zwischenwerte des Generators nachrechnet, würde nur
 * belegen, dass der Generator mit sich selbst einig ist.
 */

const CSS = readFileSync(new URL("../style.css", import.meta.url), "utf8");

/** Sammelt aus vielen Durchläufen die Aufgaben eines Typs ein. */
function sammle(thema, stufe, typ, anzahl = 40, seed = 20260904) {
  const rng = mulberry32(seed + stufe);
  const treffer = [];
  for (let i = 0; i < 6000 && treffer.length < anzahl; i++) {
    const aufgabe = GENERATOREN[thema](rng, stufe);
    if (aufgabe.typ === typ) treffer.push(aufgabe);
  }
  assert.ok(treffer.length >= anzahl, `${typ} kam nur ${treffer.length}-mal vor`);
  return treffer;
}

/* ------------------------------------------------------ Hunderterfeld */

test("das Hunderterfeld zeigt 100 Felder und verdeckt nur die genannten", () => {
  const bild = hunderterfeld([7, 42], 63);
  assert.equal(bild.match(/<rect [^>]*class="fig-feld[^"]*"/g).length, 100);
  assert.equal(bild.match(/class="fig-feld-gesucht"/g).length, 1);
  assert.equal(bild.match(/class="fig-feld-verdeckt"/g).length, 2);

  // Genau die drei abgedeckten Zahlen fehlen, alle anderen stehen da.
  const sichtbar = new Set([...bild.matchAll(/font-size="17">(\d+)<\/text>/g)].map((t) => Number(t[1])));
  assert.equal(sichtbar.size, 97);
  for (const zahl of [7, 42, 63]) assert.ok(!sichtbar.has(zahl), `${zahl} müsste zugeklebt sein`);
});

test("die Farbklassen der neuen Bilder stehen in style.css", () => {
  const bilder = [
    hunderterfeld([5], 12),
    hundertfeldStueck([{ zeile: 2, spalte: 3, wert: 24 }, { zeile: 3, spalte: 3, wert: null }]),
    formenreihe(["Kreis", null, "Dreieck"]),
  ];
  for (const bild of bilder) {
    assert.match(bild, /^<svg [^>]*viewBox="0 0 [\d.]+ [\d.]+"/);
    assert.ok(!/(fill|stroke)="(#|rgb|hsl)/.test(bild), `feste Farbe im SVG: ${bild.slice(0, 120)}`);
    // `fig` selbst ist nur die Hülle und wird über `.aufgabe-bild .fig` bemaßt;
    // geprüft werden die Farbklassen, denn eine fehlende bricht den Dunkelmodus.
    const klassen = new Set(
      [...bild.matchAll(/class="([a-z0-9 -]+)"/g)]
        .flatMap((t) => t[1].split(" "))
        .filter((klasse) => klasse.startsWith("fig-"))
    );
    assert.ok(klassen.size >= 3, "der Test misst nichts");
    for (const klasse of klassen) {
      assert.ok(CSS.includes(`.${klasse} {`), `Klasse ${klasse} fehlt in style.css`);
    }
  }
});

/** Liest die Stelle des Fragezeichens aus dem Hunderterfeld zurück. */
function gesuchteZahl(svg) {
  const treffer = svg.match(/<rect x="(\d+)" y="(\d+)" width="46" height="34" class="fig-feld-gesucht"\/>/);
  assert.ok(treffer, "kein gesuchtes Feld im Bild");
  const spalte = Number(treffer[1]) / 46;
  const zeile = Number(treffer[2]) / 34;
  return zeile * 10 + spalte + 1;
}

test("im Hunderterfeld steht das Fragezeichen an der Stelle der Lösung", () => {
  for (const stufe of [1, 2]) {
    for (const aufgabe of sammle("zahlenraum", stufe, "zahlenraum/hunderterfeld")) {
      assert.equal(
        gesuchteZahl(aufgabe.bild.svg),
        Number(aufgabe.loesung),
        `„${aufgabe.erklaerung}“ passt nicht zur Stelle im Bild`
      );
    }
  }
});

/** Liest einen Hunderterfeld-Ausschnitt als Liste von Feldern zurück. */
function stueckFelder(svg) {
  const muster =
    /<rect x="(\d+)" y="(\d+)" width="68" height="52" rx="6" class="(fig-feld[a-z-]*)"\/>/g;
  const kaesten = [...svg.matchAll(muster)];
  const texte = [...svg.matchAll(/font-size="26">([^<]+)<\/text>/g)].map((t) => t[1]);
  assert.equal(kaesten.length, texte.length, "zu jedem Kästchen gehört genau ein Text");
  return kaesten.map((k, i) => ({
    spalte: Number(k[1]) / 68,
    zeile: Number(k[2]) / 52,
    text: texte[i],
  }));
}

test("der Hunderterfeld-Ausschnitt lässt sich aus den Nachbarn erschließen", () => {
  for (const stufe of [2, 3]) {
    for (const aufgabe of sammle("zahlenraum", stufe, "zahlenraum/hunderterfeld-stueck")) {
      const felder = stueckFelder(aufgabe.bild.svg);
      assert.ok(felder.length >= 4, "der Ausschnitt ist zu klein");
      const luecke = felder.filter((f) => f.text === "?");
      assert.equal(luecke.length, 1, "im Ausschnitt fehlt genau eine Zahl");

      // Wie ein Kind: von einem gefüllten Nachbarn aus weiterzählen.
      // Rechts ist es 1 mehr, unten 10 mehr.
      const gefunden = new Set();
      for (const feld of felder) {
        if (feld.text === "?") continue;
        const schritte =
          (luecke[0].spalte - feld.spalte) * 1 + (luecke[0].zeile - feld.zeile) * 10;
        gefunden.add(Number(feld.text) + schritte);
      }
      assert.equal(gefunden.size, 1, "die Nachbarn widersprechen sich");
      assert.equal([...gefunden][0], Number(aufgabe.loesung), aufgabe.erklaerung);
      assert.ok(Number(aufgabe.loesung) >= 1 && Number(aufgabe.loesung) <= 100);
    }
  }
});

/* -------------------------------------------------------- Rechenstrich */

test("die Marke auf dem Rechenstrich sitzt an der Stelle der Lösung", () => {
  for (const stufe of [2, 3]) {
    for (const aufgabe of sammle("zahlenraum", stufe, "zahlenraum/rechenstrich")) {
      const treffer = aufgabe.bild.svg.match(/<circle cx="([\d.]+)" cy="70" r="10" class="fig-marke"\/>/);
      assert.ok(treffer, "keine Marke auf dem Rechenstrich");
      // Umkehrung der Formel aus zahlenstrahl(): x = 30 + (rechts − links − 16) · wert / max
      const wert = ((Number(treffer[1]) - 30) * 100) / (490 - 30 - 16);
      assert.ok(
        Math.abs(wert - Number(aufgabe.loesung)) < 0.5,
        `Marke steht bei ${wert.toFixed(1)}, Lösung ist ${aufgabe.loesung}`
      );
      assert.equal(Number(aufgabe.loesung) % 10, 5, "die Marke soll zwischen zwei Zehnern liegen");
    }
  }
});

/* --------------------------------------------------- Vergleich, Regel */

test("beim Vergleichszeichen zeigt die offene Seite zur größeren Zahl", () => {
  const aufgaben = sammle("zahlenraum", 1, "zahlenraum/vergleichszeichen", 200);
  let gleich = 0;
  for (const aufgabe of aufgaben) {
    const [a, b] = aufgabe.rechnung.split("?").map((teil) => Number(teil.trim()));
    const erwartet = a < b ? "<" : a > b ? ">" : "=";
    assert.equal(aufgabe.loesung, erwartet, `${a} ${aufgabe.loesung} ${b} stimmt nicht`);
    assert.deepEqual(aufgabe.antwortfeld.optionen.slice().sort(), ["<", "=", ">"]);
    if (erwartet === "=") gleich++;
  }
  // Ohne Gleichstände lernt ein Kind, dass „=“ nie vorkommt.
  assert.ok(gleich >= 10, `nur ${gleich} von ${aufgaben.length} Aufgaben sind ein Gleichstand`);
});

test("die gesuchte Regel erzeugt genau die gezeigte Zahlenreihe", () => {
  for (const aufgabe of sammle("zahlenraum", 3, "zahlenraum/regel")) {
    const glieder = aufgabe.rechnung.split(",").map((t) => Number(t.trim()));
    assert.ok(glieder.length >= 4, "die Reihe ist zu kurz zum Erkennen");

    /** Wendet eine Regel wie „immer + 3“ auf den Anfang an. */
    const passt = (regel) => {
      const [, zeichen, weite] = regel.match(/immer ([+−]) (\d+)/);
      const schritt = zeichen === "+" ? Number(weite) : -Number(weite);
      return glieder.every((wert, i) => wert === glieder[0] + i * schritt);
    };
    assert.ok(passt(aufgabe.loesung), `„${aufgabe.loesung}“ passt nicht zu ${aufgabe.rechnung}`);
    for (const option of aufgabe.antwortfeld.optionen) {
      if (option === aufgabe.loesung) continue;
      assert.ok(!passt(option), `„${option}“ passt auch – die Frage wäre nicht eindeutig`);
    }
    for (const wert of glieder) assert.ok(wert >= 0 && wert <= 100, `${wert} verlässt den Zahlenraum`);
  }
});

test("beim Ordnen ist genau eine Reihe der Größe nach sortiert", () => {
  for (const aufgabe of sammle("zahlenraum", 3, "zahlenraum/ordnen-reihe")) {
    const sortiert = (reihe) => {
      const zahlen = reihe.split(",").map((t) => Number(t.trim()));
      return zahlen.every((wert, i) => i === 0 || zahlen[i - 1] < wert);
    };
    assert.ok(aufgabe.antwortfeld.optionen.length >= 3, "es braucht echte Alternativen zur Wahl");
    const richtige = aufgabe.antwortfeld.optionen.filter(sortiert);
    assert.deepEqual(richtige, [aufgabe.loesung], `mehrdeutig: ${aufgabe.antwortfeld.optionen.join(" | ")}`);
  }
});

test("die Zahl zwischen zwei Nachbarzehnern liegt wirklich dazwischen", () => {
  for (const aufgabe of sammle("zahlenraum", 2, "zahlenraum/zwischen-zehnern")) {
    const [unten, oben] = aufgabe.frage.match(/sind (\d+) und (\d+)/).slice(1).map(Number);
    assert.equal(oben - unten, 10, "das sind keine Nachbarzehner");
    const dazwischen = (wert) => wert > unten && wert < oben;
    assert.ok(dazwischen(Number(aufgabe.loesung)), `${aufgabe.loesung} liegt nicht zwischen ${unten} und ${oben}`);
    for (const option of aufgabe.antwortfeld.optionen) {
      if (option === aufgabe.loesung) continue;
      assert.ok(!dazwischen(Number(option)), `${option} wäre auch richtig`);
    }
  }
});

/* ------------------------------------------------- Formen und Muster */

/** Zu welcher Form gehört eine Bildkarte? Aus dem SVG, nicht aus der Beschriftung. */
const INHALT_ZU_FORM = new Map(
  ALLE_FORMEN.map((name) => [form(name).replace(/^<svg[^>]*>/, "").replace("</svg>", ""), name])
);

test("bei „passt nicht“ hat genau die gesuchte Karte eine andere Eckenzahl", () => {
  for (const stufe of [1, 2]) {
    for (const aufgabe of sammle("geometrie", stufe, "geometrie/passt-nicht")) {
      const karten = aufgabe.antwortfeld.optionen.map((option) => ({
        kennung: option.kennung,
        name: INHALT_ZU_FORM.get(option.svg.replace(/^<svg[^>]*>/, "").replace("</svg>", "")),
      }));
      assert.ok(karten.every((k) => k.name), "eine Bildkarte zeigt keine bekannte Form");
      assert.equal(new Set(karten.map((k) => k.name)).size, 4, "zwei Karten zeigen dieselbe Form");

      const gesucht = karten.find((k) => k.kennung === aufgabe.loesung);
      const rest = karten.filter((k) => k.kennung !== aufgabe.loesung);
      assert.equal(new Set(rest.map((k) => eckenZahl(k.name))).size, 1, "die drei anderen passen nicht zusammen");
      assert.notEqual(eckenZahl(gesucht.name), eckenZahl(rest[0].name), `${gesucht.name} passt doch dazu`);
    }
  }
});

/** Liest die Musterreihe aus dem Bild: Formnamen und `null` für die Lücke. */
function reiheAusBild(svg) {
  const kaesten = [...svg.matchAll(/<g transform="translate\(([\d.]+) [\d.]+\) scale\([\d.]+\)">(.*?)<\/g>/g)];
  const luecken = [...svg.matchAll(/<rect x="([\d.]+)" y="0" width="84" height="84" rx="10" class="fig-feld-gesucht"\/>/g)];
  const felder = [
    ...kaesten.map((k) => ({ x: Math.round(Number(k[1])), name: INHALT_ZU_FORM.get(k[2]) })),
    ...luecken.map((l) => ({ x: Number(l[1]), name: null })),
  ];
  felder.sort((a, b) => a.x - b.x);
  return felder.map((f) => f.name);
}

test("das Muster wird durch die gesuchte Karte wieder regelmäßig", () => {
  for (const [stufe, typ] of [
    [1, "geometrie/muster-rechts"],
    [2, "geometrie/muster-links"],
  ]) {
    for (const aufgabe of sammle("geometrie", stufe, typ)) {
      const reihe = reiheAusBild(aufgabe.bild.svg);
      assert.equal(reihe.length, 6, "die Musterreihe hat sechs Kästchen");
      assert.equal(reihe.filter((n) => n === null).length, 1, "es fehlt genau eine Form");
      assert.equal(reihe.indexOf(null), typ.endsWith("links") ? 0 : 5, "die Lücke sitzt auf der falschen Seite");

      const karte = aufgabe.antwortfeld.optionen.find((o) => o.kennung === aufgabe.loesung);
      const name = INHALT_ZU_FORM.get(karte.svg.replace(/^<svg[^>]*>/, "").replace("</svg>", ""));
      const gefuellt = reihe.map((eintrag) => eintrag ?? name);

      // Jetzt muss sich die Reihe mit einer festen Musterlänge wiederholen.
      const laengen = [2, 3].filter((laenge) =>
        gefuellt.every((eintrag, i) => eintrag === gefuellt[i % laenge])
      );
      assert.ok(laengen.length > 0, `${gefuellt.join(" ")} ist kein Muster`);

      // Und keine andere Karte darf ebenfalls passen – sonst wäre es geraten.
      for (const option of aufgabe.antwortfeld.optionen) {
        if (option.kennung === aufgabe.loesung) continue;
        const falsch = INHALT_ZU_FORM.get(option.svg.replace(/^<svg[^>]*>/, "").replace("</svg>", ""));
        const versuch = reihe.map((eintrag) => eintrag ?? falsch);
        assert.ok(
          !laengen.some((laenge) => versuch.every((eintrag, i) => eintrag === versuch[i % laenge])),
          `${falsch} würde auch passen`
        );
      }
    }
  }
});
