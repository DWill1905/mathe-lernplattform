/**
 * Erklärbilder als SVG-Zeichenketten. Bewusst ohne DOM-Zugriff, damit die
 * Funktionen direkt testbar sind.
 *
 * Farben werden ausschließlich über CSS-Klassen (`fig-*` in `style.css`)
 * gesetzt – sonst bricht der Dunkelmodus.
 */

function huelle(breite: number, hoehe: number, inhalt: string): string {
  return `<svg viewBox="0 0 ${breite} ${hoehe}" class="fig" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">${inhalt}</svg>`;
}

/* ------------------------------------------------------------------ Uhr */

/** Analoge Uhr mit Stunden- und Minutenzeiger. */
export function uhr(stunde: number, minute: number): string {
  const m = ((minute % 60) + 60) % 60;
  const h = ((stunde % 12) + 12) % 12;
  const mitte = 100;
  const radius = 88;

  let teile = `<circle cx="100" cy="100" r="${radius}" class="fig-flaeche"/>`;
  teile += `<circle cx="100" cy="100" r="${radius}" class="fig-linie" fill="none" stroke-width="4"/>`;

  for (let i = 0; i < 60; i++) {
    const winkel = (i / 60) * Math.PI * 2 - Math.PI / 2;
    const voll = i % 5 === 0;
    const innen = radius - (voll ? 12 : 6);
    const x1 = mitte + Math.cos(winkel) * innen;
    const y1 = mitte + Math.sin(winkel) * innen;
    const x2 = mitte + Math.cos(winkel) * (radius - 2);
    const y2 = mitte + Math.sin(winkel) * (radius - 2);
    teile += `<line x1="${r(x1)}" y1="${r(y1)}" x2="${r(x2)}" y2="${r(y2)}" class="fig-linie" stroke-width="${voll ? 3 : 1.5}"/>`;
  }

  for (let i = 1; i <= 12; i++) {
    const winkel = (i / 12) * Math.PI * 2 - Math.PI / 2;
    const x = mitte + Math.cos(winkel) * (radius - 26);
    const y = mitte + Math.sin(winkel) * (radius - 26);
    teile += `<text x="${r(x)}" y="${r(y + 6)}" class="fig-text" text-anchor="middle" font-size="18">${i}</text>`;
  }

  const minutenWinkel = (m / 60) * Math.PI * 2 - Math.PI / 2;
  const stundenWinkel = ((h + m / 60) / 12) * Math.PI * 2 - Math.PI / 2;
  teile += zeiger(mitte, stundenWinkel, 46, 7, "fig-zeiger-stunde");
  teile += zeiger(mitte, minutenWinkel, 70, 5, "fig-zeiger-minute");
  teile += `<circle cx="100" cy="100" r="6" class="fig-zeiger-punkt"/>`;

  return huelle(200, 200, teile);
}

function zeiger(mitte: number, winkel: number, laenge: number, breite: number, klasse: string): string {
  const x = mitte + Math.cos(winkel) * laenge;
  const y = mitte + Math.sin(winkel) * laenge;
  return `<line x1="${mitte}" y1="${mitte}" x2="${r(x)}" y2="${r(y)}" class="${klasse}" stroke-width="${breite}" stroke-linecap="round"/>`;
}

/* ---------------------------------------------------------------- Geld */

export interface Muenze {
  /** Wert in Cent. */
  wert: number;
}

/** Reihe aus Münzen und Scheinen. Werte in Cent. */
export function geldbild(werte: readonly number[]): string {
  const proReihe = 5;
  const reihen = Math.ceil(werte.length / proReihe);
  // Nur die tatsächlich belegten Spalten zählen – sonst schrumpfen wenige
  // Münzen auf ein Fünftel der Bildbreite zusammen.
  const breite = Math.max(1, Math.min(werte.length, proReihe)) * 76;
  const hoehe = reihen * 76;
  let teile = "";
  werte.forEach((wert, i) => {
    const spalte = i % proReihe;
    const reihe = Math.floor(i / proReihe);
    const x = spalte * 76 + 38;
    const y = reihe * 76 + 38;
    teile += wert >= 500 ? schein(x, y, wert) : muenze(x, y, wert);
  });
  return huelle(breite, hoehe, teile);
}

function muenze(x: number, y: number, cent: number): string {
  const klasse = cent >= 100 ? "fig-muenze-euro" : cent >= 10 ? "fig-muenze-gold" : "fig-muenze-kupfer";
  const beschriftung = cent >= 100 ? `${cent / 100} €` : `${cent} ct`;
  return (
    `<circle cx="${x}" cy="${y}" r="31" class="${klasse}"/>` +
    `<circle cx="${x}" cy="${y}" r="31" class="fig-linie" fill="none" stroke-width="2.5"/>` +
    `<text x="${x}" y="${y + 6}" class="fig-muenze-text" text-anchor="middle" font-size="17">${beschriftung}</text>`
  );
}

function schein(x: number, y: number, cent: number): string {
  return (
    `<rect x="${x - 34}" y="${y - 21}" width="68" height="42" rx="5" class="fig-schein"/>` +
    `<rect x="${x - 34}" y="${y - 21}" width="68" height="42" rx="5" class="fig-linie" fill="none" stroke-width="2.5"/>` +
    `<text x="${x}" y="${y + 6}" class="fig-muenze-text" text-anchor="middle" font-size="17">${cent / 100} €</text>`
  );
}

/* ------------------------------------------------------------- Formen */

export type FormName =
  | "Quadrat"
  | "Rechteck"
  | "Dreieck"
  | "Kreis"
  | "Fünfeck"
  | "Sechseck"
  | "Raute"
  | "Trapez";

const FORM_ECKEN: Record<FormName, number> = {
  Quadrat: 4,
  Rechteck: 4,
  Dreieck: 3,
  Kreis: 0,
  Fünfeck: 5,
  Sechseck: 6,
  Raute: 4,
  Trapez: 4,
};

export function eckenZahl(form: FormName): number {
  return FORM_ECKEN[form];
}

export const ALLE_FORMEN: readonly FormName[] = Object.keys(FORM_ECKEN) as FormName[];

/** Zeichnet eine ebene Figur mittig in ein 200×200-Feld. */
export function form(name: FormName): string {
  const inhalt = (() => {
    switch (name) {
      case "Kreis":
        return `<circle cx="100" cy="100" r="74" class="fig-flaeche-bunt"/><circle cx="100" cy="100" r="74" class="fig-linie" fill="none" stroke-width="4"/>`;
      case "Quadrat":
        return rechteckForm(70, 70, 130, 130);
      case "Rechteck":
        return rechteckForm(24, 62, 176, 138);
      case "Dreieck":
        return polygon([
          [100, 26],
          [178, 168],
          [22, 168],
        ]);
      case "Raute":
        return polygon([
          [100, 22],
          [172, 100],
          [100, 178],
          [28, 100],
        ]);
      case "Trapez":
        return polygon([
          [58, 56],
          [142, 56],
          [180, 150],
          [20, 150],
        ]);
      case "Fünfeck":
        return polygon(regelmaessig(5, 78));
      case "Sechseck":
        return polygon(regelmaessig(6, 78));
    }
  })();
  return huelle(200, 200, inhalt);
}

function rechteckForm(x1: number, y1: number, x2: number, y2: number): string {
  const w = x2 - x1;
  const h = y2 - y1;
  return (
    `<rect x="${x1}" y="${y1}" width="${w}" height="${h}" rx="4" class="fig-flaeche-bunt"/>` +
    `<rect x="${x1}" y="${y1}" width="${w}" height="${h}" rx="4" class="fig-linie" fill="none" stroke-width="4"/>`
  );
}

function polygon(punkte: readonly (readonly [number, number])[]): string {
  const p = punkte.map(([x, y]) => `${r(x)},${r(y)}`).join(" ");
  return (
    `<polygon points="${p}" class="fig-flaeche-bunt"/>` +
    `<polygon points="${p}" class="fig-linie" fill="none" stroke-width="4" stroke-linejoin="round"/>`
  );
}

function regelmaessig(ecken: number, radius: number): [number, number][] {
  const punkte: [number, number][] = [];
  for (let i = 0; i < ecken; i++) {
    const winkel = (i / ecken) * Math.PI * 2 - Math.PI / 2;
    punkte.push([100 + Math.cos(winkel) * radius, 100 + Math.sin(winkel) * radius]);
  }
  return punkte;
}

/** Figur mit eingezeichneter Linie – Frage: Ist das eine Spiegelachse? */
export function spiegelachse(name: FormName, richtig: boolean): string {
  const basis = form(name).replace("</svg>", "");
  const linie = richtig
    ? `<line x1="100" y1="8" x2="100" y2="192" class="fig-achse"/>`
    : `<line x1="140" y1="8" x2="140" y2="192" class="fig-achse"/>`;
  return `${basis}${linie}</svg>`;
}

/* -------------------------------------------------------- Zahlenstrahl */

/** Zahlenstrahl von 0 bis `max` mit einem markierten Wert (oder Fragezeichen). */
export function zahlenstrahl(max: number, markiert: number | null, schritt = 10): string {
  const breite = 520;
  const links = 30;
  const rechts = breite - 30;
  const y = 70;
  let teile = `<line x1="${links}" y1="${y}" x2="${rechts}" y2="${y}" class="fig-linie" stroke-width="3"/>`;
  teile += `<polygon points="${rechts},${y} ${rechts - 12},${y - 6} ${rechts - 12},${y + 6}" class="fig-voll"/>`;
  for (let wert = 0; wert <= max; wert += schritt) {
    const x = links + ((rechts - links - 16) * wert) / max;
    teile += `<line x1="${r(x)}" y1="${y - 10}" x2="${r(x)}" y2="${y + 10}" class="fig-linie" stroke-width="2.5"/>`;
    teile += `<text x="${r(x)}" y="${y + 32}" class="fig-text" text-anchor="middle" font-size="17">${wert}</text>`;
  }
  if (markiert !== null) {
    const x = links + ((rechts - links - 16) * markiert) / max;
    teile += `<circle cx="${r(x)}" cy="${y}" r="10" class="fig-marke"/>`;
    teile += `<text x="${r(x)}" y="${y - 22}" class="fig-text-marke" text-anchor="middle" font-size="22">?</text>`;
  }
  return huelle(breite, 110, teile);
}

/* --------------------------------------------------------- Punktefeld */

/** Punktefeld für Malaufgaben: `reihen` Reihen zu je `spalten` Punkten. */
export function punktefeld(reihen: number, spalten: number): string {
  const abstand = 30;
  const rand = 20;
  const breite = spalten * abstand + rand * 2 - (abstand - 20);
  const hoehe = reihen * abstand + rand * 2 - (abstand - 20);
  let teile = "";
  for (let z = 0; z < reihen; z++) {
    for (let s = 0; s < spalten; s++) {
      teile += `<circle cx="${rand + s * abstand}" cy="${rand + z * abstand}" r="10" class="fig-punkt"/>`;
    }
  }
  return huelle(breite, hoehe, teile);
}

/* ------------------------------------------------------------ Hilfen */

function r(zahl: number): number {
  return Math.round(zahl * 100) / 100;
}
