import { THEMEN } from "../topics.js";
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
 * Ziehungstopf des gemischten Trainings. Themen aus dem Übungsheft stecken
 * zweimal darin – so kommen sie etwa doppelt so oft dran wie die
 * ergänzenden Bereiche.
 */
export const MIX_TOPF = THEMEN.flatMap((t) => t.ausHeft ? [t.id, t.id] : [t.id]);
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
/**
 * Erkennungsmerkmal einer Aufgabe innerhalb einer Runde. Lösung und Bild
 * gehören dazu: Bei Bildaufgaben (Uhr, Form, Mauer, Tabelle) ist der Fragetext
 * für alle Ausprägungen derselbe – ohne Bild und Lösung im Schlüssel würde die
 * Runde jede zweite Bildaufgabe für eine Dublette halten und stattdessen echte
 * Wiederholungen durchlassen.
 */
function kennung(aufgabe) {
    return `${aufgabe.frage}|${aufgabe.rechnung ?? ""}|${aufgabe.loesung}|${aufgabe.bild?.svg ?? ""}`;
}
/**
 * Baut eine komplette Übungsrunde. Innerhalb einer Runde wird dieselbe
 * Aufgabe nicht zweimal gestellt – bei kleinen Zahlenräumen (z. B. Uhrzeit
 * Stufe 1) kann das nicht immer gelingen, deshalb bricht die Suche nach
 * einigen Versuchen ab statt endlos zu laufen.
 */
export function runde(thema, rng, stufe, anzahl = RUNDENLAENGE, schwerpunkte = new Set()) {
    const generator = GENERATOREN[thema];
    const aufgaben = [];
    const gesehen = new Set();
    while (aufgaben.length < anzahl) {
        aufgaben.push(zieheAufgabe(() => generator(rng, stufe), gesehen, schwerpunkte, aufgaben.length));
    }
    return aufgaben;
}
/**
 * Zieht eine Aufgabe, die noch nicht dran war. Bei jeder zweiten Aufgabe wird
 * bevorzugt ein Fehlerschwerpunkt gesucht – so wiederholt die Runde gezielt,
 * ohne nur noch aus Schwachstellen zu bestehen.
 *
 * Wichtig: Der Schwerpunkt ist nur ein WUNSCH, die Frische ist Pflicht. Kommt
 * die gesuchte Aufgabenart im Thema oder auf der Stufe gar nicht vor, wird der
 * erste frische Kandidat genommen – sonst stünde am Ende fast jede Runde
 * voller Doppelungen.
 */
function zieheAufgabe(erzeuge, gesehen, schwerpunkte, platz) {
    const suchtSchwerpunkt = schwerpunkte.size > 0 && platz % 2 === 0;
    let kandidat = erzeuge();
    let bester = null;
    for (let versuch = 0; versuch < 12; versuch++) {
        if (!gesehen.has(kennung(kandidat))) {
            if (!suchtSchwerpunkt || schwerpunkte.has(kandidat.typ)) {
                bester = kandidat;
                break;
            }
            bester ??= kandidat;
        }
        kandidat = erzeuge();
    }
    const gewaehlt = bester ?? kandidat;
    gesehen.add(kennung(gewaehlt));
    return gewaehlt;
}
/**
 * Gemischte Runde über mehrere Themen – für das tägliche Training und für den
 * Rechenmeister. Ohne `themen` kommen alle Bereiche vor.
 */
export function gemischteRunde(rng, stufen, anzahl = RUNDENLAENGE, themen = MIX_TOPF, schwerpunkte = new Set()) {
    const reihenfolge = [];
    while (reihenfolge.length < anzahl)
        reihenfolge.push(...rng.shuffle([...themen]));
    const gesehen = new Set();
    return reihenfolge.slice(0, anzahl).map((thema, platz) => {
        const stufe = stufen[thema];
        const aufgabe = zieheAufgabe(() => GENERATOREN[thema](rng, stufe), gesehen, schwerpunkte, platz);
        return { thema, aufgabe };
    });
}
