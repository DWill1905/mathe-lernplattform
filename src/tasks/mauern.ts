/**
 * Zahlenmauern und Rechenräder – zwei Darstellungen, mit denen im Unterricht
 * Plus und Minus geübt werden.
 *
 * In einer Zahlenmauer ist jeder Stein die Summe der beiden Steine darunter.
 * Es fehlt immer genau ein Stein; weil alle Nachbarn sichtbar sind, ist er
 * eindeutig bestimmt – egal, ob er oben, in der Mitte oder unten steht.
 */

import type { Rng } from "../random.js";
import type { Aufgabe, Stufe } from "../types.js";
import { rechendreieck, rechenkasten, rechenrad, zahlenmauer, type RadFeld } from "../figures.js";
import { zahlfeld } from "./helpers.js";

export function mauern(rng: Rng, stufe: Stufe): Aufgabe {
  const wahl = rng.int(1, 4);
  if (wahl === 1) return kasten(rng, stufe);
  if (wahl === 2) return rng.chance(0.5) ? rad(rng, stufe) : radDifferenz(rng, stufe);
  if (wahl === 3) return dreieck(rng, stufe);
  // Stufe 1: 3 Kästchen, Stufe 2: 6, Stufe 3: 10. Auf Stufe 2 kommt die große
  // Mauer gelegentlich schon mit kleinen Zahlen vor – die Größe soll dort der
  // Reiz sein, nicht die Rechnung.
  if (stufe === 1) return kleineMauer(rng, rng.chance(0.5));
  if (stufe === 2) return rng.chance(0.3) ? mauerMitVier(rng, 6, 5) : mauerMitDrei(rng);
  return mauerMitVier(rng, 12, 10);
}

/* ------------------------------------------------------- Rechendreiecke */

/**
 * Rechendreieck: Drei Zahlen stehen innen, an jeder Seite steht außen ihre
 * Summe mit der Nachbarzahl. Aus dem Arbeitsheft („Rund um die Mathematik“).
 *
 * Es fehlt immer genau ein Feld, und die Schwierigkeit hängt daran, WELCHES:
 *
 * - Außen fehlt  → reines Zusammenzählen (Stufe 1).
 * - Innen fehlt  → man muss von einer Außenzahl die bekannte Innenzahl
 *   abziehen; die Umkehrung ist nötig (Stufe 2).
 * - Innen fehlt, aber alle drei Außenzahlen sind bekannt → derselbe Weg, nur
 *   ohne Hilfe durch eine zweite Innenzahl (Stufe 3).
 */
function dreieck(rng: Rng, stufe: Stufe): Aufgabe {
  const max = stufe === 1 ? 9 : stufe === 2 ? 15 : 25;
  const innen = [rng.int(1, max), rng.int(1, max), rng.int(1, max)];
  // Außen in fester Reihenfolge: links = oben+links, rechts = oben+rechts,
  // unten = links+rechts. Genau so liest die Figur die Felder.
  const aussen = [innen[0]! + innen[1]!, innen[0]! + innen[2]!, innen[1]! + innen[2]!];

  const aussenFehlt = stufe === 1 ? true : stufe === 2 ? rng.chance(0.4) : rng.chance(0.2);

  if (aussenFehlt) {
    const i = rng.int(0, 2);
    // Welche zwei Innenzahlen liegen an dieser Seite?
    const [x, y] = i === 0 ? [innen[0]!, innen[1]!] : i === 1 ? [innen[0]!, innen[2]!] : [innen[1]!, innen[2]!];
    const gezeigt = aussen.map((wert, k) => (k === i ? null : wert));
    return {
      typ: "mauern/dreieck-aussen",
      frage: "Welche Zahl gehört in das leere Kästchen?",
      bild: {
        svg: rechendreieck(innen, gezeigt, { bereich: "aussen", feld: i }),
        beschriftung: `Rechendreieck: innen ${innen.join(", ")}; an der leeren Seite liegen ${x} und ${y}`,
      },
      antwortfeld: zahlfeld(),
      loesung: String(x + y),
      tipp: "Zähle die beiden Zahlen zusammen, die an dieser Seite liegen.",
      erklaerung: `${x} + ${y} = ${x + y}`,
    };
  }

  // Eine Innenzahl fehlt. Die beiden Seiten, die sie berührt, verraten sie –
  // zusammen mit der jeweiligen Nachbarzahl.
  const i = rng.int(0, 2);
  const gesucht = innen[i]!;
  const gezeigtInnen = innen.map((wert, k) => (k === i ? null : wert));

  // Welche Außenseite nehmen wir zum Erklären? Eine, an der die Lücke liegt.
  const [seite, nachbar] =
    i === 0 ? [0, innen[1]!] : i === 1 ? [0, innen[0]!] : [1, innen[0]!];
  const summe = aussen[seite]!;

  /*
   * Zwei der drei Außenzahlen berühren die Lücke – jede von ihnen führt zum
   * Ziel. Die dritte liegt der Lücke gegenüber und hilft gar nicht.
   *
   * Auf Stufe 3 lassen wir genau diese überflüssige weg: Die Aufgabe bleibt
   * eindeutig lösbar, aber das Dreieck sieht leerer aus und man muss sich
   * überlegen, welche Seite überhaupt weiterhilft.
   */
  const gegenueber = i === 0 ? 2 : i === 1 ? 1 : 0;
  const gezeigtAussen = stufe === 3 ? aussen.map((wert, k) => (k === gegenueber ? null : wert)) : aussen;

  return {
    typ: "mauern/dreieck-innen",
    frage: "Welche Zahl gehört in den leeren Kreis?",
    bild: {
      svg: rechendreieck(gezeigtInnen, gezeigtAussen, { bereich: "innen", feld: i }),
      // Die Beschriftung darf nur beschreiben, was auch im Bild steht.
      beschriftung: `Rechendreieck: außen ${gezeigtAussen.map((w) => (w === null ? "leer" : w)).join(", ")}; innen fehlt eine Zahl`,
    },
    antwortfeld: zahlfeld(),
    loesung: String(gesucht),
    tipp: "Nimm eine Außenzahl und ziehe die Innenzahl ab, die daneben steht.",
    erklaerung: `${summe} − ${nachbar} = ${gesucht}`,
  };
}

/** Verteilt eine Summe zufällig auf `teile` nicht-negative Summanden. */
export function verteile(rng: Rng, summe: number, teile: number): number[] {
  const schnitte = [0, summe];
  for (let i = 0; i < teile - 1; i++) schnitte.push(rng.int(0, summe));
  schnitte.sort((a, b) => a - b);
  const werte: number[] = [];
  for (let i = 0; i < teile; i++) werte.push(schnitte[i + 1]! - schnitte[i]!);
  return werte;
}

/**
 * Rechenkasten: Vier Zahlen stehen im Kasten, auf dem Fähnchen ihre Summe.
 * Es fehlt entweder das Fähnchen (dann wird addiert) oder ein Feld (dann muss
 * rückwärts gerechnet werden).
 */
function kasten(rng: Rng, stufe: Stufe): Aufgabe {
  const summe = stufe === 1 ? rng.int(8, 20) : stufe === 2 ? rng.int(10, 20) : rng.int(20, 100);
  const werte = verteile(rng, summe, 4);
  const summeGesucht = stufe === 1 || (stufe === 3 && rng.chance(0.4));

  if (summeGesucht) {
    return {
      typ: "mauern/kasten-summe",
      frage: "Wie viel ist im Kasten zusammen? Die Zahl gehört auf das Fähnchen.",
      bild: { svg: rechenkasten(werte, null), beschriftung: `Kasten mit den Zahlen ${werte.join(", ")}` },
      antwortfeld: zahlfeld(),
      loesung: String(summe),
      tipp: "Zähle die vier Zahlen der Reihe nach zusammen.",
      erklaerung: `${werte.join(" + ")} = ${summe}`,
    };
  }

  const luecke = rng.int(0, 3);
  const anzeige = werte.map((wert, i) => (i === luecke ? null : wert));
  const bekannt = werte.filter((_, i) => i !== luecke);
  return {
    typ: "mauern/kasten-feld",
    frage: "Auf dem Fähnchen steht, wie viel zusammen im Kasten ist. Welche Zahl fehlt?",
    bild: { svg: rechenkasten(anzeige, summe), beschriftung: `Kasten mit der Gesamtzahl ${summe}` },
    antwortfeld: zahlfeld(),
    loesung: String(werte[luecke]),
    tipp: "Zähle erst die sichtbaren Zahlen zusammen und vergleiche mit dem Fähnchen.",
    erklaerung: `${bekannt.join(" + ")} = ${bekannt.reduce((a, b) => a + b, 0)}. Bis ${summe} fehlt ${werte[luecke]}.`,
  };
}

/** Baut aus den Grundsteinen die komplette Mauer (unten → oben). */
export function baueMauer(grund: readonly number[]): number[][] {
  const reihen: number[][] = [grund.slice()];
  while (reihen[reihen.length - 1]!.length > 1) {
    const unten = reihen[reihen.length - 1]!;
    const oben: number[] = [];
    for (let i = 0; i < unten.length - 1; i++) oben.push(unten[i]! + unten[i + 1]!);
    reihen.push(oben);
  }
  return reihen;
}

/** Ersetzt genau einen Stein durch die Lücke und liefert seinen Wert. */
function mitLuecke(
  reihen: number[][],
  ebene: number,
  spalte: number
): { anzeige: (number | null)[][]; loesung: number } {
  const loesung = reihen[ebene]![spalte]!;
  const anzeige = reihen.map((reihe, i) =>
    reihe.map((wert, s) => (i === ebene && s === spalte ? null : wert))
  );
  return { anzeige, loesung };
}

/** Mauer mit zwei Grundsteinen – drei Kästchen. */
function kleineMauer(rng: Rng, lueckeUnten: boolean): Aufgabe {
  const a = rng.int(1, 10);
  const b = rng.int(1, 20 - a);
  const reihen = baueMauer([a, b]);
  const { anzeige, loesung } = lueckeUnten
    ? mitLuecke(reihen, 0, rng.int(0, 1))
    : mitLuecke(reihen, 1, 0);
  return {
    typ: lueckeUnten ? "mauern/mauer-unten" : "mauern/mauer-oben",
    frage: "Welche Zahl fehlt in der Zahlenmauer?",
    bild: { svg: zahlenmauer(anzeige), beschriftung: "Zahlenmauer aus 3 Steinen, einer fehlt" },
    antwortfeld: zahlfeld(),
    loesung: String(loesung),
    tipp: lueckeUnten
      ? "Der obere Stein ist die Summe der beiden darunter – rechne rückwärts."
      : "Zähle die beiden unteren Steine zusammen.",
    erklaerung: lueckeUnten
      ? `${a} + ${b} = ${a + b} – der fehlende Grundstein ist ${loesung}.`
      : `${a} + ${b} = ${a + b}`,
  };
}

/**
 * Eine Zahlenmauer beliebiger Größe mit genau einer Lücke.
 *
 * Die Lücke darf überall sitzen: Weil nur EIN Stein fehlt, ist er immer
 * eindeutig bestimmt – entweder aus den beiden Steinen darunter (Deckstein)
 * oder aus dem Stein darüber minus dem Nachbarn (alle anderen).
 */
function mauerAufgabe(rng: Rng, grund: readonly number[], typ: string): Aufgabe {
  const reihen = baueMauer(grund);
  const ebene = rng.int(0, reihen.length - 1);
  const spalte = rng.int(0, reihen[ebene]!.length - 1);
  const { anzeige, loesung } = mitLuecke(reihen, ebene, spalte);
  const steine = reihen.reduce((summe, reihe) => summe + reihe.length, 0);

  return {
    typ,
    frage: "Welche Zahl fehlt in der Zahlenmauer?",
    bild: {
      svg: zahlenmauer(anzeige),
      beschriftung: `Zahlenmauer aus ${steine} Steinen, einer fehlt`,
    },
    antwortfeld: zahlfeld(),
    loesung: String(loesung),
    tipp:
      ebene === 0
        ? "Der Stein darüber ist die Summe der beiden darunter – rechne rückwärts."
        : "Jeder Stein ist die Summe der beiden Steine direkt darunter.",
    erklaerung: `Die Mauer von unten nach oben: ${reihen
      .map((reihe) => reihe.join(", "))
      .join(" → ")}. Der fehlende Stein ist ${loesung}.`,
  };
}

/**
 * Mauer zum AUSFÜLLEN: Die Grundreihe steht da, alles darüber ist leer. So
 * steht es auch im Übungsheft – und bei zehn Kästchen ist eine einzige Lücke
 * schlicht zu wenig zu tun.
 *
 * Diese Form ist immer lösbar, weil sich jede Reihe aus der darunter ergibt.
 */
function mauerAusfuellen(grund: readonly number[], typ: string): Aufgabe {
  const reihen = baueMauer(grund);
  const anzeige = reihen.map((reihe, ebene) => reihe.map((wert) => (ebene === 0 ? wert : null)));
  const fehlend = reihen.slice(1).flat();

  return {
    typ,
    frage:
      fehlend.length === 1
        ? "Fülle den obersten Stein aus."
        : `Fülle die Mauer aus – ${fehlend.length} Steine fehlen.`,
    antwortfeld: { art: "mauer", reihen: anzeige },
    loesung: fehlend.join(","),
    tipp: "Fang unten an: Jeder Stein ist die Summe der beiden Steine direkt darunter.",
    erklaerung: `Von unten nach oben: ${reihen.map((reihe) => reihe.join(", ")).join(" → ")}.`,
  };
}

/** Mauer mit drei Grundsteinen – sechs Kästchen. */
function mauerMitDrei(rng: Rng): Aufgabe {
  const grund = [rng.int(1, 20), rng.int(1, 20), rng.int(1, 20)];
  // Mal eine einzelne Lücke (das trainiert das Rückwärtsrechnen), mal die
  // ganze Mauer ausfüllen.
  return rng.chance(0.5)
    ? mauerAufgabe(rng, grund, "mauern/mauer-gross")
    : mauerAusfuellen(grund, "mauern/mauer-fuellen");
}

/**
 * Mauer mit vier Grundsteinen – zehn Kästchen. Die Spitze ist
 * `a + 3b + 3c + d`; die inneren Steine zählen also dreifach. Deshalb sind
 * ihre Grenzen enger, sonst verließe die Spitze den Zahlenraum bis 100.
 */
function mauerMitVier(rng: Rng, maxAussen: number, maxInnen: number): Aufgabe {
  const grund = [rng.int(1, maxAussen), rng.int(1, maxInnen), rng.int(1, maxInnen), rng.int(1, maxAussen)];
  return rng.chance(0.5)
    ? mauerAufgabe(rng, grund, "mauern/mauer-zehn")
    : mauerAusfuellen(grund, "mauern/mauer-zehn-fuellen");
}

/** Rechenrad: außen und innen ergeben zusammen immer die Zahl in der Mitte. */
function rad(rng: Rng, stufe: Stufe): Aufgabe {
  const mitte = stufe === 1 ? rng.pick([10, 20]) : stufe === 2 ? rng.pick([20, 30, 40, 50]) : rng.int(6, 10) * 10;
  const moeglich = new Set<number>();
  for (let wert = 1; wert < mitte; wert++) {
    if (stufe === 1 || wert <= 10 || wert % 10 === 0 || mitte - wert <= 10) moeglich.add(wert);
  }
  const innenWerte = rng.shuffle([...moeglich]).slice(0, 6);
  const gesucht = rng.int(0, innenWerte.length - 1);
  const felder: RadFeld[] = innenWerte.map((wert, i) => ({
    aussen: mitte - wert,
    innen: i === gesucht ? null : wert,
  }));
  const loesung = innenWerte[gesucht]!;
  return {
    typ: "mauern/rechenrad",
    frage: `Im Rechenrad ergeben außen und innen zusammen immer ${mitte}. Welche Zahl fehlt?`,
    bild: { svg: rechenrad(mitte, felder), beschriftung: `Rechenrad mit der Zahl ${mitte} in der Mitte` },
    antwortfeld: zahlfeld(),
    loesung: String(loesung),
    tipp: `Frage dich: Wie viel fehlt von ${mitte - loesung} bis ${mitte}?`,
    erklaerung: `${mitte - loesung} + ${loesung} = ${mitte}`,
  };
}

/**
 * Zweite Radform aus dem Heft: Zur Zahl in der Mitte kommt der innere Ring
 * dazu, außen steht das Ergebnis (`8 + ? = 11`). Beim ersten Rad ergänzt man
 * dagegen AUF die Mitte – die beiden Formen üben unterschiedliche Richtungen.
 */
function radDifferenz(rng: Rng, stufe: Stufe): Aufgabe {
  const mitte = stufe === 1 ? rng.int(2, 8) : stufe === 2 ? rng.int(5, 12) : rng.int(10, 40);
  const spielraum = stufe === 3 ? 60 : 20 - mitte;
  const moeglich: number[] = [];
  for (let wert = 1; wert <= Math.max(6, spielraum); wert++) {
    if (mitte + wert <= (stufe === 3 ? 100 : 20)) moeglich.push(wert);
  }
  const innenWerte = rng.shuffle(moeglich).slice(0, 6);
  const gesucht = rng.int(0, innenWerte.length - 1);
  const felder: RadFeld[] = innenWerte.map((wert, i) => ({
    aussen: mitte + wert,
    innen: i === gesucht ? null : wert,
  }));
  const loesung = innenWerte[gesucht]!;
  return {
    typ: "mauern/rechenrad-differenz",
    frage: `Zur ${mitte} in der Mitte kommt die innere Zahl dazu – außen steht das Ergebnis. Welche Zahl fehlt?`,
    bild: { svg: rechenrad(mitte, felder), beschriftung: `Rechenrad mit der Zahl ${mitte} in der Mitte` },
    antwortfeld: zahlfeld(),
    loesung: String(loesung),
    tipp: `Rechne ${mitte + loesung} − ${mitte}.`,
    erklaerung: `${mitte} + ${loesung} = ${mitte + loesung}`,
  };
}
