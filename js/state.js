/**
 * Einziger Ort, der `localStorage` liest und schreibt.
 *
 * Der gespeicherte Zustand ist von Hand veränderbar – deshalb prüft
 * `ladeFortschritt()` jedes Feld einzeln auf Typ UND Wertebereich, statt
 * blind `gelesen.feld ?? standard` zu übernehmen. Sonst könnte ein
 * manipulierter Wert (etwa Stufe 99 oder ein Text in einem Zahlenfeld) die
 * Anwendung dauerhaft lahmlegen.
 */
import { THEMEN, istThemaId } from "./topics.js";
const SCHLUESSEL = "mathe2:fortschritt";
/** Obergrenzen – verhindern, dass gespeicherte Daten unbegrenzt wachsen. */
const MAX_PUNKTE = 9_999_999;
const MAX_VERLAUF = 90;
const MAX_FEHLERTYPEN = 300;
const MAX_NAME = 20;
export function heute() {
    return new Date().toISOString().slice(0, 10);
}
function leererThemaFortschritt() {
    return { stufe: 1, richtig: 0, gesamt: 0, sterne: 0, besteSerie: 0 };
}
export function standardFortschritt() {
    const themen = {};
    for (const t of THEMEN)
        themen[t.id] = leererThemaFortschritt();
    return {
        name: "",
        punkte: 0,
        themen,
        erfolge: [],
        streakTage: 0,
        letzterTag: "",
        verlauf: [],
        fehler: {},
        meister: { besteZeit: 0, besteTreffer: 0 },
        herzen: 0,
        raetselGeloest: 0,
    };
}
/* ------------------------------------------------------------- Prüfungen */
function ganzeZahl(wert, min, max, standard) {
    if (typeof wert !== "number" || !Number.isFinite(wert))
        return standard;
    const gerundet = Math.floor(wert);
    if (gerundet < min || gerundet > max)
        return standard;
    return gerundet;
}
function stufeAus(wert) {
    const zahl = ganzeZahl(wert, 1, 3, 1);
    return zahl;
}
function textAus(wert, maxLaenge) {
    return typeof wert === "string" ? wert.slice(0, maxLaenge) : "";
}
function istDatum(wert) {
    return typeof wert === "string" && /^\d{4}-\d{2}-\d{2}$/.test(wert);
}
function themaFortschrittAus(wert) {
    if (typeof wert !== "object" || wert === null)
        return leererThemaFortschritt();
    const roh = wert;
    const gesamt = ganzeZahl(roh["gesamt"], 0, MAX_PUNKTE, 0);
    return {
        stufe: stufeAus(roh["stufe"]),
        gesamt,
        // Richtige Antworten können niemals mehr sein als gestellte Aufgaben.
        richtig: Math.min(gesamt, ganzeZahl(roh["richtig"], 0, MAX_PUNKTE, 0)),
        sterne: ganzeZahl(roh["sterne"], 0, 3, 0),
        besteSerie: ganzeZahl(roh["besteSerie"], 0, MAX_PUNKTE, 0),
    };
}
export function ladeFortschritt() {
    const standard = standardFortschritt();
    let roh;
    try {
        const text = localStorage.getItem(SCHLUESSEL);
        if (!text)
            return standard;
        roh = JSON.parse(text);
    }
    catch {
        return standard;
    }
    if (typeof roh !== "object" || roh === null)
        return standard;
    const daten = roh;
    const themen = {};
    const gespeicherteThemen = (daten["themen"] ?? {});
    for (const t of THEMEN)
        themen[t.id] = themaFortschrittAus(gespeicherteThemen[t.id]);
    const erfolge = Array.isArray(daten["erfolge"])
        ? [...new Set(daten["erfolge"].filter((e) => typeof e === "string").slice(0, 100))]
        : [];
    const verlauf = Array.isArray(daten["verlauf"])
        ? daten["verlauf"]
            .filter((e) => typeof e === "object" && e !== null)
            .filter((e) => istDatum(e["tag"]))
            .map((e) => ({
            tag: e["tag"],
            gesamt: ganzeZahl(e["gesamt"], 0, MAX_PUNKTE, 0),
            richtig: ganzeZahl(e["richtig"], 0, MAX_PUNKTE, 0),
        }))
            .slice(-MAX_VERLAUF)
        : [];
    const fehler = {};
    const rohFehler = daten["fehler"];
    if (typeof rohFehler === "object" && rohFehler !== null) {
        for (const [typ, anzahl] of Object.entries(rohFehler).slice(0, MAX_FEHLERTYPEN)) {
            const geprueft = ganzeZahl(anzahl, 1, MAX_PUNKTE, 0);
            if (geprueft > 0)
                fehler[typ.slice(0, 60)] = geprueft;
        }
    }
    const rohMeister = (daten["meister"] ?? {});
    const meister = {
        // Eine Bestzeit von über zwei Stunden ist keine – dann lieber „noch keine“.
        besteZeit: ganzeZahl(rohMeister["besteZeit"], 0, 7200, 0),
        besteTreffer: ganzeZahl(rohMeister["besteTreffer"], 0, 100, 0),
    };
    return {
        name: textAus(daten["name"], MAX_NAME),
        punkte: ganzeZahl(daten["punkte"], 0, MAX_PUNKTE, 0),
        themen,
        erfolge,
        streakTage: ganzeZahl(daten["streakTage"], 0, 3650, 0),
        letzterTag: istDatum(daten["letzterTag"]) ? daten["letzterTag"] : "",
        verlauf,
        fehler,
        meister,
        herzen: ganzeZahl(daten["herzen"], 0, MAX_PUNKTE, 0),
        raetselGeloest: ganzeZahl(daten["raetselGeloest"], 0, MAX_PUNKTE, 0),
    };
}
export function speichereFortschritt(fortschritt) {
    try {
        localStorage.setItem(SCHLUESSEL, JSON.stringify(fortschritt));
    }
    catch {
        // Privater Modus oder voller Speicher: Die Übung läuft trotzdem weiter.
    }
}
export function setzeZurueck() {
    try {
        localStorage.removeItem(SCHLUESSEL);
    }
    catch {
        // nichts zu tun
    }
}
/** Bequemer Zugriff, wenn nur ein einzelnes Thema gebraucht wird. */
export function themaFortschritt(fortschritt, id) {
    return fortschritt.themen[id] ?? leererThemaFortschritt();
}
export { istThemaId };
