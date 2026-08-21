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
import type { Fortschritt, Stufe, ThemaFortschritt, ThemaId } from "./types.js";

const SCHLUESSEL = "mathe2:fortschritt";

/** Obergrenzen – verhindern, dass gespeicherte Daten unbegrenzt wachsen. */
const MAX_PUNKTE = 9_999_999;
const MAX_VERLAUF = 90;
const MAX_FEHLERTYPEN = 300;
const MAX_NAME = 20;
/** Sechs Runden Gedächtnis – mehr bringt nichts und kostet nur Speicher. */
const MAX_LETZTE = 60;
/** Ein Kurzschlüssel ist ein 32-Bit-Wert in Basis 36, also nie länger. */
const MAX_SCHLUESSEL = 8;

/**
 * Datum als `JJJJ-MM-TT` in der ORTSZEIT. `toISOString()` wäre UTC – in
 * Mitteleuropa würde der Tag dann erst um 1 bzw. 2 Uhr nachts wechseln, und
 * die Wochentagsbeschriftung der Aktivitätsübersicht (lokal) passte nicht mehr
 * zum gespeicherten Schlüssel.
 */
export function tagesSchluessel(datum: Date): string {
  const monat = String(datum.getMonth() + 1).padStart(2, "0");
  const tag = String(datum.getDate()).padStart(2, "0");
  return `${datum.getFullYear()}-${monat}-${tag}`;
}

export function heute(): string {
  return tagesSchluessel(new Date());
}

function leererThemaFortschritt(): ThemaFortschritt {
  return { stufe: 1, richtig: 0, gesamt: 0, sterne: 0, besteSerie: 0 };
}

export function standardFortschritt(): Fortschritt {
  const themen = {} as Record<ThemaId, ThemaFortschritt>;
  for (const t of THEMEN) themen[t.id] = leererThemaFortschritt();
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
    letzteAufgaben: [],
  };
}

/* ------------------------------------------------------------- Prüfungen */

function ganzeZahl(wert: unknown, min: number, max: number, standard: number): number {
  if (typeof wert !== "number" || !Number.isFinite(wert)) return standard;
  const gerundet = Math.floor(wert);
  if (gerundet < min || gerundet > max) return standard;
  return gerundet;
}

function stufeAus(wert: unknown): Stufe {
  const zahl = ganzeZahl(wert, 1, 3, 1);
  return zahl as Stufe;
}

function textAus(wert: unknown, maxLaenge: number): string {
  return typeof wert === "string" ? wert.slice(0, maxLaenge) : "";
}

function istDatum(wert: unknown): wert is string {
  return typeof wert === "string" && /^\d{4}-\d{2}-\d{2}$/.test(wert);
}

function themaFortschrittAus(wert: unknown): ThemaFortschritt {
  if (typeof wert !== "object" || wert === null) return leererThemaFortschritt();
  const roh = wert as Record<string, unknown>;
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

export function ladeFortschritt(): Fortschritt {
  const standard = standardFortschritt();
  let roh: unknown;
  try {
    const text = localStorage.getItem(SCHLUESSEL);
    if (!text) return standard;
    roh = JSON.parse(text);
  } catch {
    return standard;
  }
  if (typeof roh !== "object" || roh === null) return standard;
  const daten = roh as Record<string, unknown>;

  const themen = {} as Record<ThemaId, ThemaFortschritt>;
  const gespeicherteThemen = (daten["themen"] ?? {}) as Record<string, unknown>;
  for (const t of THEMEN) themen[t.id] = themaFortschrittAus(gespeicherteThemen[t.id]);

  const erfolge = Array.isArray(daten["erfolge"])
    ? [...new Set(daten["erfolge"].filter((e): e is string => typeof e === "string").slice(0, 100))]
    : [];

  const verlauf = Array.isArray(daten["verlauf"])
    ? daten["verlauf"]
        .filter((e): e is Record<string, unknown> => typeof e === "object" && e !== null)
        .filter((e) => istDatum(e["tag"]))
        .map((e) => ({
          tag: e["tag"] as string,
          gesamt: ganzeZahl(e["gesamt"], 0, MAX_PUNKTE, 0),
          richtig: ganzeZahl(e["richtig"], 0, MAX_PUNKTE, 0),
        }))
        .slice(-MAX_VERLAUF)
    : [];

  const fehler: Record<string, number> = {};
  const rohFehler = daten["fehler"];
  if (typeof rohFehler === "object" && rohFehler !== null) {
    for (const [typ, anzahl] of Object.entries(rohFehler).slice(0, MAX_FEHLERTYPEN)) {
      const geprueft = ganzeZahl(anzahl, 1, MAX_PUNKTE, 0);
      if (geprueft > 0) fehler[typ.slice(0, 60)] = geprueft;
    }
  }

  const rohMeister = (daten["meister"] ?? {}) as Record<string, unknown>;
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
    letzteAufgaben: schluesselListe(daten["letzteAufgaben"]),
  };
}

/**
 * Prüft die gespeicherten Kurzschlüssel. Ein manipulierter Eintrag könnte
 * sonst beliebig lang sein oder gar kein Text – beides landete ungeprüft in
 * einem `Set`, das jede Ziehung befragt.
 */
function schluesselListe(wert: unknown): string[] {
  if (!Array.isArray(wert)) return [];
  return wert
    .filter((e): e is string => typeof e === "string" && e.length > 0 && e.length <= MAX_SCHLUESSEL)
    .slice(-MAX_LETZTE);
}

/**
 * Merkt sich, welche Aufgaben gerade gestellt wurden. Wird beim BAU der Runde
 * aufgerufen, nicht erst am Ende – bricht ein Kind mittendrin ab, soll die
 * nächste Runde trotzdem andere Aufgaben zeigen.
 */
export function merkeGestellteAufgaben(schluessel: readonly string[]): void {
  const fortschritt = ladeFortschritt();
  fortschritt.letzteAufgaben = [...fortschritt.letzteAufgaben, ...schluessel].slice(-MAX_LETZTE);
  speichereFortschritt(fortschritt);
}

export function speichereFortschritt(fortschritt: Fortschritt): void {
  try {
    localStorage.setItem(SCHLUESSEL, JSON.stringify(fortschritt));
  } catch {
    // Privater Modus oder voller Speicher: Die Übung läuft trotzdem weiter.
  }
}

export function setzeZurueck(): void {
  try {
    localStorage.removeItem(SCHLUESSEL);
  } catch {
    // nichts zu tun
  }
}

/** Bequemer Zugriff, wenn nur ein einzelnes Thema gebraucht wird. */
export function themaFortschritt(fortschritt: Fortschritt, id: ThemaId): ThemaFortschritt {
  return fortschritt.themen[id] ?? leererThemaFortschritt();
}

export { istThemaId };
