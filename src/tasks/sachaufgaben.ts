import type { Rng } from "../random.js";
import type { Aufgabe, Stufe } from "../types.js";
import { zahlfeld, zweiNamen } from "./helpers.js";

/** Gegenstände (Mehrzahl), die in den Rechengeschichten vorkommen. */
const DINGE: readonly string[] = [
  "Sticker",
  "Murmeln",
  "Karten",
  "Kastanien",
  "Muscheln",
  "Buntstifte",
  "Perlen",
  "Luftballons",
];

export function sachaufgaben(rng: Rng, stufe: Stufe): Aufgabe {
  if (stufe === 1) return rng.pick([dazubekommen, weggeben])(rng, 20);
  if (stufe === 2) return rng.pick([dazubekommen, weggeben, mehrAls, verteilen, packungen])(rng, 100);
  return rng.pick([zweiSchritte, einkaufMitRueckgeld, zusammenUndDifferenz])(rng, 100);
}

function ding(rng: Rng): string {
  return rng.pick(DINGE);
}

function dazubekommen(rng: Rng, max: number): Aufgabe {
  const [name, freund] = zweiNamen(rng);
  const mehrzahl = ding(rng);
  const a = rng.int(3, Math.floor(max * 0.6));
  const b = rng.int(2, max - a);
  return {
    typ: "sach/dazu",
    frage: `${name} hat ${a} ${mehrzahl}. ${freund} schenkt ${name} ${b} ${mehrzahl} dazu. Wie viele ${mehrzahl} hat ${name} jetzt?`,
    antwortfeld: zahlfeld(),
    loesung: String(a + b),
    tipp: "„dazu“ bedeutet: plus rechnen.",
    erklaerung: `${a} + ${b} = ${a + b}`,
  };
}

function weggeben(rng: Rng, max: number): Aufgabe {
  const [name] = zweiNamen(rng);
  const mehrzahl = ding(rng);
  const a = rng.int(8, max);
  const b = rng.int(2, a - 1);
  return {
    typ: "sach/weg",
    frage: `${name} hat ${a} ${mehrzahl} und verschenkt ${b} davon. Wie viele ${mehrzahl} bleiben übrig?`,
    antwortfeld: zahlfeld(),
    loesung: String(a - b),
    tipp: "„verschenken“ bedeutet: minus rechnen.",
    erklaerung: `${a} − ${b} = ${a - b}`,
  };
}

function mehrAls(rng: Rng, max: number): Aufgabe {
  const [name, freund] = zweiNamen(rng);
  const mehrzahl = ding(rng);
  const a = rng.int(5, Math.floor(max * 0.7));
  const b = rng.int(2, max - a);
  return {
    typ: "sach/mehr-als",
    frage: `${name} hat ${a} ${mehrzahl}. ${freund} hat ${b} ${mehrzahl} mehr als ${name}. Wie viele ${mehrzahl} hat ${freund}?`,
    antwortfeld: zahlfeld(),
    loesung: String(a + b),
    tipp: "„mehr als“ bedeutet: die Zahlen zusammenzählen.",
    erklaerung: `${a} + ${b} = ${a + b}`,
  };
}

function verteilen(rng: Rng, _max: number): Aufgabe {
  const [name] = zweiNamen(rng);
  const mehrzahl = ding(rng);
  const kinder = rng.int(2, 6);
  const proKind = rng.int(2, 10);
  return {
    typ: "sach/verteilen",
    frage: `${name} verteilt ${kinder * proKind} ${mehrzahl} gerecht an ${kinder} Kinder. Wie viele bekommt jedes Kind?`,
    antwortfeld: zahlfeld(),
    loesung: String(proKind),
    tipp: "„gerecht verteilen“ bedeutet: teilen.",
    erklaerung: `${kinder * proKind} : ${kinder} = ${proKind}`,
  };
}

function packungen(rng: Rng, _max: number): Aufgabe {
  const mehrzahl = ding(rng);
  const anzahl = rng.int(2, 9);
  const proPackung = rng.int(2, 10);
  return {
    typ: "sach/packungen",
    frage: `In einer Schachtel sind ${proPackung} ${mehrzahl}. Wie viele ${mehrzahl} sind in ${anzahl} Schachteln?`,
    antwortfeld: zahlfeld(),
    loesung: String(anzahl * proPackung),
    tipp: "Gleich große Gruppen – da hilft das Malnehmen.",
    erklaerung: `${anzahl} · ${proPackung} = ${anzahl * proPackung}`,
  };
}

function zweiSchritte(rng: Rng, _max: number): Aufgabe {
  const [name] = zweiNamen(rng);
  const mehrzahl = ding(rng);
  const start = rng.int(20, 60);
  const dazu = rng.int(5, 30);
  const weg = rng.int(3, start + dazu - 1);
  return {
    typ: "sach/zwei-schritte",
    frage: `${name} hat ${start} ${mehrzahl}. ${name} bekommt ${dazu} dazu und verschenkt danach ${weg}. Wie viele ${mehrzahl} sind es jetzt?`,
    antwortfeld: zahlfeld(),
    loesung: String(start + dazu - weg),
    tipp: "Rechne Schritt für Schritt – erst dazu, dann weg.",
    erklaerung: `${start} + ${dazu} = ${start + dazu}, dann ${start + dazu} − ${weg} = ${start + dazu - weg}`,
  };
}

function einkaufMitRueckgeld(rng: Rng, _max: number): Aufgabe {
  const [name] = zweiNamen(rng);
  const stueck = rng.int(2, 5);
  const preis = rng.int(2, 6);
  const kosten = stueck * preis;
  // Es muss immer genug Geld dabei sein – sonst wäre das Rückgeld negativ.
  const gezahlt = rng.pick([10, 20, 50].filter((schein) => schein >= kosten));
  return {
    typ: "sach/einkauf",
    frage: `${name} kauft ${stueck} Hefte für je ${preis} €. ${name} bezahlt mit ${gezahlt} €. Wie viele Euro gibt es zurück?`,
    antwortfeld: zahlfeld("€"),
    loesung: String(gezahlt - kosten),
    tipp: "Rechne zuerst den Gesamtpreis aus.",
    erklaerung: `${stueck} · ${preis} € = ${kosten} €, dann ${gezahlt} € − ${kosten} € = ${gezahlt - kosten} €`,
  };
}

function zusammenUndDifferenz(rng: Rng, _max: number): Aufgabe {
  const [name, freund] = zweiNamen(rng);
  const mehrzahl = ding(rng);
  const a = rng.int(20, 60);
  const b = rng.int(5, a - 1);
  const fragtDifferenz = rng.chance(0.5);
  return {
    typ: "sach/vergleich",
    frage: `${name} sammelt ${a} ${mehrzahl}, ${freund} sammelt ${b} ${mehrzahl}. ${
      fragtDifferenz
        ? `Wie viele ${mehrzahl} hat ${name} mehr als ${freund}?`
        : `Wie viele ${mehrzahl} haben beide zusammen?`
    }`,
    antwortfeld: zahlfeld(),
    loesung: String(fragtDifferenz ? a - b : a + b),
    tipp: fragtDifferenz ? "„mehr als“ heißt hier: den Unterschied ausrechnen." : "„zusammen“ heißt: plus rechnen.",
    erklaerung: fragtDifferenz ? `${a} − ${b} = ${a - b}` : `${a} + ${b} = ${a + b}`,
  };
}
