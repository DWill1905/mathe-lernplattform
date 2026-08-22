import { geldbild, uhr } from "../figures.js";
import { NAMEN, auswahlfeld, geldText, uhrText, zahlfeld, zweiNamen } from "./helpers.js";
/* ================================================================= Geld */
/** Umlaufende Euro-Münzen in Cent. */
const MUENZEN = [1, 2, 5, 10, 20, 50, 100, 200];
const KLEINGELD = [1, 2, 5, 10, 20, 50];
export function geld(rng, stufe) {
    if (stufe === 1) {
        if (rng.chance(0.25))
            return beziehungsKette(rng, stufe);
        return rng.pick([muenzenZaehlen, muenzenZaehlen, muenzeGroesser])(rng);
    }
    if (stufe === 2) {
        if (rng.chance(0.25))
            return beziehungsKette(rng, stufe);
        return rng.pick([inCent, inEuroUndCent, betraegeAddieren, restMuenzen, preisUnterschied])(rng);
    }
    if (rng.chance(0.25))
        return beziehungsKette(rng, stufe);
    return rng.pick([rueckgeld, rueckgeld, reichtDasGeld, restMuenzen, betragLegen, preisUnterschied])(rng);
}
/* ------------------------------------------------------ Beziehungsketten */
/**
 * „Jannik hat 3 € weniger als Anna. Clara hat 3 € mehr als Leon. Leon hat
 * 10 € mehr als Jannik." – aus dem Arbeitsheft.
 *
 * Der Witz dieser Aufgabe ist NICHT das Rechnen, sondern die Reihenfolge: Die
 * Sätze stehen absichtlich durcheinander, und nur einer lässt sich sofort
 * ausrechnen. Wer stur von oben nach unten rechnet, kommt nicht weiter.
 *
 * Deshalb ist die Kette echt (jeder bezieht sich auf den Vorgänger) und wird
 * nur für die Anzeige gemischt – so ist jeder Satz nötig und keiner überflüssig.
 */
function beziehungsKette(rng, stufe) {
    const anzahl = stufe === 1 ? 3 : 4;
    const start = stufe === 1 ? rng.int(5, 15) : stufe === 2 ? rng.int(10, 30) : rng.int(15, 45);
    const maxSchritt = stufe === 1 ? 5 : stufe === 2 ? 10 : 15;
    const OBERGRENZE = 100;
    const namen = rng.shuffle(NAMEN).slice(0, anzahl);
    const betrag = [start];
    const saetze = [];
    const schritte = [`${namen[0]}: ${start} €`];
    let letzter = null;
    for (let i = 1; i < anzahl; i++) {
        const vorher = betrag[i - 1];
        let d = rng.int(1, maxSchritt);
        // Der Betrag muss zwischen 1 € und 100 € bleiben – sonst stünde in der
        // Aufgabe ein Kind mit Schulden oder einer Summe außerhalb des Zahlenraums.
        const moeglich = [];
        if (vorher + d <= OBERGRENZE)
            moeglich.push("mehr");
        if (vorher - d >= 1)
            moeglich.push("weniger");
        if (moeglich.length === 0) {
            d = 1;
            moeglich.push(vorher > 1 ? "weniger" : "mehr");
        }
        let richtung = rng.pick(moeglich);
        /*
         * Ein Schritt, der den vorigen exakt zurücknimmt (erst 15 dazu, dann 15
         * weg), lässt zwei Kinder auf denselben Betrag kommen – das sieht wie ein
         * Druckfehler aus. Deshalb wird er umgangen, aber nur, solange das
         * Ergebnis im erlaubten Bereich bleibt: Sonst stünde am Ende ein Kind mit
         * 0 € oder Schulden da, und das wäre schlimmer als die Wiederholung.
         */
        const wertZu = (r, schritt) => (r === "mehr" ? vorher + schritt : vorher - schritt);
        const erlaubt = (wert) => wert >= 1 && wert <= OBERGRENZE;
        if (letzter && letzter.d === d && letzter.richtung !== richtung) {
            const andere = moeglich.find((r) => r !== richtung);
            if (andere)
                richtung = andere;
            else {
                const ausweich = d > 1 ? d - 1 : d + 1;
                if (erlaubt(wertZu(richtung, ausweich)))
                    d = ausweich;
            }
        }
        const wert = wertZu(richtung, d);
        letzter = { d, richtung };
        betrag.push(wert);
        saetze.push(`${namen[i]} hat ${d} € ${richtung} als ${namen[i - 1]}.`);
        schritte.push(`${namen[i]}: ${vorher} ${richtung === "mehr" ? "+" : "−"} ${d} = ${wert} €`);
    }
    // Auf Stufe 1 bleibt die Reihenfolge, damit der Einstieg nicht zusätzlich
    // am Sortieren scheitert. Ab Stufe 2 werden die Sätze gemischt – das ist die
    // eigentliche Hürde.
    const gezeigt = stufe === 1 ? saetze : rng.shuffle(saetze);
    const gesucht = anzahl - 1;
    return {
        typ: "geld/beziehungskette",
        frage: `${namen[0]} hat ${start} €.\n` +
            `${gezeigt.join("\n")}\n` +
            `Wie viel Geld hat ${namen[gesucht]}?`,
        antwortfeld: zahlfeld("€"),
        loesung: String(betrag[gesucht]),
        tipp: `Fang bei ${namen[0]} an – nur dieser Betrag steht schon da. Dann hangle dich weiter.`,
        erklaerung: schritte.join("  →  "),
    };
}
function muenzenZaehlen(rng) {
    const anzahl = rng.int(3, 5);
    const werte = [];
    for (let i = 0; i < anzahl; i++)
        werte.push(rng.pick(KLEINGELD));
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
function muenzeGroesser(rng) {
    const [a, b] = rng.shuffle(MUENZEN.slice()).slice(0, 2);
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
function inCent(rng) {
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
function inEuroUndCent(rng) {
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
function betraegeAddieren(rng) {
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
function rueckgeld(rng) {
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
function reichtDasGeld(rng) {
    const [name] = zweiNamen(rng);
    const geldbetrag = rng.int(4, 20) * 50;
    let preis = rng.int(4, 20) * 50;
    while (preis === geldbetrag)
        preis = rng.int(4, 20) * 50;
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
/**
 * Betrag passend legen: Ein Teil liegt schon da, der Rest wird mit gleichen
 * Münzen aufgefüllt. Im Heft trägt das Kind Münzen und Scheine in einen
 * Kasten ein, bis der Preis auf dem Fähnchen erreicht ist.
 */
function restMuenzen(rng) {
    const [name] = zweiNamen(rng);
    // 1 € und 2 € sind Münzen, ab 5 € gibt es nur Scheine – das darf der
    // Aufgabentext nicht durcheinanderbringen.
    const stueck = rng.pick([1, 2, 5, 10]);
    const istSchein = stueck >= 5;
    const anzahl = rng.int(2, istSchein ? 3 : 5);
    const rest = stueck * anzahl;
    const liegt = rng.shuffle([5, 10, 20]).slice(0, istSchein ? 1 : rng.int(1, 2));
    const bereits = liegt.reduce((a, b) => a + b, 0);
    const ziel = bereits + rest;
    const wort = istSchein ? "Scheine" : "Münzen";
    return {
        typ: "geld/rest-muenzen",
        frage: `${name} soll ${ziel} € passend bezahlen und hat schon ${liegt.join(" € und ")} € hingelegt. Wie viele ${stueck}-€-${wort} fehlen noch?`,
        bild: {
            svg: geldbild(liegt.map((wert) => wert * 100)),
            beschriftung: `Bereits hingelegt: ${liegt.join(" € und ")} €`,
        },
        antwortfeld: zahlfeld(wort),
        loesung: String(anzahl),
        tipp: `Rechne zuerst ${ziel} − ${bereits}.`,
        erklaerung: `${ziel} € − ${bereits} € = ${rest} €, und ${rest} : ${stueck} = ${anzahl}.`,
    };
}
/** Welche Kombination aus Scheinen und Münzen ergibt den Preis? */
function betragLegen(rng) {
    const ziel = rng.int(6, 45);
    const richtig = zerlegeEuro(ziel);
    const ablenker = [ziel + 1, ziel - 1, ziel + 5]
        .filter((wert) => wert > 0)
        .map((wert) => zerlegeEuro(wert));
    return {
        typ: "geld/betrag-legen",
        frage: `Womit bezahlst du genau ${ziel} €?`,
        antwortfeld: auswahlfeld(rng, richtig, ablenker),
        loesung: richtig,
        tipp: "Zähle die Scheine und Münzen zusammen und vergleiche mit dem Preis.",
        erklaerung: `${richtig} ergibt zusammen ${ziel} €.`,
    };
}
/** Greift zu den größten Scheinen und Münzen zuerst – wie beim Bezahlen. */
export function zerlegeEuro(betrag) {
    const werte = [20, 10, 5, 2, 1];
    const teile = [];
    let rest = betrag;
    for (const wert of werte) {
        while (rest >= wert) {
            teile.push(`${wert} €`);
            rest -= wert;
        }
    }
    return teile.join(" + ");
}
/** Wie viel teurer ist das eine als das andere? */
function preisUnterschied(rng) {
    const teuer = rng.int(4, 40) * 5;
    const guenstig = rng.int(1, teuer / 5 - 1) * 5;
    return {
        typ: "geld/unterschied",
        frage: `Ein Heft kostet ${geldText(teuer)}, ein Radiergummi ${geldText(guenstig)}. Wie viel Cent kostet das Heft mehr?`,
        antwortfeld: zahlfeld("ct"),
        loesung: String(teuer - guenstig),
        tipp: "Rechne die beiden Preise in Cent und ziehe ab.",
        erklaerung: `${teuer} ct − ${guenstig} ct = ${teuer - guenstig} ct`,
    };
}
/* ============================================================== Uhrzeit */
export function uhrzeit(rng, stufe) {
    if (stufe === 1)
        return uhrAblesen(rng, [0, 30]);
    if (stufe === 2)
        return rng.chance(0.7) ? uhrAblesen(rng, [0, 15, 30, 45]) : sprechweise(rng);
    const wahl = rng.int(1, 3);
    if (wahl === 1)
        return zeitspanne(rng);
    if (wahl === 2)
        return spaeter(rng);
    return uhrAblesen(rng, [0, 5, 10, 20, 25, 35, 40, 50, 55]);
}
function uhrAblesen(rng, minuten) {
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
function sprechweise(rng) {
    const stunde = rng.int(1, 12);
    const naechste = stunde === 12 ? 1 : stunde + 1;
    const minute = rng.pick([0, 15, 30, 45]);
    const namen = {
        0: `${stunde} Uhr`,
        15: `Viertel nach ${stunde}`,
        30: `halb ${naechste}`,
        45: `Viertel vor ${naechste}`,
    };
    const richtig = namen[minute];
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
function zeitspanne(rng) {
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
function spaeter(rng) {
    const stunde = rng.int(1, 11);
    const startMinute = rng.pick([0, 10, 15, 20, 30, 45]);
    const dauer = rng.pick([10, 15, 20, 30, 45]);
    const gesamt = stunde * 60 + startMinute + dauer;
    const endStunde = Math.floor(gesamt / 60);
    const endMinute = gesamt % 60;
    const richtig = uhrText(endStunde, endMinute);
    /*
     * Der erste Ablenker bildet den klassischen Fehler ab: die Stunde vergessen,
     * obwohl die Zeit über die volle Stunde hinausläuft. Ohne diesen Übertrag
     * IST er aber die richtige Antwort — dann fiel er weg und die Aufgabe hatte
     * nur noch drei Möglichkeiten (in gut drei Vierteln aller Ziehungen). Deshalb
     * steht ein vierter bereit, und was mit der Lösung zusammenfällt, fliegt
     * ausdrücklich vorher heraus.
     */
    const ablenker = [
        uhrText(stunde, (startMinute + dauer) % 60),
        uhrText(endStunde, (endMinute + 10) % 60),
        uhrText(endStunde, (endMinute + 50) % 60),
        uhrText(endStunde + 1 > 12 ? 1 : endStunde + 1, endMinute),
    ].filter((zeit) => zeit !== richtig);
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
export function laengen(rng, stufe) {
    if (stufe === 1)
        return rng.pick([meterInCm, cmInMeter])(rng);
    if (stufe === 2)
        return rng.pick([gemischtInCm, cmInMm, laengeVergleichen])(rng);
    return rng.pick([laengeRechnen, restLaenge, cmInMm])(rng);
}
function meterInCm(rng) {
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
function cmInMeter(rng) {
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
function gemischtInCm(rng) {
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
function cmInMm(rng) {
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
function laengeVergleichen(rng) {
    const mWert = rng.int(1, 3);
    // Gleich lang darf es nie sein – sonst hat „Welche Länge ist länger?“
    // gar keine richtige Antwort.
    let cmWert = rng.int(30, 250);
    while (cmWert === mWert * 100)
        cmWert = rng.int(30, 250);
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
function laengeRechnen(rng) {
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
function restLaenge(rng) {
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
