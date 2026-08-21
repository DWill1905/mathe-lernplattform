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
 * Kurzschlüssel einer Aufgabe für das Gedächtnis über Runden hinweg. Die volle
 * Kennung enthält bei Bildaufgaben das komplette SVG und wäre kilobytegroß –
 * im `localStorage` stünde nach wenigen Runden mehr Bild als Fortschritt.
 * Deshalb wird sie mit FNV-1a auf 32 Bit eingedampft. Eine Kollision ist
 * folgenlos: Der Verlauf ist nur ein Wunsch, keine Sperre.
 */
export function aufgabenSchluessel(aufgabe) {
    const text = kennung(aufgabe);
    let hash = 0x811c9dc5;
    for (let i = 0; i < text.length; i++) {
        hash ^= text.charCodeAt(i);
        hash = Math.imul(hash, 0x01000193);
    }
    return (hash >>> 0).toString(36);
}
/** So viele Kandidaten sieht sich eine Ziehung höchstens an. */
const VERSUCHE = 16;
/**
 * Baut eine komplette Übungsrunde. Innerhalb einer Runde wird dieselbe
 * Aufgabe nicht zweimal gestellt – bei kleinen Zahlenräumen (z. B. Uhrzeit
 * Stufe 1) kann das nicht immer gelingen, deshalb bricht die Suche nach
 * einigen Versuchen ab statt endlos zu laufen.
 */
export function runde(thema, rng, stufe, anzahl = RUNDENLAENGE, schwerpunkte = new Set(), zuletzt = new Set()) {
    const generator = GENERATOREN[thema];
    const aufgaben = [];
    const gesehen = new Set();
    while (aufgaben.length < anzahl) {
        aufgaben.push(zieheAufgabe(() => generator(rng, stufe), gesehen, zuletzt, schwerpunkte, aufgaben.length));
    }
    return aufgaben;
}
/**
 * Zieht eine Aufgabe nach drei Kriterien, in dieser Rangfolge:
 *
 * 1. **Pflicht**: In DIESER Runde noch nicht dran gewesen.
 * 2. **Wunsch**: Auch in den letzten Runden nicht dran gewesen (`zuletzt`).
 * 3. **Wunsch**: Bei jeder zweiten Aufgabe ein Fehlerschwerpunkt – so
 *    wiederholt die Runde gezielt, ohne nur aus Schwachstellen zu bestehen.
 *
 * Die beiden Wünsche sind bewusst keine Sperren: Themen wie „volle Stunden“
 * haben nur ein paar Dutzend mögliche Aufgaben. Wären sie Pflicht, fände die
 * Suche dort irgendwann gar nichts mehr und die Runde bräche ab. Stattdessen
 * gewinnt der beste gefundene Kandidat.
 */
function zieheAufgabe(erzeuge, gesehen, zuletzt, schwerpunkte, platz) {
    const suchtSchwerpunkt = schwerpunkte.size > 0 && platz % 2 === 0;
    let kandidat = erzeuge();
    let bester = null;
    let besterRang = -1;
    for (let versuch = 0; versuch < VERSUCHE; versuch++) {
        if (!gesehen.has(kennung(kandidat))) {
            const frisch = zuletzt.has(aufgabenSchluessel(kandidat)) ? 0 : 2;
            const passend = !suchtSchwerpunkt || schwerpunkte.has(kandidat.typ) ? 1 : 0;
            if (frisch + passend > besterRang) {
                bester = kandidat;
                besterRang = frisch + passend;
            }
            if (besterRang === 3)
                break;
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
export function gemischteRunde(rng, stufen, anzahl = RUNDENLAENGE, themen = MIX_TOPF, schwerpunkte = new Set(), zuletzt = new Set()) {
    const reihenfolge = [];
    while (reihenfolge.length < anzahl)
        reihenfolge.push(...rng.shuffle([...themen]));
    const gesehen = new Set();
    return reihenfolge.slice(0, anzahl).map((thema, platz) => {
        const stufe = stufen[thema];
        const aufgabe = zieheAufgabe(() => GENERATOREN[thema](rng, stufe), gesehen, zuletzt, schwerpunkte, platz);
        return { thema, aufgabe };
    });
}
