/**
 * Punkte, Level, Sterne, Streak und Abzeichen. Alles rein aus dem
 * gespeicherten Fortschritt berechnet – es gibt keinen zweiten Zustand.
 */
import { MAX_VERLAUF, heute, speichereFortschritt, tagesSchluessel } from "./state.js";
import { HEFT_THEMEN, THEMEN } from "./topics.js";
/* ================================================================ Level */
const LEVEL_TITEL = [
    "Zahlen-Entdecker",
    "Rechen-Fuchs",
    "Zahlen-Profi",
    "Mathe-Ass",
    "Rechenmeister",
    "Zahlen-Champion",
    "Mathe-Genie",
    "Mathe-Legende",
];
/** Punkte, die für das Erreichen von Level `stufe` nötig sind. */
export function levelSchwelle(stufe) {
    return 50 * (stufe - 1) * stufe;
}
export function levelInfo(punkte) {
    let stufe = 1;
    while (punkte >= levelSchwelle(stufe + 1))
        stufe++;
    const unten = levelSchwelle(stufe);
    const oben = levelSchwelle(stufe + 1);
    const breite = oben - unten;
    return {
        stufe,
        titel: LEVEL_TITEL[Math.min(stufe - 1, LEVEL_TITEL.length - 1)],
        imLevel: punkte - unten,
        levelBreite: breite,
        anteil: breite === 0 ? 1 : (punkte - unten) / breite,
    };
}
/* ================================================================ Sterne */
/** 0–3 Sterne aus der Trefferquote einer Runde. */
export function sterneFuerRunde(richtig, gesamt) {
    if (gesamt === 0)
        return 0;
    const quote = richtig / gesamt;
    if (quote >= 0.9)
        return 3;
    if (quote >= 0.7)
        return 2;
    if (quote >= 0.5)
        return 1;
    return 0;
}
/** Punkte, die ein selbst gelöstes Herz (Hilfsaufgabe) einbringt. */
export const HERZ_PUNKTE = 5;
/** Punkte einer Runde: schwerere Stufen zählen mehr, fehlerfrei gibt Bonus. */
export function punkteFuerRunde(richtig, gesamt, stufe) {
    const proAufgabe = stufe === 1 ? 10 : stufe === 2 ? 15 : 20;
    const bonus = gesamt > 0 && richtig === gesamt ? 25 : 0;
    return richtig * proAufgabe + bonus;
}
function gesamtRichtig(f) {
    return Object.values(f.themen).reduce((summe, t) => summe + t.richtig, 0);
}
function gesamtRunden(f) {
    return Math.floor(Object.values(f.themen).reduce((summe, t) => summe + t.gesamt, 0) / 10);
}
function gesamtSterne(f) {
    return Object.values(f.themen).reduce((summe, t) => summe + t.sterne, 0);
}
export const ERFOLGE = [
    {
        id: "start",
        titel: "Los geht’s!",
        text: "Die erste Übungsrunde geschafft.",
        symbol: "rakete",
        erreicht: (f) => gesamtRunden(f) >= 1,
    },
    {
        id: "hundert",
        titel: "Hundert Treffer",
        text: "100 Aufgaben richtig gelöst.",
        symbol: "hakenDoppelt",
        erreicht: (f) => gesamtRichtig(f) >= 100,
    },
    {
        id: "fuenfhundert",
        titel: "Rechen-Marathon",
        text: "500 Aufgaben richtig gelöst.",
        symbol: "medaille",
        erreicht: (f) => gesamtRichtig(f) >= 500,
    },
    {
        id: "sternensammler",
        titel: "Sternensammler",
        text: "In mindestens acht Themen einen Stern geholt.",
        symbol: "stern",
        erreicht: (f) => Object.values(f.themen).filter((t) => t.sterne > 0).length >= 8,
    },
    {
        id: "alle-themen",
        titel: "Rundum neugierig",
        text: "In jedem Thema mindestens zehn Aufgaben gelöst.",
        symbol: "karte",
        erreicht: (f) => Object.values(f.themen).every((t) => t.gesamt >= 10),
    },
    {
        id: "serie",
        titel: "Nie danebengetippt",
        text: "Zehn richtige Antworten hintereinander.",
        symbol: "ziel",
        erreicht: (f) => Object.values(f.themen).some((t) => t.besteSerie >= 10),
    },
    {
        id: "streak3",
        titel: "Drei Tage dabei",
        text: "An drei Tagen hintereinander geübt.",
        symbol: "flamme",
        erreicht: (f) => f.streakTage >= 3,
    },
    {
        id: "streak7",
        titel: "Eine ganze Woche",
        text: "An sieben Tagen hintereinander geübt.",
        symbol: "flamme",
        erreicht: (f) => f.streakTage >= 7,
    },
    {
        id: "einmaleins",
        titel: "Einmaleins-Meister",
        text: "Im Einmaleins die dritte Stufe mit drei Sternen geschafft.",
        symbol: "mal",
        erreicht: (f) => (f.themen.einmaleins?.stufe ?? 1) === 3 && (f.themen.einmaleins?.sterne ?? 0) === 3,
    },
    {
        id: "uhr",
        titel: "Uhr im Griff",
        text: "Bei der Uhrzeit die dritte Stufe mit drei Sternen geschafft.",
        symbol: "uhr",
        erreicht: (f) => (f.themen.uhrzeit?.stufe ?? 1) === 3 && (f.themen.uhrzeit?.sterne ?? 0) === 3,
    },
    {
        id: "sterne20",
        titel: "Sternenhimmel",
        text: "Insgesamt 20 Sterne gesammelt.",
        symbol: "funkeln",
        erreicht: (f) => gesamtSterne(f) >= 20,
    },
    {
        id: "rechenmeister",
        titel: "Blitzrechner",
        text: "Im Rechenmeister alle 20 Aufgaben richtig gelöst.",
        symbol: "stoppuhr",
        erreicht: (f) => f.meister.besteTreffer >= 20,
    },
    {
        id: "herzen25",
        titel: "Herzensache",
        text: "25 Hilfsaufgaben selbst gelöst.",
        symbol: "herz",
        erreicht: (f) => f.herzen >= 25,
    },
    {
        id: "puzzle",
        titel: "Puzzlemeister",
        text: "Ein Rätselwort ganz ohne Fehler gelöst.",
        symbol: "puzzle",
        erreicht: (f) => f.puzzleGeloest >= 1,
    },
    {
        id: "level5",
        titel: "Rechenmeister",
        text: "Level 5 erreicht.",
        symbol: "krone",
        erreicht: (f) => levelInfo(f.punkte).stufe >= 5,
    },
];
/* ==================================================== Fehlerschwerpunkte */
/**
 * Schreibt die Fehlerbilanz fort. Jeder Fehler zählt hoch, jede richtige
 * Antwort desselben Typs wieder herunter – so steht in der Bilanz, wo es
 * AKTUELL hakt, und nicht, was vor Wochen einmal schwerfiel.
 */
function buchefehler(f, falsch, richtig) {
    for (const typ of falsch)
        f.fehler[typ] = (f.fehler[typ] ?? 0) + 1;
    for (const typ of richtig) {
        const stand = (f.fehler[typ] ?? 0) - 1;
        if (stand > 0)
            f.fehler[typ] = stand;
        else
            delete f.fehler[typ];
    }
}
/** Wie oft ein Fehlertyp auftreten muss, bevor er gezielt wiederholt wird. */
export const SCHWERPUNKT_AB = 2;
/**
 * Aufgabentypen, die gezielt wiederholt werden sollen: die häufigsten
 * Fehlerarten. Eine leere Menge heißt „nichts Besonderes üben“.
 */
export function schwerpunkte(f, anzahl = 8) {
    return new Set(Object.entries(f.fehler)
        .filter(([, wie_oft]) => wie_oft >= SCHWERPUNKT_AB)
        .sort((a, b) => b[1] - a[1])
        .slice(0, anzahl)
        .map(([typ]) => typ));
}
/* =========================================================== Auswertung */
function gestern() {
    const datum = new Date();
    datum.setDate(datum.getDate() - 1);
    return tagesSchluessel(datum);
}
function streakFortschreiben(f) {
    const tag = heute();
    if (f.letzterTag === tag)
        return;
    f.streakTage = f.letzterTag === gestern() ? f.streakTage + 1 : 1;
    f.letzterTag = tag;
}
function verlaufFortschreiben(f, richtig, gesamt) {
    const tag = heute();
    const vorhanden = f.verlauf.find((e) => e.tag === tag);
    if (vorhanden) {
        vorhanden.richtig += richtig;
        vorhanden.gesamt += gesamt;
    }
    else {
        f.verlauf.push({ tag, richtig, gesamt });
    }
    if (f.verlauf.length > MAX_VERLAUF)
        f.verlauf = f.verlauf.slice(-MAX_VERLAUF);
}
/**
 * Passt die Stufe an: Wer eine Runde fast fehlerfrei löst, steigt auf; wer
 * deutlich unter der Hälfte bleibt, übt eine Stufe tiefer weiter.
 */
function stufeAnpassen(alt, richtig, gesamt) {
    const quote = gesamt === 0 ? 0 : richtig / gesamt;
    if (quote >= 0.9 && alt < 3)
        return (alt + 1);
    if (quote < 0.4 && alt > 1)
        return (alt - 1);
    return alt;
}
/**
 * Verbucht eine abgeschlossene Runde, speichert den Fortschritt und liefert
 * die Zusammenfassung für die Ergebnisseite.
 */
export function werteRundeAus(f, eingabe) {
    const eintrag = f.themen[eingabe.thema];
    const sterne = sterneFuerRunde(eingabe.richtig, eingabe.gesamt);
    const punkte = punkteFuerRunde(eingabe.richtig, eingabe.gesamt, eingabe.stufe) + eingabe.herzen * HERZ_PUNKTE;
    const vorher = f.erfolge.slice();
    eintrag.gesamt += eingabe.gesamt;
    eintrag.richtig += eingabe.richtig;
    eintrag.sterne = Math.max(eintrag.sterne, sterne);
    eintrag.besteSerie = Math.max(eintrag.besteSerie, eingabe.besteSerie);
    const neueStufe = stufeAnpassen(eingabe.stufe, eingabe.richtig, eingabe.gesamt);
    const aufgestiegen = neueStufe > eintrag.stufe;
    // Nur die zuletzt geübte Stufe bestimmt die nächste – ein alter Höchststand
    // soll ein Kind nicht dauerhaft überfordern.
    eintrag.stufe = neueStufe;
    f.punkte += punkte;
    f.herzen += eingabe.herzen;
    buchefehler(f, eingabe.fehlerTypen, eingabe.richtigeTypen);
    streakFortschreiben(f);
    verlaufFortschreiben(f, eingabe.richtig, eingabe.gesamt);
    for (const erfolg of ERFOLGE) {
        if (!f.erfolge.includes(erfolg.id) && erfolg.erreicht(f))
            f.erfolge.push(erfolg.id);
    }
    const neueErfolge = f.erfolge.filter((id) => !vorher.includes(id));
    speichereFortschritt(f);
    return {
        thema: eingabe.thema,
        stufe: eingabe.stufe,
        richtig: eingabe.richtig,
        gesamt: eingabe.gesamt,
        sterne,
        punkte,
        herzen: eingabe.herzen,
        neueErfolge,
        stufeAufgestiegen: aufgestiegen,
        naechsteStufe: neueStufe,
    };
}
/** Lobende Rückmeldung passend zur Trefferquote. */
export function lobText(richtig, gesamt) {
    const quote = gesamt === 0 ? 0 : richtig / gesamt;
    if (quote === 1)
        return "Perfekt! Alles richtig!";
    if (quote >= 0.9)
        return "Super gemacht!";
    if (quote >= 0.7)
        return "Gut gemacht!";
    if (quote >= 0.5)
        return "Schon ganz ordentlich – weiter so!";
    return "Übung macht den Meister. Probier es gleich noch einmal!";
}
/**
 * Welches Thema als Nächstes? Die Themen aus dem Übungsheft haben Vorrang –
 * die ergänzenden Bereiche kommen erst dran, wenn dort alles läuft.
 */
export function empfehlung(f) {
    const nochNie = HEFT_THEMEN.find((t) => f.themen[t.id].gesamt === 0);
    if (nochNie)
        return nochNie.id;
    let schwaechstes = HEFT_THEMEN[0].id;
    let schlechtesteQuote = Infinity;
    for (const t of HEFT_THEMEN) {
        const eintrag = f.themen[t.id];
        const quote = eintrag.gesamt === 0 ? 0 : eintrag.richtig / eintrag.gesamt;
        if (quote < schlechtesteQuote) {
            schlechtesteQuote = quote;
            schwaechstes = t.id;
        }
    }
    return schwaechstes;
}
/**
 * Wertet eine gemischte Runde aus. Anders als eine Themenrunde verändert sie
 * KEINE Stufen und keine Sterne: Aus ein bis zwei Aufgaben je Thema lässt
 * sich kein verlässliches Können ableiten.
 */
export function werteMixAus(f, eingabe) {
    const vorher = f.erfolge.slice();
    for (const eintrag of eingabe.proThema) {
        const stand = f.themen[eintrag.thema];
        stand.gesamt += eintrag.gesamt;
        stand.richtig += eintrag.richtig;
    }
    const punkte = punkteFuerRunde(eingabe.richtig, eingabe.gesamt, 2) + eingabe.herzen * HERZ_PUNKTE;
    f.punkte += punkte;
    f.herzen += eingabe.herzen;
    buchefehler(f, eingabe.fehlerTypen, eingabe.richtigeTypen);
    streakFortschreiben(f);
    verlaufFortschreiben(f, eingabe.richtig, eingabe.gesamt);
    for (const erfolg of ERFOLGE) {
        if (!f.erfolge.includes(erfolg.id) && erfolg.erreicht(f))
            f.erfolge.push(erfolg.id);
    }
    const neueErfolge = f.erfolge.filter((id) => !vorher.includes(id));
    speichereFortschritt(f);
    return {
        thema: THEMEN[0].id,
        stufe: 2,
        richtig: eingabe.richtig,
        gesamt: eingabe.gesamt,
        sterne: sterneFuerRunde(eingabe.richtig, eingabe.gesamt),
        punkte,
        herzen: eingabe.herzen,
        neueErfolge,
        stufeAufgestiegen: false,
        // Eine gemischte Runde verändert keine Stufe (siehe oben).
        naechsteStufe: 2,
    };
}
/* ============================================================ Rechenmeister */
/**
 * Verbucht einen Lauf des Rechenmeisters. Bestleistung ist zuerst die Zahl
 * der richtigen Aufgaben und erst danach die Zeit – sonst würde schnelles
 * Raten eine sorgfältige Runde schlagen.
 */
export function merkeMeisterErgebnis(f, treffer, sekunden) {
    // Ein Lauf ganz ohne Treffer ist keine Bestleistung – sonst stünde nach dem
    // ersten Versuch „Neue Bestleistung!“ über einem leeren Ergebnis.
    if (treffer <= 0)
        return false;
    const besser = treffer > f.meister.besteTreffer ||
        (treffer === f.meister.besteTreffer && (f.meister.besteZeit === 0 || sekunden < f.meister.besteZeit));
    if (!besser)
        return false;
    f.meister.besteTreffer = treffer;
    f.meister.besteZeit = sekunden;
    return true;
}
/** Sekunden als „2:07 min“. */
export function zeitText(sekunden) {
    const minuten = Math.floor(sekunden / 60);
    const rest = sekunden % 60;
    return `${minuten}:${String(rest).padStart(2, "0")} min`;
}
