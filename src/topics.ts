import type { ThemaId, ThemaInfo } from "./types.js";

/**
 * Alle Übungsbereiche in der Reihenfolge, in der sie auf der Startseite
 * erscheinen. Die Inhalte orientieren sich an den Lehrplänen der 2. Klasse:
 * Zahlenraum bis 100, halbschriftliches Rechnen, kleines Einmaleins, Größen
 * (Geld, Zeit, Längen) und erste Geometrie.
 */
export const THEMEN: readonly ThemaInfo[] = [
  {
    id: "zahlenraum",
    titel: "Zahlen bis 100",
    kurz: "Vorgänger, Nachfolger, Zehner und Einer",
    symbol: "🔢",
    farbe: "blau",
    stufen: [
      "Vorgänger/Nachfolger, Zehner und Einer, größer/kleiner",
      "Nachbarzehner, Zahlenfolgen, Zahl aus Zehnern und Einern",
      "Zahlen ordnen, auf Zehner runden, Zahl zwischen zwei Zahlen",
    ],
  },
  {
    id: "plusminus",
    titel: "Plus & Minus",
    kurz: "Rechnen bis 100 – mit und ohne Zehnerübergang",
    symbol: "➕",
    farbe: "gruen",
    stufen: [
      "bis 20 und mit vollen Zehnern",
      "bis 100 ohne Zehnerübergang",
      "mit Zehnerübergang, Platzhalter-Aufgaben und Rechentabellen",
    ],
  },
  {
    id: "analogie",
    titel: "Rechentricks",
    kurz: "Analogieaufgaben – von der Hilfsaufgabe zum Ergebnis",
    symbol: "💡",
    farbe: "gruen",
    stufen: [
      "von den Einern zu den Zehnern (3 + 4 → 30 + 40)",
      "Zehner davor (3 + 2 → 13 + 2) sowie plus und minus 10",
      "Hunderter, Lückenaufgaben und Tabellenzeilen",
    ],
  },
  {
    id: "familien",
    titel: "Aufgabenfamilien",
    kurz: "3 Zahlen, 4 Aufgaben – Tausch- und Umkehraufgaben",
    symbol: "👨‍👩‍👧‍👦",
    farbe: "blau",
    stufen: [
      "Umkehraufgaben bis 20",
      "Tauschaufgaben erkennen und ganze Aufgabenfamilien",
      "Lückenaufgaben in allen vier Formen bis 100",
    ],
  },
  {
    id: "mauern",
    titel: "Mauern & Räder",
    kurz: "Zahlenmauern und Rechenräder",
    symbol: "🧱",
    farbe: "orange",
    stufen: [
      "Zahlenmauer mit zwei Steinen, Rechenrad bis 20",
      "Lücke unten in der Mauer, größere Räder",
      "Mauern mit drei Grundsteinen bis 100",
    ],
  },
  {
    id: "einmaleins",
    titel: "Einmaleins",
    kurz: "Die Malreihen von 1 bis 10",
    symbol: "✖️",
    farbe: "orange",
    stufen: ["1er, 2er, 5er und 10er", "zusätzlich 3er und 4er", "alle Reihen und Umkehraufgaben"],
  },
  {
    id: "geteilt",
    titel: "Geteilt",
    kurz: "Teilen als Umkehrung des Malnehmens",
    symbol: "➗",
    farbe: "lila",
    stufen: [":2, :5 und :10", "alle Reihen ohne Rest", "Aufgaben mit Rest"],
  },
  {
    id: "geld",
    titel: "Geld",
    kurz: "Euro und Cent, Bezahlen und Rückgeld",
    symbol: "💶",
    farbe: "gruen",
    stufen: ["Münzen zusammenzählen", "Euro und Cent umrechnen", "Bezahlen und Rückgeld"],
  },
  {
    id: "uhrzeit",
    titel: "Uhrzeit",
    kurz: "Die Uhr lesen und Zeitspannen berechnen",
    symbol: "🕒",
    farbe: "blau",
    stufen: ["volle und halbe Stunden", "Viertelstunden", "Fünf-Minuten-Schritte und Zeitspannen"],
  },
  {
    id: "laengen",
    titel: "Längen",
    kurz: "Meter, Zentimeter und Millimeter",
    symbol: "📏",
    farbe: "orange",
    stufen: ["Meter in Zentimeter", "cm und mm, Längen vergleichen", "mit Längen rechnen"],
  },
  {
    id: "geometrie",
    titel: "Formen",
    kurz: "Figuren erkennen, Ecken zählen, Symmetrie",
    symbol: "🔷",
    farbe: "lila",
    stufen: ["Formen erkennen", "Ecken und Seiten zählen", "Spiegelachsen und Körper"],
  },
  {
    id: "sachaufgaben",
    titel: "Sachaufgaben",
    kurz: "Rechengeschichten aus dem Alltag",
    symbol: "📖",
    farbe: "rot",
    stufen: ["ein Rechenschritt bis 20", "ein Rechenschritt bis 100", "zwei Rechenschritte"],
  },
  {
    id: "knobeln",
    titel: "Knobeln",
    kurz: "Zahlenrätsel, Muster, Verdoppeln und Halbieren",
    symbol: "🧩",
    farbe: "rot",
    stufen: ["Verdoppeln und Halbieren", "gerade/ungerade und Muster", "Zahlenrätsel"],
  },
];

const NACH_ID = new Map<ThemaId, ThemaInfo>(THEMEN.map((t) => [t.id, t]));

export function thema(id: ThemaId): ThemaInfo {
  const gefunden = NACH_ID.get(id);
  if (!gefunden) throw new Error(`Unbekanntes Thema: ${id}`);
  return gefunden;
}

export function istThemaId(wert: unknown): wert is ThemaId {
  return typeof wert === "string" && NACH_ID.has(wert as ThemaId);
}
