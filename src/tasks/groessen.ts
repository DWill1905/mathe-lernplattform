import type { Rng } from "../random.js";
import type { Aufgabe, Stufe } from "../types.js";
import { geldbild, uhr } from "../figures.js";
import { auswahlfeld, geldText, uhrText, zahlfeld, zweiNamen } from "./helpers.js";

/* ================================================================= Geld */

/** Umlaufende Euro-Münzen in Cent. */
const MUENZEN = [1, 2, 5, 10, 20, 50, 100, 200] as const;
const KLEINGELD = [1, 2, 5, 10, 20, 50] as const;

export function geld(rng: Rng, stufe: Stufe): Aufgabe {
  if (stufe === 1) return rng.pick([muenzenZaehlen, muenzenZaehlen, muenzeGroesser])(rng);
  if (stufe === 2) return rng.pick([inCent, inEuroUndCent, betraegeAddieren])(rng);
  return rng.pick([rueckgeld, rueckgeld, reichtDasGeld])(rng);
}

function muenzenZaehlen(rng: Rng): Aufgabe {
  const anzahl = rng.int(3, 5);
  const werte: number[] = [];
  for (let i = 0; i < anzahl; i++) werte.push(rng.pick(KLEINGELD));
  const summe = werte.reduce((a, b) => a + b, 0);
  const sortiert = werte.slice().sort((a, b) => b - a);
  return {
    typ: "geld/muenzen-zaehlen",
    frage: "Wie viel Geld ist das? Antworte in Cent.",
    bild: { svg: geldbild(sortiert), beschriftung: `${anzahl} Münzen` },
    antwortfeld: zahlfeld("ct"),
    loesung: String(summe),
    tipp: "Fang mit der größten Münze an und zähle die anderen dazu.",
    erklaerung: `${sortiert.join(" ct + ")} ct = ${summe} ct`,
  };
}

function muenzeGroesser(rng: Rng): Aufgabe {
  const [a, b] = rng.shuffle(MUENZEN.slice()).slice(0, 2) as [number, number];
  const groesser = Math.max(a, b);
  return {
    typ: "geld/muenze-vergleich",
    frage: "Welche Münze ist mehr wert?",
    bild: { svg: geldbild([a, b]), beschriftung: "zwei Münzen" },
    antwortfeld: { art: "auswahl", optionen: rng.shuffle([geldText(a), geldText(b)]) },
    loesung: geldText(groesser),
    tipp: "1 Euro sind 100 Cent.",
  };
}

function inCent(rng: Rng): Aufgabe {
  const euro = rng.int(1, 9);
  const cent = rng.pick([0, 5, 10, 20, 25, 50, 60, 75, 80, 90]);
  const summe = euro * 100 + cent;
  return {
    typ: "geld/in-cent",
    frage: `Wie viele Cent sind ${geldText(summe)}?`,
    antwortfeld: zahlfeld("ct"),
    loesung: String(summe),
    tipp: "Ein Euro sind 100 Cent.",
    erklaerung: `${euro} · 100 ct = ${euro * 100} ct, dazu ${cent} ct macht ${summe} ct.`,
  };
}

function inEuroUndCent(rng: Rng): Aufgabe {
  const euro = rng.int(1, 9);
  const cent = rng.pick([5, 10, 20, 25, 40, 50, 70, 90]);
  const summe = euro * 100 + cent;
  const ablenker = [
    geldText(summe + 100),
    geldText(Math.max(5, summe - 100)),
    geldText(cent * 100 + euro),
    geldText(summe + 10),
  ];
  return {
    typ: "geld/in-euro",
    frage: `Wie viel Euro und Cent sind ${summe} ct?`,
    antwortfeld: auswahlfeld(rng, geldText(summe), ablenker),
    loesung: geldText(summe),
    tipp: "Je 100 Cent ergeben einen Euro.",
    erklaerung: `${summe} ct = ${euro} € und ${cent} ct`,
  };
}

function betraegeAddieren(rng: Rng): Aufgabe {
  const a = rng.int(2, 40) * 5;
  const b = rng.int(2, 40) * 5;
  return {
    typ: "geld/addieren",
    frage: "Wie viel kostet beides zusammen? Antworte in Cent.",
    rechnung: `${a} ct + ${b} ct =`,
    antwortfeld: zahlfeld("ct"),
    loesung: String(a + b),
    tipp: "Rechne wie mit normalen Zahlen – die Einheit bleibt Cent.",
    erklaerung: `${a} + ${b} = ${a + b}`,
  };
}

function rueckgeld(rng: Rng): Aufgabe {
  const [name] = zweiNamen(rng);
  const gezahltEuro = rng.pick([2, 5, 10]);
  const preis = rng.int(1, gezahltEuro * 20 - 1) * 5;
  const zurueck = gezahltEuro * 100 - preis;
  return {
    typ: "geld/rueckgeld",
    frage: `${name} kauft etwas für ${geldText(preis)} und bezahlt mit ${gezahltEuro} €. Wie viel Geld gibt es zurück? Antworte in Cent.`,
    antwortfeld: zahlfeld("ct"),
    loesung: String(zurueck),
    tipp: `Rechne von ${preis} ct bis ${gezahltEuro * 100} ct hinauf.`,
    erklaerung: `${gezahltEuro * 100} ct − ${preis} ct = ${zurueck} ct`,
  };
}

function reichtDasGeld(rng: Rng): Aufgabe {
  const [name] = zweiNamen(rng);
  const geldbetrag = rng.int(4, 20) * 50;
  let preis = rng.int(4, 20) * 50;
  while (preis === geldbetrag) preis = rng.int(4, 20) * 50;
  const reicht = geldbetrag >= preis;
  return {
    typ: "geld/reicht-es",
    frage: `${name} hat ${geldText(geldbetrag)} dabei und möchte etwas für ${geldText(preis)} kaufen. Reicht das Geld?`,
    antwortfeld: { art: "auswahl", optionen: ["Ja, das Geld reicht", "Nein, es fehlt noch Geld"] },
    loesung: reicht ? "Ja, das Geld reicht" : "Nein, es fehlt noch Geld",
    tipp: "Rechne beide Beträge in Cent um und vergleiche.",
    erklaerung: reicht
      ? `${geldbetrag} ct sind genug für ${preis} ct – es bleiben sogar ${geldbetrag - preis} ct übrig.`
      : `${geldbetrag} ct sind zu wenig für ${preis} ct – es fehlen ${preis - geldbetrag} ct.`,
  };
}

/* ============================================================== Uhrzeit */

export function uhrzeit(rng: Rng, stufe: Stufe): Aufgabe {
  if (stufe === 1) return uhrAblesen(rng, [0, 30]);
  if (stufe === 2) return rng.chance(0.7) ? uhrAblesen(rng, [0, 15, 30, 45]) : sprechweise(rng);
  const wahl = rng.int(1, 3);
  if (wahl === 1) return zeitspanne(rng);
  if (wahl === 2) return spaeter(rng);
  return uhrAblesen(rng, [0, 5, 10, 20, 25, 35, 40, 50, 55]);
}

function uhrAblesen(rng: Rng, minuten: readonly number[]): Aufgabe {
  const stunde = rng.int(1, 12);
  const minute = rng.pick(minuten);
  const richtig = uhrText(stunde, minute);
  const ablenker = [
    uhrText(stunde === 12 ? 1 : stunde + 1, minute),
    uhrText(stunde, rng.pick(minuten.filter((m) => m !== minute))),
    uhrText(stunde === 1 ? 12 : stunde - 1, minute),
    uhrText(minute === 0 ? 12 : Math.max(1, Math.round(minute / 5)), 0),
  ];
  return {
    typ: "uhrzeit/ablesen",
    frage: "Wie spät ist es?",
    bild: { svg: uhr(stunde, minute), beschriftung: `Uhr, die ${richtig} Uhr zeigt` },
    antwortfeld: auswahlfeld(rng, richtig, ablenker),
    loesung: richtig,
    tipp: "Der kurze Zeiger zeigt die Stunde, der lange die Minuten.",
    erklaerung: `Der kleine Zeiger steht bei ${stunde}, der große bei ${minute === 0 ? 12 : minute / 5} – das sind ${minute} Minuten.`,
  };
}

function sprechweise(rng: Rng): Aufgabe {
  const stunde = rng.int(1, 12);
  const naechste = stunde === 12 ? 1 : stunde + 1;
  const minute = rng.pick([0, 15, 30, 45]);
  const namen: Record<number, string> = {
    0: `${stunde} Uhr`,
    15: `Viertel nach ${stunde}`,
    30: `halb ${naechste}`,
    45: `Viertel vor ${naechste}`,
  };
  const richtig = namen[minute]!;
  const ablenker = Object.entries(namen)
    .filter(([m]) => Number(m) !== minute)
    .map(([, text]) => text);
  return {
    typ: "uhrzeit/sprechweise",
    frage: `Es ist ${uhrText(stunde, minute)} Uhr. Wie sagt man das?`,
    bild: { svg: uhr(stunde, minute), beschriftung: `Uhr, die ${uhrText(stunde, minute)} Uhr zeigt` },
    antwortfeld: auswahlfeld(rng, richtig, ablenker),
    loesung: richtig,
    tipp: "„halb“ zeigt immer auf die nächste volle Stunde.",
    erklaerung: `${uhrText(stunde, minute)} Uhr sagt man „${richtig}“.`,
  };
}

function zeitspanne(rng: Rng): Aufgabe {
  const stunde = rng.int(7, 18);
  const startMinute = rng.pick([0, 15, 30, 45]);
  const dauer = rng.pick([15, 20, 30, 40, 45, 60, 75, 90]);
  const endeGesamt = stunde * 60 + startMinute + dauer;
  const endStunde = Math.floor(endeGesamt / 60);
  const endMinute = endeGesamt % 60;
  return {
    typ: "uhrzeit/zeitspanne",
    frage: `Der Film beginnt um ${uhrText(stunde, startMinute)} Uhr und endet um ${uhrText(endStunde, endMinute)} Uhr. Wie viele Minuten dauert er?`,
    antwortfeld: zahlfeld("Minuten"),
    loesung: String(dauer),
    tipp: "Rechne zuerst bis zur nächsten vollen Stunde.",
    erklaerung: `Eine Stunde hat 60 Minuten. Von ${uhrText(stunde, startMinute)} bis ${uhrText(endStunde, endMinute)} sind es ${dauer} Minuten.`,
  };
}

function spaeter(rng: Rng): Aufgabe {
  const stunde = rng.int(1, 11);
  const startMinute = rng.pick([0, 10, 15, 20, 30, 45]);
  const dauer = rng.pick([10, 15, 20, 30, 45]);
  const gesamt = stunde * 60 + startMinute + dauer;
  const endStunde = Math.floor(gesamt / 60);
  const endMinute = gesamt % 60;
  const richtig = uhrText(endStunde, endMinute);
  const ablenker = [
    uhrText(endStunde, (endMinute + 10) % 60),
    uhrText(stunde, (startMinute + dauer) % 60),
    uhrText(endStunde + 1 > 12 ? 1 : endStunde + 1, endMinute),
  ];
  return {
    typ: "uhrzeit/spaeter",
    frage: `Es ist ${uhrText(stunde, startMinute)} Uhr. Wie spät ist es in ${dauer} Minuten?`,
    bild: { svg: uhr(stunde, startMinute), beschriftung: `Uhr, die ${uhrText(stunde, startMinute)} Uhr zeigt` },
    antwortfeld: auswahlfeld(rng, richtig, ablenker),
    loesung: richtig,
    tipp: "Zähle in Fünf-Minuten-Schritten weiter.",
    erklaerung: `${uhrText(stunde, startMinute)} + ${dauer} Minuten = ${richtig} Uhr`,
  };
}

/* =============================================================== Längen */

export function laengen(rng: Rng, stufe: Stufe): Aufgabe {
  if (stufe === 1) return rng.pick([meterInCm, cmInMeter])(rng);
  if (stufe === 2) return rng.pick([gemischtInCm, cmInMm, laengeVergleichen])(rng);
  return rng.pick([laengeRechnen, restLaenge, cmInMm])(rng);
}

function meterInCm(rng: Rng): Aufgabe {
  const meter = rng.int(1, 9);
  return {
    typ: "laengen/m-in-cm",
    frage: `Wie viele Zentimeter sind ${meter} m?`,
    antwortfeld: zahlfeld("cm"),
    loesung: String(meter * 100),
    tipp: "1 m sind 100 cm.",
    erklaerung: `${meter} · 100 cm = ${meter * 100} cm`,
  };
}

function cmInMeter(rng: Rng): Aufgabe {
  const meter = rng.int(1, 9);
  return {
    typ: "laengen/cm-in-m",
    frage: `Wie viele Meter sind ${meter * 100} cm?`,
    antwortfeld: zahlfeld("m"),
    loesung: String(meter),
    tipp: "Je 100 cm ergeben 1 m.",
    erklaerung: `${meter * 100} cm : 100 = ${meter} m`,
  };
}

function gemischtInCm(rng: Rng): Aufgabe {
  const meter = rng.int(1, 5);
  const cm = rng.int(1, 19) * 5;
  return {
    typ: "laengen/gemischt",
    frage: `Wie viele Zentimeter sind ${meter} m und ${cm} cm?`,
    antwortfeld: zahlfeld("cm"),
    loesung: String(meter * 100 + cm),
    tipp: "Rechne die Meter in Zentimeter um und zähle den Rest dazu.",
    erklaerung: `${meter} m = ${meter * 100} cm, dazu ${cm} cm sind ${meter * 100 + cm} cm.`,
  };
}

function cmInMm(rng: Rng): Aufgabe {
  const cm = rng.int(2, 20);
  return {
    typ: "laengen/cm-in-mm",
    frage: `Wie viele Millimeter sind ${cm} cm?`,
    antwortfeld: zahlfeld("mm"),
    loesung: String(cm * 10),
    tipp: "1 cm sind 10 mm.",
    erklaerung: `${cm} · 10 mm = ${cm * 10} mm`,
  };
}

function laengeVergleichen(rng: Rng): Aufgabe {
  const cmWert = rng.int(30, 250);
  const mWert = rng.int(1, 3);
  const laengerIstCm = cmWert > mWert * 100;
  const a = `${cmWert} cm`;
  const b = `${mWert} m`;
  return {
    typ: "laengen/vergleich",
    frage: "Welche Länge ist länger?",
    rechnung: `${a}   oder   ${b}`,
    antwortfeld: { art: "auswahl", optionen: rng.shuffle([a, b]) },
    loesung: laengerIstCm ? a : b,
    tipp: "Rechne beides in Zentimeter um.",
    erklaerung: `${mWert} m sind ${mWert * 100} cm. ${Math.max(cmWert, mWert * 100)} cm ist mehr.`,
  };
}

function laengeRechnen(rng: Rng): Aufgabe {
  const a = rng.int(5, 90);
  const b = rng.int(5, 90);
  return {
    typ: "laengen/addieren",
    frage: "Wie lang sind beide Stücke zusammen?",
    rechnung: `${a} cm + ${b} cm =`,
    antwortfeld: zahlfeld("cm"),
    loesung: String(a + b),
    tipp: "Die Einheit bleibt gleich – rechne einfach die Zahlen.",
    erklaerung: `${a} + ${b} = ${a + b}`,
  };
}

function restLaenge(rng: Rng): Aufgabe {
  const meter = rng.int(1, 3);
  const abgeschnitten = rng.int(1, meter * 20 - 1) * 5;
  const rest = meter * 100 - abgeschnitten;
  return {
    typ: "laengen/rest",
    frage: `Ein Seil ist ${meter} m lang. Es werden ${abgeschnitten} cm abgeschnitten. Wie viele Zentimeter bleiben übrig?`,
    antwortfeld: zahlfeld("cm"),
    loesung: String(rest),
    tipp: "Rechne die Meter zuerst in Zentimeter um.",
    erklaerung: `${meter} m = ${meter * 100} cm. ${meter * 100} − ${abgeschnitten} = ${rest} cm`,
  };
}
