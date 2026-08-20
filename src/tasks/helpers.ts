import type { Rng } from "../random.js";
import type { Antwortfeld } from "../types.js";

/** Zahleneingabe – Lösungen sind immer nicht-negative ganze Zahlen. */
export function zahlfeld(einheit?: string): Antwortfeld {
  return einheit ? { art: "zahl", einheit } : { art: "zahl" };
}

/**
 * Auswahlfeld aus der richtigen Antwort und passenden Ablenkern. Doppelte
 * Einträge fallen heraus, die Reihenfolge wird gemischt.
 */
export function auswahlfeld(
  rng: Rng,
  richtig: string,
  ablenker: readonly string[],
  anzahl = 4
): Antwortfeld {
  const menge = new Set<string>([richtig]);
  for (const eintrag of rng.shuffle(ablenker)) {
    if (menge.size >= anzahl) break;
    menge.add(eintrag);
  }
  return { art: "auswahl", optionen: rng.shuffle([...menge]) };
}

/** Nachbarzahlen als Ablenker – nie negativ, nie die Lösung selbst. */
export function zahlAblenker(richtig: number, spanne = 10, max = Infinity): string[] {
  const kandidaten = new Set<number>();
  for (let d = 1; d <= spanne; d++) {
    if (richtig - d >= 0) kandidaten.add(richtig - d);
    if (richtig + d <= max) kandidaten.add(richtig + d);
  }
  kandidaten.delete(richtig);
  return [...kandidaten].map(String);
}

/** Kleine Namensliste für Sachaufgaben. */
export const NAMEN: readonly string[] = [
  "Mia",
  "Leon",
  "Emma",
  "Ben",
  "Lina",
  "Paul",
  "Ida",
  "Jonas",
  "Sofia",
  "Elias",
  "Marie",
  "Noah",
];

/** Zwei verschiedene Namen. */
export function zweiNamen(rng: Rng): [string, string] {
  const [a, b] = rng.shuffle(NAMEN);
  return [a!, b!];
}

/** Zahl im deutschen Format (relevant erst ab 1000, aber einheitlich). */
export function de(zahl: number): string {
  return zahl.toLocaleString("de-DE");
}

/** Cent-Betrag als „3 € 40 ct“ bzw. „40 ct“. */
export function geldText(cent: number): string {
  const euro = Math.floor(cent / 100);
  const rest = cent % 100;
  if (euro === 0) return `${rest} ct`;
  if (rest === 0) return `${euro} €`;
  return `${euro} € ${rest} ct`;
}

/** Uhrzeit als „14:05“. */
export function uhrText(stunde: number, minute: number): string {
  return `${stunde}:${String(minute).padStart(2, "0")}`;
}
