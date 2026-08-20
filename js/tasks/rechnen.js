import { punktefeld } from "../figures.js";
import { auswahlfeld, zahlAblenker, zahlfeld } from "./helpers.js";
/** Malreihen je Stufe – der Aufbau folgt der üblichen Reihenfolge im Unterricht. */
const REIHEN = {
    1: [1, 2, 5, 10],
    2: [1, 2, 3, 4, 5, 10],
    3: [2, 3, 4, 5, 6, 7, 8, 9, 10],
};
/* ============================================================ Einmaleins */
export function einmaleins(rng, stufe) {
    if (stufe === 3 && rng.chance(0.35))
        return umkehraufgabe(rng);
    if (stufe === 1 && rng.chance(0.35))
        return malMitBild(rng, stufe);
    return malaufgabe(rng, stufe);
}
function malaufgabe(rng, stufe) {
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
function malMitBild(rng, stufe) {
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
function umkehraufgabe(rng) {
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
export function geteilt(rng, stufe) {
    if (stufe === 3 && rng.chance(0.6))
        return mitRest(rng);
    return ohneRest(rng, stufe);
}
function ohneRest(rng, stufe) {
    const teiler = rng.pick(stufe === 1 ? [2, 5, 10] : REIHEN[stufe].filter((z) => z > 1));
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
function mitRest(rng) {
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
