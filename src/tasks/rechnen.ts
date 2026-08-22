import type { Rng } from "../random.js";
import type { Aufgabe, Stufe } from "../types.js";
import { punktefeld } from "../figures.js";
import { auswahlfeld, zahlAblenker, zahlfeld } from "./helpers.js";

/** Malreihen je Stufe – der Aufbau folgt der üblichen Reihenfolge im Unterricht. */
const REIHEN: Record<Stufe, readonly number[]> = {
  1: [1, 2, 5, 10],
  2: [1, 2, 3, 4, 5, 10],
  3: [2, 3, 4, 5, 6, 7, 8, 9, 10],
};

/* ============================================================ Einmaleins */

export function einmaleins(rng: Rng, stufe: Stufe): Aufgabe {
  if (stufe === 3 && rng.chance(0.35)) return umkehraufgabe(rng);
  if (stufe === 1 && rng.chance(0.35)) return malMitBild(rng, stufe);
  return malaufgabe(rng, stufe);
}

function malaufgabe(rng: Rng, stufe: Stufe): Aufgabe {
  const reihe = rng.pick(REIHEN[stufe]);
  const faktor = rng.int(1, 10);
  const [a, b] = rng.chance(0.5) ? [reihe, faktor] : [faktor, reihe];
  const loesung = a * b;
  return {
    typ: `einmaleins/reihe-${reihe}`,
    frage: "Wie lautet das Ergebnis?",
    rechnung: `${a} · ${b} =`,
    antwortfeld: zahlfeld(),
    loesung: String(loesung),
    tipp: `Denk an die ${reihe}er-Reihe.`,
    erklaerung: `${a} · ${b} bedeutet: ${a}-mal die ${b} zusammenzählen. Das ergibt ${loesung}.`,
  };
}

function malMitBild(rng: Rng, stufe: Stufe): Aufgabe {
  const reihen = rng.pick(REIHEN[stufe]);
  const spalten = rng.int(2, 8);
  const loesung = reihen * spalten;
  return {
    typ: "einmaleins/punktefeld",
    frage: "Wie viele Punkte sind das?",
    bild: {
      svg: punktefeld(reihen, spalten),
      beschriftung: `${reihen} Reihen mit je ${spalten} Punkten`,
    },
    antwortfeld: zahlfeld(),
    loesung: String(loesung),
    tipp: "Zähle die Reihen und die Punkte pro Reihe – dann malnehmen.",
    erklaerung: `${reihen} Reihen · ${spalten} Punkte = ${loesung} Punkte`,
  };
}

function umkehraufgabe(rng: Rng): Aufgabe {
  const a = rng.int(2, 10);
  const b = rng.int(2, 10);
  const produkt = a * b;
  const vorne = rng.chance(0.5);
  return {
    typ: "einmaleins/umkehr",
    frage: "Welche Zahl gehört in die Lücke?",
    rechnung: vorne ? `? · ${b} = ${produkt}` : `${a} · ? = ${produkt}`,
    antwortfeld: auswahlfeld(rng, String(vorne ? a : b), zahlAblenker(vorne ? a : b, 5, 10)),
    loesung: String(vorne ? a : b),
    tipp: "Frage dich: Wie oft passt die Zahl in das Ergebnis?",
    erklaerung: `${produkt} : ${vorne ? b : a} = ${vorne ? a : b}`,
  };
}

/* =============================================================== Geteilt */

/**
 * Teilen hat drei Lesarten, und im Unterricht kommen alle drei vor:
 * das Ergebnis ausrechnen (`30 : 5 =`), das Enthaltensein („Wie oft passt die
 * 5 in die 30?") und die Umkehrung mit Lücke (`30 : ? = 6`).
 *
 * Der Zahlenvorrat einer Stufe ist dabei fest — „:2, :5 und :10" mit
 * Ergebnissen bis 10 sind genau dreißig Aufgaben, und die SOLL ein Kind
 * wiederholt sehen. Was fehlte, war nicht mehr Rechenstoff, sondern eine
 * zweite Art zu fragen: Vorher stand auf Stufe 1 dreißigmal derselbe Satz.
 */
export function geteilt(rng: Rng, stufe: Stufe): Aufgabe {
  if (stufe === 3) {
    if (rng.chance(0.5)) return mitRest(rng);
    return rng.chance(0.4) ? teilerLuecke(rng, stufe) : ohneRest(rng, stufe);
  }
  if (stufe === 2 && rng.chance(0.3)) return teilerLuecke(rng, stufe);
  return rng.chance(0.4) ? wieOftPasst(rng, stufe) : ohneRest(rng, stufe);
}

/** Die Teiler, die auf dieser Stufe vorkommen dürfen. */
function teilerFuer(stufe: Stufe): readonly number[] {
  return stufe === 1 ? [2, 5, 10] : REIHEN[stufe].filter((z) => z > 1);
}

/**
 * Dieselbe Rechnung als Frage nach dem Enthaltensein. Für ein Kind ist das
 * ein anderer Gedanke als „teile auf" – und es ist genau der, der beim
 * Rechnen mit Rest später gebraucht wird.
 */
function wieOftPasst(rng: Rng, stufe: Stufe): Aufgabe {
  const teiler = rng.pick(teilerFuer(stufe));
  const ergebnis = rng.int(1, 10);
  const zahl = teiler * ergebnis;
  return {
    typ: `geteilt/durch-${teiler}`,
    frage: `Wie oft passt die ${teiler} in die ${zahl}?`,
    antwortfeld: zahlfeld("mal"),
    loesung: String(ergebnis),
    tipp: `Zähle in ${teiler}er-Schritten bis ${zahl}.`,
    erklaerung: `${ergebnis} · ${teiler} = ${zahl}, die ${teiler} passt also ${ergebnis}-mal hinein.`,
  };
}

/**
 * Umkehraufgabe mit LÜCKE. `30 : 5 =` rechnet ein Kind einfach aus; erst
 * `30 : ? = 6` erzwingt den Kniff — genau wie beim Einmaleins (`? · 5 = 30`).
 */
function teilerLuecke(rng: Rng, stufe: Stufe): Aufgabe {
  const teiler = rng.pick(teilerFuer(stufe));
  const ergebnis = rng.int(2, 10);
  const zahl = teiler * ergebnis;
  const suchtTeiler = rng.chance(0.5);
  const loesung = suchtTeiler ? teiler : zahl;
  return {
    typ: "geteilt/umkehr",
    frage: "Welche Zahl gehört in die Lücke?",
    rechnung: suchtTeiler ? `${zahl} : ? = ${ergebnis}` : `? : ${teiler} = ${ergebnis}`,
    antwortfeld: zahlfeld(),
    loesung: String(loesung),
    tipp: suchtTeiler
      ? `Frage dich: ${ergebnis} mal wie viel ergibt ${zahl}?`
      : `Frage dich: Was ergibt ${ergebnis} mal ${teiler}?`,
    erklaerung: `${ergebnis} · ${teiler} = ${zahl}, also ist ${zahl} : ${teiler} = ${ergebnis}.`,
  };
}

function ohneRest(rng: Rng, stufe: Stufe): Aufgabe {
  const teiler = rng.pick(teilerFuer(stufe));
  const ergebnis = rng.int(1, 10);
  const zahl = teiler * ergebnis;
  return {
    typ: `geteilt/durch-${teiler}`,
    frage: "Wie lautet das Ergebnis?",
    rechnung: `${zahl} : ${teiler} =`,
    antwortfeld: zahlfeld(),
    loesung: String(ergebnis),
    tipp: `Frage dich: Wie oft passt die ${teiler} in die ${zahl}?`,
    erklaerung: `${ergebnis} · ${teiler} = ${zahl}, also ist ${zahl} : ${teiler} = ${ergebnis}.`,
  };
}

function mitRest(rng: Rng): Aufgabe {
  const teiler = rng.int(2, 9);
  const ergebnis = rng.int(2, 9);
  const rest = rng.int(1, teiler - 1);
  const zahl = teiler * ergebnis + rest;
  const fragtRest = rng.chance(0.5);
  return {
    typ: "geteilt/mit-rest",
    frage: fragtRest
      ? `${zahl} Bonbons werden gerecht an ${teiler} Kinder verteilt. Wie viele bleiben übrig?`
      : `${zahl} Bonbons werden gerecht an ${teiler} Kinder verteilt. Wie viele bekommt jedes Kind?`,
    antwortfeld: zahlfeld(),
    loesung: String(fragtRest ? rest : ergebnis),
    tipp: "Suche die größte Zahl der Reihe, die noch hineinpasst.",
    erklaerung: `${teiler} · ${ergebnis} = ${teiler * ergebnis}. Bis ${zahl} fehlen noch ${rest}. Also: ${zahl} : ${teiler} = ${ergebnis} Rest ${rest}.`,
  };
}
