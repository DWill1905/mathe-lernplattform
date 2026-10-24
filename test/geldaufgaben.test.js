import "./setup.js";
import test from "node:test";
import assert from "node:assert/strict";

import { mulberry32 } from "../js/random.js";
import { GENERATOREN } from "../js/tasks/index.js";
import { geldtabelle } from "../js/figures.js";

/**
 * Die Aufgabenformen der Geld-Heftseiten: „Geldtabelle – Geld legen“,
 * „Welche Münzen können es sein?“, „Immer 10 Euro“ und „Streiche durch, was
 * zu viel ist".
 *
 * Geprüft wird durchgehend aus dem ERGEBNIS: Die Geldtabelle wird aus ihrem
 * BILD zurückgelesen, die Münzgruppen werden aus den Bildkarten
 * zusammengezählt. Ein Test, der die Zwischenwerte des Generators nachrechnet,
 * würde nur belegen, dass der Generator mit sich selbst einig ist.
 */

const STUFEN = [1, 2, 3];

/* ------------------------------------------------------ Aus dem Bild lesen */

/** Alle Textelemente eines SVG mit Position und Klasse. */
function texte(svg) {
  return [...svg.matchAll(/<text x="([\d.]+)" y="([\d.]+)" class="([^"]+)"[^>]*>([^<]*)<\/text>/g)].map(
    (t) => ({ x: Number(t[1]), y: Number(t[2]), klasse: t[3], text: t[4] })
  );
}

/** „50 ct“ oder „5 €“ → Wert in Cent. */
function inCent(beschriftung) {
  const euro = beschriftung.match(/^([\d.]+) €$/);
  if (euro) return Math.round(Number(euro[1]) * 100);
  const cent = beschriftung.match(/^(\d+) ct$/);
  assert.ok(cent, `unlesbare Geldbeschriftung: „${beschriftung}“`);
  return Number(cent[1]);
}

/** Die Summe aller Münzen und Scheine, die in einem Bild liegen. */
function summeImBild(svg) {
  return texte(svg)
    .filter((t) => t.klasse === "fig-muenze-text")
    .reduce((summe, t) => summe + inCent(t.text), 0);
}

/**
 * Liest eine Geldtabelle aus ihrem Bild zurück: Betrag, Spaltensorten, das
 * markierte Feld und die bereits eingetragenen Zahlen.
 */
function lesGeldtabelle(svg) {
  const alle = texte(svg);
  const kopf = alle.filter((t) => t.y < 58);
  const zeile = alle.filter((t) => t.y > 58);

  const sorten = kopf
    .filter((t) => t.klasse === "fig-muenze-text")
    .sort((a, b) => a.x - b.x)
    .map((t) => inCent(t.text));

  const betragFeld = zeile.find((t) => t.x < 96);
  const felder = zeile
    .filter((t) => t.x >= 96)
    .sort((a, b) => a.x - b.x);

  return {
    betrag: inCent(betragFeld.text),
    sorten,
    markiert: felder.findIndex((f) => f.text === "?"),
    gezeigt: felder.map((f) => (f.text === "" || f.text === "?" ? null : Number(f.text))),
  };
}

/** Möglichst wenige Stücke – bei 1, 2, 5, 10, 20, 50 ist „größte zuerst“ optimal. */
function wenigsteStuecke(betrag, sorten) {
  let rest = betrag;
  return sorten.map((wert) => {
    const anzahl = Math.floor(rest / wert);
    rest -= anzahl * wert;
    return anzahl;
  });
}

/* ------------------------------------------------------------ Geldtabelle */

test("die Geldtabelle ist aus ihrem Bild heraus lösbar", () => {
  let geprueft = 0;

  for (const stufe of [2, 3]) {
    for (let i = 0; i < 1500; i++) {
      const rng = mulberry32(4711 + i * 13 + stufe);
      const aufgabe = GENERATOREN.geld(rng, stufe);
      if (aufgabe.typ !== "geld/geldtabelle") continue;
      geprueft++;

      const tabelle = lesGeldtabelle(aufgabe.bild.svg);
      const kontext = `${aufgabe.frage} (Stufe ${stufe})`;

      // Die Sorten stehen absteigend – sonst wäre „größte zuerst“ nicht ablesbar.
      assert.deepEqual(
        tabelle.sorten,
        [...tabelle.sorten].sort((a, b) => b - a),
        `${kontext}: die Spalten stehen nicht von groß nach klein`
      );
      assert.ok(tabelle.markiert >= 0, `${kontext}: kein markiertes Feld im Bild`);
      // Aus dem Bild nachgerechnet: genau das muss die Lösung sein.
      const erwartet = wenigsteStuecke(tabelle.betrag, tabelle.sorten);
      assert.equal(
        Number(aufgabe.loesung),
        erwartet[tabelle.markiert],
        `${kontext}: das markierte Feld müsste ${erwartet[tabelle.markiert]} sein`
      );

      // Schon eingetragene Felder müssen stimmen, sonst führt die Hilfe in die Irre.
      tabelle.gezeigt.forEach((wert, spalte) => {
        if (wert === null) return;
        assert.equal(wert, erwartet[spalte], `${kontext}: Spalte ${spalte} steht falsch in der Tabelle`);
      });

      // Und die gefragte Spalte darf nie schon ausgefüllt sein.
      assert.equal(tabelle.gezeigt[tabelle.markiert], null, `${kontext}: die Lösung steht schon da`);
    }
  }

  assert.ok(geprueft > 100, `nur ${geprueft} Geldtabellen gezogen – der Test misst zu wenig`);
});

/**
 * Genau EIN Feld trägt ein Fragezeichen – dieselbe Regel wie bei der
 * Rechentabelle. Zwei Fragezeichen, und ein Kind weiß nicht, welches gemeint
 * ist; keines, und die Aufgabe ist aus dem Bild nicht zu erkennen.
 */
test("in der Geldtabelle steht genau ein Fragezeichen", () => {
  const svg = geldtabelle("43 ct", [50, 20, 10, 5, 2, 1], [null, 2, null, null, null, null], 3);
  const felder = texte(svg).filter((t) => t.y > 58 && t.x >= 96);
  assert.equal(felder.filter((f) => f.text === "?").length, 1);
  assert.equal(felder.length, 6, "jede Zelle muss ein Textelement ausgeben, auch eine leere");
  // Die leeren Zellen sind leer – nicht etwa „null“ oder „undefined“.
  assert.deepEqual(
    felder.map((f) => f.text),
    ["", "2", "", "?", "", ""]
  );
});

/* ------------------------------------------------- Gruppen aus Bildkarten */

for (const [typ, stufe] of [
  ["geld/welche-muenzen", 1],
  ["geld/immer-zehn", 2],
]) {
  test(`bei „${typ}“ ergibt genau eine Bildkarte den gesuchten Betrag`, () => {
    let geprueft = 0;

    for (let i = 0; i < 2500; i++) {
      const rng = mulberry32(99 + i * 7 + stufe);
      const aufgabe = GENERATOREN.geld(rng, stufe);
      if (aufgabe.typ !== typ) continue;
      geprueft++;

      // Der gesuchte Betrag steht in der Frage – so, wie ein Kind ihn liest.
      const gesucht = inCent(aufgabe.frage.match(/genau ([\d.]+ (?:ct|€))\?/)[1]);
      const treffer = aufgabe.antwortfeld.optionen.filter((o) => summeImBild(o.svg) === gesucht);

      assert.equal(
        treffer.length,
        1,
        `${aufgabe.frage}: ${treffer.length} Karten ergeben ${gesucht} – es muss genau eine sein`
      );
      assert.equal(
        treffer[0].kennung,
        aufgabe.loesung,
        `${aufgabe.frage}: als Lösung steht ${aufgabe.loesung} da, richtig ist ${treffer[0].kennung}`
      );

      // Gleich viele Stücke auf allen Karten: Sonst verrät schon die Anzahl,
      // welche gemeint ist (dieselbe Falle wie beim Geldlegen).
      const stueckzahlen = new Set(
        aufgabe.antwortfeld.optionen.map(
          (o) => texte(o.svg).filter((t) => t.klasse === "fig-muenze-text").length
        )
      );
      assert.equal(
        stueckzahlen.size,
        1,
        `${aufgabe.frage}: unterschiedlich viele Stücke (${[...stueckzahlen]}) – das ist ohne Rechnen sichtbar`
      );
    }

    assert.ok(geprueft > 50, `nur ${geprueft} Aufgaben vom Typ ${typ} gezogen`);
  });
}

/* -------------------------------------------------------------- Zu viel */

/**
 * „Streiche durch, was zu viel ist“: Es muss GENAU ein Stück zu viel sein,
 * und dieses Stück muss auch wirklich im Bild liegen. Läge es nicht da, wäre
 * die Aufgabe unlösbar; wären es zwei, gäbe es zwei richtige Antworten.
 */
test("bei „zu viel“ liegt genau ein überzähliges Stück im Bild", () => {
  let geprueft = 0;

  for (let i = 0; i < 2500; i++) {
    const rng = mulberry32(31 + i * 17);
    const aufgabe = GENERATOREN.geld(rng, 3);
    if (aufgabe.typ !== "geld/zu-viel") continue;
    geprueft++;

    const [, liegtText, preisText] = aufgabe.frage.match(/liegen ([\d.]+ (?:ct|€)).*nur ([\d.]+ (?:ct|€))/);
    const liegt = inCent(liegtText);
    const preis = inCent(preisText);
    const kontext = aufgabe.frage;

    // Das Bild muss zeigen, was der Text behauptet.
    assert.equal(summeImBild(aufgabe.bild.svg), liegt, `${kontext}: im Bild liegt etwas anderes`);
    assert.ok(preis < liegt, `${kontext}: es liegt nicht mehr da, als bezahlt werden soll`);

    /*
     * Auch die SUMME muss im Zahlenraum bleiben, nicht nur die Lösung.
     * Andersherum gebaut kam „Hier liegen 140 ct" heraus — außerhalb von 100,
     * mit einer Subtraktion, die darüber hinausgeht, und kein Satz, den ein
     * Zweitklässler so sagen würde (das wären 1 Euro 40).
     */
    if (aufgabe.antwortfeld.einheit === "ct") {
      assert.ok(liegt <= 100, `${kontext}: ${liegt} ct liegt außerhalb des Zahlenraums`);
    }

    // Die Lösung trägt die Einheit der Aufgabe, nicht immer Cent.
    const einheit = aufgabe.antwortfeld.einheit;
    const loesungCent = einheit === "€" ? Number(aufgabe.loesung) * 100 : Number(aufgabe.loesung);
    assert.equal(loesungCent, liegt - preis, `${kontext}: die Lösung passt nicht zur Differenz`);

    // Und dieses Stück muss tatsächlich dort liegen.
    const stuecke = texte(aufgabe.bild.svg)
      .filter((t) => t.klasse === "fig-muenze-text")
      .map((t) => inCent(t.text));
    assert.ok(
      stuecke.includes(loesungCent),
      `${kontext}: ${aufgabe.loesung} ${einheit} liegt gar nicht da (${stuecke.join(", ")})`
    );
  }

  assert.ok(geprueft > 50, `nur ${geprueft} „zu viel“-Aufgaben gezogen`);
});

/**
 * Keine Stückzahl darf die Antworten beherrschen.
 *
 * Zieht man einfach einen Betrag und darin eine Spalte, ist die Antwort in
 * gut drei von vier Fällen eine 1 — gemessen 77 %. Das liegt am Geld selbst:
 * Bis 99 kommt jede Sorte höchstens zweimal vor, und zweimal wird sie nur bei
 * wenigen Beträgen gebraucht. Ein Kind, das das merkt, rät statt zu rechnen.
 * Deshalb wird erst die gesuchte Stückzahl gewählt und dann ein Betrag, der
 * sie hergibt.
 */
test("bei der Geldtabelle lohnt sich Raten nicht", () => {
  const wie_oft = new Map();

  for (const stufe of [2, 3]) {
    const rng = mulberry32(8080 + stufe);
    for (let i = 0; i < 12000; i++) {
      const aufgabe = GENERATOREN.geld(rng, stufe);
      if (aufgabe.typ !== "geld/geldtabelle") continue;
      wie_oft.set(aufgabe.loesung, (wie_oft.get(aufgabe.loesung) ?? 0) + 1);
    }
  }

  const gesamt = [...wie_oft.values()].reduce((a, b) => a + b, 0);
  assert.ok(gesamt > 500, `nur ${gesamt} Geldtabellen gezogen – der Test misst zu wenig`);
  assert.ok(wie_oft.size >= 3, `es kommen nur ${wie_oft.size} verschiedene Antworten vor`);

  for (const [antwort, anzahl] of wie_oft) {
    const anteil = anzahl / gesamt;
    assert.ok(
      anteil < 0.55,
      `die Antwort ${antwort} kommt in ${Math.round(anteil * 100)} % der Fälle – wer das merkt, rät statt zu rechnen`
    );
  }
});

/**
 * Keine Aufgabenart darf sich als stiller Notnagel in eine fremde Stufe
 * schleichen.
 *
 * Die beiden Bildauswahl-Formen weichen auf eine andere Aufgabe aus, wenn
 * sich zu einer Gruppe keine drei verschiedenen Ablenker bauen lassen. Das
 * geschah anfangs in 19 % der Fälle — bei 10 € als 5 € + 5 € gibt der Tausch
 * eines Stücks nur zwei andere Gruppen her. Ein Kind bekam auf der Heftseite
 * „Immer 10 Euro“ dann eine ganz andere Aufgabe zu sehen, und im Elternbereich
 * stand eine Fehlerart, die auf dieser Stufe gar nicht vorgesehen ist.
 *
 * `geld/betrag-legen` gehört zu Stufe 3. Taucht es auf Stufe 2 auf, ist es der
 * Notnagel.
 */
test("auf Stufe 2 greift kein Notnagel aus einer anderen Stufe", () => {
  const rng = mulberry32(6060);
  const arten = new Set();
  for (let i = 0; i < 20000; i++) arten.add(GENERATOREN.geld(rng, 2).typ);

  assert.ok(arten.has("geld/immer-zehn"), "„Immer 10 Euro“ kommt auf Stufe 2 gar nicht vor");
  assert.ok(
    !arten.has("geld/betrag-legen"),
    "„geld/betrag-legen“ ist eine Stufe-3-Aufgabe – auf Stufe 2 kann es nur der Notnagel sein"
  );
});

/**
 * Die Stufe muss sich auch wirklich auswirken.
 *
 * Bei der Geldtabelle steuert die Stufe die HILFE: Auf Stufe 2 stehen die
 * größeren Sorten links vom gefragten Feld schon da, auf Stufe 3 ist die Zeile
 * leer. Wird auf Stufe 2 die ERSTE Spalte gefragt, gibt es links davon nichts
 * auszufüllen — die Zeile bleibt leer und die Aufgabe ist in Wahrheit Stufe 3.
 * Gemessen traf das 12 % der Stufe-2-Tabellen, ohne dass irgendwo etwas
 * auffiel.
 */
test("die Geldtabelle hält, was die Stufe verspricht", () => {
  const zaehlen = (stufe) => {
    const rng = mulberry32(2211 + stufe);
    let gezogen = 0;
    let ohneHilfe = 0;
    for (let i = 0; i < 12000; i++) {
      const aufgabe = GENERATOREN.geld(rng, stufe);
      if (aufgabe.typ !== "geld/geldtabelle") continue;
      gezogen++;
      const tabelle = lesGeldtabelle(aufgabe.bild.svg);
      if (tabelle.gezeigt.every((wert) => wert === null)) ohneHilfe++;
    }
    return { gezogen, ohneHilfe };
  };

  const zwei = zaehlen(2);
  assert.ok(zwei.gezogen > 200, `nur ${zwei.gezogen} Stufe-2-Tabellen gezogen`);
  assert.equal(
    zwei.ohneHilfe,
    0,
    `${zwei.ohneHilfe} von ${zwei.gezogen} Stufe-2-Tabellen stehen ganz leer da – das ist Stufe-3-Schwierigkeit`
  );

  // Und die Gegenprobe: Auf Stufe 3 darf nie etwas vorgegeben sein, sonst
  // wäre die Stufe keine Steigerung.
  const drei = zaehlen(3);
  assert.ok(drei.gezogen > 200, `nur ${drei.gezogen} Stufe-3-Tabellen gezogen`);
  assert.equal(
    drei.ohneHilfe,
    drei.gezogen,
    `auf Stufe 3 steht in ${drei.gezogen - drei.ohneHilfe} Tabellen schon eine Hilfe`
  );
});

/* ------------------------------------------- Was ein Screenreader hört */

/**
 * Die Bildbeschreibung muss alles enthalten, was im Bild steht — sonst ist
 * die Aufgabe ohne Augenlicht gar nicht lösbar.
 *
 * Anders als beim Formenerkennen ist das hier gefahrlos: Geld lässt sich in
 * Worten ausdrücken, ohne die Lösung zu verraten — zusammenzählen muss man
 * immer noch selbst. Die Bildkarten sagten anfangs nur „Gruppe A".
 */
test("jede Geldgruppe sagt, was auf ihr liegt", () => {
  let geprueft = 0;

  for (const [typ, stufe] of [
    ["geld/welche-muenzen", 1],
    ["geld/immer-zehn", 2],
  ]) {
    const rng = mulberry32(3300 + stufe);
    for (let i = 0; i < 6000 && geprueft < 400; i++) {
      const aufgabe = GENERATOREN.geld(rng, stufe);
      if (aufgabe.typ !== typ) continue;
      geprueft++;

      for (const option of aufgabe.antwortfeld.optionen) {
        // Aus dem BILD gelesen …
        const imBild = texte(option.svg)
          .filter((t) => t.klasse === "fig-muenze-text")
          .map((t) => inCent(t.text));
        // … und aus der Beschreibung.
        const gesagt = [...option.beschriftung.matchAll(/([\d.]+ (?:ct|€))/g)].map((t) => inCent(t[1]));

        assert.deepEqual(
          [...gesagt].sort((a, b) => a - b),
          [...imBild].sort((a, b) => a - b),
          `„${option.beschriftung}" nennt etwas anderes, als im Bild liegt`
        );
      }
    }
  }

  assert.ok(geprueft > 100, `nur ${geprueft} Gruppenaufgaben gezogen`);
});

test("beim überzähligen Geld sagt das Bild, was dort liegt", () => {
  const rng = mulberry32(3400);
  let geprueft = 0;

  for (let i = 0; i < 8000 && geprueft < 300; i++) {
    const aufgabe = GENERATOREN.geld(rng, 3);
    if (aufgabe.typ !== "geld/zu-viel") continue;
    geprueft++;

    const imBild = texte(aufgabe.bild.svg)
      .filter((t) => t.klasse === "fig-muenze-text")
      .map((t) => inCent(t.text));
    const gesagt = [...aufgabe.bild.beschriftung.matchAll(/([\d.]+ (?:ct|€))/g)].map((t) => inCent(t[1]));

    assert.deepEqual(
      [...gesagt].sort((a, b) => a - b),
      [...imBild].sort((a, b) => a - b),
      `„${aufgabe.bild.beschriftung}" nennt etwas anderes, als im Bild liegt`
    );
  }

  assert.ok(geprueft > 50, `nur ${geprueft} Aufgaben gezogen`);
});

/**
 * Bei der Geldtabelle gilt beides: Die schon eingetragenen Spalten sind die
 * Hilfe der Stufe 2 und gehören in die Beschreibung — die Zahl der GEFRAGTEN
 * Spalte natürlich nicht.
 */
test("die Geldtabelle beschreibt ihre Hilfe, aber nicht die Lösung", () => {
  let geprueft = 0;

  for (const stufe of [2, 3]) {
    const rng = mulberry32(3500 + stufe);
    for (let i = 0; i < 6000 && geprueft < 400; i++) {
      const aufgabe = GENERATOREN.geld(rng, stufe);
      if (aufgabe.typ !== "geld/geldtabelle") continue;
      geprueft++;

      const tabelle = lesGeldtabelle(aufgabe.bild.svg);
      const text = aufgabe.bild.beschriftung;

      // Jede ausgefüllte Spalte muss mit ihrer Zahl genannt sein.
      tabelle.gezeigt.forEach((wert, spalte) => {
        if (wert === null) return;
        const sorte = tabelle.sorten[spalte];
        const name = sorte >= 100 ? `${sorte / 100} €` : `${sorte} ct`;
        assert.ok(
          text.includes(`${wert} bei ${name}`),
          `„${text}" verschweigt die eingetragene Spalte ${name}`
        );
      });

      // Die gefragte Spalte wird benannt …
      const gefragt = tabelle.sorten[tabelle.markiert];
      const gefragtName = gefragt >= 100 ? `${gefragt / 100} €` : `${gefragt} ct`;
      assert.ok(text.includes(`Spalte ${gefragtName}`), `„${text}" sagt nicht, welche Spalte gefragt ist`);

      // … aber ihre Zahl steht nirgends.
      assert.ok(
        !text.includes(`${aufgabe.loesung} bei ${gefragtName}`),
        `„${text}" verrät die Lösung`
      );
    }
  }

  assert.ok(geprueft > 100, `nur ${geprueft} Geldtabellen gezogen`);
});
