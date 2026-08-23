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
