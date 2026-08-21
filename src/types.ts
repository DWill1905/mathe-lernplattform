/** Zentrale Domänen-Typen der Lernplattform. */

export type ThemaId =
  | "zahlenraum"
  | "plusminus"
  | "analogie"
  | "familien"
  | "mauern"
  | "einmaleins"
  | "geteilt"
  | "geld"
  | "uhrzeit"
  | "laengen"
  | "geometrie"
  | "sachaufgaben"
  | "knobeln";

/** Schwierigkeitsstufe innerhalb eines Themas. */
export type Stufe = 1 | 2 | 3;

/**
 * Wie die Antwort eingegeben wird. Zahleneingaben sind immer nicht-negative
 * ganze Zahlen – damit genügt Zweitklässlern das eingebaute Zahlenfeld, und
 * es gibt keine Streitfälle um Komma oder Schreibweise. Alles andere
 * (Uhrzeiten, Formen, Ja/Nein) läuft über Auswahlknöpfe.
 */
export type Antwortfeld =
  | { art: "zahl"; einheit?: string }
  | { art: "auswahl"; optionen: string[] }
  /**
   * Auswahl aus Bildern. Die Lösung ist die `kennung` der richtigen Karte –
   * sie steht auch als Buchstabe unter dem Bild, damit die Rückmeldung
   * („Richtig ist: C“) verständlich bleibt.
   */
  | { art: "bildauswahl"; optionen: { kennung: string; svg: string; beschriftung: string }[] };

/**
 * Vorgeschalteter Rechenschritt („Rechne zuerst die Hilfsaufgabe“). Wer ihn
 * selbst löst, bekommt ein Herz – die Hilfsaufgabe steht danach als Hinweis
 * über der eigentlichen Aufgabe.
 */
export interface Vorstufe {
  frage: string;
  rechnung: string;
  loesung: string;
}

export interface Aufgabe {
  /**
   * Kennung des Aufgaben-TYPS (nicht der einzelnen Aufgabe). Sie ist die
   * Grundlage der Fehlerstatistik im Elternbereich – deshalb stabil halten.
   */
  typ: string;
  /** Fragetext in ganzen Sätzen. */
  frage: string;
  /** Optionale große Rechnung, z. B. `37 + 48 =`. */
  rechnung?: string;
  /**
   * Optionales Erklärbild als SVG-Zeichenkette (siehe `figures.ts`).
   * `breit` nutzt die volle Kartenbreite – nötig bei sehr langen Bildern wie
   * der Pfeilfolge, die sonst auf Briefmarkengröße schrumpfen.
   */
  bild?: { svg: string; beschriftung: string; breit?: boolean };
  antwortfeld: Antwortfeld;
  /** Korrekte Antwort, exakt so wie sie verglichen wird. */
  loesung: string;
  /** Tipp, den Kinder vor dem Antworten aufklappen können. */
  tipp?: string;
  /** Rechenweg, der nach einer falschen Antwort gezeigt wird. */
  erklaerung?: string;
  /** Optionaler erster Schritt, der ein Herz einbringt. */
  vorstufe?: Vorstufe;
}

/** Ein Generator erzeugt zu einer Stufe eine frische Aufgabe. */
export type AufgabenGenerator = (rng: import("./random.js").Rng, stufe: Stufe) => Aufgabe;

export interface ThemaInfo {
  id: ThemaId;
  titel: string;
  kurz: string;
  /** Name eines Symbols aus `icons.ts` – kein Emoji. */
  symbol: import("./icons.js").IconName;
  farbe: string;
  /** Was in den drei Stufen geübt wird – erscheint im Elternbereich. */
  stufen: [string, string, string];
  /**
   * Kommt dieses Thema im Übungsheft der 2. Klasse vor, an dem das Kind
   * gerade arbeitet? Solche Themen stehen auf der Startseite oben, werden
   * bevorzugt empfohlen und häufiger ins gemischte Training gezogen.
   */
  ausHeft: boolean;
}

export interface ThemaFortschritt {
  stufe: Stufe;
  richtig: number;
  gesamt: number;
  /** 0–3 Sterne, aus den besten Runden je Stufe. */
  sterne: number;
  besteSerie: number;
}

export interface Fortschritt {
  name: string;
  punkte: number;
  themen: Record<ThemaId, ThemaFortschritt>;
  erfolge: string[];
  streakTage: number;
  letzterTag: string;
  /** Tagesbilanz der letzten Wochen für die Aktivitätsübersicht. */
  verlauf: { tag: string; richtig: number; gesamt: number }[];
  /** Aufgabentyp → Anzahl Fehler, für den Elternbereich. */
  fehler: Record<string, number>;
  /** Bestwerte des Rechenmeisters (Zeit in Sekunden, 0 = noch keiner). */
  meister: { besteZeit: number; besteTreffer: number };
  /** Gesammelte Herzen aus selbst gelösten Hilfsaufgaben. */
  herzen: number;
  /** Fehlerfrei gelöste Rätselwörter. */
  raetselGeloest: number;
  /**
   * Kurzschlüssel der zuletzt gestellten Aufgaben. Die nächste Runde meidet
   * sie, damit nicht jede Sitzung dieselben Rechnungen zeigt.
   */
  letzteAufgaben: string[];
}

/** Ergebnis einer abgeschlossenen Übungsrunde. */
export interface RundenErgebnis {
  thema: ThemaId;
  stufe: Stufe;
  richtig: number;
  gesamt: number;
  sterne: number;
  punkte: number;
  /** In dieser Runde verdiente Herzen. */
  herzen: number;
  neueErfolge: string[];
  stufeAufgestiegen: boolean;
}
