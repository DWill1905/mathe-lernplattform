import { geldbild, geldtabelle } from "../figures.js";
import { zahlfeld } from "./helpers.js";
/* ============================================================ Geld legen */
/*
 * Die Aufgaben von den Geld-Heftseiten 118 bis 121: „Lege mit möglichst
 * wenig Scheinen und Münzen“ (Geldtabelle), „Welche Münzen können es
 * sein?“, „Immer 10 Euro“ und „Streiche durch, was zu viel ist“.
 *
 * Bis 1.42 steckten sie im Thema „Geld“ und gingen dort zwischen Rückgeld
 * und Umrechnen unter – auf Stufe 3 waren sie zusammen nicht einmal jede
 * dritte Aufgabe. Als eigenes Thema lassen sie sich gezielt üben, so wie die
 * Heftseiten es tun.
 */
/** Münzen bis 50 ct, in Cent. */
const KLEINGELD = [1, 2, 5, 10, 20, 50];
/**
 * Stufe 1: Münzen finden, zehn Euro aus wenigen Stücken, die Geldtabelle mit
 * Hilfe und nur in Cent. Stufe 2: alles davon, die Tabelle auch in Euro,
 * dazu „zu viel“ beim Kleingeld. Stufe 3: die Tabelle ohne Hilfe und „zu
 * viel“ auch mit Euro.
 *
 * Die Gruppen- und „zu viel“-Aufgaben können in seltenen Fällen keine
 * vollständige Aufgabe bauen (`null`). Dann wird neu gezogen, und am Ende
 * steht die Geldtabelle, die immer gelingt – nie eine Aufgabe aus einem
 * anderen Thema.
 */
export function geldlegen(rng, stufe) {
    const tabelle = () => geldTabellenZeile(rng, stufe);
    const welche = () => welcheMuenzen(rng);
    const zehn = () => immerZehn(rng, stufe === 1 ? 4 : 5);
    const zuviel = () => zuViel(rng, stufe === 3);
    const topf = stufe === 1
        ? [welche, welche, zehn, tabelle]
        : stufe === 2
            ? [tabelle, tabelle, zehn, welche, zuviel]
            : [tabelle, tabelle, zuviel, zuviel, zehn];
    for (let versuch = 0; versuch < 5; versuch++) {
        const aufgabe = rng.pick(topf)();
        if (aufgabe)
            return aufgabe;
    }
    return tabelle();
}
/* --------------------------------------------------------- Geldtabelle */
/**
 * Die Sorten der Geldtabelle, größte zuerst – genau wie die Spalten im Heft.
 * Beide Listen stehen in CENT, damit dieselben Funktionen für die Cent- und
 * die Euro-Tabelle taugen.
 */
const TABELLE_CENT = [50, 20, 10, 5, 2, 1];
const TABELLE_EURO = [5000, 2000, 1000, 500, 200, 100];
/**
 * Wie viele Stücke jeder Sorte, wenn man möglichst wenige nimmt.
 *
 * Immer die größte Sorte zuerst zu nehmen ist hier wirklich das Optimum –
 * bei 1, 2, 5, 10, 20, 50 geht das auf. Bei einem anderen Satz (etwa 1, 3, 4)
 * wäre das falsch, deshalb steht es hier und nicht als allgemeine Regel.
 */
function sortenAnzahl(betrag, sorten) {
    let rest = betrag;
    return sorten.map((wert) => {
        const anzahl = Math.floor(rest / wert);
        rest -= anzahl * wert;
        return anzahl;
    });
}
/** „50 ct" bzw. „20 €" – die Sorte, wie ein Kind sie nennt. */
function sortenName(wert) {
    return wert >= 100 ? `${wert / 100} €` : `${wert} ct`;
}
/** Was es ist: Ab 5 € gibt es nur Scheine, darunter Münzen. */
function sortenWort(wert, mehrzahl) {
    const schein = wert >= 500;
    return schein ? (mehrzahl ? "Scheine" : "Schein") : mehrzahl ? "Münzen" : "Münze";
}
/**
 * „20-ct-Münzen", „50-€-Scheine" – so steht es im Heft und so liest es sich.
 * Ein bloßes „Wie viele 20 ct brauchst du?" wäre kein deutscher Satz.
 */
function sortenBindestrich(wert) {
    const name = wert >= 100 ? `${wert / 100}-€` : `${wert}-ct`;
    return `${name}-${sortenWort(wert, true)}`;
}
/**
 * Die Geldtabelle aus dem Heft: „Lege mit möglichst wenig Scheinen und
 * Münzen." Dort füllt das Kind eine ganze Zeile aus; hier wird genau EIN Feld
 * gefragt – dieselbe Entscheidung wie bei der Rechentabelle, damit die
 * Zahlentastatur genügt.
 *
 * Die Stufe steuert die Hilfe, nicht den Zahlenraum: Auf Stufe 1 und 2 stehen
 * die größeren Sorten links schon in der Tabelle, es ist also nur der Rest zu
 * zerlegen (Stufe 1 nur mit Cent). Auf Stufe 3 ist die Zeile leer, und das Kind muss den ganzen Weg
 * im Kopf gehen.
 */
function geldTabellenZeile(rng, stufe) {
    // Stufe 1 bleibt beim Kleingeld: Cent-Beträge kennt ein Kind vom Einkaufen,
    // die Euro-Tabelle mit Fünfzigern kommt erst danach.
    const inEuro = stufe >= 2 && rng.chance(0.5);
    const sorten = inEuro ? TABELLE_EURO : TABELLE_CENT;
    const einheiten = inEuro ? 100 : 1;
    /*
     * Erst die gesuchte STÜCKZAHL, dann ein Betrag, der sie hergibt – nicht
     * umgekehrt.
     *
     * Zieht man einfach einen Betrag und darin eine Spalte, ist die Antwort in
     * gut drei von vier Fällen eine 1 (gemessen 77 %). Das liegt am Geld selbst:
     * Bis 99 kommt jede Sorte höchstens zweimal vor, und zweimal wird sie nur
     * bei wenigen Beträgen gebraucht. Ein Kind, das das merkt, rät statt zu
     * rechnen – dieselbe Falle wie beim Geldlegen und bei der Rechentabelle.
     *
     * Die 0 bleibt eine gültige Antwort („von der brauchst du keine"), kommt
     * aber seltener: Bei 43 ct sind drei der sechs Spalten leer, lauter Nullen
     * wären eine öde Runde.
     */
    const zielAnzahl = rng.pick([0, 1, 1, 2, 2]);
    /*
     * Auf Stufe 1 und 2 darf die erste Spalte nicht gefragt werden.
     *
     * Links von ihr steht nichts, was man schon ausfüllen könnte – die Zeile
     * bliebe leer, und die versprochene Hilfe fiele still weg. Gemessen traf das
     * 12 % der Stufe-2-Tabellen: Sie waren in Wahrheit Stufe-3-schwer. Auf
     * Stufe 3 ist die Spalte weiter dabei, dort hilft ohnehin nichts.
     */
    const abSpalte = stufe <= 2 ? 1 : 0;
    // 12 bis 99 Einheiten: klein genug für den Zahlenraum, groß genug, dass
    // mehrere Sorten gebraucht werden.
    let betrag = rng.int(12, 99) * einheiten;
    let anzahl = sortenAnzahl(betrag, sorten);
    let markiert = -1;
    for (let versuch = 0; versuch < 60 && markiert < 0; versuch++) {
        // Erst prüfen, dann neu ziehen – sonst stünde am Ende ein Betrag da, den
        // niemand angesehen hat.
        const passend = anzahl
            .map((wert, i) => (wert === zielAnzahl && i >= abSpalte ? i : -1))
            .filter((i) => i >= 0);
        if (passend.length > 0) {
            markiert = rng.pick(passend);
            break;
        }
        betrag = rng.int(12, 99) * einheiten;
        anzahl = sortenAnzahl(betrag, sorten);
    }
    // Notnagel, falls die gewünschte Stückzahl partout nicht vorkommt. Der
    // zuletzt gezogene Betrag ist geprüft – er trägt die Stückzahl nur nicht.
    if (markiert < 0)
        markiert = rng.int(abSpalte, sorten.length - 1);
    // Stufe 1 und 2 zeigen die bereits abgezogenen größeren Sorten, Stufe 3 nichts.
    const gezeigt = sorten.map((_, i) => (stufe <= 2 && i < markiert ? anzahl[i] : null));
    const sorte = sorten[markiert];
    const wort = sortenWort(sorte, true);
    const betragText = inEuro ? `${betrag / 100} €` : `${betrag} ct`;
    // Die Stücke einzeln aufzählen, nicht „2 · 50 ct" – so legt ein Kind sie
    // auch wirklich hin. Mehr als sechs werden es dabei nie.
    const weg = sorten
        .flatMap((wert, i) => new Array(anzahl[i]).fill(sortenName(wert)))
        .join(" + ");
    return {
        typ: "geldlegen/geldtabelle",
        // Scheine gibt es erst ab 5 €; bei Cent-Beträgen liegen nur Münzen da.
        frage: `Lege ${betragText} mit möglichst wenig ${inEuro ? "Scheinen und Münzen" : "Münzen"}. Wie viele ${sortenBindestrich(sorte)} brauchst du?`,
        bild: {
            svg: geldtabelle(betragText, sorten, gezeigt, markiert),
            /*
             * Die schon eingetragenen Spalten gehören in die Beschreibung: Sie sind
             * die Hilfe der Stufe 2, und ohne sie bekäme ein Kind mit Screenreader
             * dort die schwerere Aufgabe. Die gefragte Spalte wird benannt, ihre
             * Zahl natürlich nicht.
             */
            beschriftung: `Geldtabelle für ${betragText}. ${gezeigt.some((wert) => wert !== null)
                ? `Schon eingetragen: ${sorten
                    .map((wert, i) => (gezeigt[i] === null ? null : `${gezeigt[i]} bei ${sortenName(wert)}`))
                    .filter((teil) => teil !== null)
                    .join(", ")}.`
                : "Die Zeile ist noch leer."} Gefragt ist die Spalte ${sortenName(sorte)}.`,
            breit: true,
        },
        antwortfeld: zahlfeld(wort),
        loesung: String(anzahl[markiert]),
        tipp: "Nimm immer die größte Sorte, die noch hineinpasst.",
        // Bei der Antwort 0 sagt die bloße Zerlegung nichts: Die gefragte Sorte
        // kommt darin einfach nicht vor, und ein Kind sucht sie vergeblich.
        erklaerung: anzahl[markiert] === 0
            ? `${betragText} = ${weg}. ${sortenBindestrich(sorte)} brauchst du dafür keine.`
            : `${betragText} = ${weg}`,
    };
}
/* ------------------------------------------- Gruppen und „zu viel" */
/**
 * Eine zufällige Art, `ziel` aus `sorten` zu legen – NICHT die kürzeste.
 *
 * Genau darum geht es auf der Heftseite „Welche Münzen können es sein?": Für
 * 40 ct gibt es viermal 10, zweimal 20 oder 20 + 10 + 10, und alle drei Wege
 * sind richtig. Mit der Greedy-Zerlegung käme immer derselbe heraus.
 *
 * Die Bremse `uebrig * groesste` verhindert Sackgassen: Wer bei 99 ct erst
 * vier Einer zieht, bekommt den Rest mit den verbleibenden Stücken nicht mehr
 * zusammen. `null` heißt „in dieser Stückzahl nicht zu schaffen".
 */
function zufallsZerlegung(rng, ziel, sorten, maxStuecke) {
    const groesste = Math.max(...sorten);
    for (let versuch = 0; versuch < 80; versuch++) {
        const teile = [];
        let rest = ziel;
        while (rest > 0 && teile.length < maxStuecke) {
            const uebrig = maxStuecke - teile.length - 1;
            const brauchbar = sorten.filter((wert) => wert <= rest && rest - wert <= uebrig * groesste);
            if (brauchbar.length === 0)
                break;
            const wert = rng.pick(brauchbar);
            teile.push(wert);
            rest -= wert;
        }
        if (rest === 0)
            return teile.sort((a, b) => b - a);
    }
    return null;
}
/**
 * Vier Gruppen Geld, genau eine ergibt den gesuchten Betrag.
 *
 * Die Ablenker entstehen, indem in der richtigen Gruppe GENAU EIN Stück
 * getauscht wird. Damit haben alle vier Karten gleich viele Münzen, und die
 * Anzahl verrät nichts – dieselbe Falle, die bei `betragLegen` schon einmal
 * zugeschnappt ist.
 */
function gruppeFinden(rng, typ, ziel, sorten, maxStuecke, frage, 
/*
 * Der Betrag in der SCHREIBWEISE DER FRAGE. Ohne ihn stand unter „Welche
 * Münzen sind zusammen genau 100 ct?" die Erklärung „… ergibt zusammen
 * 1 €" – richtig gerechnet, aber ein Wechsel der Einheit, den die Aufgabe
 * gar nicht verlangt hat. Ein Kind, das gerade 50 + 20 + 20 + 10 gerechnet
 * hat, soll seine 100 wiederfinden.
 */
zielText, minStuecke = 2) {
    /*
     * Mehrere Anläufe, nicht einer.
     *
     * Aus manchen Gruppen lassen sich keine drei verschiedenen Ablenker bauen:
     * Bei 10 € als 5 € + 5 € gibt der Tausch EINES Stücks nur zwei andere
     * Gruppen her (5 + 1 und 5 + 2). Mit nur einem Anlauf landete die Aufgabe
     * dann beim Notnagel – gemessen in 19 % der Fälle, und das Kind bekam auf
     * der Heftseite „Immer 10 Euro" eine ganz andere Aufgabe zu sehen.
     */
    for (let anlauf = 0; anlauf < 12; anlauf++) {
        const richtigeGruppe = zufallsZerlegung(rng, ziel, sorten, maxStuecke);
        if (!richtigeGruppe || richtigeGruppe.length < minStuecke)
            continue;
        const gesehen = new Set([richtigeGruppe.join(",")]);
        const gruppen = [richtigeGruppe];
        for (let versuch = 0; versuch < 120 && gruppen.length < 4; versuch++) {
            const geaendert = richtigeGruppe.slice();
            const stelle = rng.int(0, geaendert.length - 1);
            const bisher = geaendert[stelle];
            geaendert[stelle] = rng.pick(sorten.filter((wert) => wert !== bisher));
            geaendert.sort((a, b) => b - a);
            /*
             * Ein Ablenker kann hier nicht versehentlich aufgehen: Getauscht wird
             * genau ein Stück gegen ein ANDERES, die Summe ändert sich also immer.
             * Eine Abfrage darauf wäre toter Code, der wie ein Schutz aussieht –
             * geprüft wird die Eigenschaft stattdessen am Ergebnis
             * (`test/geldaufgaben.test.js`: genau eine Karte ergibt den Betrag).
             *
             * Eine Dublette dagegen ist möglich und wäre nicht entscheidbar.
             */
            const schluessel = geaendert.join(",");
            if (gesehen.has(schluessel))
                continue;
            gesehen.add(schluessel);
            gruppen.push(geaendert);
        }
        if (gruppen.length < 4)
            continue;
        const kennungen = ["A", "B", "C", "D"];
        const gemischt = rng.shuffle(gruppen);
        const optionen = gemischt.map((gruppe, i) => ({
            kennung: kennungen[i],
            svg: geldbild(gruppe),
            /*
             * Die Karte sagt, WAS auf ihr liegt – nicht nur, dass sie Karte A ist.
             *
             * Anders als beim Formenerkennen lässt sich Geld in Worten ausdrücken,
             * ohne die Lösung zu verraten: Zusammenzählen muss man immer noch
             * selbst. Mit „Gruppe A" allein war die Aufgabe für einen Screenreader
             * schlicht unlösbar.
             */
            beschriftung: `Gruppe ${kennungen[i]}: ${gruppe.map(sortenName).join(", ")}`,
        }));
        const loesung = kennungen[gemischt.findIndex((g) => g === richtigeGruppe)];
        const alsText = richtigeGruppe.map(sortenName).join(" + ");
        return {
            typ,
            frage,
            antwortfeld: { art: "bildauswahl", optionen },
            loesung,
            tipp: "Zähle in jeder Gruppe zusammen und vergleiche mit dem Betrag.",
            erklaerung: `${alsText} ergibt zusammen ${zielText}.`,
        };
    }
    return null;
}
/** „Welche Münzen können es sein?" – dieselbe Summe auf verschiedenen Wegen. */
function welcheMuenzen(rng) {
    const ziel = rng.int(3, 20) * 5;
    return gruppeFinden(rng, "geldlegen/welche-muenzen", ziel, KLEINGELD, 4, `Welche Münzen sind zusammen genau ${ziel} ct?`, `${ziel} ct`);
}
/**
 * „Immer 10 Euro" – im Heft kreist das Kind alle Gruppen ein, die zusammen
 * zehn Euro ergeben. Hier ist es eine von vieren.
 */
function immerZehn(rng, maxStuecke) {
    /*
     * Immer zehn Euro, so wie die Heftseite heißt – und nicht etwa auch zwanzig:
     * Zwanzig Euro lassen sich aus Einern, Zweiern und Fünfern mit höchstens
     * fünf Stücken nur als vier Fünfer legen. Das wäre keine Aufgabe mehr,
     * sondern eine Ansage.
     */
    return gruppeFinden(rng, "geldlegen/immer-zehn", 1000, [100, 200, 500], maxStuecke, "Welche Gruppe ist zusammen genau 10 €?", "10 €", 3);
}
/**
 * „Streiche durch, was zu viel ist." Auf dem Tisch liegt ein Stück mehr, als
 * der Preis verlangt.
 *
 * Gebaut wird von der Lösung her: erst eine Zerlegung des Preises, dann genau
 * EIN zusätzliches Stück. Dadurch ist die Differenz immer der Wert dieses
 * Stücks – und damit gibt es keine zweite Antwort.
 */
function zuViel(rng, mitEuro) {
    const inEuro = mitEuro && rng.chance(0.5);
    const sorten = inEuro ? [100, 200, 500, 1000] : KLEINGELD;
    /*
     * Erst das überzählige Stück, dann der Preis – nur so bleibt die SUMME im
     * Zahlenraum.
     *
     * Andersherum kam bei 90 ct Preis und einer 50-ct-Münze obendrauf „Hier
     * liegen 140 ct" heraus: außerhalb des Zahlenraums bis 100, mit einer
     * Subtraktion, die darüber hinausgeht, und obendrein kein Satz, den ein
     * Zweitklässler so sagen würde (das wären 1 Euro 40). Gemessen traf das
     * 6,8 % der Aufgaben.
     */
    const zuvielWert = rng.pick(sorten);
    const preis = inEuro
        ? rng.int(6, 24) * 100
        : rng.int(4, Math.max(4, Math.floor((100 - zuvielWert) / 5))) * 5;
    const gelegt = zufallsZerlegung(rng, preis, sorten, 5);
    if (!gelegt)
        return null;
    const liegt = [...gelegt, zuvielWert].sort((a, b) => b - a);
    const summe = preis + zuvielWert;
    const text = (cent) => (inEuro ? `${cent / 100} €` : `${cent} ct`);
    return {
        typ: "geldlegen/zu-viel",
        /*
         * „Ein Geldstück" steht ausdrücklich dabei: Je nach Haufen ließe sich die
         * Differenz manchmal auch aus zwei kleineren Stücken zusammensetzen – und
         * das kann das Zahlenfeld gar nicht ausdrücken. Gefragt ist das EINE
         * überzählige Stück, genau wie beim Durchstreichen im Heft.
         */
        frage: `Hier liegen ${text(summe)}. Du sollst aber nur ${text(preis)} bezahlen. Ein Geldstück ist zu viel. Welches musst du weglegen?`,
        bild: {
            svg: geldbild(liegt),
            // Ohne die Aufzählung ist nicht zu erkennen, WAS dort liegt – und damit
            // auch nicht, welches Stück zu viel ist.
            beschriftung: `Hier liegen: ${liegt.map(sortenName).join(", ")}`,
        },
        antwortfeld: zahlfeld(inEuro ? "€" : "ct"),
        loesung: String(inEuro ? zuvielWert / 100 : zuvielWert),
        tipp: `Rechne zuerst ${text(summe)} − ${text(preis)}.`,
        erklaerung: `${text(summe)} − ${text(preis)} = ${text(zuvielWert)}, also muss ${text(zuvielWert)} weg.`,
    };
}
