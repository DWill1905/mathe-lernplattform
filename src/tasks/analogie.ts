/**
 * Analogieaufgaben („Rechentricks“) – im Unterricht der zentrale Weg vom
 * Zahlenraum bis 20 in den Zahlenraum bis 100: Wer 3 + 4 kann, kann auch
 * 30 + 40. Die Hilfsaufgabe steht deshalb immer mit in der Frage.
 */

import type { Rng } from "../random.js";
import type { Aufgabe, Stufe } from "../types.js";
import { zahlfeld } from "./helpers.js";

export function analogie(rng: Rng, stufe: Stufe): Aufgabe {
  if (stufe === 1) return rng.chance(0.5) ? einerZuZehnern(rng, "+") : einerZuZehnern(rng, "−");
  if (stufe === 2) {
    const wahl = rng.int(1, 3);
    if (wahl === 1) return zehnerDavor(rng);
    if (wahl === 2) return glatteZehnerSchritte(rng);
    return einerZuZehnern(rng, rng.chance(0.5) ? "+" : "−");
  }
  const wahl = rng.int(1, 4);
  if (wahl === 1) return hunderter(rng);
  if (wahl === 2) return luecke(rng);
  if (wahl === 3) return tabellenzeile(rng);
  return zehnerDavor(rng);
}

/** 3 + 4 = 7 → 30 + 40 = ? */
function einerZuZehnern(rng: Rng, zeichen: "+" | "−"): Aufgabe {
  let a: number;
  let b: number;
  if (zeichen === "+") {
    a = rng.int(1, 8);
    b = rng.int(1, 10 - a);
  } else {
    a = rng.int(2, 10);
    b = rng.int(1, a - 1);
  }
  const klein = zeichen === "+" ? a + b : a - b;
  const gross = klein * 10;
  return {
    typ: "analogie/einer-zehner",
    frage: `Die Hilfsaufgabe lautet ${a} ${zeichen} ${b} = ${klein}. Wie heißt das Ergebnis?`,
    rechnung: `${a * 10} ${zeichen} ${b * 10} =`,
    antwortfeld: zahlfeld(),
    loesung: String(gross),
    tipp: "Rechne in Zehnern: Das Ergebnis der Hilfsaufgabe bekommt eine Null angehängt.",
    erklaerung: `${a} ${zeichen} ${b} = ${klein}, also ${a * 10} ${zeichen} ${b * 10} = ${gross} (${klein} Zehner).`,
  };
}

/** 3 + 2 = 5 → 13 + 2 = ? */
function zehnerDavor(rng: Rng): Aufgabe {
  const plus = rng.chance(0.5);
  const zehner = rng.int(1, 8) * 10;
  let a: number;
  let b: number;
  if (plus) {
    a = rng.int(1, 8);
    b = rng.int(1, 9 - a);
  } else {
    a = rng.int(2, 9);
    b = rng.int(1, a - 1);
  }
  const klein = plus ? a + b : a - b;
  const zeichen = plus ? "+" : "−";
  return {
    typ: "analogie/zehner-davor",
    frage: `Die Hilfsaufgabe lautet ${a} ${zeichen} ${b} = ${klein}. Wie heißt das Ergebnis?`,
    rechnung: `${zehner + a} ${zeichen} ${b} =`,
    antwortfeld: zahlfeld(),
    loesung: String(zehner + klein),
    tipp: "Die Zehner bleiben, gerechnet wird nur mit den Einern.",
    erklaerung: `Die ${zehner / 10} Zehner bleiben stehen: ${a} ${zeichen} ${b} = ${klein}, also ${zehner + a} ${zeichen} ${b} = ${zehner + klein}.`,
  };
}

/** 16 − 10 = ? und ? + 10 = 16 */
function glatteZehnerSchritte(rng: Rng): Aufgabe {
  const zahl = rng.int(11, 99);
  const abziehen = rng.chance(0.5);
  if (abziehen) {
    return {
      typ: "analogie/minus-zehn",
      frage: "Wie lautet das Ergebnis?",
      rechnung: `${zahl} − 10 =`,
      antwortfeld: zahlfeld(),
      loesung: String(zahl - 10),
      tipp: "Bei minus 10 wird nur die Zehnerstelle um eins kleiner.",
      erklaerung: `${zahl} − 10 = ${zahl - 10} – die Einerstelle bleibt gleich.`,
    };
  }
  return {
    typ: "analogie/plus-zehn",
    frage: "Welche Zahl gehört in die Lücke?",
    rechnung: `? + 10 = ${zahl}`,
    antwortfeld: zahlfeld(),
    loesung: String(zahl - 10),
    tipp: "Rechne rückwärts: Wie viel ist die Zahl minus 10?",
    erklaerung: `${zahl} − 10 = ${zahl - 10}, also ${zahl - 10} + 10 = ${zahl}.`,
  };
}

/** 10 − 4 = 6 → 100 − 40 = ? */
function hunderter(rng: Rng): Aufgabe {
  const plus = rng.chance(0.5);
  if (plus) {
    const a = rng.int(1, 9);
    const b = 10 - a;
    return {
      typ: "analogie/hunderter",
      frage: `Die Hilfsaufgabe lautet ${a} + ${b} = 10. Wie heißt das Ergebnis?`,
      rechnung: `${a * 10} + ${b * 10} =`,
      antwortfeld: zahlfeld(),
      loesung: "100",
      tipp: "Zehn Zehner sind hundert.",
      erklaerung: `${a} + ${b} = 10 Zehner, und 10 Zehner sind 100.`,
    };
  }
  const b = rng.int(1, 9);
  return {
    typ: "analogie/hunderter",
    frage: `Die Hilfsaufgabe lautet 10 − ${b} = ${10 - b}. Wie heißt das Ergebnis?`,
    rechnung: `100 − ${b * 10} =`,
    antwortfeld: zahlfeld(),
    loesung: String((10 - b) * 10),
    tipp: "100 sind 10 Zehner.",
    erklaerung: `10 − ${b} = ${10 - b}, also 100 − ${b * 10} = ${(10 - b) * 10}.`,
  };
}

/** ☐ + 30 = 70 */
function luecke(rng: Rng): Aufgabe {
  const ergebnis = rng.int(3, 10) * 10;
  const bekannt = rng.int(1, ergebnis / 10 - 1) * 10;
  const gesucht = ergebnis - bekannt;
  const plus = rng.chance(0.5);
  return {
    typ: "analogie/luecke",
    frage: "Welche Zahl gehört in die Lücke?",
    rechnung: plus ? `? + ${bekannt} = ${ergebnis}` : `${ergebnis} − ? = ${bekannt}`,
    antwortfeld: zahlfeld(),
    loesung: String(gesucht),
    tipp: "Rechne in Zehnern und nutze die Umkehraufgabe.",
    erklaerung: `${ergebnis} − ${bekannt} = ${gesucht}`,
  };
}

/** Zeile aus der Additions- oder Subtraktionstabelle: 30 + 5 bzw. 60 − 4 */
function tabellenzeile(rng: Rng): Aufgabe {
  const plus = rng.chance(0.5);
  const zehner = rng.int(1, 9) * 10;
  const einer = rng.pick([1, 2, 3, 4, 5, 6, 7, 8, 9]);
  if (plus) {
    return {
      typ: "analogie/tabelle",
      frage: "Wie lautet das Ergebnis?",
      rechnung: `${zehner} + ${einer} =`,
      antwortfeld: zahlfeld(),
      loesung: String(zehner + einer),
      tipp: "Zehner und Einer stehen einfach nebeneinander.",
      erklaerung: `${zehner / 10} Zehner und ${einer} Einer sind ${zehner + einer}.`,
    };
  }
  return {
    typ: "analogie/tabelle",
    frage: "Wie lautet das Ergebnis?",
    rechnung: `${zehner} − ${einer} =`,
    antwortfeld: zahlfeld(),
    loesung: String(zehner - einer),
    tipp: "Gehe vom glatten Zehner rückwärts.",
    erklaerung: `Von ${zehner} ${einer} zurück sind ${zehner - einer}.`,
  };
}
