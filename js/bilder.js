/**
 * Farbige Illustrationen: ein Bild je Thema für die Navigation und die
 * Puzzlemotive für den Puzzlemodus.
 *
 * Wie in `figures.ts` gilt: **keine Farbe direkt im SVG**, nur die Klassen
 * `bild-*` aus `style.css`. Sonst verschwindet der Umriss im Dunkelmodus.
 *
 * Bewusst ohne DOM-Zugriff, damit die Funktionen direkt testbar sind.
 */
/** Themenbilder sind quadratisch, Puzzlemotive liegen quer. */
function huelle(breite, hoehe, inhalt) {
    return `<svg viewBox="0 0 ${breite} ${hoehe}" class="illu" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">${inhalt}</svg>`;
}
/* ====================================================== Themenbilder */
/**
 * Ein Bild je Thema, 100 × 100. Die Kennungen entsprechen `ThemaId` – der
 * Test hält fest, dass keines fehlt.
 */
const THEMENBILDER = {
    // Zwei Rechenzeichen als bunte Klötze.
    plusminus: `
    <rect x="6" y="30" width="40" height="40" rx="10" class="bild-blau"/>
    <rect x="12" y="46" width="28" height="8" rx="4" class="bild-hell"/>
    <rect x="22" y="36" width="8" height="28" rx="4" class="bild-hell"/>
    <rect x="54" y="30" width="40" height="40" rx="10" class="bild-rosa"/>
    <rect x="60" y="46" width="28" height="8" rx="4" class="bild-hell"/>
    <circle cx="20" cy="18" r="5" class="bild-gelb"/>
    <circle cx="80" cy="82" r="5" class="bild-gruen"/>`,
    // Glühbirne: der Trick, der einem einfällt.
    analogie: `
    <path d="M50 66c-14 0-24-10-24-24s10-24 24-24 24 10 24 24-10 24-24 24z" class="bild-gelb"/>
    <path d="M40 44l8 8 14-16" class="bild-strich"/>
    <rect x="41" y="66" width="18" height="7" rx="3" class="bild-grau"/>
    <rect x="43" y="75" width="14" height="6" rx="3" class="bild-grau"/>
    <path d="M50 6v8M18 20l6 6M82 20l-6 6M10 44h8M82 44h8" class="bild-strich"/>`,
    // Zahlenhaus: drei Zahlen wohnen zusammen.
    familien: `
    <path d="M50 10 92 44H8z" class="bild-rot"/>
    <rect x="18" y="44" width="64" height="46" rx="6" class="bild-gelb"/>
    <rect x="27" y="54" width="16" height="16" rx="3" class="bild-hell"/>
    <rect x="57" y="54" width="16" height="16" rx="3" class="bild-hell"/>
    <rect x="42" y="74" width="16" height="16" rx="3" class="bild-blau"/>`,
    // Hunderterfeld in vier Vierteln.
    zahlenraum: raster(),
    // Zahlenmauer aus drei Reihen.
    mauern: `
    <rect x="10" y="66" width="26" height="22" rx="4" class="bild-blau"/>
    <rect x="37" y="66" width="26" height="22" rx="4" class="bild-tuerkis"/>
    <rect x="64" y="66" width="26" height="22" rx="4" class="bild-blau"/>
    <rect x="24" y="42" width="26" height="22" rx="4" class="bild-lila"/>
    <rect x="51" y="42" width="26" height="22" rx="4" class="bild-lila"/>
    <rect x="37" y="18" width="26" height="22" rx="4" class="bild-rosa"/>`,
    // Münzen und ein Schein.
    geld: `
    <rect x="8" y="52" width="52" height="30" rx="5" class="bild-gruen"/>
    <circle cx="34" cy="67" r="9" class="bild-hell"/>
    <circle cx="66" cy="40" r="24" class="bild-gelb"/>
    <circle cx="66" cy="40" r="17" class="bild-orange"/>
    <path d="M74 33a11 11 0 100 14M58 37h13M58 43h13" class="bild-strich"/>`,
    // Punktefeld: vier Reihen zu je fünf.
    einmaleins: punktefeld(),
    // Ein Kuchen, in vier gleiche Stücke geteilt.
    geteilt: `
    <path d="M50 50V12a38 38 0 0138 38z" class="bild-rot"/>
    <path d="M50 50h38a38 38 0 01-38 38z" class="bild-gelb"/>
    <path d="M50 50v38a38 38 0 01-38-38z" class="bild-tuerkis"/>
    <path d="M50 50H12a38 38 0 0138-38z" class="bild-lila"/>
    <circle cx="50" cy="50" r="38" class="bild-strich"/>
    <path d="M50 12v76M12 50h76" class="bild-strich"/>`,
    // Uhr mit Zeigern.
    uhrzeit: `
    <circle cx="50" cy="50" r="40" class="bild-hell"/>
    <circle cx="50" cy="50" r="40" class="bild-strich"/>
    <path d="M50 16v6M84 50h-6M50 84v-6M16 50h6" class="bild-strich"/>
    <path d="M50 50V28M50 50l16 12" class="bild-strich"/>
    <circle cx="50" cy="50" r="5" class="bild-rot"/>`,
    // Lineal mit Strichen.
    laengen: `
    <rect x="6" y="34" width="88" height="32" rx="6" class="bild-orange"/>
    <path d="M18 34v14M30 34v9M42 34v14M54 34v9M66 34v14M78 34v9" class="bild-strich"/>
    <rect x="6" y="34" width="88" height="32" rx="6" class="bild-strich"/>`,
    // Drei Grundformen.
    geometrie: `
    <rect x="8" y="46" width="38" height="38" rx="5" class="bild-blau"/>
    <circle cx="72" cy="65" r="19" class="bild-rosa"/>
    <path d="M50 10 74 42H26z" class="bild-gelb"/>`,
    // Einkaufstasche: Rechnen im Alltag.
    sachaufgaben: `
    <path d="M20 34h60l-6 54H26z" class="bild-tuerkis"/>
    <path d="M36 34V24a14 14 0 0128 0v10" class="bild-strich"/>
    <circle cx="40" cy="56" r="8" class="bild-rot"/>
    <circle cx="62" cy="62" r="10" class="bild-gelb"/>`,
    // Würfel für das gemischte Training.
    mix: `
    <rect x="10" y="30" width="46" height="46" rx="9" class="bild-lila"/>
    <circle cx="23" cy="43" r="5" class="bild-hell"/>
    <circle cx="43" cy="63" r="5" class="bild-hell"/>
    <rect x="52" y="14" width="42" height="42" rx="8" class="bild-rosa"/>
    <circle cx="63" cy="25" r="4.5" class="bild-hell"/>
    <circle cx="83" cy="45" r="4.5" class="bild-hell"/>
    <circle cx="73" cy="35" r="4.5" class="bild-hell"/>`,
    // Zwei Puzzleteile, die ineinandergreifen.
    puzzle: `
    <path d="M10 14h30v10a7 7 0 1114 0v10H10z" class="bild-tuerkis"/>
    <path d="M54 14h36v34H68a7 7 0 100-14H54z" class="bild-gelb"/>
    <path d="M10 48h24a7 7 0 110 14H10z" class="bild-rosa"/>
    <path d="M48 62h42v28H48V76a7 7 0 10-14 0v14H10V62h24a7 7 0 1114 0z" class="bild-lila"/>`,
    // Stoppuhr für den Rechenmeister.
    meister: `
    <rect x="40" y="6" width="20" height="10" rx="3" class="bild-dunkel"/>
    <circle cx="50" cy="56" r="34" class="bild-orange"/>
    <circle cx="50" cy="56" r="26" class="bild-hell"/>
    <path d="M50 56V38M50 56l14 10" class="bild-strich"/>
    <circle cx="50" cy="56" r="4" class="bild-rot"/>
    <path d="M76 24l8-8" class="bild-strich"/>`,
    // Muster mit Fragezeichen am Ende.
    knobeln: `
    <circle cx="20" cy="34" r="12" class="bild-rot"/>
    <rect x="40" y="22" width="24" height="24" rx="4" class="bild-gelb"/>
    <circle cx="82" cy="34" r="12" class="bild-rot"/>
    <rect x="8" y="58" width="24" height="24" rx="4" class="bild-gelb"/>
    <circle cx="50" cy="70" r="12" class="bild-rot"/>
    <rect x="70" y="58" width="24" height="24" rx="4" class="bild-lila"/>
    <text x="82" y="78" class="bild-text" text-anchor="middle" font-size="22">?</text>`,
};
/** Hunderterfeld: zehn mal zehn Kästchen in vier Farbvierteln. */
function raster() {
    let teile = "";
    for (let zeile = 0; zeile < 10; zeile++) {
        for (let spalte = 0; spalte < 10; spalte++) {
            const oben = zeile < 5;
            const links = spalte < 5;
            const farbe = oben === links ? "bild-lila" : "bild-tuerkis";
            teile += `<rect x="${8 + spalte * 8.4}" y="${8 + zeile * 8.4}" width="7" height="7" rx="1.5" class="${farbe}"/>`;
        }
    }
    return teile;
}
/** Punktefeld 5 × 4 – so wird das Einmaleins im Heft gelegt. */
function punktefeld() {
    let teile = "";
    for (let zeile = 0; zeile < 4; zeile++) {
        for (let spalte = 0; spalte < 5; spalte++) {
            teile += `<circle cx="${16 + spalte * 17}" cy="${22 + zeile * 19}" r="7" class="${zeile % 2 === 0 ? "bild-blau" : "bild-rosa"}"/>`;
        }
    }
    return teile;
}
/** Das Bild eines Themas als SVG-Zeichenkette. */
export function themenbild(id) {
    return huelle(100, 100, THEMENBILDER[id] ?? THEMENBILDER["plusminus"]);
}
/** Alle Kennungen, für die es ein Themenbild gibt. */
export function themenbildKennungen() {
    return Object.keys(THEMENBILDER);
}
/** Die Motive, die sich beim Rechnen aufdecken. Alle 120 × 90. */
const MOTIVE = [
    {
        name: "Rakete",
        inhalt: `
      <path d="M60 8c12 10 18 24 18 40v18H42V48c0-16 6-30 18-40z" class="bild-hell"/>
      <path d="M60 8c12 10 18 24 18 40H42c0-16 6-30 18-40z" class="bild-rot"/>
      <circle cx="60" cy="40" r="9" class="bild-blau"/>
      <path d="M42 50 26 70h16zM78 50l16 20H78z" class="bild-rot"/>
      <path d="M50 66h20l-4 10H54z" class="bild-grau"/>
      <path d="M60 76c5 0 9 6 9 12-3-3-6-4-9-4s-6 1-9 4c0-6 4-12 9-12z" class="bild-gelb"/>
      <circle cx="18" cy="20" r="3" class="bild-gelb"/>
      <circle cx="100" cy="30" r="3" class="bild-gelb"/>`,
    },
    {
        name: "Katze",
        inhalt: `
      <path d="M34 30 40 8l18 12zM86 30 80 8 62 20z" class="bild-orange"/>
      <ellipse cx="60" cy="52" rx="32" ry="28" class="bild-orange"/>
      <path d="M38 16l4 12 8-5zM82 16l-4 12-8-5z" class="bild-rosa"/>
      <circle cx="48" cy="46" r="5" class="bild-dunkel"/>
      <circle cx="72" cy="46" r="5" class="bild-dunkel"/>
      <path d="M60 58l-5 5h10z" class="bild-rosa"/>
      <path d="M60 63v5M52 68c4 4 12 4 16 0M20 52h16M20 60h16M84 52h16M84 60h16" class="bild-strich"/>`,
    },
    {
        name: "Segelschiff",
        inhalt: `
      <path d="M60 8v52" class="bild-strich"/>
      <path d="M56 12 26 56h30z" class="bild-hell"/>
      <path d="M64 18l28 38H64z" class="bild-rot"/>
      <path d="M18 60h84l-12 18H30z" class="bild-braun"/>
      <path d="M6 82c8 0 8 6 16 6s8-6 16-6 8 6 16 6 8-6 16-6 8 6 16 6 8-6 16-6" class="bild-strich"/>
      <circle cx="98" cy="18" r="8" class="bild-gelb"/>`,
    },
    {
        name: "Blume",
        inhalt: `
      <path d="M60 34v52" class="bild-strich"/>
      <path d="M60 62c-12 0-20-6-24-14 12-2 20 4 24 14zM60 56c10-2 18-10 20-20-12 0-18 8-20 20z" class="bild-gruen"/>
      <circle cx="60" cy="14" r="12" class="bild-rosa"/>
      <circle cx="42" cy="26" r="12" class="bild-rosa"/>
      <circle cx="78" cy="26" r="12" class="bild-rosa"/>
      <circle cx="49" cy="44" r="12" class="bild-rosa"/>
      <circle cx="71" cy="44" r="12" class="bild-rosa"/>
      <circle cx="60" cy="30" r="12" class="bild-gelb"/>`,
    },
    {
        name: "Schmetterling",
        inhalt: `
      <path d="M58 20c-8-14-30-16-38-4S28 42 58 46zM62 20c8-14 30-16 38-4S92 42 62 46z" class="bild-lila"/>
      <path d="M58 50c-8 14-26 20-34 10S32 34 58 44zM62 50c8 14 26 20 34 10S88 34 62 44z" class="bild-rosa"/>
      <ellipse cx="60" cy="46" rx="5" ry="26" class="bild-dunkel"/>
      <path d="M58 22 48 8M62 22 72 8" class="bild-strich"/>
      <circle cx="34" cy="26" r="4" class="bild-gelb"/>
      <circle cx="86" cy="26" r="4" class="bild-gelb"/>`,
    },
    {
        name: "Regenbogen",
        inhalt: `
      <path d="M14 78a46 46 0 0192 0H88a32 32 0 00-64 0z" class="bild-rot"/>
      <path d="M24 78a36 36 0 0172 0H83a21 21 0 00-42 0z" class="bild-gelb"/>
      <path d="M35 78a25 25 0 0150 0H74a14 14 0 00-28 0z" class="bild-gruen"/>
      <ellipse cx="18" cy="80" rx="16" ry="9" class="bild-hell"/>
      <ellipse cx="102" cy="80" rx="16" ry="9" class="bild-hell"/>`,
    },
    {
        name: "Fuchs",
        inhalt: `
      <path d="M38 26 34 4l22 12zM82 26 86 4 64 16z" class="bild-orange"/>
      <path d="M41 21 39 9l11 6zM79 21l2-12-11 6z" class="bild-rosa"/>
      <ellipse cx="60" cy="42" rx="30" ry="25" class="bild-orange"/>
      <path d="M36 50h48L60 84z" class="bild-hell"/>
      <circle cx="48" cy="38" r="5" class="bild-dunkel"/>
      <circle cx="72" cy="38" r="5" class="bild-dunkel"/>
      <path d="M60 66 53 58h14z" class="bild-dunkel"/>
      <path d="M20 52h14M20 60h14M86 52h14M86 60h14" class="bild-strich"/>`,
    },
    {
        name: "Leuchtturm",
        inhalt: `
      <path d="M48 20h24l6 50H42z" class="bild-hell"/>
      <path d="M49 32h22l1.5 12H47.5zM51 56h18l1 12H50z" class="bild-rot"/>
      <path d="M44 14h32l-4 8H48z" class="bild-dunkel"/>
      <rect x="52" y="4" width="16" height="10" rx="3" class="bild-gelb"/>
      <path d="M52 9 20 2M68 9l32-7" class="bild-strich"/>
      <path d="M30 70h60l6 16H24z" class="bild-braun"/>
      <path d="M6 88c10 0 10-6 20-6s10 6 20 6 10-6 20-6 10 6 20 6 10-6 20-6" class="bild-strich"/>`,
    },
    {
        name: "Heißluftballon",
        inhalt: `
      <path d="M60 4c18 0 30 14 30 30 0 14-12 26-18 32H48c-6-6-18-18-18-32C30 18 42 4 60 4z" class="bild-rot"/>
      <path d="M60 4c6 0 10 14 10 30s-4 26-10 32c-6-6-10-16-10-32S54 4 60 4z" class="bild-gelb"/>
      <rect x="48" y="66" width="24" height="6" rx="2" class="bild-braun"/>
      <path d="M52 72h16l-2 14H54z" class="bild-braun"/>
      <path d="M52 66l-2 6M68 66l2 6" class="bild-strich"/>
      <circle cx="16" cy="24" r="8" class="bild-hell"/>
      <circle cx="104" cy="40" r="8" class="bild-hell"/>`,
    },
    {
        name: "Dino",
        inhalt: `
      <path d="M28 58 8 34l-3 13 15 20z" class="bild-gruen"/>
      <path d="M62 60 78 22l14 6-16 40z" class="bild-gruen"/>
      <path d="M97 10c7 0 12 5 12 11 0 5-3 9-8 11l-11 2-8-14z" class="bild-gruen"/>
      <path d="M32 44l7-13 7 13zM48 40l8-14 8 14zM66 43l7-13 7 13z" class="bild-tuerkis"/>
      <ellipse cx="56" cy="62" rx="32" ry="20" class="bild-gruen"/>
      <rect x="34" y="74" width="11" height="14" rx="5" class="bild-gruen"/>
      <rect x="52" y="74" width="11" height="14" rx="5" class="bild-gruen"/>
      <rect x="70" y="72" width="11" height="14" rx="5" class="bild-gruen"/>
      <circle cx="100" cy="19" r="3.2" class="bild-dunkel"/>
      <circle cx="44" cy="58" r="5" class="bild-gelb"/>
      <circle cx="62" cy="66" r="5" class="bild-gelb"/>`,
    },
];
/** So viele Teile hat ein Puzzle – und so viele Aufgaben hat die Runde. */
export const PUZZLE_SPALTEN = 4;
export const PUZZLE_ZEILEN = 3;
export const PUZZLE_TEILE = PUZZLE_SPALTEN * PUZZLE_ZEILEN;
/**
 * Zustand aller Puzzleteile einer Runde.
 *
 * Ein Teil gehört genau zu SEINER Aufgabe und deckt sich erst auf, wenn die
 * beantwortet ist. Die freiwillige Hilfsaufgabe zählt dabei ausdrücklich
 * NICHT: Sie wird vor der eigentlichen Antwort gerechnet, und ihr Ergebnis
 * sagt nichts über das Teil aus. Wer das vermischt, gräbt dem Kind das Teil
 * blass auf, bevor es die Aufgabe überhaupt gesehen hat.
 *
 * @param index Nummer der laufenden Aufgabe.
 * @param aktuelleFertig Ist die LAUFENDE Aufgabe (nicht ihr Bonus) beantwortet?
 * @param ergebnisse Richtig/falsch je bereits beantworteter Aufgabe.
 */
export function puzzleStaende(index, aktuelleFertig, ergebnisse, teile = PUZZLE_TEILE) {
    const stand = [];
    for (let i = 0; i < teile; i++) {
        const beantwortet = i < index || (i === index && aktuelleFertig);
        stand.push(!beantwortet ? "zu" : ergebnisse[i] === true ? "auf" : "grau");
    }
    return stand;
}
/** Wählt ein Motiv aus. */
export function waehleMotiv(zahl) {
    const motiv = MOTIVE[Math.abs(Math.floor(zahl)) % MOTIVE.length];
    return {
        name: motiv.name,
        svg: huelle(120, 90, motiv.inhalt),
        spalten: PUZZLE_SPALTEN,
        zeilen: PUZZLE_ZEILEN,
    };
}
/** Namen aller Motive – für den Test. */
export function motivNamen() {
    return MOTIVE.map((m) => m.name);
}
/**
 * Das Puzzlebild: das Motiv, darüber ein Deckel je Teil. Aufgedeckte Teile
 * bekommen keinen Deckel mehr, falsch beantwortete einen blassen.
 *
 * Die Deckel liegen bewusst IM selben SVG wie das Motiv – ein zweites,
 * überlagertes Element würde beim Zoomen verrutschen.
 */
export function puzzleBild(puzzle, stand) {
    const breite = 120 / puzzle.spalten;
    const hoehe = 90 / puzzle.zeilen;
    let deckel = "";
    for (let i = 0; i < puzzle.spalten * puzzle.zeilen; i++) {
        const zustand = stand[i] ?? "zu";
        if (zustand === "auf")
            continue;
        const x = (i % puzzle.spalten) * breite;
        const y = Math.floor(i / puzzle.spalten) * hoehe;
        const klasse = zustand === "grau" ? "puzzle-grau" : "puzzle-zu";
        deckel += `<rect x="${x}" y="${y}" width="${breite}" height="${hoehe}" rx="3" class="${klasse}"/>`;
    }
    // Gitterlinien zeigen, wie viele Teile noch fehlen.
    let gitter = "";
    for (let s = 1; s < puzzle.spalten; s++) {
        gitter += `<line x1="${s * breite}" y1="0" x2="${s * breite}" y2="90" class="puzzle-fuge"/>`;
    }
    for (let z = 1; z < puzzle.zeilen; z++) {
        gitter += `<line x1="0" y1="${z * hoehe}" x2="120" y2="${z * hoehe}" class="puzzle-fuge"/>`;
    }
    const inhalt = puzzle.svg.replace(/^<svg[^>]*>/, "").replace(/<\/svg>$/, "");
    return huelle(120, 90, inhalt + deckel + gitter);
}
