/**
 * Vorlesefunktion für Aufgabentexte.
 *
 * Zweitklässler lesen noch langsam. Wer an „Auf dem Dach sitzen 14 Tauben“
 * scheitert, scheitert an der SPRACHE und nicht an der Mathematik – und übt
 * dann genau das Falsche. Deshalb kann sich ein Kind jede Aufgabe vorlesen
 * lassen.
 *
 * Benutzt wird `speechSynthesis`, die im Browser eingebaute Sprachausgabe:
 * keine neue Abhängigkeit, kein Netzaufruf, keine Daten, die das Gerät
 * verlassen. Fehlt sie oder gibt es keine deutsche Stimme, bleibt der Knopf
 * einfach aus.
 *
 * Der Teil, der aus einer Aufgabe einen SPRECHBAREN Text macht, ist rein und
 * ohne DOM – nur so lässt sich prüfen, dass aus `37 + 48 =` auch wirklich
 * „37 plus 48“ wird und nicht „37 Pluszeichen 48 Gleichheitszeichen“.
 */

import type { Aufgabe } from "./types.js";

const SCHLUESSEL = "vorlesen:an";

/* --------------------------------------------------------- Sprechbarer Text */

/**
 * Rechenzeichen als Wörter – für eine RECHNUNG, die durchgehend eine ist.
 *
 * Ohne diese Übersetzung liest jede Stimme etwas anderes vor: mal „37 plus 48
 * gleich", mal „37 48", mal die Unicode-Namen. Das echte Minus (U+2212) und
 * den Malpunkt (U+00B7) kennt fast keine Stimme.
 */
const ZEICHEN: readonly (readonly [RegExp, string])[] = [
  [/\s*\+\s*/g, " plus "],
  [/\s*[−–—-]\s*/g, " minus "],
  [/\s*·\s*/g, " mal "],
  [/\s*:\s*/g, " geteilt durch "],
  [/\s*=\s*$/g, ""],
  [/\s*=\s*/g, " ist gleich "],
  [/\?/g, " wie viel "],
];

/**
 * Dieselben Zeichen im FLIESSTEXT – und da gelten schärfere Regeln, weil dort
 * nicht jedes Sonderzeichen ein Rechenzeichen ist:
 *
 * - Der Doppelpunkt fehlt hier mit Absicht: `7:30` ist eine Uhrzeit, keine
 *   Division. „sieben geteilt durch dreißig" wäre grober Unsinn.
 * - Der einfache Bindestrich fehlt ebenfalls: Er steht in `10-€-Scheine` und
 *   `Fünf-Minuten-Schritte`, nicht für minus.
 * - Alles Übrige zählt nur ZWISCHEN Zahlen (eine Einheit darf dazwischen
 *   stehen, „20 € + 5 €"), damit ein Fragezeichen am Satzende ein
 *   Fragezeichen bleibt.
 */
const ZEICHEN_IM_TEXT: readonly (readonly [RegExp, string])[] = [
  [/(\d\s*(?:€|ct|cm|mm|m)?)\s*\+\s*(?=\d)/g, "$1 plus "],
  [/(\d\s*(?:€|ct|cm|mm|m)?)\s*[−–—]\s*(?=\d)/g, "$1 minus "],
  [/(\d\s*(?:€|ct|cm|mm|m)?)\s*·\s*(?=\d)/g, "$1 mal "],
  [/(\d\s*(?:€|ct|cm|mm|m)?)\s*=\s*(?=\d)/g, "$1 ist gleich "],
];

/** Einheiten und Kürzel, die eine Stimme sonst buchstabiert. */
const EINHEITEN: readonly (readonly [RegExp, string])[] = [
  [/(\d)\s*€/g, "$1 Euro"],
  [/(\d)\s*ct\b/gi, "$1 Cent"],
  [/(\d)\s*cm\b/g, "$1 Zentimeter"],
  [/(\d)\s*mm\b/g, "$1 Millimeter"],
  [/(\d)\s*m\b/g, "$1 Meter"],
];

/**
 * Macht aus einer Rechnung einen Satz zum Vorlesen.
 * `37 + 48 =` wird zu `37 plus 48`.
 */
export function rechnungSprechen(rechnung: string): string {
  let text = rechnung;
  for (const [muster, ersatz] of ZEICHEN) text = text.replace(muster, ersatz);
  return text.replace(/\s+/g, " ").trim();
}

/**
 * Der ganze Text einer Aufgabe, so wie ihn ein Mensch vorlesen würde.
 *
 * Enthalten sind Frage, Rechnung und – bei einer Auswahl – die Möglichkeiten.
 * Wer nicht lesen kann, kann sonst zwar die Frage hören, aber nicht die
 * Antworten, unter denen er wählen soll.
 *
 * NICHT enthalten ist die Bildbeschreibung: Sie beschreibt das Bild für
 * jemanden, der es nicht SIEHT. Ein Kind, das nur nicht flüssig liest, sieht
 * das Bild und bekäme sonst die Lösung vorgesagt („Uhr, die 7:30 Uhr zeigt“).
 */
export function aufgabeSprechen(aufgabe: Aufgabe): string {
  const teile: string[] = [saubere(aufgabe.frage)];
  if (aufgabe.rechnung) teile.push(rechnungSprechen(aufgabe.rechnung));
  if (aufgabe.antwortfeld.art === "auswahl") {
    teile.push(`Zur Auswahl: ${aufgabe.antwortfeld.optionen.map(saubere).join(", ")}.`);
  }
  return teile.filter((teil) => teil.length > 0).map(mitSatzende).join(" ").trim();
}

/**
 * Hängt einen Punkt an, wo noch keiner steht. Ein stumpfes `join(". ")` machte
 * aus „Wie lautet das Ergebnis?" ein „Wie lautet das Ergebnis?." – und eine
 * Sprachausgabe stolpert über die doppelte Satzgrenze hörbar.
 */
function mitSatzende(teil: string): string {
  return /[.?!:]$/.test(teil) ? teil : `${teil}.`;
}

/**
 * Fließtext sprechbar machen: Zeilenumbrüche werden zu Sprechpausen,
 * Einheiten ausgeschrieben, Rechenzeichen zwischen Ziffern übersetzt.
 *
 * Das gilt auch für die AUSWAHLMÖGLICHKEITEN: Bei den Tauschaufgaben stehen
 * dort ganze Rechnungen („18 − 5 = 13"), und unübersetzt las die Stimme sie
 * als Zeichensalat vor.
 */
function saubere(text: string): string {
  // Ein Zeilenumbruch wird zur Sprechpause – aber nur, wo nicht ohnehin schon
  // ein Satzzeichen steht. Sonst hört man bei den Beziehungsketten hinter
  // jeder Zeile ein doppeltes Satzende.
  let sauber = text.replace(/([.?!:])[ \t]*\n+/g, "$1 ").replace(/\n+/g, ". ");
  // Erst die Zeichen, dann die Einheiten: Aus „20 € + 5 €" wäre sonst schon
  // „20 Euro + 5 Euro" geworden, und das Pluszeichen stünde nicht mehr neben
  // einer Ziffer.
  for (const [muster, ersatz] of ZEICHEN_IM_TEXT) sauber = sauber.replace(muster, ersatz);
  for (const [muster, ersatz] of EINHEITEN) sauber = sauber.replace(muster, ersatz);
  return sauber.replace(/\s+/g, " ").trim();
}

/* ------------------------------------------------------------- Einstellung */

/** Ist das Vorlesen eingeschaltet? Standard ist AUS – Ton überrascht sonst. */
export function vorlesenAn(): boolean {
  try {
    return localStorage.getItem(SCHLUESSEL) === "ja";
  } catch {
    return false;
  }
}

export function setzeVorlesen(an: boolean): void {
  try {
    if (an) localStorage.setItem(SCHLUESSEL, "ja");
    else localStorage.removeItem(SCHLUESSEL);
  } catch {
    // Privater Modus: Dann gilt die Einstellung eben nur für diese Sitzung.
  }
}

/* ------------------------------------------------------------- Sprechen */

/** Kann dieses Gerät überhaupt vorlesen? */
export function vorlesenMoeglich(): boolean {
  return typeof speechSynthesis !== "undefined" && typeof SpeechSynthesisUtterance !== "undefined";
}

/**
 * Sucht eine deutsche Stimme.
 *
 * `getVoices()` ist beim ersten Aufruf oft noch leer – die Liste kommt
 * asynchron nach. Deshalb wird sie bei jedem Sprechen neu befragt statt einmal
 * gemerkt; findet sich keine deutsche, spricht die Standardstimme mit
 * `lang="de-DE"`, was auf den meisten Geräten trotzdem passt.
 */
function deutscheStimme(): SpeechSynthesisVoice | undefined {
  const stimmen = speechSynthesis.getVoices();
  return stimmen.find((s) => s.lang.toLowerCase().startsWith("de"));
}

/**
 * Liest einen Text vor. Ein neuer Text bricht den alten ab: Zwei Stimmen
 * übereinander versteht kein Kind, und beim schnellen Weiterklicken stapelten
 * sich sonst die Aufgaben.
 */
export function sprich(text: string): void {
  if (!vorlesenMoeglich() || !text.trim()) return;
  try {
    speechSynthesis.cancel();
    const spruch = new SpeechSynthesisUtterance(text);
    spruch.lang = "de-DE";
    // Etwas langsamer als normal: Für ein Kind der 2. Klasse ist die
    // Standardgeschwindigkeit zu schnell zum Mitdenken.
    spruch.rate = 0.9;
    const stimme = deutscheStimme();
    if (stimme) spruch.voice = stimme;
    speechSynthesis.speak(spruch);
  } catch {
    // Manche Browser werfen, wenn noch keine Nutzergeste vorlag. Dann bleibt
    // die Aufgabe eben stumm – lesbar ist sie weiterhin.
  }
}

/** Bricht ein laufendes Vorlesen ab (Ansichtswechsel, Abbrechen). */
export function schweig(): void {
  if (!vorlesenMoeglich()) return;
  try {
    speechSynthesis.cancel();
  } catch {
    // nichts zu tun
  }
}
