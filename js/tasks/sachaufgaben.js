/**
 * Rechengeschichten. Die Rechenart steckt in der Funktion, die GESCHICHTE
 * kommt aus einem Pool daneben – vorher gab es je Rechenart genau einen Satz,
 * und weil Stufe 1 nur „dazubekommen“ und „weggeben“ kannte, ging es dort
 * ausnahmslos ums Schenken.
 *
 * Beim Schreiben einer neuen Geschichte gilt: Sie muss für JEDE Zahl aus dem
 * Bereich der Rechenart sinnvoll bleiben. „3 Kinder teilen sich 60 Bonbons“
 * geht, „60 Kinder passen auf ein Sofa“ nicht.
 */
import { wesfall, zahlfeld, zweiNamen } from "./helpers.js";
export function sachaufgaben(rng, stufe) {
    if (stufe === 1)
        return rng.pick([dazubekommen, weggeben, mehrAls])(rng, 20);
    if (stufe === 2)
        return rng.pick([dazubekommen, weggeben, mehrAls, verteilen, packungen])(rng, 100);
    return rng.pick([zweiSchritte, einkaufMitRueckgeld, zusammenUndDifferenz])(rng, 100);
}
/* ------------------------------------------------------- Dazu (Plus) */
const DAZU = [
    (a, b, n) => `In der Badewanne schwimmen ${a} Gummienten. ${n[0]} lässt noch ${b} dazu. Wie viele Enten schwimmen jetzt?`,
    (a, b) => `${a} Ameisen tragen Kuchenkrümel. Da kommen noch ${b} angelaufen. Wie viele Ameisen sind es zusammen?`,
    (a, b) => `Auf dem Dach sitzen ${a} Tauben. ${b} weitere landen daneben. Wie viele Tauben sitzen jetzt oben?`,
    (a, b, n) => `Im Aquarium schwimmen ${a} Fische. ${n[0]} setzt ${b} neue dazu. Wie viele Fische sind jetzt darin?`,
    (a, b) => `In der Schüssel liegen ${a} Popcorn. ${b} springen noch aus der Maschine hinterher. Wie viele sind es jetzt?`,
    (a, b) => `Im Parkhaus stehen ${a} Autos. ${b} fahren noch hinein. Wie viele Autos stehen jetzt darin?`,
    (a, b) => `Der Drache bewacht ${a} Goldmünzen. In einer Ecke findet er ${b} weitere. Wie viele hat er jetzt?`,
    (a, b) => `Im Bus sitzen ${a} Fahrgäste. An der Haltestelle steigen ${b} ein. Wie viele fahren jetzt mit?`,
    (a, b, n) => `${n[0]} hat einen Turm aus ${a} Bauklötzen. ${n[1]} stapelt ${b} obendrauf. Wie viele Klötze hat der Turm?`,
    (a, b) => `Auf der Wiese blühen ${a} Löwenzahnblumen. Über Nacht kommen ${b} dazu. Wie viele blühen jetzt?`,
];
function dazubekommen(rng, max) {
    const namen = zweiNamen(rng);
    const a = rng.int(3, Math.floor(max * 0.6));
    const b = rng.int(2, max - a);
    return {
        typ: "sach/dazu",
        frage: rng.pick(DAZU)(a, b, namen),
        antwortfeld: zahlfeld(),
        loesung: String(a + b),
        tipp: "Es kommt etwas dazu – also plus rechnen.",
        erklaerung: `${a} + ${b} = ${a + b}`,
    };
}
/* ------------------------------------------------------ Weg (Minus) */
const WEG = [
    (a, b) => `In die Waschmaschine wandern ${a} Socken. ${b} sind danach spurlos verschwunden. Wie viele kommen wieder heraus?`,
    (a, b) => `Der Hund hat ${a} Knochen vergraben. ${b} davon findet er nicht wieder. Wie viele findet er?`,
    (a, b, n) => `Auf dem Teller liegen ${a} Kekse. ${n[0]} nascht ${b} davon. Wie viele Kekse bleiben übrig?`,
    (a, b) => `Im Zirkus hängen ${a} Luftballons. ${b} platzen mit lautem Knall. Wie viele sind noch heil?`,
    (a, b) => `${a} Frösche sitzen am Teich. ${b} hüpfen ins Wasser. Wie viele sitzen noch am Ufer?`,
    (a, b) => `Der Bäcker hat ${a} Brezeln gebacken. ${b} sind schon verkauft. Wie viele liegen noch in der Auslage?`,
    (a, b) => `Am Baum hängen ${a} Äpfel. ${b} fallen ins Gras. Wie viele hängen noch am Baum?`,
    (a, b, n) => `${n[0]} pustet ${a} Seifenblasen. ${b} zerplatzen sofort. Wie viele schweben noch durch die Luft?`,
    (a, b) => `Im Regal stehen ${a} Bücher. ${b} werden ausgeliehen. Wie viele stehen noch da?`,
    (a, b) => `Der Pirat zählt ${a} Goldtaler. Bei einer Welle rollen ${b} über Bord. Wie viele hat er noch?`,
];
function weggeben(rng, max) {
    const namen = zweiNamen(rng);
    const a = rng.int(8, max);
    const b = rng.int(2, a - 1);
    return {
        typ: "sach/weg",
        frage: rng.pick(WEG)(a, b, namen),
        antwortfeld: zahlfeld(),
        loesung: String(a - b),
        tipp: "Es geht etwas weg – also minus rechnen.",
        erklaerung: `${a} − ${b} = ${a - b}`,
    };
}
/* ---------------------------------------------------------- Mehr als */
const MEHR = [
    (a, b, n) => `${n[0]} hat ${a} Sticker. ${n[1]} hat ${b} Sticker mehr. Wie viele hat ${n[1]}?`,
    (a, b, n) => `Auf ${wesfall(n[0])} Pizza liegen ${a} Oliven. Auf ${wesfall(n[1])} Pizza liegen ${b} mehr. Wie viele hat ${n[1]} drauf?`,
    (a, b, n) => `${n[0]} dreht ${a} Runden auf der Bahn. ${n[1]} schafft ${b} Runden mehr. Wie viele Runden sind das?`,
    (a, b) => `Im linken Glas sind ${a} Murmeln, im rechten ${b} mehr. Wie viele Murmeln sind im rechten Glas?`,
    (a, b, n) => `${n[0]} sammelt ${a} Kastanien. ${n[1]} findet ${b} mehr. Wie viele Kastanien hat ${n[1]}?`,
    (a, b) => `Der kleine Roboter hat ${a} Schrauben, der große ${b} mehr. Wie viele Schrauben hat der große?`,
    (a, b, n) => `${n[0]} springt ${a} Mal über das Seil, ${n[1]} schafft ${b} Sprünge mehr. Wie viele sind das bei ${n[1]}?`,
    (a, b) => `Die alte Eiche hat ${a} Vogelnester, die junge Buche ${b} mehr. Wie viele Nester hat die Buche?`,
];
function mehrAls(rng, max) {
    const namen = zweiNamen(rng);
    const a = rng.int(5, Math.floor(max * 0.7));
    // Der Unterschied bleibt kleiner als die Ausgangszahl. Ohne diese Grenze
    // kam „Emma dreht 10 Runden, Lina schafft 70 Runden mehr“ heraus – rechnerisch
    // richtig, als Geschichte aber Unfug.
    const b = rng.int(2, Math.min(a, max - a));
    return {
        typ: "sach/mehr-als",
        frage: rng.pick(MEHR)(a, b, namen),
        antwortfeld: zahlfeld(),
        loesung: String(a + b),
        tipp: "„mehr als“ heißt hier: die Zahlen zusammenzählen.",
        erklaerung: `${a} + ${b} = ${a + b}`,
    };
}
/* --------------------------------------------------------- Verteilen */
const VERTEILEN = [
    (g, k, n) => `${n[0]} verteilt ${g} Gummibärchen gerecht an ${k} Kinder. Wie viele bekommt jedes Kind?`,
    (g, k) => `${g} Jonglierbälle werden gleichmäßig auf ${k} Artisten verteilt. Wie viele bekommt jeder?`,
    (g, k) => `Auf ${k} Tellern liegen zusammen ${g} Pommes, auf jedem gleich viele. Wie viele sind auf einem Teller?`,
    (g, k) => `${g} Küken laufen in ${k} gleich großen Grüppchen. Wie viele Küken sind in einer Gruppe?`,
    (g, k) => `Der Zauberer holt ${g} Kaninchen aus ${k} Hüten – aus jedem gleich viele. Wie viele kommen aus einem Hut?`,
    (g, k) => `${g} Bonbons werden gerecht auf ${k} Tüten verteilt. Wie viele Bonbons sind in einer Tüte?`,
    (g, k) => `${g} Bücher passen gleichmäßig in ${k} Regalfächer. Wie viele stehen in einem Fach?`,
];
function verteilen(rng, _max) {
    const namen = zweiNamen(rng);
    const gruppen = rng.int(2, 6);
    const proGruppe = rng.int(2, 10);
    return {
        typ: "sach/verteilen",
        frage: rng.pick(VERTEILEN)(gruppen * proGruppe, gruppen, namen),
        antwortfeld: zahlfeld(),
        loesung: String(proGruppe),
        tipp: "Gerecht aufteilen heißt: teilen.",
        erklaerung: `${gruppen * proGruppe} : ${gruppen} = ${proGruppe}`,
    };
}
/* --------------------------------------------------------- Packungen */
const PACKUNGEN = [
    (p, n) => `In einer Schachtel stecken ${p} Buntstifte. Wie viele Stifte sind in ${n} Schachteln?`,
    (p, n) => `Ein Marienkäfer hat ${p} Punkte auf dem Rücken. Wie viele Punkte haben ${n} Marienkäfer?`,
    (p, n) => `Auf einem Spieß stecken ${p} Erdbeeren. Wie viele Erdbeeren sind auf ${n} Spießen?`,
    (p, n) => `In einem Karton liegen ${p} Eier. Wie viele Eier sind in ${n} Kartons?`,
    (p, n) => `Jedes Monster hat ${p} Augen. Wie viele Augen haben ${n} Monster?`,
    (p, n) => `Auf jeder Pizza liegen ${p} Salamischeiben. Wie viele Scheiben sind auf ${n} Pizzen?`,
    (p, n) => `Ein Blumenstrauß hat ${p} Tulpen. Wie viele Tulpen sind in ${n} Sträußen?`,
    (p, n) => `In einem Rudel laufen ${p} Wölfe. Wie viele Wölfe sind in ${n} Rudeln?`,
];
function packungen(rng, _max) {
    const anzahl = rng.int(2, 9);
    const proPackung = rng.int(2, 10);
    return {
        typ: "sach/packungen",
        frage: rng.pick(PACKUNGEN)(proPackung, anzahl),
        antwortfeld: zahlfeld(),
        loesung: String(anzahl * proPackung),
        tipp: "Gleich große Gruppen – da hilft das Malnehmen.",
        erklaerung: `${anzahl} · ${proPackung} = ${anzahl * proPackung}`,
    };
}
/* ------------------------------------------------------ Zwei Schritte */
const ZWEI_SCHRITTE = [
    (s, d, w) => `Im Bus sitzen ${s} Leute. An der Haltestelle steigen ${d} ein und ${w} aus. Wie viele fahren weiter?`,
    (s, d, w, n) => `${n[0]} hat ${s} Murmeln, gewinnt ${d} dazu und verliert danach ${w}. Wie viele sind es jetzt?`,
    (s, d, w) => `Auf dem Teich schwimmen ${s} Enten. ${d} landen dazu, dann fliegen ${w} weg. Wie viele schwimmen noch?`,
    (s, d, w) => `Im Baumhaus liegen ${s} Nüsse. Das Eichhörnchen bringt ${d} und knabbert ${w} auf. Wie viele bleiben?`,
    (s, d, w) => `Der Bäcker hat ${s} Brötchen, backt ${d} nach und verkauft ${w}. Wie viele hat er jetzt?`,
    (s, d, w) => `Im Schwimmbad sind ${s} Kinder. ${d} kommen dazu, ${w} gehen nach Hause. Wie viele sind noch da?`,
    (s, d, w) => `Im Kino sitzen ${s} Leute. ${d} kommen noch herein, in der Pause gehen ${w}. Wie viele bleiben?`,
    (s, d, w) => `Auf der Wiese grasen ${s} Schafe. ${d} kommen aus dem Stall, ${w} laufen zum Bach. Wie viele grasen noch?`,
    (s, d, w, n) => `Im Karton liegen ${s} Bausteine. ${n[0]} kippt ${d} dazu und verbaut ${w}. Wie viele bleiben im Karton?`,
];
function zweiSchritte(rng, _max) {
    const namen = zweiNamen(rng);
    const start = rng.int(20, 60);
    const dazu = rng.int(5, 30);
    const weg = rng.int(3, start + dazu - 1);
    return {
        typ: "sach/zwei-schritte",
        frage: rng.pick(ZWEI_SCHRITTE)(start, dazu, weg, namen),
        antwortfeld: zahlfeld(),
        loesung: String(start + dazu - weg),
        tipp: "Rechne Schritt für Schritt – erst dazu, dann weg.",
        erklaerung: `${start} + ${dazu} = ${start + dazu}, dann ${start + dazu} − ${weg} = ${start + dazu - weg}`,
    };
}
/* ------------------------------------------------------------ Einkauf */
const EINKAUF = [
    (s, p, g, n) => `${n[0]} kauft ${s} Hefte für je ${p} € und bezahlt mit ${g} €. Wie viele Euro gibt es zurück?`,
    (s, p, g, n) => `${n[0]} holt ${s} Eiskugeln für je ${p} € und legt ${g} € hin. Wie viel Geld kommt zurück?`,
    (s, p, g, n) => `Ein Comic kostet ${p} €. ${n[0]} nimmt ${s} Stück und zahlt mit ${g} €. Wie viel Wechselgeld gibt es?`,
    (s, p, g, n) => `${s} Luftballons kosten je ${p} €. ${n[0]} bezahlt mit ${g} €. Wie viele Euro bekommt ${n[0]} zurück?`,
    (s, p, g, n) => `${n[0]} kauft ${s} Tüten Popcorn für je ${p} € und gibt ${g} €. Wie viel Euro Rückgeld sind das?`,
    (s, p, g, n) => `Im Zoo kostet ein Futterbecher ${p} €. ${n[0]} nimmt ${s} und zahlt mit ${g} €. Wie viel gibt es zurück?`,
    (s, p, g, n) => `Auf dem Jahrmarkt kostet eine Fahrt ${p} €. ${n[0]} fährt ${s} Mal und zahlt mit ${g} €. Wie viel kommt zurück?`,
    (s, p, g, n) => `${n[0]} kauft ${s} Postkarten für je ${p} € und gibt ${g} €. Wie viele Euro gibt es zurück?`,
    (s, p, g, n) => `Ein Stück Kuchen kostet ${p} €. ${n[0]} nimmt ${s} Stücke und bezahlt mit ${g} €. Wie viel Wechselgeld gibt es?`,
];
function einkaufMitRueckgeld(rng, _max) {
    const namen = zweiNamen(rng);
    const stueck = rng.int(2, 5);
    const preis = rng.int(2, 6);
    const kosten = stueck * preis;
    // Es muss immer genug Geld dabei sein – sonst wäre das Rückgeld negativ.
    const gezahlt = rng.pick([10, 20, 50].filter((schein) => schein >= kosten));
    return {
        typ: "sach/einkauf",
        frage: rng.pick(EINKAUF)(stueck, preis, gezahlt, namen),
        antwortfeld: zahlfeld("€"),
        loesung: String(gezahlt - kosten),
        tipp: "Rechne zuerst den Gesamtpreis aus.",
        erklaerung: `${stueck} · ${preis} € = ${kosten} €, dann ${gezahlt} € − ${kosten} € = ${gezahlt - kosten} €`,
    };
}
const VERGLEICH = [
    {
        einleitung: (a, b, n) => `${n[0]} sammelt ${a} Muscheln, ${n[1]} sammelt ${b}.`,
        mehr: (n) => `Wie viele Muscheln hat ${n[0]} mehr als ${n[1]}?`,
        zusammen: () => "Wie viele Muscheln haben beide zusammen?",
    },
    {
        einleitung: (a, b) => `Im Zoo leben ${a} Pinguine und ${b} Robben.`,
        mehr: () => "Wie viele Pinguine mehr als Robben sind das?",
        zusammen: () => "Wie viele Tiere sind das zusammen?",
    },
    {
        einleitung: (a, b) => `Auf dem Parkplatz stehen ${a} Autos und ${b} Motorräder.`,
        mehr: () => "Wie viele Autos mehr als Motorräder stehen dort?",
        zusammen: () => "Wie viele Fahrzeuge stehen dort zusammen?",
    },
    {
        einleitung: (a, b) => `In der Bücherei stehen ${a} Bilderbücher und ${b} Comics.`,
        mehr: () => "Wie viele Bilderbücher mehr als Comics sind das?",
        zusammen: () => "Wie viele Bücher sind das zusammen?",
    },
    {
        einleitung: (a, b, n) => `${n[0]} hat ${a} Sticker im Album, ${n[1]} hat ${b}.`,
        mehr: (n) => `Wie viele Sticker hat ${n[0]} mehr als ${n[1]}?`,
        zusammen: () => "Wie viele Sticker haben beide zusammen?",
    },
    {
        einleitung: (a, b) => `Im Beet blühen ${a} rote und ${b} gelbe Tulpen.`,
        mehr: () => "Wie viele rote Tulpen mehr als gelbe sind das?",
        zusammen: () => "Wie viele Tulpen blühen dort zusammen?",
    },
    {
        einleitung: (a, b) => `Am Himmel fliegen ${a} Möwen und ${b} Störche.`,
        mehr: () => "Wie viele Möwen mehr als Störche sind das?",
        zusammen: () => "Wie viele Vögel fliegen dort zusammen?",
    },
    {
        einleitung: (a, b) => `In der Kiste liegen ${a} rote und ${b} blaue Bausteine.`,
        mehr: () => "Wie viele rote Steine mehr als blaue sind das?",
        zusammen: () => "Wie viele Bausteine liegen in der Kiste?",
    },
    {
        einleitung: (a, b, n) => `${n[0]} hat ${a} Punkte im Spiel, ${n[1]} hat ${b}.`,
        mehr: (n) => `Wie viele Punkte hat ${n[0]} mehr als ${n[1]}?`,
        zusammen: () => "Wie viele Punkte haben beide zusammen?",
    },
];
function zusammenUndDifferenz(rng, _max) {
    const namen = zweiNamen(rng);
    const geschichte = rng.pick(VERGLEICH);
    const fragtDifferenz = rng.chance(0.5);
    const a = rng.int(20, 60);
    // Beim „zusammen“ muss auch die Summe im Zahlenraum bis 100 bleiben.
    const b = rng.int(5, fragtDifferenz ? a - 1 : Math.min(a - 1, 100 - a));
    return {
        typ: "sach/vergleich",
        frage: `${geschichte.einleitung(a, b, namen)} ${fragtDifferenz ? geschichte.mehr(namen) : geschichte.zusammen()}`,
        antwortfeld: zahlfeld(),
        loesung: String(fragtDifferenz ? a - b : a + b),
        tipp: fragtDifferenz ? "„mehr als“ heißt hier: den Unterschied ausrechnen." : "„zusammen“ heißt: plus rechnen.",
        erklaerung: fragtDifferenz ? `${a} − ${b} = ${a - b}` : `${a} + ${b} = ${a + b}`,
    };
}
