/**
 * Die Zahleneule als Ganzkörper-Maskottchen.
 *
 * Bisher existierte die Namensgeberin nur als 24-px-Kopfsilhouette in der
 * Kopfzeile – gefeiert haben Hase, Schwein, Biene und Vogel. Dieser Baukasten
 * gibt ihr Körper, Flügel und Mimik: Aus wenigen Teil-Bausteinen entstehen
 * Posen für Begrüßung, Ergebnis, Jubel und Leerzustände.
 *
 * Wie in `bilder.ts` gilt: **keine Farbe direkt im SVG**, nur die
 * `bild-*`-Klassen aus `style.css` – die Illustrationen sehen in beiden
 * Farbschemata gleich aus („wie auf Papier“). Die `eule-*`-Klassen des
 * kleinen Kopf-Icons (`icons.ts`) bleiben davon unberührt: Sie hängen an den
 * Themenfarben und sind für Strichsymbole richtig, für Flächen falsch.
 *
 * Bewusst ohne DOM-Zugriff, damit jede Pose direkt testbar ist. Die viewBox
 * ist 120 × 120 wie bei den Puzzlemotiven – so stimmt die Strichstärke der
 * `bild-strich`-Linien proportional mit den übrigen Illustrationen überein.
 */

/** Die Posen der Eule. KEINE davon ist strafend – auch `mutmacht` lacht. */
export type EulenPose = "winkt" | "jubelt" | "freut" | "mutmacht" | "schlaeft";

export const EULEN_POSEN: readonly EulenPose[] = [
  "winkt",
  "jubelt",
  "freut",
  "mutmacht",
  "schlaeft",
];

/* ------------------------------------------------------------ Bausteine */

/** Körper mit Ohrbüscheln und hellem Bauch – die Basis jeder Pose. */
function koerper(): string {
  return (
    `<path d="M60 16C36 16 22 35 22 63v13c0 22 16 36 38 36s38-14 38-36V63c0-28-14-47-38-47z" class="bild-lila"/>` +
    `<path d="M31 25 24 9l17 9zM89 25l7-16-17 9z" class="bild-lila"/>` +
    `<ellipse cx="60" cy="82" rx="24" ry="19" class="bild-lila-hell"/>`
  );
}

/** Zwei Füße, die unter dem Körper hervorschauen. */
function fuesse(): string {
  return (
    `<ellipse cx="47" cy="110" rx="8" ry="5" class="bild-orange"/>` +
    `<ellipse cx="73" cy="110" rx="8" ry="5" class="bild-orange"/>`
  );
}

type Mimik = "froh" | "strahlt" | "zwinkert" | "zu";

/** Ein offenes Auge: weißer Ring, Pupille, Glanzpunkt. */
function auge(x: number): string {
  return (
    `<circle cx="${x}" cy="46" r="13" class="bild-hell"/>` +
    `<circle cx="${x}" cy="47" r="5.5" class="bild-dunkel"/>` +
    `<circle cx="${x + 2}" cy="44" r="2" class="bild-hell"/>`
  );
}

/** Ein glücklich geschlossenes Auge (Bogen nach oben). */
function lachAuge(x: number): string {
  return `<path d="M${x - 7} 48c3-6 11-6 14 0" class="bild-strich"/>`;
}

/** Ein schlafend geschlossenes Auge (sanfter Bogen nach unten). */
function schlafAuge(x: number): string {
  return `<path d="M${x - 7} 45c3 5 11 5 14 0" class="bild-strich"/>`;
}

/** Gesicht: Augen je nach Stimmung, dazu der Schnabel. */
function gesicht(mimik: Mimik): string {
  const augen =
    mimik === "froh"
      ? auge(44) + auge(76)
      : mimik === "strahlt"
        ? lachAuge(44) + lachAuge(76)
        : mimik === "zwinkert"
          ? auge(44) + lachAuge(76)
          : schlafAuge(44) + schlafAuge(76);
  return augen + `<path d="M53 58h14l-7 10z" class="bild-orange"/>`;
}

/** Rosa Wangen – für die besonders glücklichen Posen. */
function wangen(): string {
  return (
    `<circle cx="33" cy="58" r="4" class="bild-rosa"/>` +
    `<circle cx="87" cy="58" r="4" class="bild-rosa"/>`
  );
}

/**
 * Flügel HINTER dem Körper: ruhig hängend oder jubelnd hochgestreckt.
 * Sie stehen bewusst weit außen – was der Körper verdeckt, sieht niemand.
 */
function fluegelHinten(haltung: "unten" | "offen"): string {
  if (haltung === "unten") {
    return (
      `<ellipse cx="20" cy="78" rx="9" ry="19" class="bild-lila-hell" transform="rotate(18 20 78)"/>` +
      `<ellipse cx="100" cy="78" rx="9" ry="19" class="bild-lila-hell" transform="rotate(-18 100 78)"/>`
    );
  }
  return (
    `<ellipse cx="13" cy="44" rx="8" ry="19" class="bild-lila-hell" transform="rotate(42 13 44)"/>` +
    `<ellipse cx="107" cy="44" rx="8" ry="19" class="bild-lila-hell" transform="rotate(-42 107 44)"/>`
  );
}

/** Ein Flügel VOR dem Körper, zum Winken erhoben. */
function winkFluegel(): string {
  return `<ellipse cx="96" cy="44" rx="8" ry="18" class="bild-lila-hell" transform="rotate(-48 96 44)"/>`;
}

/** Ein Flügel VOR dem Körper, der auffordernd zur Seite zeigt. */
function zeigFluegel(): string {
  return `<ellipse cx="94" cy="68" rx="16" ry="8" class="bild-lila-hell" transform="rotate(-12 94 68)"/>`;
}

/** Ein vierzackiger Funke, wie ihn auch der Jubel benutzt. */
function funke(x: number, y: number, g: number): string {
  return `<path d="M${x} ${y - g}l${g / 3} ${g - g / 3} ${g - g / 3} ${g / 3} ${-(g - g / 3)} ${g / 3} ${-g / 3} ${g - g / 3} ${-g / 3} ${-(g - g / 3)} ${-(g - g / 3)} ${-g / 3} ${g - g / 3} ${-g / 3}z" class="bild-gelb"/>`;
}

/** Ein kleines Herz – die aufmunternde Geste. */
function herz(x: number, y: number): string {
  return `<path d="M${x} ${y}c-3-4-9-2-9 3 0 4 9 9 9 9s9-5 9-9c0-5-6-7-9-3z" class="bild-rosa"/>`;
}

/** Drei Schlaf-Z als Linienzug – bewusst Pfade, kein Text-Element. */
function zzz(): string {
  return (
    `<path d="M88 22h9l-9 9h9" class="bild-strich"/>` +
    `<path d="M102 8h7l-7 7h7" class="bild-strich"/>`
  );
}

/* ---------------------------------------------------------------- Posen */

const POSEN: Record<EulenPose, () => string> = {
  // Begrüßung: der Winkflügel liegt VOR dem Körper, sonst sähe ihn niemand.
  winkt: () =>
    `<ellipse cx="20" cy="78" rx="9" ry="19" class="bild-lila-hell" transform="rotate(18 20 78)"/>` +
    koerper() +
    fuesse() +
    gesicht("zwinkert") +
    winkFluegel(),
  // Voller Erfolg: beide Flügel hoch, Lach-Augen, Wangen, Funken.
  jubelt: () =>
    fluegelHinten("offen") +
    koerper() +
    fuesse() +
    gesicht("strahlt") +
    wangen() +
    funke(10, 20, 7) +
    funke(110, 16, 6),
  // Gute Runde: zufrieden mit Wangen.
  freut: () => fluegelHinten("unten") + koerper() + fuesse() + gesicht("froh") + wangen(),
  // Schwache Runde: „Komm, nochmal!“ – zeigender Flügel und ein Herz.
  mutmacht: () =>
    `<ellipse cx="20" cy="78" rx="9" ry="19" class="bild-lila-hell" transform="rotate(18 20 78)"/>` +
    koerper() +
    fuesse() +
    gesicht("froh") +
    zeigFluegel() +
    herz(104, 46),
  // Leerzustände: die Eule döst, bis geübt wird.
  schlaeft: () => fluegelHinten("unten") + koerper() + fuesse() + gesicht("zu") + zzz(),
};

/** Eine Pose als vollständige SVG-Zeichenkette. */
export function euleSvg(pose: EulenPose): string {
  return `<svg viewBox="0 0 120 120" class="illu" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">${POSEN[pose]()}</svg>`;
}

/**
 * Nur das Innere der Jubelpose – für die Jubel-Ebene, die ihre eigene Bühne
 * (und deren Hülle) mitbringt.
 */
export function euleJubelGruppe(): string {
  return POSEN.jubelt();
}

/**
 * Welche Pose zur Trefferquote passt. Die Stufen spiegeln `lobText()` in
 * `gamification.ts` – Eule und Text erzählen dieselbe Geschichte.
 * NIE strafend: Auch bei null Treffern macht die Eule Mut.
 */
export function euleFuerQuote(richtig: number, gesamt: number): EulenPose {
  if (gesamt === 0) return "winkt";
  const quote = richtig / gesamt;
  if (quote === 1) return "jubelt";
  if (quote >= 0.7) return "freut";
  return "mutmacht";
}
