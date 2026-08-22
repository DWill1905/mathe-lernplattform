/**
 * Geräteübergreifende Synchronisierung über einen **Familien-Code**.
 *
 * Kein Konto, kein Passwort: Auf einem Gerät wird ein achtstelliger Code
 * erzeugt, auf dem zweiten eingetippt – beide sprechen danach dieselbe Zeile
 * im Speicher an. Für eine Kinder-App ist das die einzige Anmeldung, die ein
 * Kind ohne Hilfe schafft.
 *
 * Gegenstelle ist ein Cloudflare Worker (`cloudflare/worker.js`), angesprochen
 * über reines `fetch()` – keine neue Laufzeit-Abhängigkeit. Er kennt genau zwei
 * Endpunkte, `hole` und `speichere`, und beide verlangen den Code.
 *
 * Hier steht bewusst KEIN Zugangsschlüssel: Der Familien-Code ist das einzige
 * Geheimnis. Die Adresse des Workers allein nützt niemandem – ohne Code gibt
 * es keinen Eintrag. Die Einrichtung steht in `README.md`.
 *
 * Die reinen Teile (Code, Zusammenführung, Prüfung) sind ohne Netz und ohne
 * DOM testbar; alle Netzaufrufe nehmen ihr `fetch` als Parameter entgegen.
 */
import { ladeFortschritt, pruefeFortschritt, speichereFortschritt } from "./state.js";
import { THEMEN } from "./topics.js";
/* ------------------------------------------------------------ Einrichtung */
/**
 * Die Adresse des eigenen Workers, ohne Schrägstrich am Ende – etwa
 * `https://zahleneule.mein-name.workers.dev`. Nach dem Eintragen muss auch die
 * CSP in `index.html` dieselbe Adresse erlauben, sonst verwirft der Browser
 * jede Anfrage STILL.
 */
export const WORKER_URL = "https://HIER-EINTRAGEN.workers.dev";
/** Ist die Gegenstelle überhaupt eingetragen? Sonst bleibt der Bereich aus. */
export function eingerichtet() {
    return !WORKER_URL.includes("HIER-EINTRAGEN");
}
/*
 * Der Code liegt bewusst NICHT unter `mathe2:` – so nimmt ihn ein späterer
 * Spielstand-Export nicht versehentlich mit.
 */
const CODE_KEY = "sync:familiencode";
const ZULETZT_KEY = "sync:zuletzt";
/* ------------------------------------------------------------ Familiencode */
/**
 * Zeichenvorrat ohne I, O, 0 und 1 – die verwechselt ein Kind beim Abtippen
 * sonst ständig. 32 Zeichen hoch 8 sind gut eine Billion Möglichkeiten.
 */
const ZEICHEN = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
const CODE_LAENGE = 8;
/**
 * Erzeugt einen neuen Code. Hier – und NUR hier – wird echter Zufall benutzt:
 * `mulberry32` ist absichtlich vorhersagbar, damit Aufgaben reproduzierbar
 * bleiben. Für einen Code, der fremde Zugriffe fernhalten soll, wäre das
 * genau falsch.
 */
export function neuerFamilienCode(zufall = kryptoZufall) {
    const werte = zufall(CODE_LAENGE);
    let code = "";
    for (let i = 0; i < CODE_LAENGE; i++)
        code += ZEICHEN[werte[i] % ZEICHEN.length];
    return code;
}
function kryptoZufall(anzahl) {
    const werte = new Uint8Array(anzahl);
    crypto.getRandomValues(werte);
    return werte;
}
/** Prüft einen von Hand eingetippten Code. Kleinbuchstaben sind erlaubt. */
export function normalisiereCode(eingabe) {
    const code = eingabe.trim().toUpperCase().replace(/[\s-]/g, "");
    if (code.length !== CODE_LAENGE)
        return null;
    for (const zeichen of code)
        if (!ZEICHEN.includes(zeichen))
            return null;
    return code;
}
export function familienCode() {
    try {
        return normalisiereCode(localStorage.getItem(CODE_KEY) ?? "");
    }
    catch {
        return null;
    }
}
export function setzeFamilienCode(code) {
    try {
        if (code === null)
            localStorage.removeItem(CODE_KEY);
        else
            localStorage.setItem(CODE_KEY, code);
    }
    catch {
        // Privater Modus: Dann läuft die App eben ohne Abgleich weiter.
    }
}
/** Zeitpunkt des letzten erfolgreichen Abgleichs, für die Anzeige. */
export function zuletztAbgeglichen() {
    try {
        return localStorage.getItem(ZULETZT_KEY);
    }
    catch {
        return null;
    }
}
/* --------------------------------------------------------- Zusammenführung */
/**
 * Führt zwei Spielstände zusammen.
 *
 * Die Felder zerfallen in zwei Gruppen:
 *
 * - **Gesammeltes** wächst nur: Punkte, Herzen, gelöste Puzzles, Erfolge,
 *   Sterne, beste Serien, gezählte Aufgaben. Hier gewinnt der größere Wert,
 *   und es kann nichts verloren gehen.
 * - **Der aktuelle Stand** beschreibt das Jetzt: Name, Streak, Fehlerbilanz,
 *   zuletzt gestellte Aufgaben – und die **Stufe**. Hier gewinnt das Gerät,
 *   auf dem zuletzt geübt wurde.
 *
 * Die Stufe gehört ausdrücklich zur zweiten Gruppe: Sie kann sinken, damit ein
 * alter Höchststand ein Kind nicht dauerhaft überfordert (siehe
 * `gamification.ts`). Mit dem Maximum zu verschmelzen würde genau das kaputt
 * machen.
 *
 * Was diese Zusammenführung NICHT kann: Haben beide Geräte offline geübt,
 * gehen ein paar gezählte Aufgaben verloren, weil aus zwei gewachsenen Zählern
 * ohne gemeinsamen Ausgangspunkt nicht mehr zu rekonstruieren ist, wie viel
 * jedes beigesteuert hat. Level und Erfolge bleiben dabei immer erhalten.
 */
export function verschmelze(a, b) {
    // „Frischer“ ist, wer zuletzt geübt hat. Bei Gleichstand gewinnt a.
    const frisch = b.letzterTag > a.letzterTag ? b : a;
    const alt = frisch === a ? b : a;
    const themen = {};
    for (const t of THEMEN) {
        const x = a.themen[t.id];
        const y = b.themen[t.id];
        themen[t.id] = {
            // Aktueller Stand: von dem Gerät, auf dem zuletzt geübt wurde.
            stufe: frisch.themen[t.id].stufe,
            // Gesammeltes: das Maximum.
            richtig: Math.max(x.richtig, y.richtig),
            gesamt: Math.max(x.gesamt, y.gesamt),
            sterne: Math.max(x.sterne, y.sterne),
            besteSerie: Math.max(x.besteSerie, y.besteSerie),
        };
    }
    return {
        name: frisch.name || alt.name,
        punkte: Math.max(a.punkte, b.punkte),
        themen,
        erfolge: [...new Set([...a.erfolge, ...b.erfolge])],
        streakTage: frisch.streakTage,
        letzterTag: frisch.letzterTag,
        verlauf: verschmelzeVerlauf(a.verlauf, b.verlauf),
        fehler: frisch.fehler,
        meister: {
            besteTreffer: Math.max(a.meister.besteTreffer, b.meister.besteTreffer),
            // Bei der Zeit ist WENIGER besser – aber 0 heißt „noch keine“.
            besteZeit: besteZeit(a.meister.besteZeit, b.meister.besteZeit),
        },
        herzen: Math.max(a.herzen, b.herzen),
        puzzleGeloest: Math.max(a.puzzleGeloest, b.puzzleGeloest),
        letzteAufgaben: frisch.letzteAufgaben,
    };
}
function besteZeit(x, y) {
    if (x === 0)
        return y;
    if (y === 0)
        return x;
    return Math.min(x, y);
}
/** Tagesbilanzen je Tag zusammenführen – je Tag gewinnt der höhere Wert. */
function verschmelzeVerlauf(a, b) {
    const proTag = new Map();
    for (const eintrag of [...a, ...b]) {
        const bisher = proTag.get(eintrag.tag);
        proTag.set(eintrag.tag, {
            tag: eintrag.tag,
            richtig: Math.max(bisher?.richtig ?? 0, eintrag.richtig),
            gesamt: Math.max(bisher?.gesamt ?? 0, eintrag.gesamt),
        });
    }
    // Dieselbe Obergrenze wie beim Laden – sonst wüchse der Verlauf unbegrenzt.
    return [...proTag.values()].sort((x, y) => x.tag.localeCompare(y.tag)).slice(-90);
}
const KOPFZEILEN = { "Content-Type": "application/json" };
/** Holt den Stand zum Code. `null` heißt: zu diesem Code gibt es noch nichts. */
export async function holeStand(code, hole = fetch) {
    const antwort = await hole(`${WORKER_URL}/hole`, {
        method: "POST",
        headers: KOPFZEILEN,
        body: JSON.stringify({ code }),
    });
    if (!antwort.ok)
        throw new Error(`Server meldet ${antwort.status}`);
    const roh = await antwort.json();
    if (roh === null || typeof roh !== "object")
        return null;
    // Fremde Daten werden genauso streng geprüft wie der eigene Browserspeicher.
    return pruefeFortschritt(roh.daten);
}
/** Schreibt den Stand zum Code. */
export async function sendeStand(code, stand, hole = fetch) {
    const antwort = await hole(`${WORKER_URL}/speichere`, {
        method: "POST",
        headers: KOPFZEILEN,
        body: JSON.stringify({ code, daten: stand }),
    });
    if (!antwort.ok)
        throw new Error(`Server meldet ${antwort.status}`);
}
/**
 * Ein vollständiger Abgleich: holen, zusammenführen, zurückschreiben.
 *
 * Bewusst in dieser Reihenfolge und immer beides – so ist es egal, welches
 * Gerät den Abgleich anstößt.
 */
export async function gleicheAb(hole = fetch) {
    const code = familienCode();
    if (!eingerichtet() || !code)
        return { art: "aus" };
    return abgleichMit(code, hole);
}
/**
 * Der eigentliche Ablauf, ohne die Prüfung auf Einrichtung – so lässt er sich
 * gegen eine Gegenstelle im Speicher vollständig durchspielen, auch bevor ein
 * echtes Supabase-Projekt eingetragen ist.
 */
export async function abgleichMit(code, hole = fetch) {
    try {
        const fremd = await holeStand(code, hole);
        const eigen = ladeFortschritt();
        if (fremd === null) {
            await sendeStand(code, eigen, hole);
            merkeZeitpunkt();
            return { art: "gesendet" };
        }
        const zusammen = verschmelze(eigen, fremd);
        speichereFortschritt(zusammen);
        await sendeStand(code, zusammen, hole);
        merkeZeitpunkt();
        return { art: "verschmolzen" };
    }
    catch (fehler) {
        return { art: "fehler", meldung: fehler instanceof Error ? fehler.message : "unbekannt" };
    }
}
function merkeZeitpunkt() {
    try {
        localStorage.setItem(ZULETZT_KEY, new Date().toISOString());
    }
    catch {
        // Ohne Speicher fehlt nur die Anzeige „zuletzt abgeglichen“.
    }
}
