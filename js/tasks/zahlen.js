import { pfeilfolge, rechentabelle, zahlenstrahl } from "../figures.js";
import { auswahlfeld, zahlAblenker, zahlfeld } from "./helpers.js";
/* ============================================================ Zahlenraum */
export function zahlenraum(rng, stufe) {
    const varianten = stufe === 1
        ? [nachbarzahl, zehnerEiner, zerlegen, vergleich]
        : stufe === 2
            ? [nachbarzehner, folge, strahl, pfeilkette]
            : [runden, groesste, mitte, folgeSchwer, pfeilkette];
    return rng.pick(varianten)(rng);
}
function nachbarzahl(rng) {
    const nachfolger = rng.chance(0.5);
    const zahl = rng.int(nachfolger ? 1 : 2, nachfolger ? 98 : 99);
    const loesung = nachfolger ? zahl + 1 : zahl - 1;
    return {
        typ: "zahlenraum/nachbarzahl",
        frage: `Wie heißt der ${nachfolger ? "Nachfolger" : "Vorgänger"} von ${zahl}?`,
        antwortfeld: zahlfeld(),
        loesung: String(loesung),
        tipp: nachfolger ? "Der Nachfolger ist eins mehr." : "Der Vorgänger ist eins weniger.",
        erklaerung: `${zahl} ${nachfolger ? "+" : "−"} 1 = ${loesung}`,
    };
}
function zehnerEiner(rng) {
    const zahl = rng.int(11, 99);
    const zehner = rng.chance(0.5);
    const loesung = zehner ? Math.floor(zahl / 10) : zahl % 10;
    return {
        typ: "zahlenraum/zehner-einer",
        frage: `Wie viele ${zehner ? "Zehner" : "Einer"} hat die Zahl ${zahl}?`,
        antwortfeld: zahlfeld(),
        loesung: String(loesung),
        tipp: "Die erste Ziffer sind die Zehner, die zweite die Einer.",
        erklaerung: `${zahl} = ${Math.floor(zahl / 10)} Zehner und ${zahl % 10} Einer`,
    };
}
function zerlegen(rng) {
    const zehner = rng.int(1, 9);
    const einer = rng.int(0, 9);
    const loesung = zehner * 10 + einer;
    return {
        typ: "zahlenraum/zerlegen",
        frage: `Welche Zahl besteht aus ${zehner} Zehnern und ${einer} Einern?`,
        antwortfeld: zahlfeld(),
        loesung: String(loesung),
        tipp: "Zehner mal 10 rechnen und die Einer dazuzählen.",
        erklaerung: `${zehner} · 10 + ${einer} = ${loesung}`,
    };
}
function vergleich(rng) {
    const a = rng.int(11, 99);
    let b = rng.int(11, 99);
    while (b === a)
        b = rng.int(11, 99);
    const groesser = rng.chance(0.5);
    const loesung = groesser ? Math.max(a, b) : Math.min(a, b);
    return {
        typ: "zahlenraum/vergleich",
        frage: `Welche Zahl ist ${groesser ? "größer" : "kleiner"}?`,
        rechnung: `${a}   oder   ${b}`,
        antwortfeld: auswahlfeld(rng, String(loesung), [String(a === loesung ? b : a)], 2),
        loesung: String(loesung),
        tipp: "Vergleiche zuerst die Zehner.",
    };
}
function nachbarzehner(rng) {
    // Volle Zehner sind ausgeschlossen: Zu 70 wäre „der Zehner davor“ sonst
    // wieder 70 – die Zahl liegt zwischen keinen zwei Nachbarzehnern.
    let zahl = rng.int(11, 89);
    while (zahl % 10 === 0)
        zahl = rng.int(11, 89);
    const vorher = rng.chance(0.5);
    const loesung = vorher ? Math.floor(zahl / 10) * 10 : Math.floor(zahl / 10) * 10 + 10;
    return {
        typ: "zahlenraum/nachbarzehner",
        frage: `Welcher Zehner kommt ${vorher ? "vor" : "nach"} der Zahl ${zahl}?`,
        antwortfeld: zahlfeld(),
        loesung: String(loesung),
        tipp: "Zehner sind 10, 20, 30, 40 …",
        erklaerung: `${zahl} liegt zwischen ${Math.floor(zahl / 10) * 10} und ${Math.floor(zahl / 10) * 10 + 10}.`,
    };
}
function folge(rng) {
    const schritt = rng.pick([2, 5, 10]);
    const start = rng.int(1, 40);
    const glieder = [start, start + schritt, start + 2 * schritt];
    const loesung = start + 3 * schritt;
    return {
        typ: "zahlenraum/folge",
        frage: "Wie geht die Zahlenreihe weiter?",
        rechnung: `${glieder.join(", ")}, ?`,
        antwortfeld: zahlfeld(),
        loesung: String(loesung),
        tipp: "Schau nach, wie groß der Sprung von Zahl zu Zahl ist.",
        erklaerung: `Die Reihe geht in ${schritt}er-Schritten weiter: ${glieder[2]} + ${schritt} = ${loesung}`,
    };
}
function strahl(rng) {
    const loesung = rng.int(1, 9) * 10;
    return {
        typ: "zahlenraum/zahlenstrahl",
        frage: "Welche Zahl gehört an die markierte Stelle?",
        bild: { svg: zahlenstrahl(100, loesung), beschriftung: "Zahlenstrahl von 0 bis 100 mit einer Markierung" },
        antwortfeld: zahlfeld(),
        loesung: String(loesung),
        tipp: "Zähle die Zehnerschritte ab 0 ab.",
    };
}
/**
 * Zahlenfolge mit zwei abwechselnden Schritten, wie im Heft mit Pfeilen
 * dargestellt (0 →+3→ 3 →+0→ 3 →+3→ 6 …). Genau ein Kästchen ist leer.
 */
function pfeilkette(rng) {
    for (let versuch = 0; versuch < 40; versuch++) {
        const ersterMinus = rng.chance(0.35);
        const a = (ersterMinus ? -1 : 1) * rng.pick([2, 3, 4, 5, 10]);
        const b = rng.pick(ersterMinus ? [1, 2, 3] : [0, 1, 2, 3]);
        const start = ersterMinus ? rng.int(60, 99) : rng.int(0, 20);
        const werte = [start];
        for (let i = 0; i < 5; i++)
            werte.push(werte[i] + (i % 2 === 0 ? a : b));
        if (werte.some((wert) => wert < 0 || wert > 100))
            continue;
        const luecke = rng.int(2, werte.length - 1);
        const schritte = werte.slice(1).map((_, i) => {
            const schritt = i % 2 === 0 ? a : b;
            return `${schritt < 0 ? "−" : "+"}${Math.abs(schritt)}`;
        });
        return {
            typ: "zahlenraum/pfeilfolge",
            frage: "Die Pfeile zeigen, wie es weitergeht. Welche Zahl fehlt?",
            bild: {
                svg: pfeilfolge(werte.map((wert, i) => (i === luecke ? null : wert)), schritte),
                beschriftung: `Zahlenfolge, die bei ${start} beginnt`,
                breit: true,
            },
            antwortfeld: zahlfeld(),
            loesung: String(werte[luecke]),
            tipp: "Schau auf den Pfeil direkt davor – er sagt, was zu rechnen ist.",
            erklaerung: `${werte[luecke - 1]} ${schritte[luecke - 1].replace("−", "− ").replace("+", "+ ")} = ${werte[luecke]}`,
        };
    }
    return folge(rng);
}
function runden(rng) {
    let zahl = rng.int(11, 94);
    while (zahl % 10 === 0 || zahl % 10 === 5)
        zahl = rng.int(11, 94);
    const loesung = Math.round(zahl / 10) * 10;
    return {
        typ: "zahlenraum/runden",
        frage: `Runde ${zahl} auf den nächsten Zehner.`,
        antwortfeld: zahlfeld(),
        loesung: String(loesung),
        tipp: "Bei 1 bis 4 Einern abrunden, ab 5 aufrunden.",
        erklaerung: `${zahl} hat ${zahl % 10} Einer – also ${zahl % 10 < 5 ? "ab" : "auf"}runden auf ${loesung}.`,
    };
}
function groesste(rng) {
    const zahlen = new Set();
    while (zahlen.size < 4)
        zahlen.add(rng.int(21, 99));
    const liste = [...zahlen];
    const groessteZahl = rng.chance(0.5);
    const loesung = groessteZahl ? Math.max(...liste) : Math.min(...liste);
    return {
        typ: "zahlenraum/ordnen",
        frage: `Welche dieser Zahlen ist die ${groessteZahl ? "größte" : "kleinste"}?`,
        antwortfeld: { art: "auswahl", optionen: rng.shuffle(liste.map(String)) },
        loesung: String(loesung),
        tipp: "Vergleiche zuerst die Zehner, dann die Einer.",
    };
}
function mitte(rng) {
    const loesung = rng.int(6, 46) * 2;
    // Der Abstand muss auf beiden Seiten passen: nie unter 0, nie über 100.
    const spielraum = Math.min(loesung, 100 - loesung);
    const abstand = rng.int(1, Math.floor(spielraum / 2)) * 2;
    const a = loesung - abstand;
    const b = loesung + abstand;
    return {
        typ: "zahlenraum/mitte",
        frage: `Welche Zahl liegt genau in der Mitte zwischen ${a} und ${b}?`,
        antwortfeld: zahlfeld(),
        loesung: String(loesung),
        tipp: "Rechne den Abstand aus und nimm die Hälfte davon.",
        erklaerung: `Von ${a} bis ${b} sind es ${b - a}. Die Hälfte ist ${(b - a) / 2}: ${a} + ${(b - a) / 2} = ${loesung}`,
    };
}
function folgeSchwer(rng) {
    const rueckwaerts = rng.chance(0.5);
    const schritt = rng.pick([3, 4, 6, 7, 8]);
    const start = rueckwaerts ? rng.int(70, 99) : rng.int(1, 25);
    const richtung = rueckwaerts ? -schritt : schritt;
    const glieder = [start, start + richtung, start + 2 * richtung];
    const loesung = start + 3 * richtung;
    return {
        typ: "zahlenraum/folge-schwer",
        frage: "Wie geht die Zahlenreihe weiter?",
        rechnung: `${glieder.join(", ")}, ?`,
        antwortfeld: zahlfeld(),
        loesung: String(loesung),
        tipp: "Wird die Reihe größer oder kleiner? Und um wie viel?",
        erklaerung: `Die Reihe geht in ${schritt}er-Schritten ${rueckwaerts ? "rückwärts" : "vorwärts"}: ${glieder[2]} ${rueckwaerts ? "−" : "+"} ${schritt} = ${loesung}`,
    };
}
/* ============================================================ Plus/Minus */
export function plusminus(rng, stufe) {
    if (stufe === 1) {
        const wahl = rng.int(1, 5);
        if (wahl === 1)
            return mehrereSummanden(rng, 20);
        if (wahl === 2)
            return ergaenzeZumZehner(rng, 1);
        if (wahl === 3)
            return volleZehner(rng);
        return bis20(rng);
    }
    if (stufe === 2) {
        if (rng.chance(0.25))
            return ergaenzeZumZehner(rng, 2);
        return rng.pick([ohneUebergang, ohneUebergang, zehnerPlus])(rng);
    }
    // Die Tabellen bleiben Stufe 3 vorbehalten: Ihre Felder überschreiten den
    // Zehner, was Stufe 2 ausdrücklich noch aussparen soll.
    if (rng.chance(0.25))
        return tabelle(rng, rng.chance(0.4));
    if (rng.chance(0.2))
        return mehrereSummanden(rng, 100);
    return rng.pick([mitUebergang, mitUebergang, platzhalter])(rng);
}
function bis20(rng) {
    const plus = rng.chance(0.5);
    if (plus) {
        const a = rng.int(2, 15);
        const b = rng.int(2, 20 - a);
        return rechenaufgabe("plusminus/bis20", a, b, "+", a + b, "Zähle vom größeren Summanden aus weiter.");
    }
    const a = rng.int(6, 20);
    const b = rng.int(2, a - 1);
    return rechenaufgabe("plusminus/bis20", a, b, "−", a - b, "Zähle vom Ergebnis aus rückwärts.");
}
function volleZehner(rng) {
    const plus = rng.chance(0.5);
    if (plus) {
        const a = rng.int(1, 8) * 10;
        const b = rng.int(1, (100 - a) / 10) * 10;
        return rechenaufgabe("plusminus/zehner", a, b, "+", a + b, `Rechne in Zehnern: ${a / 10} + ${b / 10} = ${(a + b) / 10} Zehner.`);
    }
    const a = rng.int(3, 10) * 10;
    const b = rng.int(1, a / 10 - 1) * 10;
    return rechenaufgabe("plusminus/zehner", a, b, "−", a - b, `Rechne in Zehnern: ${a / 10} − ${b / 10} = ${(a - b) / 10} Zehner.`);
}
function zehnerPlus(rng) {
    const a = rng.int(11, 79);
    const b = rng.int(1, Math.floor((99 - a) / 10)) * 10;
    return rechenaufgabe("plusminus/zehner-dazu", a, b, "+", a + b, "Beim Zehner-Dazuzählen bleibt die Einerstelle gleich.");
}
function ohneUebergang(rng) {
    const plus = rng.chance(0.5);
    if (plus) {
        const einerA = rng.int(1, 8);
        const einerB = rng.int(1, 9 - einerA);
        const zehnerA = rng.int(1, 5);
        const zehnerB = rng.int(1, 9 - zehnerA);
        const a = zehnerA * 10 + einerA;
        const b = zehnerB * 10 + einerB;
        return rechenaufgabe("plusminus/ohne-uebergang", a, b, "+", a + b, `Erst die Zehner: ${zehnerA * 10} + ${zehnerB * 10} = ${(zehnerA + zehnerB) * 10}. Dann die Einer: ${einerA} + ${einerB} = ${einerA + einerB}.`);
    }
    const zehnerA = rng.int(3, 9);
    const einerA = rng.int(2, 9);
    const zehnerB = rng.int(1, zehnerA - 1);
    const einerB = rng.int(0, einerA);
    const a = zehnerA * 10 + einerA;
    const b = zehnerB * 10 + einerB;
    return rechenaufgabe("plusminus/ohne-uebergang", a, b, "−", a - b, `Erst die Zehner: ${zehnerA * 10} − ${zehnerB * 10} = ${(zehnerA - zehnerB) * 10}. Dann die Einer: ${einerA} − ${einerB} = ${einerA - einerB}.`);
}
function mitUebergang(rng) {
    const plus = rng.chance(0.5);
    if (plus) {
        const einerA = rng.int(3, 9);
        const einerB = rng.int(11 - einerA, 9);
        const zehnerA = rng.int(1, 4);
        const zehnerB = rng.int(1, 8 - zehnerA);
        const a = zehnerA * 10 + einerA;
        const b = zehnerB * 10 + einerB;
        const bisZehner = 10 - einerA;
        return rechenaufgabe("plusminus/mit-uebergang", a, b, "+", a + b, `Erst zum nächsten Zehner: ${a} + ${bisZehner} = ${a + bisZehner}. Dann der Rest: ${a + bisZehner} + ${b - bisZehner} = ${a + b}.`);
    }
    const zehnerA = rng.int(3, 9);
    const einerA = rng.int(0, 7);
    const einerB = rng.int(einerA + 1, 9);
    const zehnerB = rng.int(1, zehnerA - 1);
    const a = zehnerA * 10 + einerA;
    const b = zehnerB * 10 + einerB;
    return rechenaufgabe("plusminus/mit-uebergang", a, b, "−", a - b, `Erst bis zum Zehner: ${a} − ${einerA} = ${a - einerA}. Dann der Rest: ${a - einerA} − ${b - einerA} = ${a - b}.`);
}
function platzhalter(rng) {
    const a = rng.int(12, 60);
    const loesung = rng.int(5, 99 - a);
    const summe = a + loesung;
    const suchtSummand = rng.chance(0.6);
    if (suchtSummand) {
        return {
            typ: "plusminus/platzhalter",
            frage: "Welche Zahl gehört in die Lücke?",
            rechnung: `${a} + ? = ${summe}`,
            antwortfeld: zahlfeld(),
            loesung: String(loesung),
            tipp: "Rechne rückwärts: Ergebnis minus die bekannte Zahl.",
            erklaerung: `${summe} − ${a} = ${loesung}`,
        };
    }
    return {
        typ: "plusminus/platzhalter",
        frage: "Welche Zahl gehört in die Lücke?",
        rechnung: `${summe} − ? = ${a}`,
        antwortfeld: zahlfeld(),
        loesung: String(loesung),
        tipp: "Wie weit ist es von der kleinen zur großen Zahl?",
        erklaerung: `${summe} − ${a} = ${loesung}`,
    };
}
/**
 * Aufgabe mit drei oder vier Summanden (`4 + 3 + 2 + 1 =`). Im Heft steht sie
 * in den Sprechblasen neben den Rechenkästen.
 */
function mehrereSummanden(rng, max) {
    const anzahl = max <= 20 ? rng.int(3, 4) : 3;
    const obergrenze = Math.floor(max / anzahl) + (max <= 20 ? 2 : 6);
    const werte = [];
    let summe = 0;
    for (let i = 0; i < anzahl; i++) {
        const verbleibend = anzahl - i - 1;
        const rest = max - summe - verbleibend;
        const wert = rng.int(1, Math.max(1, Math.min(rest, obergrenze)));
        werte.push(wert);
        summe += wert;
    }
    const sortiert = rng.shuffle(werte);
    return {
        typ: "plusminus/mehrere-summanden",
        frage: "Wie viel ist das zusammen?",
        rechnung: `${sortiert.join(" + ")} =`,
        antwortfeld: zahlfeld(),
        loesung: String(summe),
        tipp: "Rechne Schritt für Schritt von links nach rechts.",
        erklaerung: schrittweise(sortiert),
    };
}
/** Zeigt den Rechenweg einer Kette: 4 + 3 = 7, 7 + 2 = 9 … */
function schrittweise(werte) {
    const schritte = [];
    let stand = werte[0];
    for (let i = 1; i < werte.length; i++) {
        schritte.push(`${stand} + ${werte[i]} = ${stand + werte[i]}`);
        stand += werte[i];
    }
    return schritte.join(", dann ");
}
/**
 * Ergänzen bis zum nächsten vollen Zehner – die Grundlage für alles Rechnen
 * mit Zehnerübergang.
 */
function ergaenzeZumZehner(rng, stufe) {
    const ziel = stufe === 1 ? rng.pick([10, 20]) : rng.int(3, 10) * 10;
    // Immer nur bis zum NÄCHSTEN Zehner ergänzen: „4 + ? = 10“, nicht
    // „4 + ? = 20“. Sonst wäre die leichteste Stufe schwerer als die zweite.
    const start = ziel - rng.int(1, 9);
    const loesung = ziel - start;
    return {
        typ: "plusminus/ergaenzen",
        frage: `Wie viel fehlt bis ${ziel}?`,
        rechnung: `${start} + ? = ${ziel}`,
        antwortfeld: zahlfeld(),
        loesung: String(loesung),
        tipp: `Zähle von ${start} aus weiter bis ${ziel}.`,
        erklaerung: `${ziel} − ${start} = ${loesung}`,
    };
}
function rechenaufgabe(typ, a, b, zeichen, loesung, erklaerung) {
    return {
        typ,
        frage: "Wie lautet das Ergebnis?",
        rechnung: `${a} ${zeichen} ${b} =`,
        antwortfeld: zahlfeld(),
        loesung: String(loesung),
        tipp: "Rechne in zwei Schritten: erst die Zehner, dann die Einer.",
        erklaerung,
    };
}
/**
 * Rechentabelle wie im Heft: Zeilenkopf und Spaltenkopf ergeben zusammen den
 * Wert einer Zelle, genau ein Feld ist markiert.
 *
 * `mitUnloesbar` erlaubt beim Minusrechnen auch Felder, deren Aufgabe nicht
 * aufgeht – im Heft kommt dort ein X hinein.
 */
function tabelle(rng, mitUnloesbar) {
    let plus = rng.chance(0.55);
    const spalten = rng.shuffle([1, 2, 3, 4, 5, 8, 10]).slice(0, 3);
    const zeilen = rng.shuffle([3, 4, 5, 7, 8, 10, 11, 12, 13, 15, 16, 17, 19, 20]).slice(0, 4);
    const alleFelder = [];
    for (let z = 0; z < zeilen.length; z++) {
        for (let sp = 0; sp < spalten.length; sp++)
            alleFelder.push([z, sp]);
    }
    const geht = ([z, sp]) => zeilen[z] >= spalten[sp];
    // Aus welchen Feldern darf gefragt werden? Beim Minusrechnen nur aus den
    // lösbaren – es sei denn, die Stufe lässt „Das geht nicht" ausdrücklich zu.
    let kandidaten = plus ? alleFelder : alleFelder.filter((feld) => mitUnloesbar || geht(feld));
    if (kandidaten.length === 0) {
        plus = true;
        kandidaten = alleFelder;
    }
    /*
     * Ist „Das geht nicht" erlaubt, soll es auch drankommen: Sonst treffen die
     * gemischten Zeilen- und Spaltenköpfe nur selten ein Feld, in dem die
     * kleinere Zahl oben steht — gemessen etwa eine von hundertfünfzig Aufgaben.
     * Der Kniff, den diese Heftseite übt, käme damit nie vor.
     */
    if (!plus && mitUnloesbar) {
        const nichtLoesbar = kandidaten.filter((feld) => !geht(feld));
        const loesbar = kandidaten.filter(geht);
        const topf = nichtLoesbar.length > 0 && rng.chance(0.5) ? nichtLoesbar : loesbar;
        if (topf.length > 0)
            kandidaten = topf;
    }
    const [z, sp] = rng.pick(kandidaten);
    const zeile = zeilen[z];
    const spalte = spalten[sp];
    const zeichen = plus ? "+" : "−";
    const bild = {
        svg: rechentabelle(zeichen, zeilen, spalten, [z, sp]),
        beschriftung: `Rechentabelle: Das markierte Feld steht für ${zeile} ${zeichen} ${spalte}`,
    };
    /*
     * ACHTUNG, das war ein Verrat: Vorher wurde ein unlösbares Feld IMMER über
     * Auswahlknöpfe beantwortet und ein lösbares IMMER über die Zahlentastatur.
     * Damit sagte die Eingabeart schon die Antwort — wer Knöpfe sah, wusste ohne
     * zu rechnen, dass „Das geht nicht" richtig ist.
     *
     * Sobald „geht nicht" überhaupt möglich ist, wird deshalb IMMER ausgewählt,
     * und „Das geht nicht" steht jedes Mal mit zur Wahl.
     */
    if (!plus && mitUnloesbar) {
        const moeglich = zeile >= spalte;
        const richtig = moeglich ? String(zeile - spalte) : "Das geht nicht";
        // Keiner der Ablenker darf mit der Lösung zusammenfallen, sonst schrumpft
        // die Auswahl still von vier auf drei Möglichkeiten.
        const ablenker = moeglich
            ? ["Das geht nicht", String(zeile + spalte), String(zeile)]
            : [String(spalte - zeile), String(zeile + spalte), String(spalte)];
        return {
            typ: moeglich ? "plusminus/tabelle-minus" : "plusminus/tabelle-unloesbar",
            frage: "Welche Zahl gehört in das markierte Feld?",
            bild,
            antwortfeld: auswahlfeld(rng, richtig, ablenker),
            loesung: richtig,
            tipp: "Von einer kleinen Zahl kann man keine größere wegnehmen – dann geht es nicht.",
            erklaerung: moeglich
                ? `${zeile} − ${spalte} = ${zeile - spalte}`
                : `${zeile} ist kleiner als ${spalte} – diese Aufgabe geht nicht auf.`,
        };
    }
    const loesung = plus ? zeile + spalte : zeile - spalte;
    return {
        typ: "plusminus/tabelle",
        frage: "Welche Zahl gehört in das markierte Feld?",
        bild,
        antwortfeld: zahlfeld(),
        loesung: String(loesung),
        tipp: "Lies die Zahl links am Rand und oben in der Spalte ab.",
        erklaerung: `${zeile} ${zeichen} ${spalte} = ${loesung}`,
    };
}
/* ============================================================== Knobeln */
export function knobeln(rng, stufe) {
    if (stufe === 1)
        return rng.pick([verdoppeln, halbieren])(rng);
    if (stufe === 2)
        return rng.pick([geradeUngerade, muster, nachbarSumme])(rng);
    return rng.pick([raetselPlus, raetselMal, raetselMinus])(rng);
}
function verdoppeln(rng) {
    const zahl = rng.int(3, 50);
    return {
        typ: "knobeln/verdoppeln",
        frage: `Verdopple die Zahl ${zahl}.`,
        antwortfeld: zahlfeld(),
        loesung: String(zahl * 2),
        tipp: "Verdoppeln heißt: die Zahl zweimal nehmen.",
        erklaerung: `${zahl} + ${zahl} = ${zahl * 2}`,
    };
}
function halbieren(rng) {
    const haelfte = rng.int(2, 50);
    return {
        typ: "knobeln/halbieren",
        frage: `Halbiere die Zahl ${haelfte * 2}.`,
        antwortfeld: zahlfeld(),
        loesung: String(haelfte),
        tipp: "Halbieren heißt: in zwei gleich große Teile aufteilen.",
        erklaerung: `${haelfte} + ${haelfte} = ${haelfte * 2}, also ist die Hälfte ${haelfte}.`,
    };
}
function geradeUngerade(rng) {
    const zahl = rng.int(11, 99);
    const gerade = zahl % 2 === 0;
    return {
        typ: "knobeln/gerade",
        frage: `Ist die Zahl ${zahl} gerade oder ungerade?`,
        antwortfeld: { art: "auswahl", optionen: ["gerade", "ungerade"] },
        loesung: gerade ? "gerade" : "ungerade",
        tipp: "Schau nur auf die letzte Ziffer.",
        erklaerung: `Zahlen mit 0, 2, 4, 6 oder 8 am Ende sind gerade. ${zahl} endet auf ${zahl % 10}.`,
    };
}
function muster(rng) {
    const start = rng.int(1, 6);
    const glieder = [start, start * 2, start * 4];
    const loesung = start * 8;
    return {
        typ: "knobeln/muster",
        frage: "Jede Zahl ist das Doppelte der Zahl davor. Wie geht es weiter?",
        rechnung: `${glieder.join(", ")}, ?`,
        antwortfeld: zahlfeld(),
        loesung: String(loesung),
        tipp: "Verdopple die letzte Zahl.",
        erklaerung: `${glieder[2]} + ${glieder[2]} = ${loesung}`,
    };
}
function nachbarSumme(rng) {
    // Höchstens 33: Das Dreifache muss im Zahlenraum bis 100 bleiben.
    const mitteZahl = rng.int(5, 33);
    const loesung = mitteZahl * 3;
    return {
        typ: "knobeln/nachbarn",
        frage: `Zähle ${mitteZahl} und seine beiden Nachbarzahlen zusammen.`,
        rechnung: `${mitteZahl - 1} + ${mitteZahl} + ${mitteZahl + 1} =`,
        antwortfeld: zahlfeld(),
        loesung: String(loesung),
        tipp: "Der Vorgänger ist eins weniger, der Nachfolger eins mehr – zusammen gleicht sich das aus.",
        erklaerung: `Das ist dreimal die mittlere Zahl: 3 · ${mitteZahl} = ${loesung}`,
    };
}
function raetselPlus(rng) {
    const loesung = rng.int(5, 60);
    const dazu = rng.int(4, 30);
    return {
        typ: "knobeln/raetsel-plus",
        frage: `Ich denke mir eine Zahl. Wenn ich ${dazu} dazuzähle, erhalte ich ${loesung + dazu}. Wie heißt meine Zahl?`,
        antwortfeld: zahlfeld(),
        loesung: String(loesung),
        tipp: "Rechne rückwärts – ziehe wieder ab.",
        erklaerung: `${loesung + dazu} − ${dazu} = ${loesung}`,
    };
}
function raetselMinus(rng) {
    const loesung = rng.int(20, 90);
    const weg = rng.int(4, 19);
    return {
        typ: "knobeln/raetsel-minus",
        frage: `Ich denke mir eine Zahl. Wenn ich ${weg} wegnehme, bleibt ${loesung - weg} übrig. Wie heißt meine Zahl?`,
        antwortfeld: zahlfeld(),
        loesung: String(loesung),
        tipp: "Rechne rückwärts – zähle wieder dazu.",
        erklaerung: `${loesung - weg} + ${weg} = ${loesung}`,
    };
}
function raetselMal(rng) {
    const loesung = rng.int(2, 10);
    const faktor = rng.int(2, 10);
    return {
        typ: "knobeln/raetsel-mal",
        frage: `Ich denke mir eine Zahl. Wenn ich sie mit ${faktor} malnehme, erhalte ich ${loesung * faktor}. Wie heißt meine Zahl?`,
        antwortfeld: auswahlfeld(rng, String(loesung), zahlAblenker(loesung, 4, 10)),
        loesung: String(loesung),
        tipp: "Denke an die Malreihe – oder teile.",
        erklaerung: `${loesung * faktor} : ${faktor} = ${loesung}`,
    };
}
