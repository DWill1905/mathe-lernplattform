import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

/**
 * Touch-Ziele bleiben mindestens 40 px hoch – auch im Querformat, wo lieber
 * Kopfzeile und Navigation weichen (siehe `CLAUDE.md`).
 *
 * Bei Kinderhänden ist das keine Stellschraube: Wer eine Taste nicht trifft,
 * tippt daneben, bekommt eine falsche Antwort gewertet und lernt, dass er es
 * nicht kann. Die Regel stand bisher nur in der Doku; hier wird sie geprüft.
 *
 * Geprüft werden die Regeln, die im Querformat und auf flachen Bildschirmen
 * bewusst NACH UNTEN korrigieren – dort ist die Versuchung am größten, „nur
 * ein paar Pixel“ zu opfern.
 */

const CSS = readFileSync(new URL("../style.css", import.meta.url), "utf8");
const MINDESTHOEHE = 40;

/** Alle `min-height`-Angaben einer Klasse, über das ganze Stylesheet. */
function mindesthoehen(klasse) {
  const gefunden = [];
  // Auch Regeln mit mehreren Wählern („.a, .b { … }“) und in Media-Queries.
  const muster = new RegExp(`(^|[,{}\\s])\\${klasse}\\b[^{}]*\\{([^{}]*)\\}`, "g");
  for (const treffer of CSS.matchAll(muster)) {
    const wert = treffer[2].match(/min-height:\s*([\d.]+)(px|rem)/);
    if (wert) gefunden.push(wert[2] === "rem" ? Number(wert[1]) * 16 : Number(wert[1]));
  }
  return gefunden;
}

/** Was ein Kind mit dem Finger trifft. */
const ZIELE = [".taste", ".knopf-auswahl", ".knopf-klein", ".bonus-angebot", ".mauer-stein"];

test("kein Touch-Ziel wird kleiner als 40 px", () => {
  for (const ziel of ZIELE) {
    const hoehen = mindesthoehen(ziel);
    assert.ok(hoehen.length > 0, `${ziel}: keine einzige min-height gefunden – die Regel greift nirgends`);
    for (const hoehe of hoehen) {
      assert.ok(
        hoehe >= MINDESTHOEHE,
        `${ziel}: ${hoehe}px ist unter der Grenze von ${MINDESTHOEHE}px – bei Kinderhänden keine Stellschraube`
      );
    }
  }
});

/**
 * Der Antwortbereich darf im Querformat nicht durch die Kopfzeile aus dem
 * Bild geschoben werden. Umgekehrt gilt aber: Wer Platzprobleme misst, muss
 * auch messen, dass noch etwas DA ist – sonst ist die Prüfung grün, WEIL das
 * Geprüfte fehlt.
 */
test("die Querformat-Regeln blenden Kopf und Navigation aus, statt Tasten zu schrumpfen", () => {
  const quer = CSS.match(/@media \(orientation: landscape\)[^{]*\{([\s\S]*)$/);
  assert.ok(quer, "die Querformat-Regeln fehlen ganz");
  assert.match(
    quer[1],
    /body\.uebung-laeuft[\s\S]*?\.kopf[\s\S]*?display:\s*none|\.kopf\s*\{[^}]*position:\s*static/,
    "im Querformat muss die Kopfzeile weichen, nicht das Tastenfeld"
  );
});

/* -------------------------------------------------------------- Fokus */

/**
 * Wer die App mit der Tastatur bedient, muss jederzeit SEHEN, wo er steht.
 *
 * Der Fokusrahmen trug vorher nur an Knöpfen, Tasten, Eingabefeldern und
 * Bildkarten die Markenfarbe; Themenkacheln, Navigation, Themenzeilen und die
 * Steine einer Zahlenmauer bekamen den dünnen Browser-Standard, der auf dem
 * dunklen Hintergrund kaum zu erkennen ist.
 */
test("es gibt einen sichtbaren Fokusrahmen für alles Fokussierbare", () => {
  const global = CSS.match(/(^|\n)\s*:focus-visible\s*\{([^}]*)\}/);
  assert.ok(global, "es fehlt eine allgemeine :focus-visible-Regel");
  assert.match(global[2], /outline:\s*[23]px|outline:\s*[23]px\s+solid/, "der Rahmen ist zu dünn");
  assert.ok(!/outline:\s*none|outline:\s*0\b/.test(global[2]), "der Rahmen darf nicht abgeschaltet werden");
});

/**
 * Ein `outline: none` ohne Ersatz ist das klassische Barrierefreiheits-Loch:
 * Der Fokus ist dann unsichtbar und die Seite mit der Tastatur unbedienbar.
 */
test("nirgends wird der Fokusrahmen ersatzlos abgeschaltet", () => {
  const regeln = [...CSS.matchAll(/([^{}]+)\{([^{}]*)\}/g)];
  for (const [, waehler, inhalt] of regeln) {
    if (!/outline:\s*(none|0)\b/.test(inhalt)) continue;
    assert.ok(
      /box-shadow|border/.test(inhalt),
      `„${waehler.trim()}“ schaltet den Fokusrahmen ab, ohne einen Ersatz zu setzen`
    );
  }
});

/*
 * Ohne Erklärbild ankert der Antwortbereich am unteren Kartenrand (Daumen-
 * zone) statt unter der Frage zu kleben und ein totes Drittel Karte übrig zu
 * lassen. Die Lücke sitzt VOR der Rechnung, damit „37 + 48 =“ direkt über dem
 * Antwortfeld steht. Beides muss im Hochformat UND im hohen Querformat
 * gelten – die Spalte über die volle Fensterhöhe gibt es in beiden Blöcken.
 */
test("der Antwortbereich rückt in die Daumenzone, die Rechnung bleibt bei ihm", () => {
  const bloecke = [...CSS.matchAll(/@media \(orientation: (?:portrait|landscape)[^{]*\{([\s\S]*?)\n\}/g)]
    .map((t) => t[1])
    .filter((block) => block.includes("min-height: 100dvh"));
  assert.equal(bloecke.length, 2, "Hochformat und hohes Querformat bauen die Spalte – beide müssen da sein");

  for (const block of bloecke) {
    const anker = block.match(
      /\.karte-aufgabe > \.aufgabe-rechnung,[^{]*\.eingabe-bereich,[^{]*\{([^}]*)\}/
    );
    assert.ok(anker, "die Ankerregel für Rechnung und Antwortbereich fehlt");
    assert.match(anker[1], /margin-top:\s*auto/, "ohne margin-top: auto bleibt das tote Drittel unter den Tasten");

    // Und die Rechnung nimmt die Lücke ALLEIN – sonst klaffte sie doppelt.
    const reset = block.match(/\.aufgabe-rechnung ~ \.eingabe-bereich[^{]*\{([^}]*)\}/);
    assert.ok(reset, "die Rückstellung hinter einer Rechnung fehlt");
    assert.match(reset[1], /margin-top:\s*0/, "hinter der Rechnung muss der Antwortbereich wieder anliegen");
  }
});

/*
 * Eine kurze Karte (weder Bild noch Rechnung) darf die Spalte nicht füllen.
 *
 * Sonst bleibt in der weißen Fläche ein Loch stehen – erst direkt unter der
 * Frage, nach dem ersten Reparaturversuch unter dem Tastenfeld. Beide Male
 * sah es aus wie ein fehlendes Erklärbild. Die Karte schrumpft deshalb auf
 * ihren Inhalt (`flex: none`) und rückt ans untere Ende (`margin-top: auto`),
 * damit die Luft AUSSERHALB der Karte liegt und das Tastenfeld trotzdem in
 * der Daumenzone bleibt. Beide Eigenschaften zusammen ergeben erst die
 * Wirkung – deshalb prüft der Test beide.
 */
test("eine kurze Aufgabenkarte schrumpft und rückt in die Daumenzone", () => {
  const bloecke = [...CSS.matchAll(/@media \(orientation: (?:portrait|landscape)[^{]*\{([\s\S]*?)\n\}/g)]
    .map((t) => t[1])
    .filter((block) => block.includes("min-height: 100dvh"));
  assert.equal(bloecke.length, 2);

  for (const block of bloecke) {
    const regel = block.match(/\.karte-aufgabe-schlank\s*\{([^}]*)\}/);
    assert.ok(regel, "die Regel für die kurze Aufgabenkarte fehlt");
    assert.match(
      regel[1],
      /flex:\s*none/,
      "ohne flex: none füllt die kurze Karte die Spalte – und klafft innen"
    );
    assert.match(
      regel[1],
      /margin-top:\s*auto/,
      "ohne margin-top: auto klebt die kurze Karte oben statt in der Daumenzone"
    );
  }
});

/* ------------------------------------------------------------ Breite Bilder */

/**
 * `bild-breit` muss die Deckel für kleine Schirme überstimmen.
 *
 * Acht Aufgaben brauchen die volle Kartenbreite — Pfeilfolge, Rechenstrich,
 * Hunderterfeld, die beiden Musterreihen, das Grundmuster und die Geldtabelle.
 * Genau dafür gibt es `breit`. Die Regel stand aber nur EINEN Klassennamen
 * stark da, und die Deckel (`.bild { max-width: 200px }` bei flacher Bauhöhe,
 * `130px` im Querformat) stehen weiter unten im Stylesheet — sie gewannen
 * deshalb. Ausgerechnet auf dem Telefon, wo die Breite am nötigsten ist,
 * schrumpfte jedes dieser Bilder auf Briefmarkengröße.
 *
 * Geprüft wird die Kaskade selbst: Der Wähler der Breit-Regel muss mehr
 * Klassen tragen als jeder Deckel, dann gewinnt er unabhängig von der
 * Reihenfolge.
 */
test("breite Bilder überstehen die Deckel für kleine Schirme", () => {
  const klassen = (waehler) => (waehler.match(/\.[a-zA-Z][\w-]*/g) ?? []).length;

  /*
   * Nur die ALLGEMEINEN Deckel zählen. `.rueckmeldung-sticker .bild` etwa
   * gilt für die Stickerbelohnung, wo es nie ein breites Bild gibt – so ein
   * Wähler darf ruhig mehr Klassen tragen.
   */
  const allgemein = /^(?:body\.uebung-laeuft\s+|\.karte-aufgabe\s+)*\.bild$/;

  /*
   * Ohne Kommentare lesen – sonst zählt der Test die ERKLÄRUNG mit.
   * In genau diesem Abschnitt steht `.bild { max-width: 200px }` als Prosa,
   * und ein naiver Parser hält das für eine Regel mit zwei Klassen. Der Test
   * war dadurch grün, weil er den Kommentar maß statt des Stylesheets.
   */
  const ohneKommentare = CSS.replace(/\/\*[\s\S]*?\*\//g, "");

  const breit = [];
  const deckel = [];
  for (const [, waehler, inhalt] of ohneKommentare.matchAll(/([^{}]+)\{([^{}]*)\}/g)) {
    if (!/max-width/.test(inhalt)) continue;
    const sauber = waehler.trim();
    // Auch die einklassige Fassung `.bild-breit` muss erkannt werden – sonst
    // meldet der Test bei einem Rückfall „gibt es gar nicht" statt zu sagen,
    // dass sie zu schwach ist.
    if (/\.bild-breit(?![\w-])/.test(sauber)) {
      breit.push({ waehler: sauber, stufe: klassen(sauber) });
      continue;
    }
    // `.bild` als ganze Klasse – nicht `.bildauswahl` oder `.bildkarte`.
    if (!/\.bild(?![\w-])/.test(sauber)) continue;
    if (allgemein.test(sauber)) deckel.push({ waehler: sauber, stufe: klassen(sauber) });
  }

  assert.ok(breit.length > 0, "es gibt gar keine Regel für breite Bilder");
  assert.ok(deckel.length > 0, "der Test misst nichts – es gibt keinen Deckel auf .bild");

  const schwaechste = Math.min(...breit.map((r) => r.stufe));
  for (const regel of deckel) {
    assert.ok(
      schwaechste > regel.stufe,
      `„${regel.waehler}" (${regel.stufe} Klassen) überstimmt die Breit-Regel (${schwaechste} Klassen) – ` +
        "breite Bilder schrumpfen dann genau dort, wo sie die Breite brauchen"
    );
  }
});

/**
 * Das Erklärbild braucht eine ANGEGEBENE Breite, nicht nur eine Obergrenze.
 *
 * `.bild` trägt `margin: 0 auto`, und automatische Seitenränder schalten in
 * einer Flexspalte das Strecken ab. Ohne `width` bemisst sich das Bild dann
 * nach seinem Inhalt — und ein Inline-SVG mit bloßer `viewBox` ist 300 × 150
 * groß. Auf dem Telefon fiel das nie auf, weil die Obergrenze dort kleiner
 * ist; auf dem Tablet standen gemessene 300 px, wo 360 erlaubt waren.
 *
 * Das ist die Schwester der Falle aus 1.11.1 („width: auto auf einem Inline-
 * SVG lässt es auf null zusammenfallen"): Beide Male fehlt dem Bild die
 * Bezugsgröße, einmal mit null und einmal mit 300 als Ergebnis.
 */
test("das Erklärbild der Übung hat eine angegebene Breite", () => {
  const ohneKommentare = CSS.replace(/\/\*[\s\S]*?\*\//g, "");
  /*
   * Gefragt ist eine Regel, die auch ein BILD OHNE `breit` trifft. Dass
   * `.bild.bild-breit` eine Breite setzt, genügt nicht: Die acht breiten
   * Bilder wären versorgt, alle übrigen fielen weiter auf 300 px zurück.
   */
  const fuerJedesBild = [...ohneKommentare.matchAll(/([^{}]+)\{([^{}]*)\}/g)]
    .map(([, waehler, inhalt]) => ({ waehler: waehler.trim(), inhalt }))
    .filter((r) => !/bild-breit/.test(r.waehler))
    .filter((r) => /\.karte-aufgabe\s*>?\s*\.bild(?![\w-])$/.test(r.waehler) || /^\.bild$/.test(r.waehler));

  const mitBreite = fuerJedesBild.filter((r) => /(^|[;{\s])width:\s*100%/.test(r.inhalt));
  assert.ok(
    fuerJedesBild.length > 0,
    "der Test misst nichts – es gibt gar keine allgemeine Regel für das Erklärbild"
  );
  assert.ok(
    mitBreite.length > 0,
    "keine Regel setzt die Breite JEDES Erklärbilds – ohne `breit` fällt es auf die SVG-Standardgröße 300 px zurück"
  );

  // Und die Obergrenze muss bleiben, sonst sprengt das Bild die Karte.
  assert.ok(
    ohneKommentare.includes("max-width: 280px"),
    "die allgemeine Obergrenze für Erklärbilder fehlt"
  );
});
