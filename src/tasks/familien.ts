/**
 * Aufgabenfamilien: „3 Zahlen, 4 Aufgaben“. Zu jedem Zahlentrio gehören zwei
 * Plus- und zwei Minusaufgaben. Wer die Zusammenhänge sieht, muss nicht jede
 * Aufgabe einzeln auswendig lernen.
 */

import type { Rng } from "../random.js";
import type { Aufgabe, Stufe } from "../types.js";
import { auswahlfeld, zahlfeld } from "./helpers.js";

/** Zieht ein Zahlentrio a + b = summe im gewünschten Zahlenraum. */
function trio(rng: Rng, max: number): { a: number; b: number; summe: number } {
  const summe = rng.int(Math.min(8, max), max);
  const a = rng.int(1, summe - 1);
  return { a, b: summe - a, summe };
}

export function familien(rng: Rng, stufe: Stufe): Aufgabe {
  if (stufe === 1) return rng.chance(0.5) ? umkehrZuPlus(rng, 20) : umkehrZuMinus(rng, 20);
  if (stufe === 2) {
    const wahl = rng.int(1, 4);
    if (wahl === 1) return tauschaufgabe(rng, 20);
    if (wahl === 2) return vierteAufgabe(rng, 20);
    if (wahl === 3) return dritteZahl(rng, 20);
    return umkehrZuPlus(rng, 20);
  }
  const wahl = rng.int(1, 5);
  if (wahl === 1) return luecke(rng, 100);
  if (wahl === 2) return vierteAufgabe(rng, 100);
  if (wahl === 3) return umkehrZuMinus(rng, 100);
  if (wahl === 4) return dritteZahl(rng, 100);
  return tauschaufgabe(rng, 100);
}

/*
 * Umkehraufgaben brauchen eine LÜCKE in der Rechnung – sonst sind sie keine.
 *
 * Vorher stand hier `13 − 5 =`; das rechnet ein Kind einfach aus, ohne je ans
 * Umkehren zu denken. Erst die Lücke macht den Kniff nötig: Bei `8 + ? = 13`
 * kommt man nur weiter, indem man die Aufgabe umdreht und rechnet 13 − 8.
 * Genau so ist die Umkehraufgabe beim Einmaleins schon immer gebaut
 * (`? · 5 = 30`).
 *
 * Die Umkehrung selbst ist die Hilfsaufgabe: Wer sie freiwillig ganz auftippt,
 * bekommt ein Pferd.
 */

/** Lücke in einer Plusaufgabe – auflösen lässt sie sich nur durch Minus. */
function umkehrZuPlus(rng: Rng, max: number): Aufgabe {
  const { a, b, summe } = trio(rng, max);
  // Welcher der beiden Teile fehlt? Der jeweils andere ist der bekannte.
  const hintenFehlt = rng.chance(0.5);
  const [bekannt, gesucht] = hintenFehlt ? [a, b] : [b, a];
  return {
    typ: "familien/umkehr-plus",
    frage: "Welche Zahl gehört in die Lücke?",
    vorstufe: {
      frage: "Schreibe die Umkehraufgabe ganz auf – sie verrät dir die Lücke:",
      rechnung: `${summe} − ${bekannt} =`,
      loesung: String(gesucht),
    },
    rechnung: hintenFehlt ? `${a} + ? = ${summe}` : `? + ${b} = ${summe}`,
    antwortfeld: zahlfeld(),
    loesung: String(gesucht),
    tipp: "Dreh die Aufgabe um: Nimm vom Ganzen den Teil weg, den du schon kennst.",
    erklaerung: `${summe} − ${bekannt} = ${gesucht}, also ${a} + ${b} = ${summe}.`,
  };
}

/** Lücke am Anfang einer Minusaufgabe – auflösen lässt sie sich nur durch Plus. */
function umkehrZuMinus(rng: Rng, max: number): Aufgabe {
  const { a, b, summe } = trio(rng, max);
  return {
    typ: "familien/umkehr-minus",
    frage: "Welche Zahl gehört in die Lücke?",
    vorstufe: {
      frage: "Schreibe die Umkehraufgabe ganz auf – sie verrät dir die Lücke:",
      rechnung: `${a} + ${b} =`,
      loesung: String(summe),
    },
    rechnung: `? − ${b} = ${a}`,
    antwortfeld: zahlfeld(),
    loesung: String(summe),
    tipp: "Was weggenommen wurde, zählst du wieder dazu.",
    erklaerung: `${a} + ${b} = ${summe}, also ${summe} − ${b} = ${a}.`,
  };
}

/** Welche der vier Aufgaben ist die Tauschaufgabe? */
function tauschaufgabe(rng: Rng, max: number): Aufgabe {
  // Bei a = b wäre die Tauschaufgabe mit der Ausgangsaufgabe identisch.
  let gezogen = trio(rng, max);
  while (gezogen.a === gezogen.b) gezogen = trio(rng, max);
  const { a, b, summe } = gezogen;
  const richtig = `${b} + ${a} = ${summe}`;
  const ablenker = [`${summe} − ${a} = ${b}`, `${summe} − ${b} = ${a}`, `${a} + ${a} = ${a + a}`];
  return {
    typ: "familien/tausch",
    frage: `Welche Aufgabe ist die Tauschaufgabe zu ${a} + ${b} = ${summe}?`,
    antwortfeld: auswahlfeld(rng, richtig, ablenker),
    loesung: richtig,
    tipp: "Bei der Tauschaufgabe stehen dieselben Zahlen – nur vertauscht.",
    erklaerung: `${a} + ${b} und ${b} + ${a} ergeben beide ${summe}. Das Ergebnis ändert sich beim Tauschen nie.`,
  };
}

/** Aus drei Zahlen die vierte Aufgabe bilden. */
function vierteAufgabe(rng: Rng, max: number): Aufgabe {
  const { a, b, summe } = trio(rng, max);
  const formen = [
    { rechnung: `${a} + ${b} =`, loesung: summe },
    { rechnung: `${b} + ${a} =`, loesung: summe },
    { rechnung: `${summe} − ${a} =`, loesung: b },
    { rechnung: `${summe} − ${b} =`, loesung: a },
  ];
  const gewaehlt = rng.pick(formen);
  return {
    typ: "familien/vier-aufgaben",
    frage: `Zu den Zahlen ${a}, ${b} und ${summe} gehören vier Aufgaben. Wie lautet das Ergebnis?`,
    rechnung: gewaehlt.rechnung,
    antwortfeld: zahlfeld(),
    loesung: String(gewaehlt.loesung),
    tipp: `${a} und ${b} sind die Teile, ${summe} ist das Ganze.`,
    erklaerung: `Die Familie lautet: ${a} + ${b} = ${summe}, ${b} + ${a} = ${summe}, ${summe} − ${a} = ${b}, ${summe} − ${b} = ${a}.`,
  };
}

/** Lückenaufgaben in allen vier Formen. */
function luecke(rng: Rng, max: number): Aufgabe {
  const { a, b, summe } = trio(rng, max);
  const formen = [
    { rechnung: `${a} + ? = ${summe}`, loesung: b },
    { rechnung: `? + ${b} = ${summe}`, loesung: a },
    { rechnung: `${summe} − ? = ${a}`, loesung: b },
    { rechnung: `? − ${b} = ${a}`, loesung: summe },
  ];
  const gewaehlt = rng.pick(formen);
  return {
    typ: "familien/luecke",
    frage: "Welche Zahl gehört in die Lücke?",
    rechnung: gewaehlt.rechnung,
    antwortfeld: zahlfeld(),
    loesung: String(gewaehlt.loesung),
    tipp: "Suche zuerst das Ganze und die Teile: Zwei Teile ergeben zusammen das Ganze.",
    erklaerung: `Zur Familie gehören ${a}, ${b} und ${summe}: ${a} + ${b} = ${summe}.`,
  };
}

/** Zwei Zahlen der Familie sind bekannt – welche gehört noch dazu? */
function dritteZahl(rng: Rng, max: number): Aufgabe {
  const { a, b, summe } = trio(rng, max);
  const fehltDasGanze = rng.chance(0.5);
  return {
    typ: "familien/dritte-zahl",
    frage: fehltDasGanze
      ? `Zu einer Aufgabenfamilie gehören die Teile ${a} und ${b}. Wie heißt das Ganze?`
      : `Zu einer Aufgabenfamilie gehören das Ganze ${summe} und das Teil ${a}. Wie heißt das andere Teil?`,
    antwortfeld: zahlfeld(),
    loesung: String(fehltDasGanze ? summe : b),
    tipp: "Zwei Teile ergeben zusammen das Ganze.",
    erklaerung: `${a} + ${b} = ${summe}`,
  };
}
