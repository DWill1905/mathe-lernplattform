/**
 * Jubel: Was passiert, wenn eine Aufgabe richtig war. Ein Zauberer holt ein
 * Kaninchen aus dem Hut, ein Tier fliegt quer durchs Bild, Konfetti regnet.
 *
 * Wie in `bilder.ts` gilt: **keine Farbe im SVG**, nur `bild-*`-Klassen –
 * sonst bricht der Dunkelmodus. Die Bewegung selbst steckt komplett in CSS
 * (`jubel-*` in `style.css`), damit hier nichts pro Bild neu erfunden wird.
 *
 * Der Modul-Teil, der das SVG baut, ist bewusst frei von DOM-Zugriff und
 * deshalb direkt testbar.
 */
import { el, svgBild } from "./dom.js";
import { euleJubelGruppe } from "./eule.js";
/**
 * Die Arten, die bei einer normalen richtigen Antwort REIHUM drankommen.
 *
 * Das Pferd steht ausdrücklich NICHT darin: Käme es über `waehleJubel()` auch
 * bei gewöhnlichen Antworten dran, wäre es keine Belohnung für den
 * freiwilligen Umweg mehr, sondern die neunte Überraschung von neun.
 */
export const JUBEL_ARTEN = [
    "zauberhut",
    "schwein",
    "biene",
    "vogel",
    "konfetti",
    "rakete",
    "sterne",
    "eule",
];
/** Der Jubel, der allein der selbst gelösten Hilfsaufgabe gehört. */
export const BONUS_JUBEL = "pferd";
/**
 * Rotation plus Bonus. Die Tests prüfen hierüber die SVG-Zusicherungen – sonst
 * bliebe ausgerechnet das Pferd ungeprüft, weil es in der Reihe fehlt.
 */
export const ALLE_JUBEL_ARTEN = [...JUBEL_ARTEN, BONUS_JUBEL];
/**
 * Wie lange der Jubel läuft (ms). Danach räumt die Anzeige ihn weg. Die Werte
 * müssen zu den Dauern in `style.css` passen – ein zu kurzer Wert schnitte die
 * Bewegung ab, ein zu langer ließe die Ebene über der Aufgabe liegen.
 */
const DAUER = {
    zauberhut: 1900,
    schwein: 2300,
    biene: 2300,
    vogel: 2300,
    konfetti: 2100,
    rakete: 1800,
    sterne: 1400,
    eule: 2000,
    // Etwas getragener als die Flieger: Ein Galopp soll nicht hetzen, und die
    // Reiterin will erkannt werden. Muss zu `.jubel-pferd` in `style.css` passen.
    pferd: 2600,
};
export function jubelDauer(art) {
    return DAUER[art];
}
/**
 * Durchquert das Motiv den Schirm, statt mittig zu stehen? Die Anzeige braucht
 * dafür ein anderes Layout (`jubel-quer`).
 *
 * Hieß früher `fliegt()` – das stimmte nur, solange es drei Vögel und Schweine
 * waren. Ein Pferd galoppiert; gemeint war immer die Layoutfrage.
 */
export function quert(art) {
    return art === "schwein" || art === "biene" || art === "vogel" || art === "pferd";
}
function huelle(breite, hoehe, inhalt) {
    return `<svg viewBox="0 0 ${breite} ${hoehe}" class="illu" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">${inhalt}</svg>`;
}
/** Ein vierzackiger Funkelstern an beliebiger Stelle. */
function funke(x, y, groesse, klasse) {
    const g = groesse;
    return (`<path d="M${x} ${y - g}q${g * 0.2} ${g * 0.8} ${g} ${g}q-${g * 0.8} ${g * 0.2} -${g} ${g}` +
        `q-${g * 0.2} -${g * 0.8} -${g} -${g}q${g * 0.8} -${g * 0.2} ${g} -${g}z" ` +
        `class="${klasse}"/>`);
}
/** Vier versetzt aufblitzende Funken – für Zauberhut und Rakete. */
function funkenreihe(punkte) {
    return punkte
        .map(([x, y, g], i) => funke(x, y, g, `bild-gelb jubel-funke jubel-funke-${i + 1}`))
        .join("");
}
/* ------------------------------------------------------------ Zauberhut */
function zauberhut() {
    // Reihenfolge zählt: Das Kaninchen wird ZUERST gezeichnet, damit die Krempe
    // und die Hutkrone davor liegen – nur so kommt es sichtbar aus dem Hut.
    const hase = `<g class="jubel-hase">` +
        `<path d="M86 36c0-13 3-24 7-24s7 11 7 24-3 15-7 15-7-2-7-15z" class="bild-hell"/>` +
        `<path d="M100 36c0-13 3-24 7-24s7 11 7 24-3 15-7 15-7-2-7-15z" class="bild-hell"/>` +
        `<path d="M90 34c0-9 2-16 3-16s3 7 3 16-1 9-3 9-3-1-3-9z" class="bild-rosa"/>` +
        `<path d="M104 34c0-9 2-16 3-16s3 7 3 16-1 9-3 9-3-1-3-9z" class="bild-rosa"/>` +
        `<ellipse cx="100" cy="68" rx="25" ry="23" class="bild-hell"/>` +
        `<path d="M86 36c0-13 3-24 7-24s7 11 7 24M100 36c0-13 3-24 7-24s7 11 7 24" class="bild-strich"/>` +
        `<ellipse cx="100" cy="68" rx="25" ry="23" class="bild-strich"/>` +
        `<circle cx="91" cy="64" r="3.6" class="bild-dunkel"/>` +
        `<circle cx="109" cy="64" r="3.6" class="bild-dunkel"/>` +
        `<path d="M100 72l-5 5h10z" class="bild-rosa"/>` +
        `<path d="M100 77v4M92 83c5 4 11 4 16 0M70 68h14M70 76h14M116 68h14M116 76h14" class="bild-strich"/>` +
        `</g>`;
    const hut = `<g class="jubel-hut">` +
        `<path d="M64 90h72v36H64z" class="bild-lila"/>` +
        `<rect x="64" y="110" width="72" height="11" class="bild-rosa"/>` +
        `<ellipse cx="100" cy="127" rx="64" ry="15" class="bild-lila"/>` +
        `</g>`;
    const zauberstab = `<g class="jubel-stab">` +
        `<path d="M18 118 54 82" class="bild-strich"/>` +
        `<circle cx="56" cy="80" r="6" class="bild-gelb"/>` +
        `</g>`;
    const funken = funkenreihe([
        [46, 44, 9],
        [154, 52, 11],
        [30, 78, 7],
        [170, 96, 8],
    ]);
    return huelle(200, 150, zauberstab + hase + hut + funken);
}
/* --------------------------------------------------- Fliegende Tiere */
/**
 * Ein schlagender Flügel. Er wird IMMER nach dem Körper gezeichnet und liegt
 * teilweise darüber – hinter dem Körper wäre der weiße Flügel auf der weißen
 * Karte unsichtbar, und mit Umriss allein sah er aus wie ein Koffergriff.
 */
function fluegel(x, y) {
    const form = `M${x} ${y}c-5-15 7-26 20-20 7 3 8 11 2 16-7 6-18 7-22 4z`;
    return (`<g class="jubel-fluegel">` +
        `<path d="${form}" class="bild-hell"/>` +
        `<path d="${form}" class="bild-strich"/>` +
        `<path d="M${x + 4} ${y - 2}c4-8 10-12 16-12" class="bild-strich"/>` +
        `</g>`);
}
function schwein() {
    return huelle(120, 80, `<ellipse cx="62" cy="48" rx="34" ry="24" class="bild-rosa"/>` +
        `<path d="M34 30l6 12 8-8zM90 30l-6 12-8-8z" class="bild-rosa"/>` +
        `<ellipse cx="94" cy="50" rx="13" ry="11" class="bild-rosa"/>` +
        `<circle cx="91" cy="49" r="2.4" class="bild-dunkel"/>` +
        `<circle cx="98" cy="49" r="2.4" class="bild-dunkel"/>` +
        `<circle cx="76" cy="40" r="3.4" class="bild-dunkel"/>` +
        `<path d="M28 54c-8 2-8 10 0 8" class="bild-strich"/>` +
        `<path d="M46 70v6M64 70v6" class="bild-strich"/>` +
        fluegel(50, 42));
}
function biene() {
    return huelle(120, 80, `<ellipse cx="62" cy="48" rx="32" ry="22" class="bild-gelb"/>` +
        `<path d="M50 28a32 22 0 0 0-4 38zM70 27a32 22 0 0 1 4 40zM86 34a32 22 0 0 1 4 26z" class="bild-dunkel"/>` +
        `<circle cx="30" cy="44" r="12" class="bild-dunkel"/>` +
        `<circle cx="26" cy="42" r="2.6" class="bild-hell"/>` +
        `<path d="M26 34 18 24M34 34l6-12" class="bild-strich"/>` +
        `<circle cx="18" cy="22" r="3" class="bild-gelb"/>` +
        `<circle cx="41" cy="20" r="3" class="bild-gelb"/>` +
        `<path d="M94 48l10-6-2 12z" class="bild-dunkel"/>` +
        fluegel(52, 40) +
        fluegel(70, 38));
}
function vogel() {
    return huelle(120, 80, `<ellipse cx="56" cy="46" rx="32" ry="21" class="bild-tuerkis"/>` +
        `<circle cx="88" cy="34" r="15" class="bild-tuerkis"/>` +
        `<path d="M100 32l16 4-16 7z" class="bild-orange"/>` +
        `<circle cx="90" cy="30" r="3" class="bild-dunkel"/>` +
        `<path d="M24 40 4 30l6 18-8 10 26-8z" class="bild-blau"/>` +
        `<path d="M50 64v8M64 64v8" class="bild-strich"/>` +
        `<path d="M86 18c2-8 8-10 12-6" class="bild-strich"/>` +
        fluegel(48, 42));
}
/* ------------------------------------------- Pferd mit Reiterin */
/**
 * Ein Beinpaar mit dunklem Huf – abgerundete Balken, wie beim Dino in
 * `bilder.ts`. Die Klasse trägt die Galopp-Bewegung aus dem Stylesheet.
 */
function beinpaar(x, klasse) {
    const bein = (bx) => `<rect x="${bx}" y="46" width="8" height="26" rx="4" class="bild-fell"/>` +
        `<rect x="${bx - 0.5}" y="66" width="9" height="6" rx="3" class="bild-dunkel"/>`;
    return `<g class="${klasse}">${bein(x)}${bein(x + 10)}</g>`;
}
/**
 * Die Reiterin: blonder Zopf im Fahrtwind, Arme am Zügel.
 *
 * Das Gesicht kommt bewusst OHNE `bild-strich`-Kontur aus – bei dieser
 * viewBox ist der Strich drei Einheiten breit und legte sich wie eine Kapuze
 * um den kleinen Kopf. Die Abgrenzung übernimmt das Haar, das ihn hinten und
 * oben umschließt; nach vorn liegt er ohnehin auf der dunklen Mähne.
 */
function reiterin() {
    return (
    // Bein mit Stiefel, seitlich am Sattel – kurz, sonst hängt es im Bauch.
    `<path d="M54 30h7v9l-3 6h-6l2-7z" class="bild-blau"/>` +
        // Oberkörper und der Arm, der nach vorn zum Zügel greift.
        `<path d="M50 32c0-9 3-13 8-13s8 4 8 13z" class="bild-tuerkis"/>` +
        `<path d="M62 24l14-3 1.5 5-14 4z" class="bild-tuerkis"/>` +
        `<circle cx="78" cy="23" r="2.8" class="bild-haut"/>` +
        // Zopf zuerst: Er liegt HINTER dem Kopf und weht im Fahrtwind.
        `<path d="M50 10c-8 2-13 6-15 13 5-3 9-2 11 2 0-6 2-11 4-15z" class="bild-blond jubel-haar"/>` +
        `<circle cx="57" cy="13" r="7" class="bild-haut"/>` +
        `<path d="M50 11a7 7 0 0 1 14 0c-1.5-3.5-4-5.5-7-5.5s-5.5 2-7 5.5z" class="bild-blond"/>` +
        `<circle cx="60.5" cy="13" r="1.4" class="bild-dunkel"/>`);
}
/**
 * Der Bonus-Jubel: ein Pferd mit blonder Reiterin galoppiert nach rechts.
 *
 * Wie die drei fliegenden Tiere viewBox 120 × 80 und Blick nach RECHTS – nur
 * so stimmt die Querbahn (`.jubel-quer`). Die Zeichenreihenfolge IST die
 * Ebenenlogik: Schweif und Hinterbeine hinter den Rumpf, die Reiterin zuletzt.
 */
function pferd() {
    return huelle(120, 80, 
    // Schweif, Hinterbeine – hinter dem Rumpf.
    `<path d="M24 40c-9-6-18-3-21 8 6-3 10 0 11 7 2-8 5-13 10-15z" class="bild-braun jubel-schweif"/>` +
        beinpaar(28, "jubel-galopp-hinten") +
        // Rumpf, Hals, Mähne.
        `<ellipse cx="55" cy="42" rx="30" ry="15" class="bild-fell"/>` +
        `<path d="M68 32c3-11 12-19 22-22l7 11c-9 4-14 11-16 20z" class="bild-fell"/>` +
        `<path d="M90 8c-11 5-19 14-22 27 4-4 8-5 12-3-1-8 4-15 12-17z" class="bild-braun jubel-maehne"/>` +
        // Ohren, Kopf, Auge, Nüster.
        `<path d="M87 12V4l6 5zM96 9l3-7 3 7z" class="bild-fell"/>` +
        `<ellipse cx="100" cy="18" rx="15" ry="8" class="bild-fell" transform="rotate(22 100 18)"/>` +
        `<circle cx="96" cy="14" r="2.4" class="bild-dunkel"/>` +
        `<circle cx="110" cy="26" r="1.6" class="bild-dunkel"/>` +
        // Satteldecke, Vorderbeine, Reiterin.
        `<path d="M44 30h22l-4 9H47z" class="bild-rot"/>` +
        beinpaar(64, "jubel-galopp-vorn") +
        reiterin());
}
/* ---------------------------------------------------------- Konfetti */
function konfetti() {
    const farben = ["bild-rot", "bild-gelb", "bild-gruen", "bild-blau", "bild-lila", "bild-rosa", "bild-tuerkis"];
    let teile = "";
    for (let i = 0; i < 18; i++) {
        // Feste Werte statt Zufall: Der Jubel soll auf jedem Gerät gleich aussehen.
        const x = 6 + (i * 197) % 188;
        const farbe = farben[i % farben.length];
        const breit = 5 + (i % 3) * 2;
        teile += `<rect x="${x}" y="-12" width="${breit}" height="${breit * 1.6}" rx="1.5" class="${farbe} jubel-schnipsel jubel-schnipsel-${i % 6}"/>`;
    }
    return huelle(200, 150, teile);
}
/* ------------------------------------------------------------ Rakete */
function rakete() {
    return huelle(200, 150, `<g class="jubel-rakete">` +
        `<path d="M100 20c11 9 17 22 17 37v16H83V57c0-15 6-28 17-37z" class="bild-rot"/>` +
        `<circle cx="100" cy="50" r="8" class="bild-blau"/>` +
        `<path d="M83 60 69 78h14zM117 60l14 18h-14z" class="bild-rot"/>` +
        `<path d="M92 73h16l-3 9h-10z" class="bild-grau"/>` +
        `<path d="M100 82c5 0 9 7 9 14-3-3-6-5-9-5s-6 2-9 5c0-7 4-14 9-14z" class="bild-gelb"/>` +
        `</g>` +
        funkenreihe([
            [48, 60, 9],
            [152, 74, 10],
            [62, 116, 7],
            [140, 124, 8],
        ]));
}
/* ------------------------------------------------------------ Sterne */
function sterne() {
    const farben = ["bild-gelb", "bild-rosa", "bild-tuerkis", "bild-lila", "bild-orange", "bild-gruen"];
    let teile = "";
    for (let i = 0; i < 10; i++) {
        const winkel = (i / 10) * Math.PI * 2;
        const x = Math.round(100 + Math.cos(winkel) * 8);
        const y = Math.round(75 + Math.sin(winkel) * 8);
        // Die Flugrichtung steckt in der Klasse `jubel-stern-<i>`, NICHT in einem
        // style-Attribut: Die CSP dieser Seite erlaubt kein Inline-Style.
        teile +=
            `<g class="jubel-stern jubel-stern-${i}">` +
                funke(x, y, 11, farben[i % farben.length]) +
                `</g>`;
    }
    return huelle(200, 150, teile);
}
/* ----------------------------------------------------- Jubelnde Eule */
/**
 * Die Zahleneule höchstselbst hüpft ins Bild. Die Pose kommt aus dem
 * Eulen-Baukasten (`eule.ts`) – Ergebnisseite und Jubel zeigen dadurch
 * garantiert dieselbe Eule, keine Kopie, die auseinanderlaufen könnte.
 * Sie fliegt bewusst NICHT quer durchs Bild: Das Querflug-Layout gehört
 * den drei Tieren, die Eule feiert mittig wie der Zauberhut.
 */
function eule() {
    const funken = funkenreihe([
        [28, 42, 9],
        [172, 50, 10],
        [22, 102, 7],
        [178, 108, 8],
    ]);
    return huelle(200, 150, `<g class="jubel-eulensprung"><g transform="translate(43 14)">${euleJubelGruppe()}</g></g>` + funken);
}
const BAUER = {
    zauberhut,
    schwein,
    biene,
    vogel,
    konfetti,
    rakete,
    sterne,
    eule,
    pferd,
};
/** Das SVG einer Jubelart. */
export function jubelSvg(art) {
    return BAUER[art]();
}
/**
 * Wählt eine Jubelart. Bewusst aus einer Zahl statt aus `Math.random()` –
 * so bleibt der Aufruf testbar und das Projekt bei einer Zufallsquelle.
 */
export function waehleJubel(zahl) {
    return JUBEL_ARTEN[Math.abs(Math.floor(zahl)) % JUBEL_ARTEN.length];
}
/* ------------------------------------------------------------ Anzeige */
/** Die gerade laufende Jubelebene – es soll immer nur eine geben. */
let laufend = null;
/** Räumt eine laufende Jubelebene sofort weg. */
export function raeumeJubel() {
    if (!laufend)
        return;
    clearTimeout(laufend.uhr);
    laufend.knoten.remove();
    laufend = null;
}
/**
 * Zeigt einen Jubel über der ganzen Seite. Die Ebene lässt Klicks durch
 * (`pointer-events: none`) – ein Kind, das schnell weitertippt, darf nie
 * blockiert werden. Sie räumt sich nach `jubelDauer()` selbst weg.
 */
export function zeigeJubel(art) {
    if (typeof document === "undefined")
        return;
    raeumeJubel();
    const buehne = svgBild(jubelSvg(art), "");
    buehne.classList.add("jubel-buehne");
    const knoten = el("div", { class: `jubel jubel-${art}${quert(art) ? " jubel-quer" : ""}` }, buehne);
    document.body.appendChild(knoten);
    const uhr = setTimeout(() => {
        knoten.remove();
        laufend = null;
    }, jubelDauer(art));
    laufend = { knoten, uhr };
}
