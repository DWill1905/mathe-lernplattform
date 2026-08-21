/**
 * Aufgabenfamilien: „3 Zahlen, 4 Aufgaben“. Zu jedem Zahlentrio gehören zwei
 * Plus- und zwei Minusaufgaben. Wer die Zusammenhänge sieht, muss nicht jede
 * Aufgabe einzeln auswendig lernen.
 */
import { auswahlfeld, zahlfeld } from "./helpers.js";
/** Zieht ein Zahlentrio a + b = summe im gewünschten Zahlenraum. */
function trio(rng, max) {
    const summe = rng.int(Math.min(8, max), max);
    const a = rng.int(1, summe - 1);
    return { a, b: summe - a, summe };
}
export function familien(rng, stufe) {
    if (stufe === 1)
        return rng.chance(0.5) ? umkehrZuPlus(rng, 20) : umkehrZuMinus(rng, 20);
    if (stufe === 2) {
        const wahl = rng.int(1, 3);
        if (wahl === 1)
            return tauschaufgabe(rng, 20);
        if (wahl === 2)
            return vierteAufgabe(rng, 20);
        return umkehrZuPlus(rng, 20);
    }
    const wahl = rng.int(1, 4);
    if (wahl === 1)
        return luecke(rng, 100);
    if (wahl === 2)
        return vierteAufgabe(rng, 100);
    if (wahl === 3)
        return umkehrZuMinus(rng, 100);
    return tauschaufgabe(rng, 100);
}
/** 8 + 5 = 13 ist bekannt – gesucht ist 13 − 5. */
function umkehrZuPlus(rng, max) {
    const { a, b, summe } = trio(rng, max);
    return {
        typ: "familien/umkehr-plus",
        frage: `Du weißt: ${a} + ${b} = ${summe}. Wie heißt die Umkehraufgabe?`,
        rechnung: `${summe} − ${b} =`,
        antwortfeld: zahlfeld(),
        loesung: String(a),
        tipp: "Beim Umkehren nimmst du von der Summe einen der beiden Teile wieder weg.",
        erklaerung: `${a} + ${b} = ${summe}, also ${summe} − ${b} = ${a}.`,
    };
}
/** 17 − 3 = 14 ist bekannt – gesucht ist 14 + 3. */
function umkehrZuMinus(rng, max) {
    const { a, b, summe } = trio(rng, max);
    return {
        typ: "familien/umkehr-minus",
        frage: `Du weißt: ${summe} − ${a} = ${b}. Wie heißt die Umkehraufgabe?`,
        rechnung: `${b} + ${a} =`,
        antwortfeld: zahlfeld(),
        loesung: String(summe),
        tipp: "Was du abgezogen hast, zählst du wieder dazu.",
        erklaerung: `${summe} − ${a} = ${b}, also ${b} + ${a} = ${summe}.`,
    };
}
/** Welche der vier Aufgaben ist die Tauschaufgabe? */
function tauschaufgabe(rng, max) {
    // Bei a = b wäre die Tauschaufgabe mit der Ausgangsaufgabe identisch.
    let gezogen = trio(rng, max);
    while (gezogen.a === gezogen.b)
        gezogen = trio(rng, max);
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
function vierteAufgabe(rng, max) {
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
function luecke(rng, max) {
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
