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
/**
 * So viele Tagesbilanzen werden aufgehoben. Die Zahl steht EINMAL hier: Sie
 * wird an drei Stellen gebraucht (Laden, Fortschreiben, Zusammenführen), und
 * eine davon zu vergessen hieße, dass der Verlauf je nach Weg unterschiedlich
 * lang wird.
 */
export const MAX_VERLAUF = 90;
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
    puzzleGeloest: 0,
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
  try {
    const text = localStorage.getItem(SCHLUESSEL);
    if (!text) return standardFortschritt();
    return pruefeFortschritt(JSON.parse(text));
  } catch {
    return standardFortschritt();
  }
}

/**
 * Prüft einen Spielstand aus beliebiger Quelle und füllt fehlende Felder auf.
 *
 * Das gilt für den Browserspeicher genauso wie für Daten, die von einem
 * anderen Gerät kommen (`sync.ts`): Beides ist von Hand veränderbar und
 * deshalb ungeprüfte Eingabe.
 */
export function pruefeFortschritt(roh: unknown): Fortschritt {
  const standard = standardFortschritt();
  if (typeof roh !== "object" || roh === null) return standard;
  const daten = roh as Record<string, unknown>;

  const themen = {} as Record<ThemaId, ThemaFortschritt>;
  const gespeicherteThemen = (daten["themen"] ?? {}) as Record<string, unknown>;
  for (const t of THEMEN) themen[t.id] = themaFortschrittAus(gespeicherteThemen[t.id]);

  const erfolge = Array.isArray(daten["erfolge"])
    ? [...new Set(daten["erfolge"].filter((e): e is string => typeof e === "string").slice(0, 100))]
    : [];

  const verlauf = tagesVerlauf(daten["verlauf"]);

  /*
   * Beim Kappen überleben die GRÖSSTEN Einträge, nicht die ersten.
   *
   * Vorher schnitt ein `slice(0, MAX_FEHLERTYPEN)` einfach nach Einfügereihen-
   * folge ab. Wer über die Zeit mehr als 300 Aufgabenarten gesammelt hat,
   * verlor damit ausgerechnet die Schwerpunkte – also genau die Zahlen, auf
   * denen `schwerpunkte()` das gezielte Wiederholen aufbaut, und die im
   * Elternbereich unter „Wo es gerade hakt" stehen.
   */
  const fehler: Record<string, number> = {};
  const rohFehler = daten["fehler"];
  if (typeof rohFehler === "object" && rohFehler !== null) {
    const geprueft = Object.entries(rohFehler)
      .map(([typ, anzahl]) => [typ.slice(0, 60), ganzeZahl(anzahl, 1, MAX_PUNKTE, 0)] as const)
      .filter(([, anzahl]) => anzahl > 0)
      .sort((a, b) => b[1] - a[1])
      .slice(0, MAX_FEHLERTYPEN);
    for (const [typ, anzahl] of geprueft) fehler[typ] = anzahl;
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
    puzzleGeloest: ganzeZahl(daten["puzzleGeloest"], 0, MAX_PUNKTE, 0),
    letzteAufgaben: schluesselListe(daten["letzteAufgaben"]),
  };
}

/**
 * Prüft die Tagesbilanzen.
 *
 * Drei Dinge, die vorher fehlten und alle dasselbe Muster haben – geprüft
 * wurde jeder Wert für sich, aber nicht sein Verhältnis zu den anderen:
 *
 * - **Richtige nie mehr als gestellte.** Die Themenbilanz klemmt das
 *   ausdrücklich; der Verlauf ließ `{ gesamt: 1, richtig: 9999 }` durch.
 * - **Ein Eintrag je Tag.** Standen zwei für denselben Tag da, schrieb
 *   `verlaufFortschreiben()` nur den ersten fort, und der zweite belegte
 *   stumm einen Platz im Vorrat.
 * - **Nach Datum sortiert.** `slice(-90)` behält sonst die letzten neunzig
 *   der ARRAY-Reihenfolge, nicht die neunzig jüngsten Tage.
 */
function tagesVerlauf(wert: unknown): Fortschritt["verlauf"] {
  if (!Array.isArray(wert)) return [];
  const proTag = new Map<string, { tag: string; richtig: number; gesamt: number }>();

  for (const eintrag of wert) {
    if (typeof eintrag !== "object" || eintrag === null) continue;
    const roh = eintrag as Record<string, unknown>;
    if (!istDatum(roh["tag"])) continue;
    const tag = roh["tag"];
    const gesamt = ganzeZahl(roh["gesamt"], 0, MAX_PUNKTE, 0);
    const richtig = Math.min(gesamt, ganzeZahl(roh["richtig"], 0, MAX_PUNKTE, 0));
    const bisher = proTag.get(tag);
    // Dieselbe Regel wie beim Zusammenführen zweier Geräte: je Tag das Größere.
    proTag.set(tag, {
      tag,
      gesamt: Math.max(bisher?.gesamt ?? 0, gesamt),
      richtig: Math.max(bisher?.richtig ?? 0, richtig),
    });
  }

  return [...proTag.values()].sort((a, b) => a.tag.localeCompare(b.tag)).slice(-MAX_VERLAUF);
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

export { istThemaId };
