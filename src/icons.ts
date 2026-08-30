/**
 * Das Symbolset der Zahleneule.
 *
 * Statt Emojis (die auf jedem Gerät anders aussehen, sich nicht einfärben
 * lassen und in Screenreadern seltsam vorgelesen werden) zeichnet die App ihre
 * Symbole selbst. Alle Icons liegen in einem 24×24-Raster, sind
 * strichbasiert und nehmen über `currentColor` die Farbe ihrer Umgebung an –
 * dadurch funktionieren sie in Hell und Dunkel und in jeder Themenfarbe.
 *
 * Der Inhalt ist konstanter, projekteigener Code. Er geht über `svgSymbol()`
 * aus `dom.ts` als Markup in die Seite – niemals mit gespeicherten Daten.
 */

import { svgSymbol } from "./dom.js";

/** Inneres Markup je Symbol (Rahmen und Strichattribute setzt `svgSymbol`). */
const FORMEN: Record<string, string> = {
  /* ------------------------------------------------------------ Themen */

  zahlen: '<path d="M9 3.5 7 20.5M17 3.5l-2 17M3.5 9h17M2.5 15h17"/>',

  plusminus: '<path d="M12 4v9M7.5 8.5h9M7.5 18h9"/>',

  gluehbirne:
    '<path d="M9.5 18.5h5M10.5 21.5h3"/><path d="M12 2.5a6.5 6.5 0 0 0-3.8 11.8v2.2h7.6v-2.2A6.5 6.5 0 0 0 12 2.5Z"/>',

  familie:
    '<circle cx="12" cy="6" r="3"/><path d="M7 21v-2.5A3.5 3.5 0 0 1 10.5 15h3a3.5 3.5 0 0 1 3.5 3.5V21"/>' +
    '<circle cx="4.5" cy="11" r="2"/><circle cx="19.5" cy="11" r="2"/><path d="M1.5 21v-1.5A2.5 2.5 0 0 1 4 17M22.5 21v-1.5A2.5 2.5 0 0 0 20 17"/>',

  mauer:
    '<rect x="2.5" y="5" width="19" height="14" rx="2"/><path d="M2.5 12h19M9 5v7M15 12v7"/>',

  geld:
    '<circle cx="12" cy="12" r="9"/><path d="M15.5 8.4A4.6 4.6 0 0 0 8.2 12a4.6 4.6 0 0 0 7.3 3.6"/><path d="M6.5 10.6h5.2M6.5 13.4h5.2"/>',

  mal: '<path d="M6.5 6.5l11 11M17.5 6.5l-11 11"/>',

  geteilt:
    '<path d="M4 12h16"/><circle cx="12" cy="6.6" r="1.5" fill="currentColor" stroke="none"/>' +
    '<circle cx="12" cy="17.4" r="1.5" fill="currentColor" stroke="none"/>',

  uhr: '<circle cx="12" cy="12" r="9"/><path d="M12 6.5V12l3.8 2.2"/>',

  lineal:
    '<rect x="2" y="8" width="20" height="8" rx="2"/><path d="M6.5 8v3.2M10.5 8v4.4M14.5 8v3.2M18.5 8v4.4"/>',

  formen:
    '<circle cx="7" cy="7.5" r="4.5"/><rect x="13" y="13" width="8" height="8" rx="1.5"/><path d="M17 2.5l4.2 7.5h-8.4z"/>',

  buch: '<path d="M4.5 19V5a2 2 0 0 1 2-2H19v18H6.5a2 2 0 0 1-2-2Z"/><path d="M6.5 17H19"/><path d="M9 7h6"/>',

  puzzle:
    '<path d="M4 4.5h4.6a2.7 2.7 0 0 1 5.4 0h5.5v4.6a2.7 2.7 0 0 0 0 5.4v5.5h-5.5a2.7 2.7 0 0 0-5.4 0H4v-5.5a2.7 2.7 0 0 0 0-5.4z"/>',

  /* ------------------------------------------------- Navigation und App */

  haus: '<path d="M3.5 10.5 12 3.5l8.5 7"/><path d="M5.5 9.5V20h13V9.5"/><path d="M10 20v-5.5h4V20"/>',

  diagramm:
    '<path d="M3.5 20.5V3.5"/><path d="M3.5 20.5h17"/><path d="M7 16.5V12M11.5 16.5V8M16 16.5v-6.5M20 16.5V6"/>',

  eltern:
    '<circle cx="8" cy="6.5" r="3"/><circle cx="17.5" cy="8" r="2.5"/>' +
    '<path d="M2.5 20.5v-2A3.5 3.5 0 0 1 6 15h4a3.5 3.5 0 0 1 3.5 3.5v2"/>' +
    '<path d="M16 20.5v-1.8a3 3 0 0 1 3-3h.5a2 2 0 0 1 2 2v2.8"/>',

  stoppuhr:
    '<circle cx="12" cy="13.5" r="7.5"/><path d="M12 9.5v4l2.5 1.8"/><path d="M9.5 2.5h5M12 2.5v3.5"/><path d="m18.5 6.5 1.8-1.8"/>',

  flamme:
    '<path d="M12 2.5s5.5 4.4 5.5 9.5a5.5 5.5 0 0 1-11 0c0-2 .9-3.6 1.8-4.8.4 1 1.1 1.8 2 2.2.5-2.7 1.7-5.2 1.7-6.9Z"/>',

  offline:
    '<path d="M2.2 8.6A15 15 0 0 1 7.6 5.4M16.4 5.4a15 15 0 0 1 5.4 3.2"/>' +
    '<path d="M6.4 12.8a9.5 9.5 0 0 1 3.2-1.9M14.4 10.9a9.5 9.5 0 0 1 3.2 1.9"/>' +
    '<path d="M10.2 16.6a4.5 4.5 0 0 1 3.6 0"/>' +
    '<circle cx="12" cy="20" r="1.3" fill="currentColor" stroke="none"/><path d="M3 3 21 21"/>',

  /* ------------------------------------------------------ Rückmeldungen */

  haken: '<circle cx="12" cy="12" r="9.2"/><path d="m7.8 12.3 2.9 2.9 5.5-6.2"/>',
  pfeil: '<path d="M4 12h15M13 6l6 6-6 6"/>',

  gedanke:
    '<path d="M6.5 15.5A4 4 0 0 1 6 7.6a4.5 4.5 0 0 1 8.4-1.4 3.8 3.8 0 0 1 3.1 6.6 3.5 3.5 0 0 1-2.5 2.7z"/>' +
    '<circle cx="7" cy="19" r="1.6"/><circle cx="4" cy="21.6" r="1"/>',

  /*
   * Pferdekopf im Profil, nach links – die Springer-Silhouette, die auch ein
   * Kind sofort liest: Schnauze, Stirn, zwei Ohren, kräftiger Hals.
   *
   * Gefüllt wie das Herz davor, und bewusst OHNE Auge: Auf einer einfarbigen
   * Fläche müsste es eine Aussparung sein, und die ginge nur mit einer festen
   * Hintergrundfarbe – die verbietet der Dunkelmodus.
   */
  pferd:
    '<path d="M4.8 13.6c-.6-2.1.2-4 2.1-5.4l3.5-4-.7-2.8 3.4 2 1.1-2.2 1.8 3.4c2 1.8 3 4.1 3 6.8v11h-5.6v-9.2c0-1.6-1.1-2.6-2.6-2.6-1.8 0-3.1 1.2-3.6 3.1z" fill="currentColor"/>',

  stern:
    '<path d="m12 3.2 2.7 5.5 6 .9-4.3 4.2 1 6-5.4-2.8-5.4 2.8 1-6L3.3 9.6l6-.9z" fill="currentColor"/>',

  sternLeer: '<path d="m12 3.2 2.7 5.5 6 .9-4.3 4.2 1 6-5.4-2.8-5.4 2.8 1-6L3.3 9.6l6-.9z"/>',

  schloss:
    '<rect x="4.5" y="10.5" width="15" height="10" rx="2.5"/><path d="M8 10.5V7.8a4 4 0 0 1 8 0v2.7"/>' +
    '<circle cx="12" cy="15.5" r="1.4" fill="currentColor" stroke="none"/>',

  /* ----------------------------------------------------------- Abzeichen */

  rakete:
    '<path d="M12 2.5c3.2 2.4 5 6 5 10.2l-1.8 3.3H8.8L7 12.7C7 8.5 8.8 4.9 12 2.5Z"/>' +
    '<circle cx="12" cy="10" r="2"/><path d="M8.8 16 6 18.5l1.2 3 2.4-1.4M15.2 16l2.8 2.5-1.2 3-2.4-1.4"/>',

  medaille:
    '<circle cx="12" cy="15" r="6"/><path d="m8.5 9.5-3-7M15.5 9.5l3-7M9 2.5h6"/>' +
    '<path d="M12 12.4l1 2 2.2.3-1.6 1.5.4 2.2-2-1-2 1 .4-2.2-1.6-1.5 2.2-.3z" fill="currentColor" stroke="none"/>',

  ziel:
    '<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5"/>' +
    '<circle cx="12" cy="12" r="1.6" fill="currentColor" stroke="none"/>',

  karte:
    '<path d="M2.5 6.5 9 4l6 2.5 6.5-2.5v13.5L15 20l-6-2.5L2.5 20z"/><path d="M9 4v13.5M15 6.5V20"/>',

  krone:
    '<path d="M3 8.5 6.5 13 12 4.5 17.5 13 21 8.5V19H3z"/><path d="M3 19h18"/>',

  funkeln:
    '<path d="M11 3.5 12.6 8l4.5 1.6-4.5 1.6L11 15.7 9.4 11.2 4.9 9.6 9.4 8z" fill="currentColor" stroke="none"/>' +
    '<path d="M18 14.5l.8 2.2 2.2.8-2.2.8-.8 2.2-.8-2.2-2.2-.8 2.2-.8z" fill="currentColor" stroke="none"/>',

  hakenDoppelt: '<path d="M2.5 12.6l4 4 7.5-8.6M11 16.6l1.6 1.6 8.9-10.2"/>',

  /* ------------------------------------------------------------ Maskottchen */

  eule:
    '<path d="M12 21c-4.4 0-7.5-3.2-7.5-7.6V9.4C4.5 5.3 7.9 2.5 12 2.5s7.5 2.8 7.5 6.9v4C19.5 17.8 16.4 21 12 21Z" class="eule-koerper"/>' +
    '<circle cx="8.7" cy="10.2" r="3.1" class="eule-auge"/><circle cx="15.3" cy="10.2" r="3.1" class="eule-auge"/>' +
    '<circle cx="8.7" cy="10.4" r="1.3" class="eule-pupille"/><circle cx="15.3" cy="10.4" r="1.3" class="eule-pupille"/>' +
    '<path d="M12 13.2 10.6 15h2.8z" class="eule-schnabel"/>' +
    '<path d="M5.2 6.2 4 3.2l3 1.4M18.8 6.2 20 3.2l-3 1.4" class="eule-ohren"/>',
};

export type IconName = keyof typeof FORMEN & string;

export function istIconName(wert: string): wert is IconName {
  return Object.prototype.hasOwnProperty.call(FORMEN, wert);
}

/** Alle Namen – für den Kontaktbogen und die Tests. */
export const ICON_NAMEN: readonly string[] = Object.keys(FORMEN);

/**
 * Vollständiges SVG eines Symbols. Es trägt keine eigene Größe: Die legt das
 * Stylesheet über `width`/`height` der Klasse fest, damit ein Symbol überall
 * zur Schriftgröße seines Umfelds passt.
 */
export function iconSvg(name: IconName): string {
  const inhalt = FORMEN[name];
  if (!inhalt) throw new Error(`Unbekanntes Symbol: ${name}`);
  return (
    '<svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" fill="none" stroke="currentColor" ' +
    'stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' +
    inhalt +
    "</svg>"
  );
}

/**
 * Symbol als fertiges Element – der übliche Weg in den Ansichten.
 *
 * Die Basisklasse `symbol` wird IMMER gesetzt (sie bringt Größe und Ausrichtung
 * mit); `klasse` kommt zusätzlich dazu. Würde sie ersetzt, verlöre das Symbol
 * seine Maße und fiele auf null zusammen.
 */
export function icon(name: IconName, klasse = ""): HTMLElement {
  return svgSymbol(iconSvg(name), klasse ? `symbol ${klasse}` : "symbol");
}
