import { einmaleins, geteilt } from "./rechnen.js";
import { geld, laengen, uhrzeit } from "./groessen.js";
import { geometrie } from "./geometrie.js";
import { knobeln, plusminus, zahlenraum } from "./zahlen.js";
import { analogie } from "./analogie.js";
import { familien } from "./familien.js";
import { mauern } from "./mauern.js";
import { sachaufgaben } from "./sachaufgaben.js";
/** Ein Generator je Thema. Neue Themen brauchen hier einen Eintrag. */
export const GENERATOREN = {
    zahlenraum,
    plusminus,
    analogie,
    familien,
    mauern,
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
/** Anzahl der Aufgaben im Rechenmeister (Runde gegen die Uhr). */
export const MEISTERLAENGE = 20;
/**
 * Themen des Rechenmeisters. Wie im Lernheft geht es dort um Plus und Minus
 * samt ihrer Tricks – nicht um Uhrzeit, Geld oder Formen.
 */
export const MEISTER_THEMEN = [
    "plusminus",
    "analogie",
    "familien",
    "mauern",
    "zahlenraum",
];
function kennung(aufgabe) {
    return `${aufgabe.frage}|${aufgabe.rechnung ?? ""}`;
}
/**
 * Baut eine komplette Übungsrunde. Innerhalb einer Runde wird dieselbe
 * Aufgabe nicht zweimal gestellt – bei kleinen Zahlenräumen (z. B. Uhrzeit
 * Stufe 1) kann das nicht immer gelingen, deshalb bricht die Suche nach
 * einigen Versuchen ab statt endlos zu laufen.
 */
export function runde(thema, rng, stufe, anzahl = RUNDENLAENGE) {
    const generator = GENERATOREN[thema];
    const aufgaben = [];
    const gesehen = new Set();
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
/**
 * Gemischte Runde über mehrere Themen – für das tägliche Training und für den
 * Rechenmeister. Ohne `themen` kommen alle Bereiche vor.
 */
export function gemischteRunde(rng, stufen, anzahl = RUNDENLAENGE, themen = Object.keys(GENERATOREN)) {
    const reihenfolge = [];
    while (reihenfolge.length < anzahl)
        reihenfolge.push(...rng.shuffle([...themen]));
    const gesehen = new Set();
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
