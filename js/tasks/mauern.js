/**
 * Zahlenmauern und Rechenräder – zwei Darstellungen, mit denen im Unterricht
 * Plus und Minus geübt werden.
 *
 * In einer Zahlenmauer ist jeder Stein die Summe der beiden Steine darunter.
 * Es fehlt immer genau ein Stein; weil alle Nachbarn sichtbar sind, ist er
 * eindeutig bestimmt – egal, ob er oben, in der Mitte oder unten steht.
 */
import { rechenrad, zahlenmauer } from "../figures.js";
import { zahlfeld } from "./helpers.js";
export function mauern(rng, stufe) {
    if (stufe === 1)
        return rng.chance(0.6) ? kleineMauer(rng, false) : rad(rng, stufe);
    if (stufe === 2)
        return rng.chance(0.6) ? kleineMauer(rng, true) : rad(rng, stufe);
    return rng.chance(0.65) ? grosseMauer(rng) : rad(rng, stufe);
}
/** Baut aus den Grundsteinen die komplette Mauer (unten → oben). */
export function baueMauer(grund) {
    const reihen = [grund.slice()];
    while (reihen[reihen.length - 1].length > 1) {
        const unten = reihen[reihen.length - 1];
        const oben = [];
        for (let i = 0; i < unten.length - 1; i++)
            oben.push(unten[i] + unten[i + 1]);
        reihen.push(oben);
    }
    return reihen;
}
/** Ersetzt genau einen Stein durch die Lücke und liefert seinen Wert. */
function mitLuecke(reihen, ebene, spalte) {
    const loesung = reihen[ebene][spalte];
    const anzeige = reihen.map((reihe, i) => reihe.map((wert, s) => (i === ebene && s === spalte ? null : wert)));
    return { anzeige, loesung };
}
/** Mauer mit zwei Grundsteinen – gesucht ist der Deckstein oder ein Grundstein. */
function kleineMauer(rng, lueckeUnten) {
    const a = rng.int(1, 10);
    const b = rng.int(1, 20 - a);
    const reihen = baueMauer([a, b]);
    const { anzeige, loesung } = lueckeUnten
        ? mitLuecke(reihen, 0, rng.int(0, 1))
        : mitLuecke(reihen, 1, 0);
    return {
        typ: lueckeUnten ? "mauern/mauer-unten" : "mauern/mauer-oben",
        frage: "Welche Zahl fehlt in der Zahlenmauer?",
        bild: { svg: zahlenmauer(anzeige), beschriftung: "Zahlenmauer mit einem fehlenden Stein" },
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
/** Mauer mit drei Grundsteinen, Lücke an beliebiger Stelle. */
function grosseMauer(rng) {
    const a = rng.int(1, 20);
    const b = rng.int(1, 20);
    const c = rng.int(1, 20);
    const reihen = baueMauer([a, b, c]);
    const ebene = rng.int(0, 2);
    const spalte = rng.int(0, reihen[ebene].length - 1);
    const { anzeige, loesung } = mitLuecke(reihen, ebene, spalte);
    return {
        typ: "mauern/mauer-gross",
        frage: "Welche Zahl fehlt in der Zahlenmauer?",
        bild: { svg: zahlenmauer(anzeige), beschriftung: "Zahlenmauer mit einem fehlenden Stein" },
        antwortfeld: zahlfeld(),
        loesung: String(loesung),
        tipp: "Jeder Stein ist die Summe der beiden Steine direkt darunter.",
        erklaerung: `Von unten gerechnet: ${a} + ${b} = ${a + b} und ${b} + ${c} = ${b + c}, ` +
            `oben steht ${a + 2 * b + c}. Der fehlende Stein ist ${loesung}.`,
    };
}
/** Rechenrad: außen und innen ergeben zusammen immer die Zahl in der Mitte. */
function rad(rng, stufe) {
    const mitte = stufe === 1 ? rng.pick([10, 20]) : stufe === 2 ? rng.pick([20, 30, 40, 50]) : rng.int(6, 10) * 10;
    const moeglich = new Set();
    for (let wert = 1; wert < mitte; wert++) {
        if (stufe === 1 || wert <= 10 || wert % 10 === 0 || mitte - wert <= 10)
            moeglich.add(wert);
    }
    const innenWerte = rng.shuffle([...moeglich]).slice(0, 6);
    const gesucht = rng.int(0, innenWerte.length - 1);
    const felder = innenWerte.map((wert, i) => ({
        aussen: mitte - wert,
        innen: i === gesucht ? null : wert,
    }));
    const loesung = innenWerte[gesucht];
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
