import "./setup.js";
import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

import { mulberry32 } from "../js/random.js";
import { GENERATOREN } from "../js/tasks/index.js";
import {
  ALLE_FORMEN,
  formVariante,
  formenreihe,
  hunderterfeld,
  hunderterfeldStueck,
  rechenstrich,
} from "../js/figures.js";

/**
 * Die Aufgabenformen der Heftseiten „Orientieren am Hunderterfeld“,
 * „am Zahlenstrahl“, „am Rechenstrich“, „Zahlen vergleichen und ordnen“ und
 * „Geometrische Formen, Muster“.
 *
 * Geprüft wird durchgehend aus dem ERGEBNIS: Das Hunderterfeld wird aus dem
 * Bild ausgelesen, der Rechenstrich zwischen seinen beiden beschrifteten
 * Enden interpoliert, das Muster aus den gezeichneten Kästchen zusammengesetzt.
 * Ein Test, der die Zwischenwerte des Generators nachrechnet, würde nur
 * belegen, dass der Generator mit sich selbst einig ist.
 */

const CSS = readFileSync(new URL("../style.css", import.meta.url), "utf8");

/** Sammelt aus vielen Durchläufen die Aufgaben eines Typs ein. */
function sammle(thema, stufe, typ, anzahl = 40, seed = 20260904) {
  const rng = mulberry32(seed + stufe);
  const treffer = [];
  for (let i = 0; i < 8000 && treffer.length < anzahl; i++) {
    const aufgabe = GENERATOREN[thema](rng, stufe);
    if (aufgabe.typ === typ) treffer.push(aufgabe);
  }
  assert.ok(treffer.length >= anzahl, `${typ} kam nur ${treffer.length}-mal vor`);
  return treffer;
}

/* ---------------------------------------------------- gemeinsame Bilder */

test("die Farbklassen der neuen Bilder stehen in style.css", () => {
  const bilder = [
    hunderterfeld([10, 20], 34),
    hunderterfeld([10, 20, 30, 40], null, [2, 12, 22, 32]),
    hunderterfeldStueck([
      { zeile: 2, spalte: 3, wert: 24 },
      { zeile: 3, spalte: 3, wert: null },
    ]),
    rechenstrich(20, 30, 23, true),
    formenreihe(["Kreis", null, "Dreieck"]),
    formVariante("Ellipse", { groesse: 0.8, drehung: 10 }),
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
    assert.ok(klassen.size >= 2, "der Test misst nichts");
    for (const klasse of klassen) {
      assert.ok(CSS.includes(`.${klasse} {`), `Klasse ${klasse} fehlt in style.css`);
    }
  }
});

/* ------------------------------------------------------ Hunderterfeld */

/** Die gedruckten Zahlen eines Hunderterfelds samt ihrer Lage. */
function gedruckteZahlen(svg) {
  return [...svg.matchAll(/<text x="([\d.]+)" y="([\d.]+)"[^>]*font-size="17">(\d+)<\/text>/g)].map((t) => ({
    // Der Text sitzt mittig im Kästchen: beide Male 23 vom Eck aus.
    spalte: (Number(t[1]) - 23) / 46,
    zeile: (Number(t[2]) - 23) / 34,
    zahl: Number(t[3]),
  }));
}

const svgHatFragezeichen = (svg) => svg.includes(">?</text>");

/** Liest ein Hunderterfeld aus: gedruckte Zahlen und die Stelle des „?“. */
function feldLesen(svg) {
  const gesucht = svg.match(/<rect x="(\d+)" y="(\d+)" width="46" height="34" class="fig-feld-gesucht"\/>/);
  assert.ok(gesucht, "kein gesuchtes Feld im Bild");
  return {
    gedruckt: gedruckteZahlen(svg),
    gesucht: (Number(gesucht[2]) / 34) * 10 + Number(gesucht[1]) / 46 + 1,
  };
}

test("das Hunderterfeld druckt jede Zahl an ihre Stelle", () => {
  const bild = hunderterfeld([10, 20, 30], 34);
  const { gedruckt, gesucht } = feldLesen(bild);
  assert.equal(gesucht, 34);
  assert.deepEqual(
    gedruckt.map((f) => f.zahl),
    [10, 20, 30]
  );
  for (const feld of gedruckt) {
    assert.equal(feld.zeile * 10 + feld.spalte + 1, feld.zahl, `${feld.zahl} steht an der falschen Stelle`);
  }
  // Hundert Kästchen sind es weiterhin – nur eben fast alle leer.
  assert.equal(bild.match(/<rect [^>]*class="fig-feld[^"]*"/g).length, 100);
});

test("das Hunderterfeld bleibt fast leer – sonst liest man die Lücke am Nachbarn ab", () => {
  for (const stufe of [1, 2]) {
    for (const aufgabe of sammle("zahlenraum", stufe, "zahlenraum/hunderterfeld")) {
      const { gedruckt, gesucht } = feldLesen(aufgabe.bild.svg);
      assert.equal(gesucht, Number(aufgabe.loesung), `„${aufgabe.erklaerung}“ passt nicht zur Stelle im Bild`);
      for (const feld of gedruckt) {
        assert.equal(feld.zeile * 10 + feld.spalte + 1, feld.zahl, `${feld.zahl} steht an der falschen Stelle`);
      }

      const zahlen = gedruckt.map((f) => f.zahl);
      assert.ok(!zahlen.includes(gesucht), "die gesuchte Zahl steht selbst im Feld");
      assert.ok(zahlen.length <= 20, `${zahlen.length} von 100 Zahlen gedruckt – das ist keine Orientierung mehr`);
      if (stufe === 1) {
        // Zeilenanfänge und Zehnerspalte.
        assert.equal(zahlen.length, 20);
        assert.ok(zahlen.every((z) => z % 10 === 1 || z % 10 === 0));
      } else {
        // Nur noch die Zehnerspalte: Jetzt muss die Zeile abgezählt werden.
        assert.equal(zahlen.length, 10);
        assert.ok(zahlen.every((z) => z % 10 === 0));
      }
    }
  }
});

/** Die angemalten Felder eines Hunderterfelds, als Zahlen. */
function bunteFelder(svg) {
  return [...svg.matchAll(/<rect x="(\d+)" y="(\d+)" width="46" height="34" class="fig-feld-bunt"\/>/g)]
    .map((t) => (Number(t[2]) / 34) * 10 + Number(t[1]) / 46 + 1)
    .sort((a, b) => a - b);
}

test("das Muster im Hunderterfeld geht regelmäßig weiter", () => {
  for (const stufe of [1, 2]) {
    for (const aufgabe of sammle("zahlenraum", stufe, "zahlenraum/hunderterfeld-muster")) {
      const bunt = bunteFelder(aufgabe.bild.svg);
      assert.ok(bunt.length >= 3, `nur ${bunt.length} angemalte Felder`);
      assert.ok(!svgHatFragezeichen(aufgabe.bild.svg), "das Muster braucht kein Fragezeichen im Bild");

      // Der Schritt muss überall derselbe sein – sonst gäbe es keine Regel.
      const schritte = new Set(bunt.slice(1).map((zahl, i) => zahl - bunt[i]));
      assert.equal(schritte.size, 1, `ungleiche Schritte: ${bunt.join(", ")}`);
      const schritt = [...schritte][0];

      // Wie ein Kind: einen Schritt weiterzählen.
      assert.equal(bunt[bunt.length - 1] + schritt, Number(aufgabe.loesung), aufgabe.erklaerung);
      assert.ok(Number(aufgabe.loesung) <= 100, "die Reihe verlässt das Hunderterfeld");

      // Waagerecht bleiben alle in EINER Reihe, senkrecht in EINER Spalte.
      const alle = [...bunt, Number(aufgabe.loesung)];
      const zeilen = new Set(alle.map((zahl) => Math.floor((zahl - 1) / 10)));
      const spalten = new Set(alle.map((zahl) => (zahl - 1) % 10));
      assert.ok(
        zeilen.size === 1 || spalten.size === 1,
        `${alle.join(", ")} liegen weder in einer Reihe noch in einer Spalte`
      );

      // Steht die gesuchte Zahl gedruckt da, ist nichts mehr zu überlegen.
      const gedruckt = gedruckteZahlen(aufgabe.bild.svg).map((f) => f.zahl);
      assert.ok(!gedruckt.includes(Number(aufgabe.loesung)), "die Lösung steht schon im Feld");
    }
  }
});

/* -------------------------------------------- Hunderterfeld-Ausschnitt */

/** Liest einen Hunderterfeld-Ausschnitt als Liste von Feldern zurück. */
function stueckFelder(svg) {
  const kaesten = [
    ...svg.matchAll(/<rect x="(\d+)" y="(\d+)" width="68" height="52" rx="6" class="(fig-feld[a-z-]*)"\/>/g),
  ];
  const texte = [...svg.matchAll(/font-size="26">([^<]+)<\/text>/g)].map((t) => t[1]);
  assert.equal(kaesten.length, texte.length, "zu jedem Kästchen gehört genau ein Text");
  return kaesten.map((k, i) => ({
    spalte: Number(k[1]) / 68,
    zeile: Number(k[2]) / 52,
    text: texte[i],
  }));
}

test("der Hunderterfeld-Ausschnitt lässt sich aus den Nachbarn erschließen", () => {
  const formen = new Set();
  for (const stufe of [2, 3]) {
    for (const aufgabe of sammle("zahlenraum", stufe, "zahlenraum/hunderterfeld-stueck", 60)) {
      formen.add(aufgabe.bild.beschriftung);
      const felder = stueckFelder(aufgabe.bild.svg);
      assert.ok(felder.length >= 3, "der Ausschnitt ist zu klein");
      const luecke = felder.filter((f) => f.text === "?");
      assert.equal(luecke.length, 1, "im Ausschnitt fehlt genau eine Zahl");

      // Wie ein Kind: von einem gefüllten Nachbarn aus weiterzählen.
      // Rechts ist es 1 mehr, unten 10 mehr.
      const gefunden = new Set();
      for (const feld of felder) {
        if (feld.text === "?") continue;
        const schritte = (luecke[0].spalte - feld.spalte) * 1 + (luecke[0].zeile - feld.zeile) * 10;
        gefunden.add(Number(feld.text) + schritte);
      }
      assert.equal(gefunden.size, 1, "die Nachbarn widersprechen sich");
      assert.equal([...gefunden][0], Number(aufgabe.loesung), aufgabe.erklaerung);
      assert.ok(Number(aufgabe.loesung) >= 1 && Number(aufgabe.loesung) <= 100);
    }
  }
  // Das Heft zeigt Streifen, Spalten, Kreuze, Blöcke und Treppen – nicht nur
  // eine Form.
  assert.equal(formen.size, 6, `nur ${formen.size} Ausschnittformen: ${[...formen].join(" | ")}`);
});

/* -------------------------------------------------------- Rechenstrich */

/** Liest einen Rechenstrich aus: beschriftete Striche und die Lage des Kästchens. */
function strichLesen(svg) {
  const beschriftet = [...svg.matchAll(/<text x="([\d.]+)" y="38"[^>]*font-size="22">(\d+)<\/text>/g)].map((t) => ({
    x: Number(t[1]),
    wert: Number(t[2]),
  }));
  const kasten = svg.match(/<rect x="([\d.]+)" y="96" width="62" height="44" rx="6" class="fig-feld-gesucht"\/>/);
  assert.ok(kasten, "kein Kästchen am Rechenstrich");
  // Senkrechte Striche: alle Linien mit gleichem x1 und x2, ohne die
  // Führungslinie zum Kästchen (die endet erst bei y2 = 96).
  const striche = [...svg.matchAll(/<line x1="([\d.]+)" y1="(\d+)" x2="([\d.]+)" y2="(\d+)"/g)].filter(
    (l) => l[1] === l[3] && Number(l[4]) !== 96
  );
  return { beschriftet, striche: striche.length, mitte: Number(kasten[1]) + 31 };
}

test("das Kästchen am Rechenstrich hängt am Strich der Lösung", () => {
  const spannen = new Set();
  for (const stufe of [2, 3]) {
    for (const aufgabe of sammle("zahlenraum", stufe, "zahlenraum/rechenstrich", 60)) {
      const { beschriftet, striche, mitte } = strichLesen(aufgabe.bild.svg);
      const links = beschriftet[0];
      const rechts = beschriftet[beschriftet.length - 1];
      const spanne = rechts.wert - links.wert;
      spannen.add(`${stufe}/${spanne}`);

      assert.ok(spanne === 10 || spanne === 20, `Abschnitt über ${spanne} Zahlen`);
      assert.equal(striche, spanne + 1, `ein Abschnitt von ${spanne} hat ${spanne + 1} Striche`);
      // Kurzer Abschnitt: Enden und (bis Stufe 2) die Mitte. Langer Abschnitt:
      // jeder Zehner, weil die Mitte dort selbst ein Zehner ist.
      assert.equal(
        beschriftet.length,
        spanne === 20 || stufe < 3 ? 3 : 2,
        `Stufe ${stufe}, Spanne ${spanne}: falsch viele Beschriftungen`
      );

      // Zwischen den beiden äußeren Beschriftungen linear ablesen – genau das
      // tut ein Kind, das die Striche abzählt.
      const wert = links.wert + ((mitte - links.x) * spanne) / (rechts.x - links.x);
      assert.ok(
        Math.abs(wert - Number(aufgabe.loesung)) < 0.2,
        `Kästchen steht bei ${wert.toFixed(2)}, Lösung ist ${aufgabe.loesung}`
      );

      // Eine beschriftete Zahl abzulesen wäre keine Aufgabe.
      assert.ok(
        !beschriftet.some((b) => b.wert === Number(aufgabe.loesung)),
        `${aufgabe.loesung} steht schon am Strich`
      );
    }
  }
  // Stufe 3 bringt zusätzlich den langen Abschnitt der Zahlenstrahlseite.
  assert.ok(spannen.has("3/20"), `nur diese Abschnitte: ${[...spannen].join(", ")}`);
  assert.ok(spannen.has("2/10"), `nur diese Abschnitte: ${[...spannen].join(", ")}`);
});

/* ------------------------------------------------ Vergleichen, Ordnen */

const zehner = (zahl) => Math.floor(zahl / 10);
const vertauscht = (a, b) => a >= 10 && b >= 10 && a % 10 === zehner(b) && b % 10 === zehner(a);

test("die Zahlenpaare beim Vergleichen sind verwandt, nicht zufällig", () => {
  const aufgaben = sammle("zahlenraum", 1, "zahlenraum/vergleichszeichen", 400);
  let gleich = 0;
  let gleicheZehner = 0;
  let getauscht = 0;
  let leicht = 0;
  for (const aufgabe of aufgaben) {
    const [a, b] = aufgabe.rechnung.split("?").map((teil) => Number(teil.trim()));
    const erwartet = a < b ? "<" : a > b ? ">" : "=";
    assert.equal(aufgabe.loesung, erwartet, `${a} ${aufgabe.loesung} ${b} stimmt nicht`);
    assert.deepEqual(aufgabe.antwortfeld.optionen.slice().sort(), ["<", "=", ">"]);

    if (a === b) gleich++;
    else if (zehner(a) === zehner(b)) gleicheZehner++;
    else if (vertauscht(a, b)) getauscht++;
    else if (Math.abs(zehner(a) - zehner(b)) > 1) leicht++;
  }
  const anteil = (n) => n / aufgaben.length;
  // Ohne Gleichstände lernt ein Kind, dass „=“ nie vorkommt.
  assert.ok(anteil(gleich) > 0.1, `nur ${gleich} Gleichstände`);
  assert.ok(anteil(gleicheZehner) > 0.1, `nur ${gleicheZehner} Paare mit gleichen Zehnern`);
  assert.ok(anteil(getauscht) > 0.1, `nur ${getauscht} Paare mit vertauschten Ziffern`);
  // 12 gegen 87 sieht ein Kind auf einen Blick – das übt nichts.
  assert.equal(leicht, 0, `${leicht} Paare liegen weit auseinander, ohne verwandt zu sein`);
});

test("beim Ordnen stammen alle Zahlen aus derselben Ziffernfamilie", () => {
  const laengen = new Set();
  for (const aufgabe of sammle("zahlenraum", 3, "zahlenraum/ordnen-reihe", 80)) {
    const zahlen = aufgabe.loesung.split(",").map((t) => Number(t.trim()));
    laengen.add(zahlen.length);
    assert.ok(zahlen.length === 4 || zahlen.length === 6, `${zahlen.length} Zahlen in der Reihe`);
    assert.ok(
      zahlen.every((wert, i) => i === 0 || zahlen[i - 1] < wert),
      `die Lösung ist nicht sortiert: ${aufgabe.loesung}`
    );

    // Die 0 zählt nicht mit: Sie kommt nur als Einer vor (90), nie als Zehner.
    const ziffern = new Set(
      zahlen
        .join("")
        .split("")
        .filter((z) => z !== "0")
    );
    assert.ok(ziffern.size <= 3, `${aufgabe.loesung} benutzt ${ziffern.size} verschiedene Ziffern`);

    assert.ok(aufgabe.antwortfeld.optionen.length >= 3, "es braucht echte Alternativen zur Wahl");
    const sortiert = (reihe) => {
      const werte = reihe.split(",").map((t) => Number(t.trim()));
      return werte.every((wert, i) => i === 0 || werte[i - 1] < wert);
    };
    assert.deepEqual(
      aufgabe.antwortfeld.optionen.filter(sortiert),
      [aufgabe.loesung],
      `mehrdeutig: ${aufgabe.antwortfeld.optionen.join(" | ")}`
    );
  }
  // Zwei Reihen im Heft sind sechs Zahlen lang.
  assert.deepEqual([...laengen].sort(), [4, 6]);
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

test("in der Reihe mit Lücke fehlt genau eine Zahl mittendrin", () => {
  for (const stufe of [2, 3]) {
    for (const aufgabe of sammle("zahlenraum", stufe, "zahlenraum/reihe-luecke")) {
      const teile = aufgabe.rechnung.split(",").map((t) => t.trim());
      assert.ok(teile.length >= 5, `nur ${teile.length} Glieder`);
      const luecke = teile.indexOf("?");
      assert.equal(teile.filter((t) => t === "?").length, 1, "genau eine Lücke");
      assert.ok(luecke > 0 && luecke < teile.length - 1, "die Lücke sitzt am Rand statt mittendrin");

      // Wie ein Kind: den Schritt aus zwei sichtbaren Nachbarn ablesen.
      const werte = teile.map((t) => (t === "?" ? null : Number(t)));
      const schritte = new Set();
      for (let i = 1; i < werte.length; i++) {
        if (werte[i] === null || werte[i - 1] === null) continue;
        schritte.add(werte[i] - werte[i - 1]);
      }
      assert.equal(schritte.size, 1, `ungleiche Schritte in ${aufgabe.rechnung}`);
      const schritt = [...schritte][0];
      const erwartet = werte[luecke - 1] + schritt;
      assert.equal(Number(aufgabe.loesung), erwartet, `${aufgabe.rechnung} → ${aufgabe.loesung}`);
      for (const wert of werte) {
        if (wert !== null) assert.ok(wert >= 0 && wert <= 100, `${wert} verlässt den Zahlenraum`);
      }
    }
  }
});

test("beide Nachbarzehner umschließen die Zahl", () => {
  for (const aufgabe of sammle("zahlenraum", 2, "zahlenraum/nachbarzehner-paar")) {
    const zahl = Number(aufgabe.frage.match(/die (\d+)\?/)[1]);
    const umschliesst = (paar) => {
      const [unten, oben] = paar.split(" und ").map(Number);
      return oben - unten === 10 && unten < zahl && zahl < oben;
    };
    assert.ok(umschliesst(aufgabe.loesung), `${aufgabe.loesung} umschließt ${zahl} nicht`);
    for (const option of aufgabe.antwortfeld.optionen) {
      if (option === aufgabe.loesung) continue;
      assert.ok(!umschliesst(option), `${option} wäre auch richtig`);
    }
  }
});

/* ---------------------------------------------------------- Regeln */

/** Wendet eine Regel wie „immer + 3“ auf eine Zahlenreihe an. */
function folgtRegel(regel, reihe) {
  const [, zeichen, weite] = regel.match(/immer ([+−]) (\d+)/);
  const schritt = zeichen === "+" ? Number(weite) : -Number(weite);
  return reihe.every((wert, i) => wert === reihe[0] + i * schritt);
}

const alsReihe = (text) => text.split(",").map((t) => Number(t.trim()));

test("die gesuchte Regel erzeugt genau die gezeigte Zahlenreihe", () => {
  const schritte = new Set();
  for (const aufgabe of sammle("zahlenraum", 3, "zahlenraum/regel", 80)) {
    const glieder = alsReihe(aufgabe.rechnung);
    assert.ok(glieder.length >= 4, "die Reihe ist zu kurz zum Erkennen");
    schritte.add(aufgabe.loesung.match(/(\d+)$/)[1]);

    assert.ok(folgtRegel(aufgabe.loesung, glieder), `„${aufgabe.loesung}“ passt nicht zu ${aufgabe.rechnung}`);
    for (const option of aufgabe.antwortfeld.optionen) {
      if (option === aufgabe.loesung) continue;
      assert.ok(!folgtRegel(option, glieder), `„${option}“ passt auch – die Frage wäre nicht eindeutig`);
    }
    for (const wert of glieder) assert.ok(wert >= 0 && wert <= 100, `${wert} verlässt den Zahlenraum`);
  }
  // „immer + 1“ ist das Beispiel im Heft und muss vorkommen.
  assert.ok(schritte.has("1"), `Schrittweite 1 fehlt (gesehen: ${[...schritte].join(", ")})`);
});

test("zur genannten Regel passt genau eine der angebotenen Reihen", () => {
  for (const aufgabe of sammle("zahlenraum", 3, "zahlenraum/regel-reihe")) {
    const regel = aufgabe.frage.match(/„(immer [+−] \d+)“/)[1];
    const passende = aufgabe.antwortfeld.optionen.filter((option) => folgtRegel(regel, alsReihe(option)));
    assert.deepEqual(passende, [aufgabe.loesung], `„${regel}“ passt zu ${passende.length} Reihen`);
    for (const wert of alsReihe(aufgabe.loesung)) {
      assert.ok(wert >= 0 && wert <= 100, `${wert} verlässt den Zahlenraum`);
    }
  }
});

/* ------------------------------------------------- Formen und Muster */

/** Der Zeichnungsteil eines Formbildes – ohne Hülle und ohne Lagerahmen. */
function zeichnung(svg) {
  return svg
    .replace(/^<svg[^>]*>/, "")
    .replace(/<\/svg>$/, "")
    .replace(/^<g transform="[^"]*">/, "")
    .replace(/<\/g>$/, "");
}

/** Zu welcher Form gehört ein Bild? Aus der Zeichnung, nicht aus der Beschriftung. */
const ZEICHNUNG_ZU_FORM = new Map(
  ["Ellipse", ...ALLE_FORMEN].map((name) => [zeichnung(formVariante(name)), name])
);

const formAus = (svg) => ZEICHNUNG_ZU_FORM.get(zeichnung(svg));

/** Die Mehrzahl im Fragetext gehört zu genau einer Form. */
const GRUPPEN = { Quadrate: "Quadrat", Rechtecke: "Rechteck", Dreiecke: "Dreieck", Kreise: "Kreis" };

test("bei „passt nicht“ sind drei Karten dieselbe Form und eine nicht", () => {
  const gruppen = new Set();
  for (const stufe of [1, 2, 3]) {
    for (const aufgabe of sammle("geometrie", stufe, "geometrie/passt-nicht", 60)) {
      const mehrzahl = aufgabe.frage.match(/alles (\w+) sein/)[1];
      gruppen.add(mehrzahl);
      assert.ok(GRUPPEN[mehrzahl], `unbekannte Gruppe „${mehrzahl}“`);

      const karten = aufgabe.antwortfeld.optionen.map((option) => ({
        kennung: option.kennung,
        name: formAus(option.svg),
      }));
      assert.ok(
        karten.every((k) => k.name),
        "eine Bildkarte zeigt keine bekannte Form"
      );
      assert.equal(
        new Set(aufgabe.antwortfeld.optionen.map((o) => o.svg)).size,
        4,
        "zwei Bildkarten sind identisch"
      );

      const gesucht = karten.find((k) => k.kennung === aufgabe.loesung);
      const rest = karten.filter((k) => k.kennung !== aufgabe.loesung);
      assert.equal(new Set(rest.map((k) => k.name)).size, 1, "die drei anderen sind nicht dieselbe Form");
      assert.equal(rest[0].name, GRUPPEN[mehrzahl], `„${mehrzahl}“ passt nicht zu ${rest[0].name}`);
      assert.notEqual(gesucht.name, rest[0].name, `${gesucht.name} passt doch dazu`);

      // Die Karten dürfen die Lösung nicht im Klartext nennen.
      for (const option of aufgabe.antwortfeld.optionen) {
        assert.match(option.beschriftung, /^Form [A-D]$/, `„${option.beschriftung}“ verrät die Form`);
      }
    }
  }
  assert.equal(gruppen.size, 4, `nur ${gruppen.size} Formgruppen: ${[...gruppen].join(", ")}`);
});

/** Liest die Musterreihe aus dem Bild: Formnamen und `null` für die Lücke. */
function reiheAusBild(svg) {
  const kaesten = [...svg.matchAll(/<g transform="translate\(([\d.]+) [\d.]+\) scale\([\d.]+\)">(.*?)<\/g>/g)];
  const luecken = [
    ...svg.matchAll(/<rect x="([\d.]+)" y="0" width="84" height="84" rx="10" class="fig-feld-gesucht"\/>/g),
  ];
  const felder = [
    ...kaesten.map((k) => ({ x: Number(k[1]), name: ZEICHNUNG_ZU_FORM.get(k[2]) })),
    ...luecken.map((l) => ({ x: Number(l[1]), name: null })),
  ];
  felder.sort((a, b) => a.x - b.x);
  return felder.map((f) => f.name);
}

/**
 * Das kleinste Stück, das sich in einer vollständigen Reihe wiederholt.
 *
 * Nur Teiler der Länge zählen: „Kreis, Rechteck, Kreis“ passt zwar auf die
 * ersten drei Stellen eines Zweiermusters, wiederholt sich als Grundmuster
 * aber zu „Kreis, Rechteck, Kreis, Kreis, Rechteck, Kreis“ – und das hat die
 * Periode 3.
 */
function periode(reihe) {
  for (let laenge = 1; laenge <= reihe.length; laenge++) {
    if (reihe.length % laenge !== 0) continue;
    if (reihe.every((eintrag, i) => eintrag === reihe[i % laenge])) return laenge;
  }
  return reihe.length;
}

test("das Muster wird durch die gesuchte Karte wieder regelmäßig", () => {
  const laengen = new Set();
  for (const [stufe, typ] of [
    [1, "geometrie/muster-rechts"],
    [2, "geometrie/muster-links"],
    // Auf Stufe 3 werden es viele Proben: Nur dort werden die Grundmuster
    // vier Formen lang, und nur dort kann eines versehentlich schon in sich
    // periodisch sein (Kreis, Dreieck, Kreis, Dreieck).
    [3, "geometrie/muster-links"],
  ]) {
    for (const aufgabe of sammle("geometrie", stufe, typ, stufe === 3 ? 250 : 60)) {
      const reihe = reiheAusBild(aufgabe.bild.svg);
      assert.ok(reihe.length === 6 || reihe.length === 8, `${reihe.length} Kästchen in der Reihe`);
      assert.equal(reihe.filter((n) => n === null).length, 1, "es fehlt genau eine Form");
      assert.equal(
        reihe.indexOf(null),
        typ.endsWith("links") ? 0 : reihe.length - 1,
        "die Lücke sitzt auf der falschen Seite"
      );
      // Das Heft baut seine Muster nur aus diesen vier Formen.
      for (const name of reihe) {
        if (name !== null) assert.ok(["Quadrat", "Rechteck", "Dreieck", "Kreis"].includes(name), name);
      }

      const karte = aufgabe.antwortfeld.optionen.find((o) => o.kennung === aufgabe.loesung);
      const gefuellt = reihe.map((eintrag) => eintrag ?? formAus(karte.svg));
      const laenge = periode(gefuellt);
      assert.ok(laenge <= 4, `${gefuellt.join(" ")} ist kein Muster`);
      assert.ok(laenge >= 2, "ein Muster aus einer einzigen Form wäre keins");
      laengen.add(laenge);
      // Mindestens zwei volle Durchläufe – sonst ist das Muster nicht erkennbar.
      assert.ok(gefuellt.length >= 2 * laenge, `nur ${gefuellt.length} Kästchen für ein ${laenge}er-Muster`);

      // Das genannte Grundmuster muss das KLEINSTE sich wiederholende Stück
      // sein. „Kreis, Dreieck, Kreis, Dreieck“ wäre keins – der Auftrag im
      // Heft heißt „Kreise erst das Grundmuster ein“.
      const genannt = aufgabe.erklaerung.match(/Grundmuster ist: ([^.]+)\./)[1].split(", ");
      assert.equal(periode(genannt), genannt.length, `„${genannt.join(", ")}“ wiederholt sich schon in sich`);
      assert.equal(genannt.length, laenge, `genannt: ${genannt.length}, gezeichnet: ${laenge}`);

      // Und keine andere Karte darf ebenfalls passen – sonst wäre es geraten.
      for (const option of aufgabe.antwortfeld.optionen) {
        if (option.kennung === aufgabe.loesung) continue;
        const versuch = reihe.map((eintrag) => eintrag ?? formAus(option.svg));
        assert.ok(periode(versuch) > laenge, `${formAus(option.svg)} würde auch passen`);
      }
    }
  }
  // Im Heft sind die Grundmuster bis zu vier Formen lang.
  assert.ok(laengen.has(4), `nur Musterlängen ${[...laengen].join(", ")}`);
});

test("die Lücke der Musterreihe ist nicht kräftiger gezeichnet als die Formen", () => {
  const bild = formenreihe(["Kreis", "Dreieck", null]);
  const faktor = Number(bild.match(/scale\(([\d.]+)\)/)[1]);
  const luecke = Number(bild.match(/class="fig-linie" fill="none" stroke-width="([\d.]+)" stroke-dasharray/)[1]);
  // Die Formen sind mit Strichstärke 4 gezeichnet und werden mitskaliert.
  assert.ok(
    Math.abs(luecke - 4 * faktor) < 0.05,
    `Lücke ${luecke}, Formen ${(4 * faktor).toFixed(2)} – das leere Kästchen drängt sich vor`
  );
});

test("beim Grundmuster ist genau ein Vorschlag das kleinste Stück", () => {
  for (const stufe of [2, 3]) {
    for (const aufgabe of sammle("geometrie", stufe, "geometrie/grundmuster", 60)) {
      const reihe = reiheAusBild(aufgabe.bild.svg);
      assert.ok(!reihe.includes(null), "die Reihe des Grundmusters hat keine Lücke");
      assert.ok(reihe.length === 6 || reihe.length === 8, `${reihe.length} Kästchen in der Reihe`);
      const kleinste = periode(reihe);

      // Ein Vorschlag taugt, wenn er die ganze Reihe wieder aufbaut. Gesucht
      // ist der kürzeste davon – genau einer darf das sein.
      const baut = (stueck) => reihe.every((form, i) => form === stueck[i % stueck.length]);
      const vorschlaege = aufgabe.antwortfeld.optionen.map((option) => ({
        kennung: option.kennung,
        stueck: reiheAusBild(option.svg),
      }));
      assert.equal(new Set(vorschlaege.map((v) => v.stueck.join())).size, 4, "zwei Vorschläge sind gleich");

      // Alle Karten sind gleich breit gezeichnet – sonst wählte ein Kind nach
      // der Größe der Formen statt nach dem Muster.
      const breiten = new Set(
        aufgabe.antwortfeld.optionen.map((option) => option.svg.match(/viewBox="0 0 ([\d.]+) /)[1])
      );
      assert.equal(breiten.size, 1, `verschieden breite Bildkarten: ${[...breiten].join(", ")}`);

      const passende = vorschlaege.filter((v) => baut(v.stueck));
      const kuerzeste = passende.filter((v) => v.stueck.length === kleinste);
      assert.equal(kuerzeste.length, 1, `${kuerzeste.length} Vorschläge sind das kleinste Stück`);
      assert.equal(kuerzeste[0].kennung, aufgabe.loesung, "die Lösung zeigt nicht das kleinste Stück");
      assert.equal(periode(kuerzeste[0].stueck), kuerzeste[0].stueck.length, "der Vorschlag wiederholt sich in sich");

      // Ein reiner Längenvergleich wäre zu wenig: Mindestens ein Vorschlag
      // muss die Reihe gar nicht erst aufbauen.
      assert.ok(passende.length < 4, "alle vier Vorschläge bauen die Reihe – dann wird geraten");
      for (const name of reihe) {
        assert.ok(["Quadrat", "Rechteck", "Dreieck", "Kreis"].includes(name), name);
      }
    }
  }
});
