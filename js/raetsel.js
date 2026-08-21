/**
 * Die große Rätselseite: Zu jedem Buchstaben des Lösungsworts gehört eine
 * Zahl. Wer die Aufgabe rechnet, deckt den Buchstaben auf – am Ende steht das
 * ganze Wort da.
 *
 * Alle Aufgaben bleiben im Zahlenraum bis 20, damit die Rätselseite auch für
 * Kinder funktioniert, die beim Rechnen bis 100 noch unsicher sind.
 */
import { buchstabencode } from "./figures.js";
/** Höchste Zahl, die ein Buchstabe bekommen kann. */
const MAX_ZAHL = 20;
/** Lösungswörter ohne Umlaute – die Legende bliebe sonst missverständlich. */
const WOERTER = [
    { wort: "EISVOGEL", satz: "Der Eisvogel sitzt am Ufer eines Gewässers und hält Ausschau nach Fischen." },
    { wort: "SEESTERN", satz: "Ein Seestern hat meistens fünf Arme und lebt auf dem Meeresboden." },
    { wort: "PINGUIN", satz: "Pinguine können nicht fliegen, dafür schwimmen sie blitzschnell." },
    { wort: "ELEFANT", satz: "Der Elefant ist das schwerste Landtier der Erde." },
    { wort: "GIRAFFE", satz: "Die Giraffe hat den längsten Hals von allen Tieren." },
    { wort: "DELFIN", satz: "Delfine pfeifen und klicken – so verständigen sie sich untereinander." },
    { wort: "KROKODIL", satz: "Ein Krokodil kann stundenlang regungslos im Wasser liegen." },
    { wort: "SCHNECKE", satz: "Die Schnecke trägt ihr Haus überallhin mit sich herum." },
    { wort: "FUCHS", satz: "Der Fuchs schläft am Tag und geht in der Dämmerung auf die Jagd." },
    { wort: "BIBER", satz: "Der Biber baut aus Ästen ganze Dämme quer durch den Bach." },
    { wort: "REGENBOGEN", satz: "Ein Regenbogen entsteht, wenn die Sonne auf Regentropfen scheint." },
    { wort: "LEUCHTTURM", satz: "Der Leuchtturm zeigt den Schiffen nachts den Weg zum Hafen." },
];
/**
 * Erzeugt eine Aufgabe im Zahlenraum bis 20, deren Ergebnis genau `ziel` ist.
 * `verbraucht` verhindert, dass derselbe Buchstabe zweimal dieselbe Aufgabe
 * bekommt.
 */
export function aufgabeFuerZahl(rng, ziel, verbraucht) {
    for (let versuch = 0; versuch < 20; versuch++) {
        const plus = rng.chance(0.5);
        const a = plus ? rng.int(0, ziel) : rng.int(ziel, MAX_ZAHL);
        const b = plus ? ziel - a : a - ziel;
        const rechnung = `${a} ${plus ? "+" : "−"} ${b} =`;
        if (verbraucht.has(rechnung) && versuch < 19)
            continue;
        verbraucht.add(rechnung);
        return {
            typ: "raetsel/rechnung",
            frage: "Rechne und finde den Buchstaben.",
            rechnung,
            antwortfeld: { art: "zahl" },
            loesung: String(ziel),
            tipp: "Das Ergebnis steht in der Tabelle unter einem Buchstaben.",
            erklaerung: `${rechnung} ${ziel}`,
        };
    }
    throw new Error("Keine Aufgabe gefunden");
}
/** Baut eine komplette Rätselrunde: Wort, Buchstabencode und Aufgaben. */
export function baueRaetsel(rng) {
    const gewaehlt = rng.pick(WOERTER);
    const buchstaben = [...new Set(gewaehlt.wort.split(""))].sort();
    // Wie im Heft steigen die Zahlen mit dem Alphabet an – das macht die
    // Legende lesbar und das Nachschlagen für Kinder einfacher.
    const zahlen = rng
        .shuffle([...Array(MAX_ZAHL + 1).keys()])
        .slice(0, buchstaben.length)
        .sort((a, b) => a - b);
    const code = buchstaben.map((buchstabe, i) => ({ buchstabe, zahl: zahlen[i] }));
    const nachBuchstabe = new Map(code.map((eintrag) => [eintrag.buchstabe, eintrag.zahl]));
    const verbraucht = new Set();
    const aufgaben = gewaehlt.wort
        .split("")
        .map((buchstabe) => aufgabeFuerZahl(rng, nachBuchstabe.get(buchstabe), verbraucht));
    return {
        wort: gewaehlt.wort,
        satz: gewaehlt.satz,
        code,
        codeBild: buchstabencode(code),
        aufgaben,
    };
}
