import { ALLE_FORMEN, eckenZahl, form, spiegelachse } from "../figures.js";
import { auswahlfeld, zahlfeld } from "./helpers.js";
/** Körper mit ihren Kennzahlen – für die Fragen der dritten Stufe. */
const KOERPER = [
    { name: "Würfel", ecken: 8, flaechen: 6, kanten: 12 },
    { name: "Quader", ecken: 8, flaechen: 6, kanten: 12 },
];
export function geometrie(rng, stufe) {
    if (stufe === 1)
        return rng.pick([formErkennen, formErkennen, formMitEcken])(rng);
    if (stufe === 2)
        return rng.pick([eckenZaehlen, seitenZaehlen, formMitEcken])(rng);
    return rng.pick([symmetrie, koerper, umfangQuadrat, umfangRechteck])(rng);
}
function formErkennen(rng) {
    const gewaehlt = rng.pick(ALLE_FORMEN);
    const ablenker = ALLE_FORMEN.filter((f) => f !== gewaehlt);
    return {
        typ: "geometrie/form-erkennen",
        frage: "Welche Form ist das?",
        bild: { svg: form(gewaehlt), beschriftung: `Ein ${gewaehlt}` },
        antwortfeld: auswahlfeld(rng, gewaehlt, ablenker),
        loesung: gewaehlt,
        tipp: "Zähle die Ecken – das verrät oft schon den Namen.",
    };
}
function formMitEcken(rng) {
    const kandidaten = ALLE_FORMEN.filter((f) => eckenZahl(f) > 0);
    const gewaehlt = rng.pick(kandidaten);
    const anzahl = eckenZahl(gewaehlt);
    const ablenker = kandidaten.filter((f) => eckenZahl(f) !== anzahl);
    return {
        typ: "geometrie/form-mit-ecken",
        frage: `Welche Form hat genau ${anzahl} Ecken?`,
        antwortfeld: auswahlfeld(rng, gewaehlt, ablenker),
        loesung: gewaehlt,
        tipp: "Dreieck: 3, Viereck: 4, Fünfeck: 5 …",
    };
}
function eckenZaehlen(rng) {
    const gewaehlt = rng.pick(ALLE_FORMEN.filter((f) => eckenZahl(f) > 0));
    const anzahl = eckenZahl(gewaehlt);
    return {
        typ: "geometrie/ecken-zaehlen",
        frage: "Wie viele Ecken hat diese Form?",
        bild: { svg: form(gewaehlt), beschriftung: `Ein ${gewaehlt}` },
        antwortfeld: zahlfeld(),
        loesung: String(anzahl),
        tipp: "Tippe die Ecken der Reihe nach ab.",
        erklaerung: `Ein ${gewaehlt} hat ${anzahl} Ecken.`,
    };
}
function seitenZaehlen(rng) {
    const gewaehlt = rng.pick(ALLE_FORMEN.filter((f) => eckenZahl(f) > 0));
    const anzahl = eckenZahl(gewaehlt);
    return {
        typ: "geometrie/seiten-zaehlen",
        frage: "Wie viele Seiten hat diese Form?",
        bild: { svg: form(gewaehlt), beschriftung: `Ein ${gewaehlt}` },
        antwortfeld: zahlfeld(),
        loesung: String(anzahl),
        tipp: "Eine Form hat immer so viele Seiten wie Ecken.",
        erklaerung: `Ein ${gewaehlt} hat ${anzahl} Seiten – genauso viele wie Ecken.`,
    };
}
function symmetrie(rng) {
    const gewaehlt = rng.pick(["Quadrat", "Rechteck", "Kreis", "Raute"]);
    const istAchse = rng.chance(0.5);
    return {
        typ: "geometrie/symmetrie",
        frage: "Ist die eingezeichnete Linie eine Spiegelachse?",
        bild: {
            svg: spiegelachse(gewaehlt, istAchse),
            beschriftung: `Ein ${gewaehlt} mit einer eingezeichneten Linie`,
        },
        antwortfeld: { art: "auswahl", optionen: ["Ja", "Nein"] },
        loesung: istAchse ? "Ja" : "Nein",
        tipp: "Stell dir vor, du faltest die Form an der Linie. Passen beide Hälften genau aufeinander?",
        erklaerung: istAchse
            ? "Beim Falten an dieser Linie liegen beide Hälften genau aufeinander."
            : "Beim Falten an dieser schrägen Linie passen die Hälften nicht aufeinander.",
    };
}
function koerper(rng) {
    const gewaehlt = rng.pick(KOERPER);
    const frageArt = rng.pick(["ecken", "flaechen", "kanten"]);
    const loesung = frageArt === "ecken" ? gewaehlt.ecken : frageArt === "flaechen" ? gewaehlt.flaechen : gewaehlt.kanten;
    const wort = frageArt === "ecken" ? "Ecken" : frageArt === "flaechen" ? "Flächen" : "Kanten";
    return {
        typ: "geometrie/koerper",
        frage: `Wie viele ${wort} hat ein ${gewaehlt.name}?`,
        antwortfeld: zahlfeld(),
        loesung: String(loesung),
        tipp: "Denk an einen Würfel: oben, unten und vier Seiten.",
        erklaerung: `Ein ${gewaehlt.name} hat ${gewaehlt.flaechen} Flächen, ${gewaehlt.ecken} Ecken und ${gewaehlt.kanten} Kanten.`,
    };
}
function umfangQuadrat(rng) {
    const seite = rng.int(2, 20);
    return {
        typ: "geometrie/umfang-quadrat",
        frage: `Ein Quadrat hat Seiten von ${seite} cm. Wie lang ist der Umfang?`,
        bild: { svg: form("Quadrat"), beschriftung: "Ein Quadrat" },
        antwortfeld: zahlfeld("cm"),
        loesung: String(seite * 4),
        tipp: "Beim Quadrat sind alle vier Seiten gleich lang.",
        erklaerung: `4 · ${seite} cm = ${seite * 4} cm`,
    };
}
function umfangRechteck(rng) {
    const laenge = rng.int(4, 20);
    const breite = rng.int(2, laenge - 1);
    return {
        typ: "geometrie/umfang-rechteck",
        frage: `Ein Rechteck ist ${laenge} cm lang und ${breite} cm breit. Wie lang ist der Umfang?`,
        bild: { svg: form("Rechteck"), beschriftung: "Ein Rechteck" },
        antwortfeld: zahlfeld("cm"),
        loesung: String((laenge + breite) * 2),
        tipp: "Jede Länge und jede Breite kommt zweimal vor.",
        erklaerung: `${laenge} + ${breite} + ${laenge} + ${breite} = ${(laenge + breite) * 2} cm`,
    };
}
