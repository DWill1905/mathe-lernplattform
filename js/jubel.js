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
/** Alle Jubelarten in fester Reihenfolge. */
export const JUBEL_ARTEN = [
    "zauberhut",
    "schwein",
    "biene",
    "vogel",
    "konfetti",
    "rakete",
    "sterne",
];
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
};
export function jubelDauer(art) {
    return DAUER[art];
}
/** Fliegt das Motiv quer durchs Bild? Die Anzeige braucht dafür ein anderes Layout. */
export function fliegt(art) {
    return art === "schwein" || art === "biene" || art === "vogel";
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
const BAUER = {
    zauberhut,
    schwein,
    biene,
    vogel,
    konfetti,
    rakete,
    sterne,
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
    const knoten = el("div", { class: `jubel jubel-${art}${fliegt(art) ? " jubel-flug" : ""}` }, buehne);
    document.body.appendChild(knoten);
    const uhr = setTimeout(() => {
        knoten.remove();
        laufend = null;
    }, jubelDauer(art));
    laufend = { knoten, uhr };
}
