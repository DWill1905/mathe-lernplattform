import type { Rng } from "../random.js";
import type { Aufgabe, AufgabenGenerator, Stufe, ThemaId } from "../types.js";
import { einmaleins, geteilt } from "./rechnen.js";
import { geld, laengen, uhrzeit } from "./groessen.js";
import { geometrie } from "./geometrie.js";
import { knobeln, plusminus, zahlenraum } from "./zahlen.js";
import { sachaufgaben } from "./sachaufgaben.js";

/** Ein Generator je Thema. Neue Themen brauchen hier einen Eintrag. */
export const GENERATOREN: Record<ThemaId, AufgabenGenerator> = {
  zahlenraum,
  plusminus,
  einmaleins,
  geteilt,
  geld,
  uhrzeit,
  laengen,
  geometrie,
  sachaufgaben,
  knobeln,
};

/** Anzahl der Aufgaben in einer Übungsrunde. */
export const RUNDENLAENGE = 10;

function kennung(aufgabe: Aufgabe): string {
  return `${aufgabe.frage}|${aufgabe.rechnung ?? ""}`;
}

/**
 * Baut eine komplette Übungsrunde. Innerhalb einer Runde wird dieselbe
 * Aufgabe nicht zweimal gestellt – bei kleinen Zahlenräumen (z. B. Uhrzeit
 * Stufe 1) kann das nicht immer gelingen, deshalb bricht die Suche nach
 * einigen Versuchen ab statt endlos zu laufen.
 */
export function runde(thema: ThemaId, rng: Rng, stufe: Stufe, anzahl = RUNDENLAENGE): Aufgabe[] {
  const generator = GENERATOREN[thema];
  const aufgaben: Aufgabe[] = [];
  const gesehen = new Set<string>();
  while (aufgaben.length < anzahl) {
    let kandidat = generator(rng, stufe);
    for (let versuch = 0; versuch < 12 && gesehen.has(kennung(kandidat)); versuch++) {
      kandidat = generator(rng, stufe);
    }
    gesehen.add(kennung(kandidat));
    aufgaben.push(kandidat);
  }
  return aufgaben;
}

/** Gemischte Runde über alle Themen – für das tägliche Training. */
export function gemischteRunde(
  rng: Rng,
  stufen: Record<ThemaId, Stufe>,
  anzahl = RUNDENLAENGE
): { thema: ThemaId; aufgabe: Aufgabe }[] {
  const themen = Object.keys(GENERATOREN) as ThemaId[];
  const reihenfolge: ThemaId[] = [];
  while (reihenfolge.length < anzahl) reihenfolge.push(...rng.shuffle(themen));
  const gesehen = new Set<string>();
  return reihenfolge.slice(0, anzahl).map((thema) => {
    const stufe = stufen[thema];
    let aufgabe = GENERATOREN[thema](rng, stufe);
    for (let versuch = 0; versuch < 12 && gesehen.has(kennung(aufgabe)); versuch++) {
      aufgabe = GENERATOREN[thema](rng, stufe);
    }
    gesehen.add(kennung(aufgabe));
    return { thema, aufgabe };
  });
}
