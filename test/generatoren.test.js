import "./setup.js";
import test from "node:test";
import assert from "node:assert/strict";

import { mulberry32 } from "../js/random.js";
import {
  GENERATOREN,
  MIX_TOPF,
  RUNDENLAENGE,
  aufgabenSchluessel,
  gemischteRunde,
  runde,
} from "../js/tasks/index.js";
import { HEFT_THEMEN, THEMEN, WEITERE_THEMEN } from "../js/topics.js";
import { NAMEN, wesfall } from "../js/tasks/helpers.js";

const STUFEN = [1, 2, 3];

/** Prüft die Grundform jeder Aufgabe – unabhängig vom Thema. */
function pruefeAufgabe(aufgabe, kontext) {
  assert.ok(aufgabe.typ && typeof aufgabe.typ === "string", `${kontext}: Typ fehlt`);
  assert.ok(aufgabe.frage.length > 5, `${kontext}: Frage zu kurz`);
  assert.ok(typeof aufgabe.loesung === "string" && aufgabe.loesung.length > 0, `${kontext}: keine Lösung`);
  assert.ok(!/undefined|NaN|\[object/.test(JSON.stringify(aufgabe)), `${kontext}: kaputter Text`);

  if (aufgabe.antwortfeld.art === "zahl") {
    assert.match(aufgabe.loesung, /^\d+$/, `${kontext}: Zahlenantwort ist keine natürliche Zahl`);
    assert.ok(Number(aufgabe.loesung) <= 1000, `${kontext}: Lösung ${aufgabe.loesung} zu groß für Klasse 2`);
  } else if (aufgabe.antwortfeld.art === "rechnung") {
    // Eine ganze Rechnung, z. B. „4 − 1 = 3“.
    assert.match(aufgabe.loesung, /^\d+\s*[+−·:]\s*\d+\s*=\s*\d+$/, `${kontext}: keine ganze Rechnung`);
  } else if (aufgabe.antwortfeld.art === "mauer") {
    const reihen = aufgabe.antwortfeld.reihen;
    const luecken = reihen.flat().filter((wert) => wert === null).length;
    const werte = aufgabe.loesung.split(",");
    assert.ok(luecken >= 1, `${kontext}: Mauer ohne Lücke`);
    assert.equal(werte.length, luecken, `${kontext}: ${werte.length} Lösungen für ${luecken} Lücken`);
    for (const wert of werte) {
      assert.match(wert, /^\d+$/, `${kontext}: „${wert}“ ist keine natürliche Zahl`);
      assert.ok(Number(wert) <= 100, `${kontext}: Stein ${wert} liegt über 100`);
    }
    // Jede Reihe muss einen Stein kürzer sein als die darunter.
    for (let i = 1; i < reihen.length; i++) {
      assert.equal(reihen[i].length, reihen[i - 1].length - 1, `${kontext}: Mauer ist schief`);
    }
  } else if (aufgabe.antwortfeld.art === "bildauswahl") {
    const optionen = aufgabe.antwortfeld.optionen;
    const kennungen = optionen.map((o) => o.kennung);
    assert.ok(optionen.length >= 2, `${kontext}: zu wenige Bildkarten`);
    assert.equal(new Set(kennungen).size, kennungen.length, `${kontext}: doppelte Kennung`);
    assert.ok(kennungen.includes(aufgabe.loesung), `${kontext}: Lösung fehlt in der Bildauswahl`);
    for (const option of optionen) {
      assert.match(option.svg, /^<svg /, `${kontext}: Bildkarte ohne SVG`);
      assert.ok(option.beschriftung.length > 3, `${kontext}: Bildkarte ohne Beschreibung`);
    }
    // Zwei gleiche Bilder wären nicht entscheidbar.
    const bilder = optionen.map((o) => o.svg);
    assert.equal(new Set(bilder).size, bilder.length, `${kontext}: zwei Bildkarten sind identisch`);
  } else {
    const optionen = aufgabe.antwortfeld.optionen;
    assert.ok(optionen.length >= 2, `${kontext}: zu wenige Auswahlmöglichkeiten`);
    assert.equal(new Set(optionen).size, optionen.length, `${kontext}: doppelte Auswahlmöglichkeit`);
    assert.ok(optionen.includes(aufgabe.loesung), `${kontext}: Lösung fehlt in der Auswahl`);
  }
}

test("jeder Generator liefert auf jeder Stufe wohlgeformte Aufgaben", () => {
  for (const thema of THEMEN) {
    for (const stufe of STUFEN) {
      const rng = mulberry32(20260820 + stufe);
      for (let i = 0; i < 300; i++) {
        pruefeAufgabe(GENERATOREN[thema.id](rng, stufe), `${thema.id}/Stufe ${stufe}/Durchlauf ${i}`);
      }
    }
  }
});

test("Rechnungen stimmen mit der angegebenen Lösung überein", () => {
  const rechenthemen = ["plusminus", "einmaleins", "geteilt", "analogie", "familien"];
  for (const id of rechenthemen) {
    for (const stufe of STUFEN) {
      const rng = mulberry32(4711 + stufe);
      for (let i = 0; i < 400; i++) {
        const aufgabe = GENERATOREN[id](rng, stufe);
        if (aufgabe.antwortfeld.art !== "zahl") continue;
        const treffer = aufgabe.rechnung?.match(/^(\d+) ([+−·:]) (\d+) =$/);
        if (!treffer) continue;
        const [, a, zeichen, b] = treffer;
        const erwartet = {
          "+": Number(a) + Number(b),
          "−": Number(a) - Number(b),
          "·": Number(a) * Number(b),
          ":": Number(a) / Number(b),
        }[zeichen];
        assert.equal(
          Number(aufgabe.loesung),
          erwartet,
          `${id}/Stufe ${stufe}: ${aufgabe.rechnung} ${aufgabe.loesung}`
        );
      }
    }
  }
});

test("Plus und Minus bleiben im Zahlenraum bis 100", () => {
  for (const stufe of STUFEN) {
    const rng = mulberry32(99 + stufe);
    for (let i = 0; i < 500; i++) {
      const aufgabe = GENERATOREN.plusminus(rng, stufe);
      if (aufgabe.antwortfeld.art !== "zahl") continue;
      assert.ok(
        Number(aufgabe.loesung) <= 100,
        `Stufe ${stufe}: Ergebnis ${aufgabe.loesung} verlässt den Zahlenraum (${aufgabe.rechnung})`
      );
    }
  }
});

test("Stufe 2 von Plus/Minus kommt ohne Zehnerübergang aus", () => {
  const rng = mulberry32(2024);
  for (let i = 0; i < 500; i++) {
    const aufgabe = GENERATOREN.plusminus(rng, 2);
    const treffer = aufgabe.rechnung?.match(/^(\d+) ([+−]) (\d+) =$/);
    if (!treffer) continue;
    const [, a, zeichen, b] = treffer;
    const einerA = Number(a) % 10;
    const einerB = Number(b) % 10;
    if (zeichen === "+") assert.ok(einerA + einerB <= 9, `Zehnerübergang in ${aufgabe.rechnung}`);
    else assert.ok(einerA >= einerB, `Zehnerübergang in ${aufgabe.rechnung}`);
  }
});

test("Einmaleins Stufe 1 nutzt nur die einfachen Reihen", () => {
  const erlaubt = new Set([1, 2, 5, 10]);
  const rng = mulberry32(7);
  for (let i = 0; i < 400; i++) {
    const aufgabe = GENERATOREN.einmaleins(rng, 1);
    const treffer = aufgabe.rechnung?.match(/^(\d+) · (\d+) =$/);
    if (!treffer) continue;
    const [, a, b] = treffer;
    assert.ok(
      erlaubt.has(Number(a)) || erlaubt.has(Number(b)),
      `Unerwartete Reihe in ${aufgabe.rechnung}`
    );
  }
});

test("eine Runde hat zehn Aufgaben und ist bei gleichem Seed reproduzierbar", () => {
  for (const thema of THEMEN) {
    const eins = runde(thema.id, mulberry32(123), 2);
    const zwei = runde(thema.id, mulberry32(123), 2);
    assert.equal(eins.length, RUNDENLAENGE);
    assert.deepEqual(eins, zwei, `${thema.id}: Runde ist nicht reproduzierbar`);
  }
});

test("das gemischte Training zieht aus mehreren Themen", () => {
  const stufen = Object.fromEntries(THEMEN.map((t) => [t.id, 2]));
  const eintraege = gemischteRunde(mulberry32(555), stufen, RUNDENLAENGE);
  assert.equal(eintraege.length, RUNDENLAENGE);
  assert.ok(new Set(eintraege.map((e) => e.thema)).size >= 5, "zu wenig Abwechslung");
  for (const eintrag of eintraege) pruefeAufgabe(eintrag.aufgabe, `mix/${eintrag.thema}`);
});

test("die Themen aus dem Übungsheft stehen vorn und wiegen im Mix doppelt", () => {
  assert.ok(HEFT_THEMEN.length >= 5, "es sollten mehrere Heft-Themen sein");
  assert.equal(HEFT_THEMEN.length + WEITERE_THEMEN.length, THEMEN.length);

  // Die Heft-Themen belegen die vorderen Plätze der Themenliste.
  const vordere = THEMEN.slice(0, HEFT_THEMEN.length).map((t) => t.id);
  assert.deepEqual(vordere, HEFT_THEMEN.map((t) => t.id));

  const heft = new Set(HEFT_THEMEN.map((t) => t.id));
  assert.equal(MIX_TOPF.filter((id) => heft.has(id)).length, HEFT_THEMEN.length * 2);
  assert.equal(MIX_TOPF.filter((id) => !heft.has(id)).length, WEITERE_THEMEN.length);

  // Über viele Runden hinweg kommen die Heft-Themen deutlich häufiger dran.
  const stufen = Object.fromEntries(THEMEN.map((t) => [t.id, 1]));
  const rng = mulberry32(31415);
  let ausHeft = 0;
  let gesamt = 0;
  for (let runde = 0; runde < 60; runde++) {
    for (const eintrag of gemischteRunde(rng, stufen, RUNDENLAENGE)) {
      gesamt++;
      if (heft.has(eintrag.thema)) ausHeft++;
    }
  }
  assert.ok(ausHeft / gesamt > 0.55, `nur ${Math.round((ausHeft / gesamt) * 100)} % aus dem Heft`);
});

test("eine Runde wiederholt bekannte Fehlerarten häufiger", () => {
  const ohne = runde("plusminus", mulberry32(2024), 3, 10);
  const anteilOhne = ohne.filter((a) => a.typ === "plusminus/ergaenzen").length;

  const schwerpunkt = new Set(["plusminus/platzhalter"]);
  let mitSchwerpunkt = 0;
  let gesamt = 0;
  for (let seed = 1; seed <= 40; seed++) {
    const aufgaben = runde("plusminus", mulberry32(seed), 3, 10, schwerpunkt);
    assert.equal(aufgaben.length, 10, "die Runde bleibt zehn Aufgaben lang");
    mitSchwerpunkt += aufgaben.filter((a) => a.typ === "plusminus/platzhalter").length;
    gesamt += aufgaben.length;
  }
  assert.ok(
    mitSchwerpunkt / gesamt > 0.4,
    `nur ${Math.round((mitSchwerpunkt / gesamt) * 100)} % Schwerpunktaufgaben`
  );
  assert.ok(mitSchwerpunkt / gesamt < 0.75, "die Runde darf nicht NUR aus Schwerpunkten bestehen");
  assert.ok(anteilOhne >= 0, "ohne Schwerpunkte bleibt alles wie bisher");
});

test("ein Schwerpunkt, den es im Thema nicht gibt, blockiert die Runde nicht", () => {
  const aufgaben = runde("geld", mulberry32(9), 2, 10, new Set(["gibt/es/nicht"]));
  assert.equal(aufgaben.length, 10);
  for (const aufgabe of aufgaben) pruefeAufgabe(aufgabe, "geld ohne passenden Schwerpunkt");
});

test("ein unerreichbarer Schwerpunkt erzeugt keine zusätzlichen Doppelaufgaben", () => {
  // Der Schwerpunkt ist nur ein Wunsch – die Frische einer Aufgabe ist Pflicht.
  const doppelquote = (schwerpunkt) => {
    let mitDoppel = 0;
    const durchlaeufe = 400;
    for (let seed = 1; seed <= durchlaeufe; seed++) {
      const aufgaben = runde("uhrzeit", mulberry32(seed), 2, 10, schwerpunkt);
      const kennungen = aufgaben.map((a) => `${a.frage}|${a.rechnung ?? ""}`);
      if (new Set(kennungen).size < aufgaben.length) mitDoppel++;
    }
    return mitDoppel / durchlaeufe;
  };

  const ohne = doppelquote(new Set());
  const mitFremdem = doppelquote(new Set(["geld/rueckgeld"]));
  assert.ok(
    mitFremdem <= ohne + 0.05,
    `Doppelquote steigt von ${Math.round(ohne * 100)} % auf ${Math.round(mitFremdem * 100)} %`
  );
});

test("keine Aufgabe zeigt negative Zahlen oder verlässt den Zahlenraum", () => {
  for (const thema of THEMEN) {
    // Geld (Cent) und Längen (mm/cm) rechnen bewusst in kleinen Einheiten und
    // liegen dabei über 100 – dort gilt die Grenze nicht.
    const grenze = thema.id === "geld" || thema.id === "laengen" ? Infinity : 100;
    for (const stufe of STUFEN) {
      const rng = mulberry32(555 + stufe);
      for (let i = 0; i < 1500; i++) {
        const aufgabe = GENERATOREN[thema.id](rng, stufe);
        const text = [aufgabe.frage, aufgabe.rechnung ?? "", aufgabe.erklaerung ?? ""].join(" ");
        // Rechenzeichen stehen immer mit Leerzeichen („12 − 5“); ein Minus
        // direkt an einer Ziffer ist deshalb ein Vorzeichen – und verboten.
        assert.ok(
          !/[-−]\d/.test(text),
          `${thema.id}/Stufe ${stufe}: negative Zahl im Text – ${text}`
        );
        for (const zahl of text.match(/\d+/g) ?? []) {
          assert.ok(
            Number(zahl) <= grenze,
            `${thema.id}/Stufe ${stufe}: ${zahl} verlässt den Zahlenraum – ${text}`
          );
        }
      }
    }
  }
});

test("Nachbarzehner fragt nie nach der Zahl selbst", () => {
  for (const stufe of STUFEN) {
    const rng = mulberry32(4711 + stufe);
    for (let i = 0; i < 600; i++) {
      const aufgabe = GENERATOREN.zahlenraum(rng, stufe);
      if (aufgabe.typ !== "zahlenraum/nachbarzehner") continue;
      const [, richtung, zahl] = aufgabe.frage.match(/kommt (vor|nach) der Zahl (\d+)/);
      const loesung = Number(aufgabe.loesung);
      assert.equal(loesung % 10, 0, "die Antwort ist immer ein voller Zehner");
      assert.notEqual(loesung, Number(zahl), `„${aufgabe.frage}“ hat sich selbst als Antwort`);
      assert.ok(richtung === "vor" ? loesung < Number(zahl) : loesung > Number(zahl), aufgabe.frage);
    }
  }
});

test("beim Längenvergleich ist nie beides gleich lang", () => {
  const rng = mulberry32(321);
  for (let i = 0; i < 800; i++) {
    const aufgabe = GENERATOREN.laengen(rng, 2);
    if (aufgabe.typ !== "laengen/vergleich") continue;
    const [, cm, meter] = aufgabe.rechnung.match(/^(\d+) cm {3}oder {3}(\d+) m$/);
    assert.notEqual(Number(cm), Number(meter) * 100, `${aufgabe.rechnung} ist gleich lang`);
  }
});

test("eine Runde stellt keine Aufgabe zweimal – auch keine Bildaufgabe", () => {
  for (const thema of THEMEN) {
    for (const stufe of STUFEN) {
      for (let seed = 1; seed <= 40; seed++) {
        const aufgaben = runde(thema.id, mulberry32(seed), stufe, RUNDENLAENGE);
        const kennungen = aufgaben.map((a) => JSON.stringify([a.frage, a.rechnung, a.loesung, a.bild?.svg]));
        assert.equal(
          new Set(kennungen).size,
          aufgaben.length,
          `${thema.id}/Stufe ${stufe}/Seed ${seed}: dieselbe Aufgabe kam doppelt`
        );
      }
    }
  }
});

/*
 * Die Rechengeschichten sollen abwechslungsreich sein. Vorher kannte Stufe 1
 * genau zwei Geschichten – beide ums Schenken – und ein Kind las immer
 * dasselbe. Der Test hält fest, dass keine Geschichte den Topf beherrscht.
 */
const neueNamen = new RegExp(`\\b(${NAMEN.join("|")})\\b`, "g");

test("Sachaufgaben erzählen viele verschiedene Geschichten", () => {
  for (const stufe of [1, 2, 3]) {
    const rng = mulberry32(2024 + stufe);
    const anfaenge = new Map();
    const N = 800;
    for (let i = 0; i < N; i++) {
      const aufgabe = GENERATOREN.sachaufgaben(rng, stufe);
      // Zahlen UND Namen raus – sonst zählte „Mia hat …“ gegen „Ben hat …“
      // schon als andere Geschichte, und der Test ließe zwei Situationen mit
      // wechselnden Vornamen als „vielfältig“ durchgehen.
      const geruest = aufgabe.frage
        .replace(/\d+/g, "#")
        .replace(neueNamen, "@")
        .split(/[.?]/)[0];
      anfaenge.set(geruest, (anfaenge.get(geruest) ?? 0) + 1);
    }
    assert.ok(anfaenge.size >= 24, `Stufe ${stufe}: nur ${anfaenge.size} verschiedene Geschichten`);
    const haeufigste = Math.max(...anfaenge.values());
    assert.ok(
      haeufigste / N <= 0.2,
      `Stufe ${stufe}: eine Geschichte macht ${((100 * haeufigste) / N).toFixed(0)} % aus`
    );
  }
});

test("in den Sachaufgaben geht es nicht dauernd ums Schenken", () => {
  for (const stufe of [1, 2, 3]) {
    const rng = mulberry32(77 + stufe);
    let schenken = 0;
    const N = 600;
    for (let i = 0; i < N; i++) {
      if (/schenk/i.test(GENERATOREN.sachaufgaben(rng, stufe).frage)) schenken++;
    }
    assert.ok(schenken / N <= 0.15, `Stufe ${stufe}: ${((100 * schenken) / N).toFixed(0)} % drehen sich ums Schenken`);
  }
});

test("bei „mehr als“ bleibt der Unterschied kleiner als die Ausgangszahl", () => {
  const rng = mulberry32(555);
  for (let i = 0; i < 800; i++) {
    for (const stufe of [1, 2]) {
      const aufgabe = GENERATOREN.sachaufgaben(rng, stufe);
      if (aufgabe.typ !== "sach/mehr-als") continue;
      const [a, b] = aufgabe.erklaerung.match(/\d+/g).map(Number);
      assert.ok(b <= a, `„${aufgabe.frage}“ – ${b} mehr als ${a} ergibt keine sinnvolle Geschichte`);
    }
  }
});

test("der Wesfall eines Namens ist deutsch richtig", () => {
  // Namen auf s, ß, x, z bekommen nur einen Apostroph.
  assert.equal(wesfall("Mia"), "Mias");
  assert.equal(wesfall("Noah"), "Noahs");
  assert.equal(wesfall("Jonas"), "Jonas’");
  assert.equal(wesfall("Elias"), "Elias’");
  assert.equal(wesfall("Max"), "Max’");
  assert.equal(wesfall("Fritz"), "Fritz’");

  // Und in den Aufgaben taucht kein doppeltes s auf.
  const rng = mulberry32(4242);
  for (let i = 0; i < 1500; i++) {
    for (const stufe of [1, 2, 3]) {
      const frage = GENERATOREN.sachaufgaben(rng, stufe).frage;
      for (const name of NAMEN) {
        assert.ok(!frage.includes(`${name}s `) || !name.endsWith("s"), `falscher Wesfall in „${frage}“`);
      }
    }
  }
});

/*
 * Die Hilfsaufgabe ist seit 1.13.0 freiwillig: Die eigentliche Aufgabe steht
 * VORNE, der Bonus ist ein Angebot. Damit das aufgeht, muss die Hauptfrage
 * für sich allein verständlich sein – Formulierungen wie „Und jetzt die große
 * Aufgabe“ setzten voraus, dass vorher schon etwas dran war.
 */
test("Aufgaben mit Hilfsaufgabe sind auch ohne sie verständlich", () => {
  const rueckbezug = /^(und |dann |danach |jetzt )|und jetzt|wie eben|von eben/i;
  for (const t of THEMEN) {
    for (const stufe of [1, 2, 3]) {
      const rng = mulberry32(600 + stufe);
      for (let i = 0; i < 400; i++) {
        const aufgabe = GENERATOREN[t.id](rng, stufe);
        if (!aufgabe.vorstufe) continue;
        assert.ok(
          !rueckbezug.test(aufgabe.frage.trim()),
          `${t.id} Stufe ${stufe}: „${aufgabe.frage}“ bezieht sich auf einen Schritt davor`
        );
        // Ohne sichtbare Rechnung stünde da nur eine Frage ohne Zahlen.
        assert.ok(
          aufgabe.rechnung || aufgabe.bild,
          `${t.id} Stufe ${stufe}: „${aufgabe.frage}“ zeigt die Aufgabe selbst nicht`
        );
        // Und die Hilfsaufgabe muss eine eigene, sichtbare Rechnung haben.
        assert.ok(
          aufgabe.vorstufe.rechnung && /\d/.test(aufgabe.vorstufe.rechnung),
          `${t.id} Stufe ${stufe}: Hilfsaufgabe ohne Rechnung`
        );
      }
    }
  }
});

/*
 * Eine Umkehraufgabe ist erst dann eine, wenn in der Rechnung eine LÜCKE
 * steht. Vorher zeigten die Familien-Umkehraufgaben ein glattes `13 − 5 =` –
 * das rechnet ein Kind direkt aus, ohne je umzukehren. Beim Einmaleins war es
 * von Anfang an richtig (`? · 5 = 30`); diese Prüfung hält beides zusammen.
 */
test("jede Umkehraufgabe hat eine Lücke, die nur durch Umkehren zu füllen ist", () => {
  const gefunden = new Set();

  for (const stufe of STUFEN) {
    for (let i = 0; i < 400; i++) {
      const rng = mulberry32(i * 31 + stufe);
      for (const thema of ["familien", "einmaleins", "geteilt"]) {
        const aufgabe = GENERATOREN[thema](rng, stufe);
        if (!aufgabe.typ.includes("umkehr")) continue;
        gefunden.add(aufgabe.typ);

        const kontext = `${aufgabe.typ} (Stufe ${stufe}): ${aufgabe.rechnung}`;
        assert.ok(aufgabe.rechnung?.includes("?"), `${kontext}: keine Lücke`);
        // Ohne rechte Seite wäre die Lücke gar nicht bestimmt.
        assert.match(aufgabe.rechnung, /=\s*\d+$/, `${kontext}: das Ergebnis fehlt`);

        // Die Lösung eingesetzt muss die Rechnung wahr machen.
        const gefuellt = aufgabe.rechnung.replace("?", aufgabe.loesung);
        const teile = gefuellt.match(/^(\d+)\s*([+−·:])\s*(\d+)\s*=\s*(\d+)$/);
        assert.ok(teile, `${kontext}: unerwartete Form ${gefuellt}`);
        const [, x, zeichen, y, ergebnis] = teile;
        const gerechnet =
          zeichen === "+" ? Number(x) + Number(y)
          : zeichen === "−" ? Number(x) - Number(y)
          : zeichen === ":" ? Number(x) / Number(y)
          : Number(x) * Number(y);
        assert.equal(gerechnet, Number(ergebnis), `${kontext}: Lösung passt nicht in die Lücke`);
      }
    }
  }

  // Alle drei Umkehr-Arten müssen dabei gewesen sein, sonst prüft der Test zu wenig.
  assert.deepEqual(
    [...gefunden].sort(),
    ["einmaleins/umkehr", "familien/umkehr-minus", "familien/umkehr-plus", "geteilt/umkehr"],
    "nicht jede Umkehr-Art wurde erzeugt"
  );
});

/*
 * Die Hilfsaufgabe einer Umkehraufgabe ist die Umkehrung selbst – und sie muss
 * die Lücke tatsächlich ausrechnen. Stimmte sie nicht mit der Lösung überein,
 * führte der Bonus das Kind in die Irre.
 */
test("die Hilfsaufgabe der Umkehraufgabe rechnet genau die Lücke aus", () => {
  let geprueft = 0;

  for (const stufe of STUFEN) {
    for (let i = 0; i < 400; i++) {
      const aufgabe = GENERATOREN.familien(mulberry32(i * 17 + stufe), stufe);
      if (!aufgabe.typ.includes("umkehr")) continue;
      const kontext = `${aufgabe.typ}: ${aufgabe.rechnung}`;
      assert.ok(aufgabe.vorstufe, `${kontext}: keine Hilfsaufgabe`);

      // Die Hilfsaufgabe muss stimmen …
      const teile = `${aufgabe.vorstufe.rechnung} ${aufgabe.vorstufe.loesung}`.match(
        /^(\d+)\s*([+−])\s*(\d+)\s*=\s*(\d+)$/
      );
      assert.ok(teile, `${kontext}: Hilfsaufgabe hat keine ganze Form`);
      const [, x, zeichen, y, ergebnis] = teile;
      const gerechnet = zeichen === "+" ? Number(x) + Number(y) : Number(x) - Number(y);
      assert.equal(gerechnet, Number(ergebnis), `${kontext}: Hilfsaufgabe rechnet falsch`);

      // … und sie muss die Gegenrechnung sein, nicht dieselbe Rechenart.
      const hauptZeichen = aufgabe.rechnung.includes("+") ? "+" : "−";
      assert.notEqual(zeichen, hauptZeichen, `${kontext}: Hilfsaufgabe kehrt nichts um`);

      // Ihr Ergebnis ist die gesuchte Zahl.
      assert.equal(aufgabe.vorstufe.loesung, aufgabe.loesung, `${kontext}: Hilfsaufgabe füllt die Lücke nicht`);
      geprueft++;
    }
  }

  assert.ok(geprueft > 50, `zu wenige Umkehraufgaben geprüft: ${geprueft}`);
});

/*
 * Rechendreieck: drei Zahlen innen, an jeder Seite außen die Summe der beiden
 * Innenzahlen, die dort liegen. Aus dem Arbeitsheft übernommen.
 *
 * Nachgerechnet wird aus dem BILD heraus, nicht aus den Zwischenwerten des
 * Generators – sonst prüfte der Test nur, dass der Generator mit sich selbst
 * einig ist. Die Figur gibt für jedes der sechs Felder ein Textelement aus,
 * in fester Reihenfolge: außen links, außen rechts, außen unten, dann innen
 * oben, innen links, innen rechts.
 */
test("im Rechendreieck ist jede Außenzahl die Summe ihrer beiden Innenzahlen", () => {
  const arten = new Set();
  let geprueft = 0;

  for (const stufe of STUFEN) {
    for (let i = 0; i < 500; i++) {
      const aufgabe = GENERATOREN.mauern(mulberry32(i * 23 + stufe), stufe);
      if (!aufgabe.typ.includes("dreieck")) continue;
      arten.add(aufgabe.typ);
      const kontext = `${aufgabe.typ} (Stufe ${stufe})`;

      const felder = [...aufgabe.bild.svg.matchAll(/<text[^>]*>([^<]*)<\/text>/g)].map((t) => t[1]);
      assert.equal(felder.length, 6, `${kontext}: das Bild hat nicht sechs Felder`);
      assert.equal(
        felder.filter((t) => t === "?").length,
        1,
        `${kontext}: nicht genau ein Fragezeichen`
      );

      // Die Lücke mit der Lösung füllen, leere Felder bleiben unbekannt.
      const wert = felder.map((t) =>
        t === "?" ? Number(aufgabe.loesung) : t === "" ? null : Number(t)
      );
      assert.ok(
        wert.every((z) => z === null || Number.isInteger(z)),
        `${kontext}: unlesbares Feld in ${JSON.stringify(felder)}`
      );

      // Feldnummern: 0 außen links, 1 außen rechts, 2 außen unten,
      // 3 innen oben, 4 innen links, 5 innen rechts.
      const seiten = [
        { name: "links", felder: [0, 3, 4] },
        { name: "rechts", felder: [1, 3, 5] },
        { name: "unten", felder: [2, 4, 5] },
      ];
      const luecke = felder.indexOf("?");

      /*
       * Zwei Dinge auf einmal: Jede vollständige Seite muss aufgehen, UND
       * mindestens eine vollständige Seite muss die Lücke selbst enthalten.
       * Ohne die zweite Bedingung ginge eine unlösbare Aufgabe durch – etwa
       * wenn beide Außenzahlen neben der Lücke fehlen und nur die
       * gegenüberliegende Seite dasteht, die von der Lücke gar nichts weiß.
       */
      let erreichbar = 0;
      for (const { name, felder: [a, x, y] } of seiten) {
        if (wert[a] === null || wert[x] === null || wert[y] === null) continue;
        assert.equal(
          wert[a],
          wert[x] + wert[y],
          `${kontext}: Seite ${name} stimmt nicht (${wert[x]} + ${wert[y]} ≠ ${wert[a]})`
        );
        if ([a, x, y].includes(luecke)) erreichbar++;
      }
      assert.ok(erreichbar >= 1, `${kontext}: keine vollständige Seite führt zur Lücke – unlösbar`);

      // Innen darf nie eine 0 oder negative Zahl herauskommen.
      for (const feld of [3, 4, 5]) {
        const z = wert[feld];
        if (z !== null) assert.ok(z >= 1, `${kontext}: Innenzahl ${z} ist für Klasse 2 unbrauchbar`);
      }

      geprueft++;
    }
  }

  assert.deepEqual(
    [...arten].sort(),
    ["mauern/dreieck-aussen", "mauern/dreieck-innen"],
    "nicht beide Dreiecks-Arten wurden erzeugt"
  );
  assert.ok(geprueft > 100, `zu wenige Dreiecke geprüft: ${geprueft}`);
});

/*
 * Beziehungsketten („Jannik hat 3 € weniger als Anna.") – aus dem Arbeitsheft.
 *
 * Der Test LIEST die Aufgabe und löst sie selbst, so wie ein Kind es täte:
 * beim einzigen genannten Betrag anfangen und sich weiterhangeln. Damit prüft
 * er die Aufgabe, nicht die Buchführung des Generators.
 */
test("die Geld-Beziehungskette lässt sich aus ihrem eigenen Text lösen", () => {
  let geprueft = 0;
  let gemischt = 0;

  for (const stufe of STUFEN) {
    for (let i = 0; i < 600; i++) {
      const aufgabe = GENERATOREN.geld(mulberry32(i * 41 + stufe), stufe);
      if (aufgabe.typ !== "geld/beziehungskette") continue;
      const kontext = `Stufe ${stufe}: ${JSON.stringify(aufgabe.frage)}`;

      const zeilen = aufgabe.frage.split("\n");
      const anker = zeilen[0].match(/^(\w+) hat (\d+) €\.$/);
      assert.ok(anker, `${kontext}: kein Startbetrag in der ersten Zeile`);
      const ziel = zeilen[zeilen.length - 1].match(/^Wie viel Geld hat (\w+)\?$/);
      assert.ok(ziel, `${kontext}: keine Frage in der letzten Zeile`);

      const aussagen = zeilen.slice(1, -1).map((z) => {
        const t = z.match(/^(\w+) hat (\d+) € (mehr|weniger) als (\w+)\.$/);
        assert.ok(t, `${kontext}: unverständlicher Satz „${z}“`);
        return { wer: t[1], betrag: Number(t[2]), richtung: t[3], bezug: t[4] };
      });
      assert.ok(aussagen.length >= 2, `${kontext}: zu wenige Sätze`);

      // Auflösen: immer den Satz nehmen, dessen Bezugsperson schon bekannt ist.
      const bekannt = new Map([[anker[1], Number(anker[2])]]);
      const offen = [...aussagen];
      let runden = 0;
      while (offen.length > 0 && runden++ < 20) {
        const k = offen.findIndex((a) => bekannt.has(a.bezug));
        if (k === -1) break;
        const a = offen.splice(k, 1)[0];
        assert.ok(!bekannt.has(a.wer), `${kontext}: ${a.wer} kommt doppelt vor`);
        const von = bekannt.get(a.bezug);
        bekannt.set(a.wer, a.richtung === "mehr" ? von + a.betrag : von - a.betrag);
      }
      assert.equal(offen.length, 0, `${kontext}: die Kette reißt ab, Aufgabe unlösbar`);

      // Selbst ausgerechnet – stimmt es mit der hinterlegten Lösung überein?
      assert.equal(
        String(bekannt.get(ziel[1])),
        aufgabe.loesung,
        `${kontext}: selbst gerechnet ${bekannt.get(ziel[1])}, hinterlegt ${aufgabe.loesung}`
      );

      // Kein Kind hat Schulden, und der Zahlenraum der 2. Klasse hält.
      for (const [wer, wert] of bekannt) {
        assert.ok(wert >= 1 && wert <= 100, `${kontext}: ${wer} hat ${wert} €`);
      }

      // Standen die Sätze nicht in Rechenreihenfolge? Genau das ist die Hürde.
      const inReihenfolge = aussagen.every((a, k) => (k === 0 ? a.bezug === anker[1] : a.bezug === aussagen[k - 1].wer));
      if (!inReihenfolge) gemischt++;

      geprueft++;
    }
  }

  assert.ok(geprueft > 80, `zu wenige Beziehungsketten geprüft: ${geprueft}`);
  assert.ok(gemischt > 20, `die Sätze stehen fast immer schon in Rechenreihenfolge (${gemischt}) – die Aufgabe hat dann keine Hürde`);
});

/**
 * Die Zahl der Auswahlmöglichkeiten darf innerhalb eines Aufgabentyps nicht
 * schwanken.
 *
 * Schwankt sie, ist ein Ablenker mit der Lösung zusammengefallen und still
 * weggefallen – das Kind rät dann mal gegen drei, mal gegen vier
 * Möglichkeiten. Genau das war bei „Wie spät ist es in 20 Minuten?“ der Fall:
 * Ohne Stundenübertrag WAR der Ablenker „Stunde vergessen“ die richtige
 * Antwort, und in gut drei Vierteln aller Ziehungen blieben nur drei
 * Möglichkeiten übrig.
 */
test("die Zahl der Auswahlmöglichkeiten schwankt innerhalb eines Typs nicht", () => {
  const gesehen = new Map();
  for (const eintrag of THEMEN) {
    for (const stufe of STUFEN) {
      const rng = mulberry32(4242 + stufe);
      for (let i = 0; i < 400; i++) {
        const aufgabe = GENERATOREN[eintrag.id](rng, stufe);
        if (aufgabe.antwortfeld.art !== "auswahl") continue;
        // Der Schlüssel enthält die Stufe: Ein Typ DARF auf Stufe 3 mehr
        // Möglichkeiten anbieten als auf Stufe 1.
        const schluessel = `${aufgabe.typ} (Stufe ${stufe})`;
        if (!gesehen.has(schluessel)) gesehen.set(schluessel, new Map());
        const zaehler = gesehen.get(schluessel);
        const anzahl = aufgabe.antwortfeld.optionen.length;
        zaehler.set(anzahl, (zaehler.get(anzahl) ?? 0) + 1);
      }
    }
  }

  assert.ok(gesehen.size > 0, "keine einzige Auswahlaufgabe gezogen – der Test misst nichts");
  for (const [schluessel, zaehler] of gesehen) {
    const verteilung = [...zaehler]
      .sort((a, b) => a[0] - b[0])
      .map(([anzahl, wie_oft]) => `${anzahl} Möglichkeiten: ${wie_oft}×`)
      .join(", ");
    assert.equal(
      zaehler.size,
      1,
      `${schluessel} bietet mal so, mal so viele Möglichkeiten (${verteilung}) – ` +
        "da fällt ein Ablenker mit der Lösung zusammen"
    );
  }
});

/**
 * Jede Stufe braucht deutlich mehr verschiedene Aufgaben als eine Runde lang
 * ist – sonst nützt das Gedächtnis nichts.
 *
 * Die App merkt sich die Schlüssel der letzten 60 gestellten Aufgaben und geht
 * ihnen bei der nächsten Ziehung aus dem Weg. Ist der Vorrat einer Stufe
 * kleiner als dieses Gedächtnis, steht dort irgendwann ALLES auf der Merkliste
 * und der Wunsch läuft dauerhaft ins Leere: Ein Kind bekommt immer wieder
 * genau dieselben Aufgaben.
 *
 * Gemessen wird mit demselben Schlüssel, mit dem auch die App entscheidet
 * (`aufgabenSchluessel`) – ein Test mit eigener Kennung misst sonst etwas
 * anderes als die Anwendung.
 */
test("jede Stufe hat mehr verschiedene Aufgaben als eine Runde lang ist", () => {
  // Untergrenze: drei volle Runden. Mehr wäre wünschenswert (siehe ROADMAP),
  // weniger macht die Stufe nachweislich eintönig.
  const MINDESTENS = 3 * RUNDENLAENGE;
  const knapp = [];

  for (const eintrag of THEMEN) {
    for (const stufe of STUFEN) {
      const rng = mulberry32(20260822 + stufe);
      const menge = new Set();
      for (let i = 0; i < 4000; i++) {
        menge.add(aufgabenSchluessel(GENERATOREN[eintrag.id](rng, stufe)));
      }
      if (menge.size < MINDESTENS) knapp.push(`${eintrag.id} Stufe ${stufe}: nur ${menge.size}`);
    }
  }

  assert.deepEqual(
    knapp,
    [],
    `zu wenig verschiedene Aufgaben (mindestens ${MINDESTENS} nötig):\n  ${knapp.join("\n  ")}`
  );
});

/**
 * Die Eingabeart darf die Antwort nicht verraten.
 *
 * Bei der Rechentabelle war genau das der Fall: Ein unlösbares Feld
 * („20 − 3“ geht, „3 − 20“ nicht) wurde IMMER über Auswahlknöpfe beantwortet,
 * ein lösbares IMMER über die Zahlentastatur. Wer Knöpfe sah, wusste ohne zu
 * rechnen, dass „Das geht nicht“ richtig ist – und der Kniff, den diese
 * Heftseite übt, wurde nie geübt.
 */
test("bei der Rechentabelle verrät die Auswahl nicht schon die Antwort", () => {
  let gehtNicht = 0;
  let gehtDoch = 0;

  for (let i = 0; i < 20000; i++) {
    const rng = mulberry32(31337 + i);
    const aufgabe = GENERATOREN.plusminus(rng, 3);
    if (!aufgabe.typ.startsWith("plusminus/tabelle")) continue;
    if (aufgabe.antwortfeld.art !== "auswahl") continue;
    if (aufgabe.loesung === "Das geht nicht") gehtNicht++;
    else gehtDoch++;
  }

  assert.ok(gehtNicht + gehtDoch > 50, "zu wenige Auswahl-Tabellen gezogen – der Test misst nichts");
  assert.ok(
    gehtDoch > 0,
    "jede Auswahl-Tabelle ist unlösbar – dann sagt schon die Eingabeart die Antwort"
  );
  assert.ok(
    gehtNicht > 0,
    "„Das geht nicht“ kommt nie vor – der Kniff dieser Heftseite wird nie geübt"
  );
  const anteil = gehtNicht / (gehtNicht + gehtDoch);
  assert.ok(
    anteil > 0.1 && anteil < 0.9,
    `„Das geht nicht“ ist in ${Math.round(anteil * 100)} % der Fälle richtig – das ist erratbar`
  );
});
