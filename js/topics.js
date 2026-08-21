/**
 * Alle Übungsbereiche in der Reihenfolge, in der sie auf der Startseite
 * erscheinen. Zuerst kommen die Themen aus dem Übungsheft (`ausHeft`), danach
 * die ergänzenden Bereiche. Die Inhalte orientieren sich an den Lehrplänen der 2. Klasse:
 * Zahlenraum bis 100, halbschriftliches Rechnen, kleines Einmaleins, Größen
 * (Geld, Zeit, Längen) und erste Geometrie.
 */
export const THEMEN = [
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
        ausHeft: true,
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
        ausHeft: true,
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
        ausHeft: true,
    },
    {
        id: "zahlenraum",
        titel: "Zahlen bis 100",
        kurz: "Vorgänger, Nachfolger, Zehner und Einer",
        symbol: "🔢",
        farbe: "blau",
        stufen: [
            "Vorgänger/Nachfolger, Zehner und Einer, größer/kleiner",
            "Nachbarzehner, Zahlenfolgen mit Pfeilschritten, Zahlenstrahl",
            "Zahlen ordnen, runden, Mitte finden, Folgen mit wechselnden Schritten",
        ],
        ausHeft: true,
    },
    {
        id: "mauern",
        titel: "Mauern & Räder",
        kurz: "Zahlenmauern, Rechenkästen und Rechenräder",
        symbol: "🧱",
        farbe: "orange",
        stufen: [
            "Zahlenmauer mit zwei Steinen, Rechenkasten, Rechenrad bis 20",
            "Lücke unten in der Mauer, Kasten rückwärts, größere Räder",
            "Mauern mit drei Grundsteinen und Kästen bis 100",
        ],
        ausHeft: true,
    },
    {
        id: "geld",
        titel: "Geld",
        kurz: "Euro und Cent, Bezahlen und Rückgeld",
        symbol: "💶",
        farbe: "gruen",
        stufen: ["Münzen zusammenzählen", "Euro und Cent umrechnen, Beträge passend legen", "Bezahlen, Rückgeld und Beträge zusammenstellen"],
        ausHeft: true,
    },
    {
        id: "einmaleins",
        titel: "Einmaleins",
        kurz: "Die Malreihen von 1 bis 10",
        symbol: "✖️",
        farbe: "orange",
        stufen: ["1er, 2er, 5er und 10er", "zusätzlich 3er und 4er", "alle Reihen und Umkehraufgaben"],
        ausHeft: false,
    },
    {
        id: "geteilt",
        titel: "Geteilt",
        kurz: "Teilen als Umkehrung des Malnehmens",
        symbol: "➗",
        farbe: "lila",
        stufen: [":2, :5 und :10", "alle Reihen ohne Rest", "Aufgaben mit Rest"],
        ausHeft: false,
    },
    {
        id: "uhrzeit",
        titel: "Uhrzeit",
        kurz: "Die Uhr lesen und Zeitspannen berechnen",
        symbol: "🕒",
        farbe: "blau",
        stufen: ["volle und halbe Stunden", "Viertelstunden", "Fünf-Minuten-Schritte und Zeitspannen"],
        ausHeft: false,
    },
    {
        id: "laengen",
        titel: "Längen",
        kurz: "Meter, Zentimeter und Millimeter",
        symbol: "📏",
        farbe: "orange",
        stufen: ["Meter in Zentimeter", "cm und mm, Längen vergleichen", "mit Längen rechnen"],
        ausHeft: false,
    },
    {
        id: "geometrie",
        titel: "Formen",
        kurz: "Figuren erkennen, Ecken zählen, Symmetrie",
        symbol: "🔷",
        farbe: "lila",
        stufen: ["Formen erkennen und Puzzleteile zuordnen", "Ecken und Seiten zählen, schwierigere Puzzleteile", "Spiegelachsen und Körper"],
        ausHeft: false,
    },
    {
        id: "sachaufgaben",
        titel: "Sachaufgaben",
        kurz: "Rechengeschichten aus dem Alltag",
        symbol: "📖",
        farbe: "rot",
        stufen: ["ein Rechenschritt bis 20", "ein Rechenschritt bis 100", "zwei Rechenschritte"],
        ausHeft: false,
    },
    {
        id: "knobeln",
        titel: "Knobeln",
        kurz: "Zahlenrätsel, Muster, Verdoppeln und Halbieren",
        symbol: "🧩",
        farbe: "rot",
        stufen: ["Verdoppeln und Halbieren", "gerade/ungerade und Muster", "Zahlenrätsel"],
        ausHeft: false,
    },
];
const NACH_ID = new Map(THEMEN.map((t) => [t.id, t]));
export function thema(id) {
    const gefunden = NACH_ID.get(id);
    if (!gefunden)
        throw new Error(`Unbekanntes Thema: ${id}`);
    return gefunden;
}
/** Die Themen aus dem Übungsheft – Schwerpunkt der Plattform. */
export const HEFT_THEMEN = THEMEN.filter((t) => t.ausHeft);
/** Ergänzende Themen, die im Heft nicht vorkommen. */
export const WEITERE_THEMEN = THEMEN.filter((t) => !t.ausHeft);
export function istThemaId(wert) {
    return typeof wert === "string" && NACH_ID.has(wert);
}
