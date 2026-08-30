import "./setup.js";
import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

/**
 * Diese Seite wird vollständig über den Hash geroutet: `#/`, `#/uebung/geld`,
 * `#/eltern`. Jeder Hash, der NICHT mit `#/` anfängt, ist für den Router eine
 * unbekannte Ansicht und landet auf „Diese Seite gibt es nicht“.
 *
 * Genau daran ist die Sprungmarke gescheitert: `href="#inhalt"` sah aus wie
 * ein harmloser Sprunganker, warf aber ausgerechnet Tastatur- und
 * Screenreader-Nutzer auf die Fehlerseite. Sie ist deshalb ein Knopf, der den
 * Fokus selbst setzt (`shell.ts`).
 */

const HTML = readFileSync(new URL("../index.html", import.meta.url), "utf8");
/** Ohne Kommentare – sonst schlagen die Erklärtexte selbst an. */
const MARKUP = HTML.replace(/<!--[\s\S]*?-->/g, "");

test("kein Hash-Link in index.html umgeht den Router", () => {
  const ziele = [...MARKUP.matchAll(/href="(#[^"]*)"/g)].map((t) => t[1]);
  for (const ziel of ziele) {
    assert.ok(
      ziel === "#/" || ziel.startsWith("#/"),
      `href="${ziel}" ist keine Route – der Router zeigt darauf die Fehlerseite`
    );
  }
});

test("die Sprungmarke ist ein Knopf und wird verdrahtet", () => {
  const marke = MARKUP.match(/<(\w+)[^>]*class="sprungmarke"[^>]*>/);
  assert.ok(marke, "die Sprungmarke fehlt ganz – ohne sie tabbt man durch die ganze Kopfzeile");
  assert.equal(marke[1], "button", "als <a href=…> läuft die Sprungmarke in den Hash-Router");
  assert.ok(/id="sprungmarke"/.test(marke[0]), "ohne Id findet shell.ts sie nicht");

  const shell = readFileSync(new URL("../js/shell.js", import.meta.url), "utf8");
  assert.ok(
    shell.includes('getElementById("sprungmarke")'),
    "die Sprungmarke wird nirgends verdrahtet – als Knopf täte sie dann gar nichts"
  );
  assert.ok(/\.focus\(\)/.test(shell), "die Sprungmarke muss den Fokus tatsächlich setzen");
});

test("das Sprungziel ist fokussierbar", () => {
  const shell = readFileSync(new URL("../js/shell.js", import.meta.url), "utf8");
  assert.ok(
    /id:\s*"inhalt"[\s\S]{0,80}tabindex:\s*"-1"|tabindex:\s*"-1"[\s\S]{0,80}id:\s*"inhalt"/.test(shell),
    "das <main> braucht tabindex=\"-1\", sonst nimmt es den Fokus nicht an"
  );
});

/* ------------------------------------------------------------- Bilder */

/**
 * `role="img"` mit LEEREM `aria-label` ist der schlimmste aller Fälle: Der
 * Screenreader meldet ein Bild, kann es aber nicht benennen. Auf der
 * Startseite steht neben jedem Motiv ohnehin sein Titel – dort ist das Bild
 * Schmuck und muss ganz verschwinden.
 */
test("ein Bild ohne Beschriftung wird als Schmuck ausgeblendet", async () => {
  const { bildAttribute } = await import("../js/dom.js");

  const schmuck = bildAttribute("");
  assert.equal(schmuck["aria-hidden"], "true");
  assert.equal(schmuck["role"], undefined, "Schmuck darf keine Bildrolle behaupten");
  assert.equal(schmuck["aria-label"], undefined, "ein leerer Name ist schlimmer als gar keiner");

  // Leerzeichen sind auch keine Beschriftung.
  assert.equal(bildAttribute("   ")["aria-hidden"], "true");

  const echt = bildAttribute("Zahlenstrahl von 0 bis 100");
  assert.equal(echt["role"], "img");
  assert.equal(echt["aria-label"], "Zahlenstrahl von 0 bis 100");
  assert.equal(echt["aria-hidden"], undefined, "ein beschriftetes Bild darf nie versteckt werden");

  // Die Klasse trägt das Layout – sie muss in beiden Fällen dranbleiben.
  assert.equal(schmuck["class"], "bild");
  assert.equal(echt["class"], "bild");
});

/* ------------------------------------------------------- Fokus in der Übung */

/**
 * Nach einer falschen Antwort zeichnet die Übung neu — `replaceChildren()`
 * wirft dabei den gerade angeklickten Knopf weg, und mit ihm den Fokus. Der
 * landet auf `<body>`, und wer mit der Tastatur bedient, muss sich von ganz
 * oben durch Sprungmarke, Kopfzeile und Navigation zurücktabben, um „Weiter“
 * zu erreichen — ausgerechnet in dem Moment, in dem der Rechenweg erklärt wird.
 *
 * Ein echter Klicktest bräuchte einen Browser; geprüft wird deshalb, dass die
 * Rückmeldung fokussierbar bleibt und der Fokus nach dem Neuzeichnen auch
 * wirklich gesetzt wird.
 */
test("nach einer falschen Antwort bekommt die Rückmeldung den Fokus", () => {
  const uebung = readFileSync(new URL("../js/views/uebung.js", import.meta.url), "utf8");

  assert.match(
    uebung,
    /rueckmeldung rueckmeldung-falsch[\s\S]{0,120}tabindex:\s*"-1"/,
    'die Rückmeldung braucht tabindex="-1", sonst nimmt sie den Fokus nicht an'
  );
  assert.match(
    uebung,
    /replaceChildren\(kopf, karte\);\s*setzeFokus\(\);/,
    "der Fokus muss NACH dem Neuzeichnen gesetzt werden – vorher gibt es das Element noch gar nicht"
  );
  assert.match(uebung, /fokusZiel\s*=\s*kasten/, "die Rückmeldung meldet sich nicht als Fokusziel an");
});

/* ------------------------------------------------------ Bonus in der Übung */

/**
 * Das Angebot „Erst die Hilfsaufgabe rechnen?“ muss VOR dem Antwortbereich
 * stehen.
 *
 * Es stand einmal darunter – also unter dem Tastenfeld und damit auf dem Handy
 * regelmäßig unter dem Fensterrand. Ein Angebot, das niemand sieht, ist keins.
 * Und es gehört auch inhaltlich nach vorn: Die Frage „erst die kleine
 * Aufgabe?“ kommt vor dem Antworten, nicht danach.
 */
test("das Bonusangebot steht über dem Antwortbereich", () => {
  const uebung = readFileSync(new URL("../js/views/uebung.js", import.meta.url), "utf8");

  const bonus = uebung.indexOf('"bonus-angebot"');
  const antwort = uebung.indexOf("karte.appendChild(antwortbereich(");
  assert.ok(bonus > 0, "das Bonusangebot fehlt ganz");
  assert.ok(antwort > 0, "der Antwortbereich wird nicht mehr an die Karte gehängt");
  assert.ok(
    bonus < antwort,
    "das Bonusangebot wird nach dem Antwortbereich angehängt – dort liegt es unter dem Tastenfeld"
  );
});

/**
 * Und es muss aussehen wie ein Angebot, nicht wie ein Nebensatz: eigene
 * Fläche, sichtbarer Rahmen, Pferd. Ohne diese Prüfung fällt es beim nächsten
 * Aufräumen still wieder auf Knopfgröße zurück.
 */
test("das Bonusangebot ist eine eigene Fläche, kein kleiner Knopf", () => {
  const css = readFileSync(new URL("../style.css", import.meta.url), "utf8");
  const regel = css.match(/\n\.bonus-angebot\s*\{([^}]*)\}/);
  assert.ok(regel, "es gibt keine Regel für .bonus-angebot");
  assert.match(regel[1], /width:\s*100%/, "das Angebot soll die volle Breite nutzen");
  assert.match(regel[1], /border:\s*2px/, "ohne Rahmen sieht es aus wie Fließtext");

  const uebung = readFileSync(new URL("../js/views/uebung.js", import.meta.url), "utf8");
  assert.match(uebung, /icon\("pferd",\s*"bonus-pferd"\)/, "dem Angebot fehlt das Pferd");
});

/*
 * Das Pferd galoppiert NUR nach einer selbst gelösten Hilfsaufgabe.
 *
 * Geprüft wird am ausgelieferten Kompilat: Der Aufruf muss genau einmal
 * vorkommen, und zwar im Vorstufen-Zweig – dort, wo der Bonus verbucht wird.
 * Stünde er zusätzlich im Zweig der normalen Antwort, käme das Pferd bei
 * jeder richtigen Aufgabe und wäre keine Besonderheit mehr.
 */
test("der Bonus-Jubel wird an genau einer Stelle ausgelöst", () => {
  const uebung = readFileSync(new URL("../js/views/uebung.js", import.meta.url), "utf8");
  assert.equal(
    [...uebung.matchAll(/zeigeJubel\(BONUS_JUBEL\)/g)].length,
    1,
    "der Bonus-Jubel darf an genau EINER Stelle stehen"
  );

  const pruefe = uebung.slice(uebung.indexOf("function pruefe("), uebung.indexOf("function jubele("));
  const bonuszweig = pruefe.slice(pruefe.indexOf('"vorstufe"'), pruefe.indexOf("sitzung.ergebnisse.push"));
  assert.match(bonuszweig, /zeigeJubel\(BONUS_JUBEL\)/, "die gelöste Hilfsaufgabe muss das Pferd auslösen");
  assert.ok(
    !bonuszweig.includes("jubele(sitzung)"),
    "im Bonus darf nicht zusätzlich die normale Reihe laufen"
  );
});
