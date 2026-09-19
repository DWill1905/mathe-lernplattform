/**
 * Das Sammelbild: ein Haus im Wald, das sich Stück für Stück einrichtet.
 *
 * Nach je fünf richtigen Aufgaben darf sich das Kind einen Sticker aussuchen
 * und ins Bild kleben – wie im Übungsheft, wo zu jeder Seite ein Sticker
 * gehört und die Wimmelszene dadurch vollständiger wird. Anders als Punkte,
 * Sterne und Puzzle trägt diese Belohnung über die einzelne Runde hinaus.
 *
 * Haus, Dach, Zimmerwände und die Wiese sind von Anfang an da; leer sind die
 * Zimmer. Ein noch fehlender Sticker steht als gestrichelter Umriss im Bild –
 * so sieht ein Kind, wie viel noch kommt.
 *
 * Wie in `bilder.ts` und `figures.ts` gilt: **keine Farbe direkt im SVG**, nur
 * die Klassen `bild-*` aus `style.css`. Bewusst ohne DOM-Zugriff, damit alles
 * direkt testbar ist.
 */
import { euleSvg } from "./eule.js";
/**
 * So viele richtige Antworten bringen einen Sticker. Die freiwillige
 * Hilfsaufgabe zählt nicht mit – sie bringt ein Pferd.
 */
export const RICHTIGE_PRO_STICKER = 5;
/** Das Bild liegt quer und füllt eine Karte. */
export const BILD_BREITE = 240;
export const BILD_HOEHE = 180;
/* ------------------------------------------------------------ Bausteine */
/** Ein Möbelkasten mit dunklerem Rand – Grundform vieler Sticker. */
function kasten(farbe) {
    return (`<rect x="2" y="2" width="96" height="96" rx="8" class="bild-dunkel"/>` +
        `<rect x="6" y="6" width="88" height="88" rx="6" class="${farbe}"/>`);
}
/* -------------------------------------------------------- Die Sticker */
export const STICKER = [
    /* ---------------------------------------------- Schlafzimmer (oben links) */
    {
        nummer: 1,
        name: "Bett",
        x: 68,
        y: 82,
        breite: 40,
        hoehe: 24,
        zeichnung: `
      <rect x="2" y="24" width="96" height="60" rx="8" class="bild-braun"/>
      <rect x="8" y="34" width="84" height="34" rx="6" class="bild-hell"/>
      <rect x="12" y="38" width="30" height="26" rx="6" class="bild-blau"/>
      <path d="M46 38h44a6 6 0 016 6v20a6 6 0 01-6 6H46z" class="bild-rosa"/>
      <rect x="4" y="80" width="12" height="18" rx="4" class="bild-dunkel"/>
      <rect x="84" y="80" width="12" height="18" rx="4" class="bild-dunkel"/>`,
    },
    {
        nummer: 2,
        name: "Nachttisch",
        x: 95,
        y: 85,
        breite: 13,
        hoehe: 17,
        zeichnung: `
      ${kasten("bild-braun")}
      <rect x="18" y="22" width="64" height="26" rx="5" class="bild-hell"/>
      <rect x="18" y="56" width="64" height="26" rx="5" class="bild-hell"/>
      <circle cx="50" cy="35" r="6" class="bild-dunkel"/>
      <circle cx="50" cy="69" r="6" class="bild-dunkel"/>`,
    },
    {
        nummer: 3,
        name: "Wecker",
        x: 95,
        y: 68,
        breite: 12,
        hoehe: 12,
        zeichnung: `
      <circle cx="26" cy="22" r="14" class="bild-grau"/>
      <circle cx="74" cy="22" r="14" class="bild-grau"/>
      <circle cx="50" cy="54" r="42" class="bild-dunkel"/>
      <circle cx="50" cy="54" r="34" class="bild-gelb"/>
      <rect x="46" y="28" width="8" height="30" rx="4" class="bild-dunkel"/>
      <rect x="48" y="50" width="28" height="8" rx="4" class="bild-dunkel"/>`,
    },
    {
        nummer: 4,
        name: "Kleiderschrank",
        x: 109,
        y: 76,
        breite: 15,
        hoehe: 34,
        zeichnung: `
      ${kasten("bild-braun")}
      <rect x="12" y="12" width="34" height="76" rx="4" class="bild-hell"/>
      <rect x="54" y="12" width="34" height="76" rx="4" class="bild-hell"/>
      <circle cx="40" cy="50" r="5" class="bild-dunkel"/>
      <circle cx="60" cy="50" r="5" class="bild-dunkel"/>`,
    },
    {
        nummer: 5,
        name: "Teddy",
        x: 56,
        y: 62,
        breite: 15,
        hoehe: 15,
        zeichnung: `
      <circle cx="24" cy="20" r="14" class="bild-fell"/>
      <circle cx="76" cy="20" r="14" class="bild-fell"/>
      <ellipse cx="50" cy="70" rx="30" ry="26" class="bild-fell"/>
      <circle cx="50" cy="34" r="26" class="bild-fell"/>
      <ellipse cx="50" cy="42" rx="13" ry="10" class="bild-hell"/>
      <circle cx="40" cy="28" r="4" class="bild-dunkel"/>
      <circle cx="60" cy="28" r="4" class="bild-dunkel"/>
      <circle cx="50" cy="39" r="4" class="bild-dunkel"/>`,
    },
    /* ------------------------------------------------------ Bad (oben rechts) */
    {
        nummer: 6,
        name: "Badewanne",
        x: 150,
        y: 84,
        breite: 40,
        hoehe: 22,
        zeichnung: `
      <path d="M2 22h96v46a26 26 0 01-26 26H28A26 26 0 012 68z" class="bild-dunkel"/>
      <path d="M8 28h84v40a20 20 0 01-20 20H28A20 20 0 018 68z" class="bild-hell"/>
      <path d="M16 40h68v26a14 14 0 01-14 14H30a14 14 0 01-14-14z" class="bild-tuerkis"/>
      <rect x="16" y="88" width="10" height="10" rx="3" class="bild-dunkel"/>
      <rect x="74" y="88" width="10" height="10" rx="3" class="bild-dunkel"/>`,
    },
    {
        nummer: 7,
        name: "Waschbecken",
        x: 182,
        y: 82,
        breite: 20,
        hoehe: 24,
        zeichnung: `
      <rect x="42" y="4" width="10" height="26" rx="5" class="bild-grau"/>
      <rect x="42" y="4" width="26" height="8" rx="4" class="bild-grau"/>
      <path d="M4 30h92v16a28 28 0 01-28 28H32A28 28 0 014 46z" class="bild-dunkel"/>
      <path d="M10 36h80v10a22 22 0 01-22 22H32A22 22 0 0110 46z" class="bild-hell"/>
      <ellipse cx="50" cy="40" rx="28" ry="7" class="bild-tuerkis"/>
      <rect x="40" y="70" width="20" height="28" rx="4" class="bild-dunkel"/>
      <rect x="43" y="70" width="14" height="26" rx="3" class="bild-hell"/>`,
    },
    {
        nummer: 8,
        name: "Spiegel",
        x: 182,
        y: 60,
        breite: 16,
        hoehe: 15,
        zeichnung: `
      <ellipse cx="50" cy="50" rx="44" ry="48" class="bild-braun"/>
      <ellipse cx="50" cy="50" rx="34" ry="38" class="bild-tuerkis"/>
      <path d="M32 26c-8 8-12 18-12 28" class="bild-hell"/>
      <ellipse cx="38" cy="34" rx="8" ry="12" class="bild-hell"/>`,
    },
    {
        nummer: 9,
        name: "Gummiente",
        x: 138,
        y: 66,
        breite: 14,
        hoehe: 13,
        zeichnung: `
      <ellipse cx="46" cy="70" rx="42" ry="24" class="bild-gelb"/>
      <circle cx="68" cy="34" r="22" class="bild-gelb"/>
      <path d="M86 32h16l-6 12-12-4z" class="bild-orange"/>
      <circle cx="72" cy="28" r="4" class="bild-dunkel"/>
      <path d="M20 60c8-6 20-6 26 4-10 8-22 6-26-4z" class="bild-orange"/>`,
    },
    /* ------------------------------------------- Wohnzimmer (unten links) */
    {
        nummer: 10,
        name: "Sofa",
        x: 80,
        y: 126,
        breite: 36,
        hoehe: 22,
        zeichnung: `
      <rect x="4" y="20" width="92" height="46" rx="10" class="bild-lila"/>
      <rect x="2" y="44" width="96" height="36" rx="10" class="bild-lila-hell"/>
      <rect x="2" y="40" width="16" height="40" rx="8" class="bild-lila"/>
      <rect x="82" y="40" width="16" height="40" rx="8" class="bild-lila"/>
      <rect x="24" y="28" width="24" height="18" rx="5" class="bild-rosa"/>
      <rect x="54" y="28" width="24" height="18" rx="5" class="bild-rosa"/>
      <rect x="10" y="80" width="10" height="16" rx="3" class="bild-dunkel"/>
      <rect x="80" y="80" width="10" height="16" rx="3" class="bild-dunkel"/>`,
    },
    {
        nummer: 11,
        name: "Teppich",
        x: 82,
        y: 141,
        breite: 44,
        hoehe: 8,
        zeichnung: `
      <rect x="2" y="14" width="96" height="72" rx="24" class="bild-orange"/>
      <rect x="14" y="30" width="72" height="40" rx="14" class="bild-gelb"/>
      <rect x="32" y="42" width="36" height="16" rx="8" class="bild-rot"/>`,
    },
    {
        nummer: 12,
        name: "Stehlampe",
        x: 108,
        y: 120,
        breite: 14,
        hoehe: 40,
        zeichnung: `
      <path d="M22 6h56l12 26H10z" class="bild-gelb"/>
      <rect x="44" y="32" width="12" height="52" rx="4" class="bild-dunkel"/>
      <ellipse cx="50" cy="90" rx="34" ry="10" class="bild-dunkel"/>`,
    },
    {
        nummer: 13,
        name: "Bücherregal",
        x: 53,
        y: 113,
        breite: 15,
        hoehe: 24,
        zeichnung: `
      ${kasten("bild-braun")}
      <rect x="12" y="14" width="18" height="26" rx="3" class="bild-rot"/>
      <rect x="34" y="14" width="18" height="26" rx="3" class="bild-blau"/>
      <rect x="56" y="14" width="18" height="26" rx="3" class="bild-gruen"/>
      <rect x="12" y="52" width="18" height="30" rx="3" class="bild-gelb"/>
      <rect x="34" y="52" width="18" height="30" rx="3" class="bild-lila"/>
      <rect x="56" y="52" width="18" height="30" rx="3" class="bild-tuerkis"/>`,
    },
    {
        nummer: 14,
        name: "Zimmerpflanze",
        x: 66,
        y: 107,
        breite: 14,
        hoehe: 16,
        zeichnung: `
      <ellipse cx="30" cy="30" rx="24" ry="18" class="bild-gruen"/>
      <ellipse cx="72" cy="26" rx="22" ry="16" class="bild-gruen"/>
      <ellipse cx="50" cy="12" rx="20" ry="14" class="bild-gruen"/>
      <rect x="44" y="24" width="10" height="42" rx="4" class="bild-braun"/>
      <path d="M26 62h48l-8 34H34z" class="bild-orange"/>`,
    },
    {
        nummer: 15,
        name: "Katze",
        x: 53,
        y: 136,
        breite: 15,
        hoehe: 14,
        zeichnung: `
      <path d="M22 40 18 8l20 14zM78 40 82 8 62 22z" class="bild-orange"/>
      <ellipse cx="50" cy="74" rx="30" ry="24" class="bild-orange"/>
      <circle cx="50" cy="44" r="28" class="bild-orange"/>
      <circle cx="39" cy="40" r="5" class="bild-dunkel"/>
      <circle cx="61" cy="40" r="5" class="bild-dunkel"/>
      <path d="M50 52l-7 7h14z" class="bild-rosa"/>
      <ellipse cx="84" cy="90" rx="16" ry="7" class="bild-orange"/>`,
    },
    /* ------------------------------------------------ Küche (unten rechts) */
    {
        nummer: 16,
        name: "Tisch",
        x: 137,
        y: 128,
        breite: 26,
        hoehe: 18,
        zeichnung: `
      <rect x="2" y="16" width="96" height="18" rx="8" class="bild-braun"/>
      <rect x="12" y="34" width="12" height="60" rx="4" class="bild-braun"/>
      <rect x="76" y="34" width="12" height="60" rx="4" class="bild-braun"/>
      <rect x="18" y="4" width="64" height="12" rx="6" class="bild-hell"/>`,
    },
    {
        nummer: 17,
        name: "Stuhl",
        x: 133,
        y: 110,
        breite: 14,
        hoehe: 20,
        zeichnung: `
      <rect x="18" y="4" width="64" height="46" rx="8" class="bild-tuerkis"/>
      <rect x="30" y="16" width="40" height="22" rx="5" class="bild-hell"/>
      <rect x="10" y="50" width="80" height="16" rx="6" class="bild-tuerkis"/>
      <rect x="16" y="66" width="12" height="30" rx="4" class="bild-dunkel"/>
      <rect x="72" y="66" width="12" height="30" rx="4" class="bild-dunkel"/>`,
    },
    {
        nummer: 18,
        name: "Herd",
        x: 165,
        y: 128,
        breite: 22,
        hoehe: 22,
        zeichnung: `
      ${kasten("bild-grau")}
      <circle cx="30" cy="26" r="10" class="bild-dunkel"/>
      <circle cx="70" cy="26" r="10" class="bild-dunkel"/>
      <rect x="14" y="44" width="72" height="44" rx="6" class="bild-hell"/>
      <rect x="22" y="52" width="56" height="26" rx="4" class="bild-dunkel"/>
      <rect x="34" y="82" width="32" height="6" rx="3" class="bild-dunkel"/>`,
    },
    {
        nummer: 19,
        name: "Kühlschrank",
        x: 186,
        y: 120,
        breite: 16,
        hoehe: 40,
        zeichnung: `
      ${kasten("bild-hell")}
      <rect x="10" y="10" width="80" height="2" rx="1" class="bild-grau"/>
      <rect x="10" y="36" width="80" height="4" rx="2" class="bild-grau"/>
      <rect x="72" y="16" width="8" height="16" rx="4" class="bild-dunkel"/>
      <rect x="72" y="46" width="8" height="22" rx="4" class="bild-dunkel"/>
      <rect x="18" y="50" width="16" height="14" rx="3" class="bild-rot"/>`,
    },
    {
        nummer: 20,
        name: "Teekanne",
        x: 165,
        y: 108,
        breite: 15,
        hoehe: 13,
        zeichnung: `
      <ellipse cx="46" cy="60" rx="38" ry="32" class="bild-rot"/>
      <path d="M82 42c14 0 16 22 2 26l-6-12z" class="bild-rot"/>
      <path d="M8 44C-4 48-2 74 12 76l4-14z" class="bild-rot"/>
      <ellipse cx="46" cy="26" rx="18" ry="8" class="bild-dunkel"/>
      <circle cx="46" cy="18" r="7" class="bild-dunkel"/>
      <ellipse cx="34" cy="52" rx="10" ry="8" class="bild-hell"/>`,
    },
    /* --------------------------------------------------------- Draußen */
    {
        nummer: 21,
        name: "Baum",
        x: 20,
        y: 120,
        breite: 34,
        hoehe: 60,
        zeichnung: `
      <rect x="40" y="52" width="20" height="46" rx="6" class="bild-braun"/>
      <circle cx="50" cy="30" r="30" class="bild-gruen"/>
      <circle cx="26" cy="46" r="22" class="bild-gruen"/>
      <circle cx="74" cy="46" r="22" class="bild-gruen"/>
      <circle cx="36" cy="22" r="7" class="bild-rot"/>
      <circle cx="66" cy="36" r="7" class="bild-rot"/>`,
    },
    {
        nummer: 22,
        name: "Vogelhaus",
        x: 219,
        y: 124,
        breite: 28,
        hoehe: 52,
        zeichnung: `
      <rect x="42" y="52" width="16" height="46" rx="5" class="bild-braun"/>
      <rect x="18" y="26" width="64" height="30" rx="4" class="bild-gelb"/>
      <path d="M50 2 92 30H8z" class="bild-rot"/>
      <rect x="18" y="52" width="64" height="6" rx="3" class="bild-braun"/>
      <circle cx="50" cy="40" r="10" class="bild-dunkel"/>
      <ellipse cx="72" cy="66" rx="12" ry="9" class="bild-blau"/>
      <circle cx="80" cy="60" r="7" class="bild-blau"/>`,
    },
    {
        nummer: 23,
        name: "Blumenbeet",
        x: 214,
        y: 163,
        breite: 40,
        hoehe: 22,
        zeichnung: `
      <rect x="18" y="40" width="6" height="42" rx="3" class="bild-gruen"/>
      <rect x="47" y="30" width="6" height="52" rx="3" class="bild-gruen"/>
      <rect x="76" y="44" width="6" height="38" rx="3" class="bild-gruen"/>
      <ellipse cx="50" cy="84" rx="48" ry="14" class="bild-braun"/>
      <circle cx="21" cy="34" r="14" class="bild-rosa"/>
      <circle cx="50" cy="24" r="16" class="bild-rot"/>
      <circle cx="79" cy="38" r="14" class="bild-gelb"/>
      <circle cx="21" cy="34" r="5" class="bild-gelb"/>
      <circle cx="50" cy="24" r="6" class="bild-gelb"/>
      <circle cx="79" cy="38" r="5" class="bild-rot"/>`,
    },
    /* ------------------------------------------------------- Krönung */
    {
        nummer: 24,
        name: "Zahleneule",
        x: 92,
        y: 26,
        breite: 30,
        hoehe: 30,
        zuletzt: true,
        // Die Pose kommt aus `eule.ts` – keine zweite Eule im Projekt. Ihre
        // viewBox ist 120 breit, hier passen 100 hinein.
        zeichnung: `<g transform="scale(0.8333)">${euleSvg("winkt")
            .replace(/^<svg[^>]*>/, "")
            .replace(/<\/svg>$/, "")}</g>`,
    },
];
export const STICKER_ANZAHL = STICKER.length;
const NACH_NUMMER = new Map(STICKER.map((s) => [s.nummer, s]));
/** Gibt es diesen Sticker? */
export function istStickerNummer(wert) {
    return typeof wert === "number" && NACH_NUMMER.has(wert);
}
export function sticker(nummer) {
    const gefunden = NACH_NUMMER.get(nummer);
    if (!gefunden)
        throw new Error(`Unbekannter Sticker: ${nummer}`);
    return gefunden;
}
/* ------------------------------------------------------------- Das Haus */
/**
 * Haus, Dach und Wiese – alles, was von Anfang an da ist. Die vier Zimmer
 * bleiben leer, sie füllen sich mit den Stickern.
 */
function haus() {
    return (
    // Wiese mit einem kleinen Hügel.
    `<path d="M0 152c40-6 70 4 110 3s70-8 130-3v28H0z" class="bild-gruen"/>` +
        // Mauerwerk und die vier Zimmer.
        `<rect x="40" y="52" width="160" height="100" rx="6" class="bild-braun"/>` +
        `<rect x="46" y="58" width="71" height="40" rx="3" class="bild-hell"/>` +
        `<rect x="123" y="58" width="71" height="40" rx="3" class="bild-hell"/>` +
        `<rect x="46" y="104" width="71" height="42" rx="3" class="bild-hell"/>` +
        `<rect x="123" y="104" width="71" height="42" rx="3" class="bild-hell"/>` +
        // Dach mit Schornstein. Der Schornstein steht VOR dem Dach gezeichnet,
        // damit seine Unterkante im Dach verschwindet statt daneben zu schweben.
        `<rect x="156" y="26" width="13" height="22" rx="2" class="bild-braun"/>` +
        `<rect x="154" y="23" width="17" height="5" rx="2" class="bild-braun"/>` +
        `<path d="M120 14 214 58H26z" class="bild-rot"/>` +
        `<path d="M120 14 214 58h-7L120 22z" class="bild-dunkel"/>`);
}
/* ------------------------------------------------------------ Das Bild */
function huelle(inhalt) {
    return (`<svg viewBox="0 0 ${BILD_BREITE} ${BILD_HOEHE}" class="illu" ` +
        `xmlns="http://www.w3.org/2000/svg" aria-hidden="true">${inhalt}</svg>`);
}
/** Ein Sticker an seinem Platz, auf sein Feld gezogen. */
function geklebt(eintrag, neu) {
    const x = eintrag.x - eintrag.breite / 2;
    const y = eintrag.y - eintrag.hoehe / 2;
    const klasse = neu ? ` class="sticker-neu"` : "";
    return (`<g${klasse} transform="translate(${r(x)} ${r(y)}) ` +
        `scale(${r(eintrag.breite / 100)} ${r(eintrag.hoehe / 100)})">${eintrag.zeichnung}</g>`);
}
/** Der gestrichelte Umriss eines noch fehlenden Stickers. */
function luecke(eintrag) {
    return (`<rect x="${r(eintrag.x - eintrag.breite / 2)}" y="${r(eintrag.y - eintrag.hoehe / 2)}" ` +
        `width="${eintrag.breite}" height="${eintrag.hoehe}" rx="3" class="sticker-leer"/>`);
}
/**
 * Das ganze Bild.
 *
 * @param gesammelt Nummern der geklebten Sticker.
 * @param neu Dieser Sticker ploppt kurz auf – der gerade ausgesuchte.
 * @param zeigeLuecken Fehlende Plätze gestrichelt andeuten.
 */
export function sammelbild(gesammelt, neu = null, zeigeLuecken = true) {
    const geklebte = new Set(gesammelt);
    let teile = haus();
    for (const eintrag of STICKER) {
        if (geklebte.has(eintrag.nummer))
            teile += geklebt(eintrag, eintrag.nummer === neu);
        else if (zeigeLuecken)
            teile += luecke(eintrag);
    }
    return huelle(teile);
}
/** Ein Sticker allein, für die Auswahlkarte. */
export function stickerBild(nummer) {
    const eintrag = sticker(nummer);
    return (`<svg viewBox="0 0 100 100" class="illu" xmlns="http://www.w3.org/2000/svg" ` +
        `aria-hidden="true">${eintrag.zeichnung}</svg>`);
}
function r(zahl) {
    return Math.round(zahl * 100) / 100;
}
