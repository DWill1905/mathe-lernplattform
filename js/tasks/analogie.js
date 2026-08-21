/**
 * Analogieaufgaben („Rechentricks“) – im Unterricht der zentrale Weg vom
 * Zahlenraum bis 20 in den Zahlenraum bis 100: Wer 3 + 4 kann, kann auch
 * 30 + 40. Die Hilfsaufgabe steht deshalb immer mit in der Frage.
 */
import { zahlfeld } from "./helpers.js";
/** Die Hilfsaufgabe, die das Kind zuerst selbst rechnet. */
function hilfsaufgabe(a, zeichen, b, ergebnis) {
    return {
        frage: "Rechne zuerst die Hilfsaufgabe.",
        rechnung: `${a} ${zeichen} ${b} =`,
        loesung: String(ergebnis),
    };
}
export function analogie(rng, stufe) {
    if (stufe === 1) {
        const wahl = rng.int(1, 3);
        if (wahl === 1)
            return nachbarPlus(rng);
        return einerZuZehnern(rng, wahl === 2 ? "+" : "−");
    }
    if (stufe === 2) {
        const wahl = rng.int(1, 4);
        if (wahl === 1)
            return zehnerDavor(rng);
        if (wahl === 2)
            return glatteZehnerSchritte(rng);
        if (wahl === 3)
            return nachbarMinus(rng);
        return einerZuZehnern(rng, rng.chance(0.5) ? "+" : "−");
    }
    const wahl = rng.int(1, 5);
    if (wahl === 1)
        return hunderter(rng);
    if (wahl === 2)
        return luecke(rng);
    if (wahl === 3)
        return tabellenzeile(rng);
    if (wahl === 4)
        return mitUebergangDavor(rng);
    return zehnerDavor(rng);
}
/** 3 + 4 = 7 → 30 + 40 = ? */
function einerZuZehnern(rng, zeichen) {
    let a;
    let b;
    if (zeichen === "+") {
        a = rng.int(1, 8);
        b = rng.int(1, 10 - a);
    }
    else {
        a = rng.int(2, 10);
        b = rng.int(1, a - 1);
    }
    const klein = zeichen === "+" ? a + b : a - b;
    const gross = klein * 10;
    return {
        typ: "analogie/einer-zehner",
        frage: "Und jetzt die große Aufgabe:",
        vorstufe: hilfsaufgabe(a, zeichen, b, klein),
        rechnung: `${a * 10} ${zeichen} ${b * 10} =`,
        antwortfeld: zahlfeld(),
        loesung: String(gross),
        tipp: "Rechne in Zehnern: Das Ergebnis der Hilfsaufgabe bekommt eine Null angehängt.",
        erklaerung: `${a} ${zeichen} ${b} = ${klein}, also ${a * 10} ${zeichen} ${b * 10} = ${gross} (${klein} Zehner).`,
    };
}
/** 3 + 2 = 5 → 13 + 2 = ? */
function zehnerDavor(rng) {
    const plus = rng.chance(0.5);
    const zehner = rng.int(1, 8) * 10;
    let a;
    let b;
    if (plus) {
        a = rng.int(1, 8);
        b = rng.int(1, 9 - a);
    }
    else {
        a = rng.int(2, 9);
        b = rng.int(1, a - 1);
    }
    const klein = plus ? a + b : a - b;
    const zeichen = plus ? "+" : "−";
    return {
        typ: "analogie/zehner-davor",
        frage: "Und jetzt die große Aufgabe:",
        vorstufe: hilfsaufgabe(a, zeichen, b, klein),
        rechnung: `${zehner + a} ${zeichen} ${b} =`,
        antwortfeld: zahlfeld(),
        loesung: String(zehner + klein),
        tipp: "Die Zehner bleiben, gerechnet wird nur mit den Einern.",
        erklaerung: `Die ${zehner / 10} Zehner bleiben stehen: ${a} ${zeichen} ${b} = ${klein}, also ${zehner + a} ${zeichen} ${b} = ${zehner + klein}.`,
    };
}
/** 16 − 10 = ? und ? + 10 = 16 */
function glatteZehnerSchritte(rng) {
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
function hunderter(rng) {
    const plus = rng.chance(0.5);
    if (plus) {
        const a = rng.int(1, 9);
        const b = 10 - a;
        return {
            typ: "analogie/hunderter",
            frage: "Und jetzt die große Aufgabe:",
            vorstufe: hilfsaufgabe(a, "+", b, 10),
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
        frage: "Und jetzt die große Aufgabe:",
        vorstufe: hilfsaufgabe(10, "−", b, 10 - b),
        rechnung: `100 − ${b * 10} =`,
        antwortfeld: zahlfeld(),
        loesung: String((10 - b) * 10),
        tipp: "100 sind 10 Zehner.",
        erklaerung: `10 − ${b} = ${10 - b}, also 100 − ${b * 10} = ${(10 - b) * 10}.`,
    };
}
/** Lücke ergänzen: ? + 30 = 70 */
function luecke(rng) {
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
function tabellenzeile(rng) {
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
/* --------------------------------------------------------- Nachbaraufgaben */
/**
 * Nachbaraufgabe zur Verdopplung: Wer 7 + 7 kann, kann auch 7 + 8 – es ist
 * genau eins mehr. Im Heft steht dieser Aufgabentyp direkt neben den
 * Analogieaufgaben.
 */
function nachbarPlus(rng) {
    const a = rng.int(2, 9);
    const doppelt = a + a;
    const mehr = rng.chance(0.7);
    const partner = mehr ? a + 1 : a - 1;
    const loesung = a + partner;
    return {
        typ: "analogie/nachbar-plus",
        frage: "Und jetzt die Nachbaraufgabe:",
        vorstufe: hilfsaufgabe(a, "+", a, doppelt),
        rechnung: `${a} + ${partner} =`,
        antwortfeld: zahlfeld(),
        loesung: String(loesung),
        tipp: mehr ? "Die Nachbaraufgabe ist genau eins mehr." : "Die Nachbaraufgabe ist genau eins weniger.",
        erklaerung: `${a} + ${a} = ${doppelt}, und ${a} + ${partner} ist eins ${mehr ? "mehr" : "weniger"}: ${loesung}.`,
    };
}
/** Nachbaraufgabe beim Minusrechnen: 18 − 9 = 9, also ist 18 − 8 eins mehr. */
function nachbarMinus(rng) {
    const a = rng.int(3, 10);
    const zahl = a + a;
    const weniger = rng.chance(0.7);
    const partner = weniger ? a - 1 : a + 1;
    const loesung = zahl - partner;
    return {
        typ: "analogie/nachbar-minus",
        frage: "Und jetzt die Nachbaraufgabe:",
        vorstufe: hilfsaufgabe(zahl, "−", a, a),
        rechnung: `${zahl} − ${partner} =`,
        antwortfeld: zahlfeld(),
        loesung: String(loesung),
        tipp: weniger
            ? "Wer weniger wegnimmt, behält mehr übrig."
            : "Wer mehr wegnimmt, behält weniger übrig.",
        erklaerung: `${zahl} − ${a} = ${a}. Du nimmst eins ${weniger ? "weniger" : "mehr"} weg, also bleibt ${loesung}.`,
    };
}
/**
 * Analogie über den Zehner hinweg: 8 + 5 = 13, also 18 + 5 = 23. Der
 * Zehnerübergang bleibt derselbe, nur der Zehner davor ändert sich.
 */
function mitUebergangDavor(rng) {
    const plus = rng.chance(0.5);
    const zehner = rng.int(1, 7) * 10;
    if (plus) {
        const a = rng.int(3, 9);
        const b = rng.int(11 - a, 9);
        return {
            typ: "analogie/uebergang-davor",
            frage: "Und jetzt die große Aufgabe:",
            vorstufe: hilfsaufgabe(a, "+", b, a + b),
            rechnung: `${zehner + a} + ${b} =`,
            antwortfeld: zahlfeld(),
            loesung: String(zehner + a + b),
            tipp: "Der Übergang über den Zehner ist derselbe wie in der Hilfsaufgabe.",
            erklaerung: `${a} + ${b} = ${a + b}, also ${zehner + a} + ${b} = ${zehner + a + b}.`,
        };
    }
    const a = rng.int(11, 18);
    const b = rng.int(a - 9, 9);
    return {
        typ: "analogie/uebergang-davor",
        frage: "Und jetzt die große Aufgabe:",
        vorstufe: hilfsaufgabe(a, "−", b, a - b),
        rechnung: `${zehner + a} − ${b} =`,
        antwortfeld: zahlfeld(),
        loesung: String(zehner + a - b),
        tipp: "Der Übergang über den Zehner ist derselbe wie in der Hilfsaufgabe.",
        erklaerung: `${a} − ${b} = ${a - b}, also ${zehner + a} − ${b} = ${zehner + a - b}.`,
    };
}
