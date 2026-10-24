import type { ThemaId, ThemaInfo } from "./types.js";

/**
 * Alle Übungsbereiche in der Reihenfolge, in der sie auf der Startseite
 * erscheinen. Zuerst kommen die Themen aus dem Übungsheft (`ausHeft`), danach
 * die ergänzenden Bereiche. Die Inhalte orientieren sich an den Lehrplänen der 2. Klasse:
 * Zahlenraum bis 100, halbschriftliches Rechnen, kleines Einmaleins, Größen
 * (Geld, Zeit, Längen) und erste Geometrie.
 */
export const THEMEN: readonly ThemaInfo[] = [
  {
    id: "plusminus",
    titel: "Plus & Minus",
    kurz: "Rechnen bis 100 – mit und ohne Zehnerübergang",
    symbol: "plusminus",
    farbe: "gruen",
    stufen: [
      "bis 20, volle Zehner, mehrere Summanden, Ergänzen bis 10 und 20",
      "bis 100 ohne Zehnerübergang, Ergänzen zum nächsten Zehner",
      "mit Zehnerübergang, Platzhalter, mehrere Summanden und Rechentabellen",
    ],
    ausHeft: true,
  },
  {
    id: "analogie",
    titel: "Rechentricks",
    kurz: "Analogieaufgaben – von der Hilfsaufgabe zum Ergebnis",
    symbol: "gluehbirne",
    farbe: "gruen",
    stufen: [
      "von den Einern zu den Zehnern (3 + 4 → 30 + 40) und Nachbaraufgaben (7 + 7 → 7 + 8)",
      "Zehner davor (3 + 2 → 13 + 2), plus und minus 10, Zehneraufgaben und Nachbaraufgaben mit Minus",
      "Hunderter, Analogien über den Zehner, Zehner davor bis 100, Lücken und Tabellenzeilen",
    ],
    ausHeft: true,
  },
  {
    id: "familien",
    titel: "Aufgabenfamilien",
    kurz: "3 Zahlen, 4 Aufgaben – Tausch- und Umkehraufgaben",
    symbol: "familie",
    farbe: "blau",
    stufen: [
      "Umkehraufgaben bis 20",
      "Umkehraufgaben, Tauschaufgaben, ganze Familien und die fehlende dritte Zahl",
      "Lückenaufgaben in allen vier Formen bis 100",
    ],
    ausHeft: true,
  },
  {
    id: "zahlenraum",
    titel: "Zahlen bis 100",
    kurz: "Vorgänger, Nachfolger, Zehner und Einer",
    symbol: "zahlen",
    farbe: "blau",
    stufen: [
      "Vorgänger/Nachfolger, Zehner und Einer, größer/kleiner, Hunderterfeld",
      "Nachbarzehner, Zahlenfolgen mit Pfeilschritten, Zahlenstrahl, Rechenstrich, Hunderterfeld",
      "Zahlen ordnen, runden, Mitte finden, Regeln finden, Hunderterfeld-Ausschnitte",
    ],
    ausHeft: true,
  },
  {
    id: "mauern",
    titel: "Mauern & Räder",
    kurz: "Zahlenmauern, Rechendreiecke, Kästen und Räder",
    symbol: "mauer",
    farbe: "orange",
    stufen: [
      "Zahlenmauer mit zwei Steinen, Rechenkasten, Rechenrad, Rechendreieck bis 20",
      "Lücke unten in der Mauer, Mauern ausfüllen, Kasten rückwärts, größere Räder, Innenzahl im Dreieck",
      "Mauern mit vier Grundsteinen, Kästen und Räder bis 100, Dreiecke ohne Hilfsseite",
    ],
    ausHeft: true,
  },
  {
    id: "geld",
    titel: "Geld",
    kurz: "Euro und Cent, Bezahlen und Rückgeld",
    symbol: "geld",
    farbe: "gruen",
    stufen: [
      "Münzen zusammenzählen und vergleichen, passende Münzen finden, Geldgeschichten",
      "Euro und Cent umrechnen, Geldtabelle, immer 10 Euro, Beträge legen, Preise vergleichen",
      "Bezahlen, Rückgeld, Geldtabelle ohne Hilfe, streiche durch, was zu viel ist",
    ],
    ausHeft: true,
  },
  {
    id: "geometrie",
    titel: "Formen",
    kurz: "Figuren erkennen, Muster fortsetzen, Ecken zählen",
    symbol: "formen",
    farbe: "lila",
    stufen: [
      "Formen erkennen, Muster nach rechts fortsetzen, Puzzleteile zuordnen",
      "Ecken und Seiten zählen, Muster nach links fortsetzen, Grundmuster finden, welche Form passt nicht",
      "Spiegelachsen, Körper, Umfang – dazu schwerere Muster und Formen",
    ],
    ausHeft: true,
  },
  {
    id: "einmaleins",
    titel: "Einmaleins",
    kurz: "Die Malreihen von 1 bis 10",
    symbol: "mal",
    farbe: "orange",
    stufen: ["1er, 2er, 5er und 10er, Punktefelder", "1er, 2er, 5er und 10er, dazu 3er und 4er", "alle Reihen und Umkehraufgaben"],
    ausHeft: false,
  },
  {
    id: "geteilt",
    titel: "Geteilt",
    kurz: "Teilen als Umkehrung des Malnehmens",
    symbol: "geteilt",
    farbe: "lila",
    stufen: [":2, :5 und :10, „Wie oft passt …?“", "alle Reihen ohne Rest, Lückenaufgaben", "Aufgaben mit Rest"],
    ausHeft: false,
  },
  {
    id: "uhrzeit",
    titel: "Uhrzeit",
    kurz: "Die Uhr lesen und Zeitspannen berechnen",
    symbol: "uhr",
    farbe: "blau",
    stufen: [
      "volle und halbe Stunden, die passende Uhr finden",
      "Viertelstunden, „Viertel nach“ und „Viertel vor“",
      "Fünf-Minuten-Schritte und Zeitspannen",
    ],
    ausHeft: false,
  },
  {
    id: "laengen",
    titel: "Längen",
    kurz: "Meter, Zentimeter und Millimeter",
    symbol: "lineal",
    farbe: "orange",
    stufen: [
      "Meter in Zentimeter und zurück, bis zum Meter ergänzen",
      "cm und mm, Meter und Zentimeter gemischt, Längen vergleichen",
      "mit Längen rechnen: zusammenzählen, Reststücke, cm und mm",
    ],
    ausHeft: false,
  },
  {
    id: "sachaufgaben",
    titel: "Sachaufgaben",
    kurz: "Rechengeschichten aus dem Alltag",
    symbol: "buch",
    farbe: "rot",
    stufen: [
      "ein Rechenschritt bis 20",
      "ein Rechenschritt bis 100, auch mit Mal und Geteilt",
      "zwei Rechenschritte, Einkaufen mit Rückgeld, Vergleichen",
    ],
    ausHeft: false,
  },
  {
    id: "knobeln",
    titel: "Knobeln",
    kurz: "Zahlenrätsel, Muster, Verdoppeln und Halbieren",
    symbol: "puzzle",
    farbe: "rot",
    stufen: ["Verdoppeln und Halbieren", "gerade/ungerade, Muster und Nachbarzahlen", "Zahlenrätsel"],
    ausHeft: false,
  },
];

const NACH_ID = new Map<ThemaId, ThemaInfo>(THEMEN.map((t) => [t.id, t]));

export function thema(id: ThemaId): ThemaInfo {
  const gefunden = NACH_ID.get(id);
  if (!gefunden) throw new Error(`Unbekanntes Thema: ${id}`);
  return gefunden;
}

/** Die Themen aus dem Übungsheft – Schwerpunkt der Plattform. */
export const HEFT_THEMEN: readonly ThemaInfo[] = THEMEN.filter((t) => t.ausHeft);

/** Ergänzende Themen, die im Heft nicht vorkommen. */
export const WEITERE_THEMEN: readonly ThemaInfo[] = THEMEN.filter((t) => !t.ausHeft);

export function istThemaId(wert: unknown): wert is ThemaId {
  return typeof wert === "string" && NACH_ID.has(wert as ThemaId);
}
