import "./setup.js";
import test from "node:test";
import assert from "node:assert/strict";

import { mulberry32 } from "../js/random.js";
import { baueMauer } from "../js/tasks/mauern.js";
import { GENERATOREN } from "../js/tasks/index.js";

test("baueMauer stapelt jede Reihe als Summe der Reihe darunter", () => {
  assert.deepEqual(baueMauer([3, 4]), [[3, 4], [7]]);
  assert.deepEqual(baueMauer([1, 2, 5]), [
    [1, 2, 5],
    [3, 7],
    [10],
  ]);
  assert.deepEqual(baueMauer([9]), [[9]]);
});

test("in jeder Zahlenmauer fehlt genau ein Stein", () => {
  for (const stufe of [1, 2, 3]) {
    const rng = mulberry32(808 + stufe);
    let mauern = 0;
    for (let i = 0; i < 400; i++) {
      const aufgabe = GENERATOREN.mauern(rng, stufe);
      // Nur die gezeichneten Mauern – die ausfüllbaren haben absichtlich
      // mehrere Lücken und gar kein Bild.
      if (!aufgabe.typ.startsWith("mauern/mauer") || !aufgabe.bild) continue;
      mauern++;
      const luecken = aufgabe.bild.svg.match(/>\?<\/text>/g) ?? [];
      assert.equal(luecken.length, 1, `Stufe ${stufe}: ${luecken.length} Lücken statt einer`);
    }
    assert.ok(mauern > 50, `Stufe ${stufe}: zu wenige Mauern gezogen`);
  }
});

test("die Zahlenmauer bleibt im Zahlenraum bis 100", () => {
  for (const stufe of [1, 2, 3]) {
    const rng = mulberry32(31 + stufe);
    for (let i = 0; i < 400; i++) {
      const aufgabe = GENERATOREN.mauern(rng, stufe);
      if (!aufgabe.typ.startsWith("mauern/mauer") || !aufgabe.bild) continue;
      const zahlen = [...aufgabe.bild.svg.matchAll(/font-size="22">(\d+)</g)].map((t) => Number(t[1]));
      for (const zahl of zahlen) {
        assert.ok(zahl <= 100, `Stufe ${stufe}: Stein ${zahl} liegt über 100`);
      }
      assert.ok(Number(aufgabe.loesung) <= 100);
    }
  }
});

test("im Rechenrad ergeben außen und innen immer die Zahl der Mitte", () => {
  for (const stufe of [1, 2, 3]) {
    const rng = mulberry32(4242 + stufe);
    let raeder = 0;
    for (let i = 0; i < 400; i++) {
      const aufgabe = GENERATOREN.mauern(rng, stufe);
      if (aufgabe.typ !== "mauern/rechenrad") continue;
      raeder++;
      const mitte = Number(aufgabe.frage.match(/immer (\d+)\./)[1]);
      const zahlen = [...aufgabe.bild.svg.matchAll(/font-size="20">([\d?]+)</g)].map((t) => t[1]);
      // Die Beschriftungen kommen paarweise: außen, dann innen.
      assert.equal(zahlen.length, 12, "ein Rechenrad hat sechs Felder mit je zwei Zahlen");
      let luecken = 0;
      for (let feld = 0; feld < 6; feld++) {
        const aussen = Number(zahlen[feld * 2]);
        const innen = zahlen[feld * 2 + 1];
        if (innen === "?") {
          luecken++;
          assert.equal(aussen + Number(aufgabe.loesung), mitte, "die Lösung passt nicht zur Mitte");
        } else {
          assert.equal(aussen + Number(innen), mitte, `${aussen} + ${innen} ist nicht ${mitte}`);
        }
      }
      assert.equal(luecken, 1);
    }
    assert.ok(raeder > 30, `Stufe ${stufe}: zu wenige Räder gezogen`);
  }
});

test("die Hilfsaufgabe der Vorstufe stimmt selbst", () => {
  for (const id of ["analogie", "familien"]) {
    for (const stufe of [1, 2, 3]) {
      const rng = mulberry32(1234 + stufe);
      let vorstufen = 0;
      for (let i = 0; i < 400; i++) {
        const aufgabe = GENERATOREN[id](rng, stufe);
        if (!aufgabe.vorstufe) continue;
        vorstufen++;
        const treffer = aufgabe.vorstufe.rechnung.match(/^(\d+) ([+−]) (\d+) =$/);
        assert.ok(treffer, `unerwartete Hilfsaufgabe: ${aufgabe.vorstufe.rechnung}`);
        const [, a, zeichen, b] = treffer;
        const erwartet = zeichen === "+" ? Number(a) + Number(b) : Number(a) - Number(b);
        assert.equal(
          Number(aufgabe.vorstufe.loesung),
          erwartet,
          `falsche Hilfsaufgabe: ${aufgabe.vorstufe.rechnung} ${aufgabe.vorstufe.loesung}`
        );
        assert.ok(erwartet >= 0, "eine Hilfsaufgabe darf nie negativ werden");
        assert.ok(aufgabe.vorstufe.frage.length > 5);
      }
      assert.ok(vorstufen > 30, `${id}/Stufe ${stufe}: kaum Hilfsaufgaben gezogen`);
    }
  }
});

test("Aufgabenfamilien nennen nur stimmige Ausgangsaufgaben", () => {
  for (const stufe of [1, 2, 3]) {
    const rng = mulberry32(77 + stufe);
    for (let i = 0; i < 400; i++) {
      const aufgabe = GENERATOREN.familien(rng, stufe);
      for (const treffer of aufgabe.frage.matchAll(/(\d+) ([+−]) (\d+) = (\d+)/g)) {
        const [, a, zeichen, b, ergebnis] = treffer;
        const erwartet = zeichen === "+" ? Number(a) + Number(b) : Number(a) - Number(b);
        assert.equal(Number(ergebnis), erwartet, `falsche Angabe: ${aufgabe.frage}`);
      }
      if (aufgabe.antwortfeld.art === "auswahl") {
        for (const option of aufgabe.antwortfeld.optionen) {
          const treffer = option.match(/^(\d+) \+ (\d+) = (\d+)$/) ?? option.match(/^(\d+) − (\d+) = (\d+)$/);
          if (!treffer) continue;
          const zeichen = option.includes("+") ? 1 : -1;
          const erwartet = Number(treffer[1]) + zeichen * Number(treffer[2]);
          assert.equal(Number(treffer[3]), erwartet, `falsche Auswahl: ${option}`);
        }
      }
    }
  }
});

test("im Differenz-Rad ergibt Mitte plus innen die Zahl außen", () => {
  for (const stufe of [1, 2, 3]) {
    const rng = mulberry32(909 + stufe);
    let raeder = 0;
    for (let i = 0; i < 600; i++) {
      const aufgabe = GENERATOREN.mauern(rng, stufe);
      if (aufgabe.typ !== "mauern/rechenrad-differenz") continue;
      raeder++;
      const mitte = Number(aufgabe.frage.match(/Zur (\d+) in der Mitte/)[1]);
      const zahlen = [...aufgabe.bild.svg.matchAll(/font-size="20">([\d?]+)</g)].map((t) => t[1]);
      assert.equal(zahlen.length, 12);
      let luecken = 0;
      for (let feld = 0; feld < 6; feld++) {
        const aussen = Number(zahlen[feld * 2]);
        const innen = zahlen[feld * 2 + 1];
        if (innen === "?") {
          luecken++;
          assert.equal(mitte + Number(aufgabe.loesung), aussen);
        } else {
          assert.equal(mitte + Number(innen), aussen, `${mitte} + ${innen} ist nicht ${aussen}`);
        }
        assert.ok(aussen <= 100, "das Rad verlässt den Zahlenraum");
      }
      assert.equal(luecken, 1);
    }
    assert.ok(raeder > 20, `Stufe ${stufe}: zu wenige Differenz-Räder gezogen`);
  }
});

test("die Rechentabelle fragt immer ein einziges, passendes Feld", () => {
  const rng = mulberry32(6161);
  let tabellen = 0;
  let unloesbare = 0;
  for (let i = 0; i < 1200; i++) {
    const aufgabe = GENERATOREN.plusminus(rng, 3);
    if (!aufgabe.typ.startsWith("plusminus/tabelle")) continue;
    tabellen++;

    const luecken = aufgabe.bild.svg.match(/>\?</g) ?? [];
    assert.equal(luecken.length, 1, "es darf genau ein Feld markiert sein");

    assert.equal(aufgabe.rechnung, undefined, "die Rechnung darf nicht danebenstehen – Ablesen ist die Übung");
    const [, zeile, zeichen, spalte] = aufgabe.bild.beschriftung.match(/für (\d+) ([+−]) (\d+)$/);
    const kopfzahlen = [...aufgabe.bild.svg.matchAll(/font-size="20">(\d+)</g)].map((t) => Number(t[1]));
    assert.ok(kopfzahlen.includes(Number(zeile)), `${zeile} steht nicht in der Tabelle`);
    assert.ok(kopfzahlen.includes(Number(spalte)), `${spalte} steht nicht in der Tabelle`);

    if (aufgabe.loesung === "Das geht nicht") {
      unloesbare++;
      assert.equal(zeichen, "−");
      assert.ok(Number(zeile) < Number(spalte), "„geht nicht“ nur, wenn die Zeile kleiner ist");
    } else {
      const erwartet = zeichen === "+" ? Number(zeile) + Number(spalte) : Number(zeile) - Number(spalte);
      assert.equal(Number(aufgabe.loesung), erwartet);
      assert.ok(erwartet >= 0, "eine lösbare Tabellenaufgabe wird nie negativ");
    }
  }
  assert.ok(tabellen > 100, "zu wenige Tabellen gezogen");
  assert.ok(unloesbare > 0, "der Fall „Das geht nicht“ kommt gar nicht vor");
});

test("Ergänzen führt immer nur bis zum nächsten Zehner", () => {
  for (const stufe of [1, 2]) {
    const rng = mulberry32(606 + stufe);
    let gefunden = 0;
    for (let i = 0; i < 800; i++) {
      const aufgabe = GENERATOREN.plusminus(rng, stufe);
      if (aufgabe.typ !== "plusminus/ergaenzen") continue;
      gefunden++;
      const [, start, ziel] = aufgabe.rechnung.match(/^(\d+) \+ \? = (\d+)$/);
      const loesung = Number(aufgabe.loesung);
      assert.equal(Number(start) + loesung, Number(ziel));
      assert.equal(Number(ziel) % 10, 0, "das Ziel ist immer ein voller Zehner");
      assert.ok(
        loesung >= 1 && loesung <= 9,
        `Stufe ${stufe}: ${aufgabe.rechnung} verlangt ${loesung} – das ist mehr als ein Zehnerschritt`
      );
    }
    assert.ok(gefunden > 40, `Stufe ${stufe}: zu wenige Ergänzungsaufgaben gezogen`);
  }
});

/** Liest die Steine einer Zahlenmauer aus dem SVG, von unten nach oben. */
function reihenAus(svg) {
  const felder = [...svg.matchAll(/font-size="22">([\d?]+)</g)].map((t) => t[1]);
  let unten = 0;
  while (((unten + 1) * (unten + 2)) / 2 <= felder.length) unten++;
  const reihen = [];
  let k = 0;
  for (let laenge = unten; laenge >= 1; laenge--) {
    reihen.push(felder.slice(k, k + laenge));
    k += laenge;
  }
  return reihen;
}

test("die Mauergrößen wachsen mit der Stufe – bis zu zehn Kästchen", () => {
  const erwartet = { 1: new Set([3]), 2: new Set([6, 10]), 3: new Set([10]) };
  for (const stufe of [1, 2, 3]) {
    const rng = mulberry32(1200 + stufe);
    const gesehen = new Map();
    for (let i = 0; i < 2000; i++) {
      const aufgabe = GENERATOREN.mauern(rng, stufe);
      if (!aufgabe.typ.startsWith("mauern/mauer")) continue;
      // Gezeichnete Mauer oder ausfüllbare – beide zählen für die Größe.
      const steine = aufgabe.bild
        ? reihenAus(aufgabe.bild.svg).flat().length
        : aufgabe.antwortfeld.reihen.flat().length;
      gesehen.set(steine, (gesehen.get(steine) ?? 0) + 1);
    }
    assert.deepEqual(
      new Set(gesehen.keys()),
      erwartet[stufe],
      `Stufe ${stufe}: Größen ${[...gesehen.keys()].join(", ")}`
    );
    // Keine der vorkommenden Größen darf zur Randerscheinung werden.
    const gesamt = [...gesehen.values()].reduce((a, b) => a + b, 0);
    for (const [steine, anzahl] of gesehen) {
      assert.ok(anzahl / gesamt >= 0.1, `Stufe ${stufe}: ${steine} Kästchen nur ${anzahl}/${gesamt}`);
    }
  }
});

/*
 * Die tragende Eigenschaft jeder Zahlenmauer: Der fehlende Stein muss sich aus
 * den SICHTBAREN Nachbarn ausrechnen lassen – entweder aus den beiden darunter
 * oder aus dem darüber minus dem Nachbarn. Ohne das wäre die Aufgabe geraten.
 */
test("der fehlende Stein lässt sich immer eindeutig herleiten", () => {
  for (const stufe of [1, 2, 3]) {
    const rng = mulberry32(3300 + stufe);
    let geprueft = 0;
    for (let i = 0; i < 1500; i++) {
      const aufgabe = GENERATOREN.mauern(rng, stufe);
      if (!aufgabe.typ.startsWith("mauern/mauer") || !aufgabe.bild) continue;
      const reihen = reihenAus(aufgabe.bild.svg);
      geprueft++;

      let ebene = -1;
      let spalte = -1;
      reihen.forEach((reihe, e) =>
        reihe.forEach((wert, s) => {
          if (wert === "?") {
            ebene = e;
            spalte = s;
          }
        })
      );
      assert.ok(ebene >= 0, "keine Lücke gefunden");

      const unten = reihen[ebene - 1];
      const oben = reihen[ebene + 1];
      let hergeleitet = null;
      if (unten) {
        // Aus den beiden Steinen darunter.
        hergeleitet = Number(unten[spalte]) + Number(unten[spalte + 1]);
      } else if (oben) {
        // Aus dem Stein darüber minus dem Nachbarn in derselben Reihe.
        if (spalte > 0) hergeleitet = Number(oben[spalte - 1]) - Number(reihen[ebene][spalte - 1]);
        else hergeleitet = Number(oben[spalte]) - Number(reihen[ebene][spalte + 1]);
      }
      assert.equal(
        hergeleitet,
        Number(aufgabe.loesung),
        `Stufe ${stufe}: ${reihen.map((r) => r.join(" ")).join(" | ")} – Lösung ${aufgabe.loesung}`
      );
    }
    assert.ok(geprueft > 200, `Stufe ${stufe}: nur ${geprueft} Mauern geprüft`);
  }
});

/*
 * Die ausfüllbare Mauer: Die Grundreihe steht da, alles darüber ist leer.
 * Damit ein Kind sie überhaupt lösen kann, muss sich jede Reihe aus der
 * darunter ergeben – und die Lösungen müssen in genau dieser Reihenfolge
 * stehen (unten nach oben, links nach rechts).
 */
test("die ausfüllbare Mauer lässt sich Reihe für Reihe ausrechnen", () => {
  let geprueft = 0;
  for (const stufe of [1, 2, 3]) {
    const rng = mulberry32(5100 + stufe);
    for (let i = 0; i < 2000; i++) {
      const aufgabe = GENERATOREN.mauern(rng, stufe);
      if (aufgabe.antwortfeld.art !== "mauer") continue;
      geprueft++;
      const reihen = aufgabe.antwortfeld.reihen;

      // Die Grundreihe ist vollständig, alles darüber leer.
      assert.ok(
        reihen[0].every((wert) => typeof wert === "number"),
        "die Grundreihe muss vollständig sein"
      );
      for (let e = 1; e < reihen.length; e++) {
        assert.ok(reihen[e].every((wert) => wert === null), `Reihe ${e} ist nicht leer`);
      }

      // Selbst hochrechnen und mit der Lösung vergleichen.
      const erwartet = [];
      let unten = reihen[0];
      while (unten.length > 1) {
        const oben = [];
        for (let s = 0; s < unten.length - 1; s++) oben.push(unten[s] + unten[s + 1]);
        erwartet.push(...oben);
        unten = oben;
      }
      assert.equal(aufgabe.loesung, erwartet.join(","), `falsche Lösungsfolge: ${aufgabe.loesung}`);
      assert.ok(erwartet.length >= 3, "eine ausfüllbare Mauer soll mehr als eine Zahl verlangen");
    }
  }
  assert.ok(geprueft > 300, `nur ${geprueft} ausfüllbare Mauern geprüft`);
});

test("ausfüllbare Mauern kommen auf den größeren Stufen wirklich vor", () => {
  for (const stufe of [2, 3]) {
    const rng = mulberry32(6100 + stufe);
    let mauern = 0;
    let ausfuellbar = 0;
    for (let i = 0; i < 2000; i++) {
      const aufgabe = GENERATOREN.mauern(rng, stufe);
      if (!aufgabe.typ.startsWith("mauern/mauer")) continue;
      mauern++;
      if (aufgabe.antwortfeld.art === "mauer") ausfuellbar++;
    }
    const anteil = ausfuellbar / mauern;
    assert.ok(anteil > 0.3 && anteil < 0.7, `Stufe ${stufe}: ${(100 * anteil).toFixed(0)} % ausfüllbar`);
  }
});
