/**
 * Erklärbilder als SVG-Zeichenketten. Bewusst ohne DOM-Zugriff, damit die
 * Funktionen direkt testbar sind.
 *
 * Farben werden ausschließlich über CSS-Klassen (`fig-*` in `style.css`)
 * gesetzt – sonst bricht der Dunkelmodus.
 */
function huelle(breite, hoehe, inhalt) {
    return `<svg viewBox="0 0 ${breite} ${hoehe}" class="fig" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">${inhalt}</svg>`;
}
/* ------------------------------------------------------------------ Uhr */
/** Analoge Uhr mit Stunden- und Minutenzeiger. */
export function uhr(stunde, minute) {
    const m = ((minute % 60) + 60) % 60;
    const h = ((stunde % 12) + 12) % 12;
    const mitte = 100;
    const radius = 88;
    let teile = `<circle cx="100" cy="100" r="${radius}" class="fig-flaeche"/>`;
    teile += `<circle cx="100" cy="100" r="${radius}" class="fig-linie" fill="none" stroke-width="4"/>`;
    for (let i = 0; i < 60; i++) {
        const winkel = (i / 60) * Math.PI * 2 - Math.PI / 2;
        const voll = i % 5 === 0;
        const innen = radius - (voll ? 12 : 6);
        const x1 = mitte + Math.cos(winkel) * innen;
        const y1 = mitte + Math.sin(winkel) * innen;
        const x2 = mitte + Math.cos(winkel) * (radius - 2);
        const y2 = mitte + Math.sin(winkel) * (radius - 2);
        teile += `<line x1="${r(x1)}" y1="${r(y1)}" x2="${r(x2)}" y2="${r(y2)}" class="fig-linie" stroke-width="${voll ? 3 : 1.5}"/>`;
    }
    for (let i = 1; i <= 12; i++) {
        const winkel = (i / 12) * Math.PI * 2 - Math.PI / 2;
        const x = mitte + Math.cos(winkel) * (radius - 26);
        const y = mitte + Math.sin(winkel) * (radius - 26);
        teile += `<text x="${r(x)}" y="${r(y + 6)}" class="fig-text" text-anchor="middle" font-size="18">${i}</text>`;
    }
    const minutenWinkel = (m / 60) * Math.PI * 2 - Math.PI / 2;
    const stundenWinkel = ((h + m / 60) / 12) * Math.PI * 2 - Math.PI / 2;
    teile += zeiger(mitte, stundenWinkel, 46, 7, "fig-zeiger-stunde");
    teile += zeiger(mitte, minutenWinkel, 70, 5, "fig-zeiger-minute");
    teile += `<circle cx="100" cy="100" r="6" class="fig-zeiger-punkt"/>`;
    return huelle(200, 200, teile);
}
function zeiger(mitte, winkel, laenge, breite, klasse) {
    const x = mitte + Math.cos(winkel) * laenge;
    const y = mitte + Math.sin(winkel) * laenge;
    return `<line x1="${mitte}" y1="${mitte}" x2="${r(x)}" y2="${r(y)}" class="${klasse}" stroke-width="${breite}" stroke-linecap="round"/>`;
}
/* ---------------------------------------------------------------- Geld */
/** Reihe aus Münzen und Scheinen. Werte in Cent. */
export function geldbild(werte) {
    const proReihe = 5;
    const reihen = Math.ceil(werte.length / proReihe);
    // Nur die tatsächlich belegten Spalten zählen – sonst schrumpfen wenige
    // Münzen auf ein Fünftel der Bildbreite zusammen.
    const breite = Math.max(1, Math.min(werte.length, proReihe)) * 76;
    const hoehe = reihen * 76;
    let teile = "";
    werte.forEach((wert, i) => {
        const spalte = i % proReihe;
        const reihe = Math.floor(i / proReihe);
        const x = spalte * 76 + 38;
        const y = reihe * 76 + 38;
        teile += wert >= 500 ? schein(x, y, wert) : muenze(x, y, wert);
    });
    return huelle(breite, hoehe, teile);
}
function muenze(x, y, cent) {
    const klasse = cent >= 100 ? "fig-muenze-euro" : cent >= 10 ? "fig-muenze-gold" : "fig-muenze-kupfer";
    const beschriftung = cent >= 100 ? `${cent / 100} €` : `${cent} ct`;
    return (`<circle cx="${x}" cy="${y}" r="31" class="${klasse}"/>` +
        `<circle cx="${x}" cy="${y}" r="31" class="fig-linie" fill="none" stroke-width="2.5"/>` +
        `<text x="${x}" y="${y + 6}" class="fig-muenze-text" text-anchor="middle" font-size="17">${beschriftung}</text>`);
}
function schein(x, y, cent) {
    return (`<rect x="${x - 34}" y="${y - 21}" width="68" height="42" rx="5" class="fig-schein"/>` +
        `<rect x="${x - 34}" y="${y - 21}" width="68" height="42" rx="5" class="fig-linie" fill="none" stroke-width="2.5"/>` +
        `<text x="${x}" y="${y + 6}" class="fig-muenze-text" text-anchor="middle" font-size="17">${cent / 100} €</text>`);
}
const FORM_ECKEN = {
    Quadrat: 4,
    Rechteck: 4,
    Dreieck: 3,
    Kreis: 0,
    Fünfeck: 5,
    Sechseck: 6,
    Raute: 4,
    Trapez: 4,
};
export function eckenZahl(form) {
    return FORM_ECKEN[form];
}
export const ALLE_FORMEN = Object.keys(FORM_ECKEN);
/**
 * Formen, die im Deutschen weiblich sind. Die Raute ist die einzige in dieser
 * Liste – und genau solche Einzelfälle rutschen durch: In der Aufgabe stand
 * „Ein Raute hat 4 Ecken". Dasselbe Muster wie beim Wesfall der Vornamen
 * (`wesfall()` in `tasks/helpers.ts`), wo „Jonass" herauskam.
 */
const WEIBLICHE_FORMEN = new Set(["Raute"]);
/** Formname mit richtigem unbestimmten Artikel: „Ein Dreieck", „Eine Raute". */
export function mitArtikel(name, gross = true) {
    const artikel = WEIBLICHE_FORMEN.has(name) ? "eine" : "ein";
    return `${gross ? artikel[0].toUpperCase() + artikel.slice(1) : artikel} ${name}`;
}
/** Zeichnet eine ebene Figur mittig in ein 200×200-Feld. */
export function form(name) {
    const inhalt = (() => {
        switch (name) {
            case "Kreis":
                return `<circle cx="100" cy="100" r="74" class="fig-flaeche-bunt"/><circle cx="100" cy="100" r="74" class="fig-linie" fill="none" stroke-width="4"/>`;
            case "Quadrat":
                return rechteckForm(70, 70, 130, 130);
            case "Rechteck":
                return rechteckForm(24, 62, 176, 138);
            case "Dreieck":
                return polygon([
                    [100, 26],
                    [178, 168],
                    [22, 168],
                ]);
            case "Raute":
                return polygon([
                    [100, 22],
                    [172, 100],
                    [100, 178],
                    [28, 100],
                ]);
            case "Trapez":
                return polygon([
                    [58, 56],
                    [142, 56],
                    [180, 150],
                    [20, 150],
                ]);
            case "Fünfeck":
                return polygon(regelmaessig(5, 78));
            case "Sechseck":
                return polygon(regelmaessig(6, 78));
        }
    })();
    return huelle(200, 200, inhalt);
}
function rechteckForm(x1, y1, x2, y2) {
    const w = x2 - x1;
    const h = y2 - y1;
    return (`<rect x="${x1}" y="${y1}" width="${w}" height="${h}" rx="4" class="fig-flaeche-bunt"/>` +
        `<rect x="${x1}" y="${y1}" width="${w}" height="${h}" rx="4" class="fig-linie" fill="none" stroke-width="4"/>`);
}
function polygon(punkte) {
    const p = punkte.map(([x, y]) => `${r(x)},${r(y)}`).join(" ");
    return (`<polygon points="${p}" class="fig-flaeche-bunt"/>` +
        `<polygon points="${p}" class="fig-linie" fill="none" stroke-width="4" stroke-linejoin="round"/>`);
}
function regelmaessig(ecken, radius) {
    const punkte = [];
    for (let i = 0; i < ecken; i++) {
        const winkel = (i / ecken) * Math.PI * 2 - Math.PI / 2;
        punkte.push([100 + Math.cos(winkel) * radius, 100 + Math.sin(winkel) * radius]);
    }
    return punkte;
}
/**
 * Figur mit eingezeichneter Linie – Frage: Ist das eine Spiegelachse?
 *
 * Die falsche Linie verläuft schräg und bewusst NICHT durch den Mittelpunkt:
 * Eine senkrechte Linie daneben lag bei schmalen Figuren (Quadrat: x 70–130)
 * komplett neben der Form, und jede Gerade DURCH den Mittelpunkt wäre beim
 * Kreis eine echte Spiegelachse. Sie schneidet alle vier verwendeten Formen.
 */
export function spiegelachse(name, richtig) {
    const basis = form(name).replace("</svg>", "");
    const linie = richtig
        ? `<line x1="100" y1="8" x2="100" y2="192" class="fig-achse"/>`
        : `<line x1="40" y1="20" x2="180" y2="150" class="fig-achse"/>`;
    return `${basis}${linie}</svg>`;
}
/* -------------------------------------------------------- Zahlenstrahl */
/** Zahlenstrahl von 0 bis `max` mit einem markierten Wert (oder Fragezeichen). */
export function zahlenstrahl(max, markiert, schritt = 10) {
    const breite = 520;
    const links = 30;
    const rechts = breite - 30;
    const y = 70;
    let teile = `<line x1="${links}" y1="${y}" x2="${rechts}" y2="${y}" class="fig-linie" stroke-width="3"/>`;
    teile += `<polygon points="${rechts},${y} ${rechts - 12},${y - 6} ${rechts - 12},${y + 6}" class="fig-voll"/>`;
    for (let wert = 0; wert <= max; wert += schritt) {
        const x = links + ((rechts - links - 16) * wert) / max;
        teile += `<line x1="${r(x)}" y1="${y - 10}" x2="${r(x)}" y2="${y + 10}" class="fig-linie" stroke-width="2.5"/>`;
        teile += `<text x="${r(x)}" y="${y + 32}" class="fig-text" text-anchor="middle" font-size="17">${wert}</text>`;
    }
    if (markiert !== null) {
        const x = links + ((rechts - links - 16) * markiert) / max;
        teile += `<circle cx="${r(x)}" cy="${y}" r="10" class="fig-marke"/>`;
        teile += `<text x="${r(x)}" y="${y - 22}" class="fig-text-marke" text-anchor="middle" font-size="22">?</text>`;
    }
    return huelle(breite, 110, teile);
}
/* --------------------------------------------------------- Punktefeld */
/** Punktefeld für Malaufgaben: `reihen` Reihen zu je `spalten` Punkten. */
export function punktefeld(reihen, spalten) {
    const abstand = 30;
    const rand = 20;
    const breite = spalten * abstand + rand * 2 - (abstand - 20);
    const hoehe = reihen * abstand + rand * 2 - (abstand - 20);
    let teile = "";
    for (let z = 0; z < reihen; z++) {
        for (let s = 0; s < spalten; s++) {
            teile += `<circle cx="${rand + s * abstand}" cy="${rand + z * abstand}" r="10" class="fig-punkt"/>`;
        }
    }
    return huelle(breite, hoehe, teile);
}
/* ------------------------------------------------------------ Hilfen */
function r(zahl) {
    return Math.round(zahl * 100) / 100;
}
/* ------------------------------------------------------- Zahlenmauern */
/**
 * Zahlenmauer (Rechenmauer). `reihen[0]` ist die UNTERSTE Reihe, jede Reihe
 * darüber hat einen Stein weniger. `null` markiert den gesuchten Stein.
 */
export function zahlenmauer(reihen) {
    const breiteStein = 66;
    const hoeheStein = 46;
    const spalt = 5;
    const unten = reihen[0]?.length ?? 0;
    const breite = unten * (breiteStein + spalt) - spalt;
    const hoehe = reihen.length * (hoeheStein + spalt) - spalt;
    let teile = "";
    reihen.forEach((reihe, ebene) => {
        const y = (reihen.length - 1 - ebene) * (hoeheStein + spalt);
        const versatz = (ebene * (breiteStein + spalt)) / 2;
        reihe.forEach((wert, spalte) => {
            const x = versatz + spalte * (breiteStein + spalt);
            const gesucht = wert === null;
            teile +=
                `<rect x="${r(x)}" y="${y}" width="${breiteStein}" height="${hoeheStein}" rx="7" ` +
                    `class="${gesucht ? "fig-stein-luecke" : "fig-stein"}"/>` +
                    `<rect x="${r(x)}" y="${y}" width="${breiteStein}" height="${hoeheStein}" rx="7" ` +
                    `class="fig-linie" fill="none" stroke-width="2.5"/>` +
                    `<text x="${r(x + breiteStein / 2)}" y="${y + hoeheStein / 2 + 8}" ` +
                    `class="${gesucht ? "fig-text-marke" : "fig-text"}" text-anchor="middle" font-size="22">` +
                    `${gesucht ? "?" : wert}</text>`;
        });
    });
    return huelle(breite, hoehe, teile);
}
/** Rechenrad: außen + innen ergibt immer die Zahl in der Mitte. */
export function rechenrad(mitte, felder) {
    const m = 130;
    const rMitte = 40;
    const rInnen = 76;
    const rAussen = 116;
    const schritt = (Math.PI * 2) / felder.length;
    const start = -Math.PI / 2 - schritt / 2;
    let teile = "";
    felder.forEach((feld, i) => {
        const w1 = start + i * schritt;
        const w2 = w1 + schritt;
        const gesucht = feld.innen === null;
        teile += `<path d="${sektor(m, m, rInnen, rAussen, w1, w2)}" class="fig-rad-aussen"/>`;
        teile += `<path d="${sektor(m, m, rMitte, rInnen, w1, w2)}" class="${gesucht ? "fig-stein-luecke" : "fig-rad-innen"}"/>`;
        teile += beschriftung(m, (rInnen + rAussen) / 2, (w1 + w2) / 2, String(feld.aussen), "fig-text");
        teile += beschriftung(m, (rMitte + rInnen) / 2, (w1 + w2) / 2, gesucht ? "?" : String(feld.innen), gesucht ? "fig-text-marke" : "fig-text");
    });
    for (const radius of [rMitte, rInnen, rAussen]) {
        teile += `<circle cx="${m}" cy="${m}" r="${radius}" class="fig-linie" fill="none" stroke-width="2.5"/>`;
    }
    for (let i = 0; i < felder.length; i++) {
        const winkel = start + i * schritt;
        const [x1, y1] = punkt(m, m, rMitte, winkel);
        const [x2, y2] = punkt(m, m, rAussen, winkel);
        teile += `<line x1="${r(x1)}" y1="${r(y1)}" x2="${r(x2)}" y2="${r(y2)}" class="fig-linie" stroke-width="2.5"/>`;
    }
    teile += `<circle cx="${m}" cy="${m}" r="${rMitte}" class="fig-rad-mitte"/>`;
    teile += `<circle cx="${m}" cy="${m}" r="${rMitte}" class="fig-linie" fill="none" stroke-width="2.5"/>`;
    teile += `<text x="${m}" y="${m + 10}" class="fig-rad-text" text-anchor="middle" font-size="30">${mitte}</text>`;
    return huelle(2 * m, 2 * m, teile);
}
/** Punkt auf einem Kreis um (cx, cy). */
function punkt(cx, cy, radius, winkel) {
    return [cx + Math.cos(winkel) * radius, cy + Math.sin(winkel) * radius];
}
function beschriftung(m, radius, winkel, text, klasse) {
    const [x, y] = punkt(m, m, radius, winkel);
    return `<text x="${r(x)}" y="${r(y + 7)}" class="${klasse}" text-anchor="middle" font-size="20">${text}</text>`;
}
/** Ringausschnitt zwischen zwei Radien und zwei Winkeln. */
function sektor(cx, cy, rI, rA, w1, w2) {
    const [ax1, ay1] = punkt(cx, cy, rA, w1);
    const [ax2, ay2] = punkt(cx, cy, rA, w2);
    const [ix2, iy2] = punkt(cx, cy, rI, w2);
    const [ix1, iy1] = punkt(cx, cy, rI, w1);
    const gross = w2 - w1 > Math.PI ? 1 : 0;
    return (`M${r(ax1)},${r(ay1)} A${rA},${rA} 0 ${gross} 1 ${r(ax2)},${r(ay2)} ` +
        `L${r(ix2)},${r(iy2)} A${rI},${rI} 0 ${gross} 0 ${r(ix1)},${r(iy1)} Z`);
}
/* ------------------------------------------------------- Rechentabellen */
/**
 * Additions- oder Subtraktionstabelle mit einem markierten Feld. Die übrigen
 * Felder bleiben leer – gefragt ist immer genau eine Zelle.
 */
export function rechentabelle(zeichen, zeilen, spalten, markiert) {
    const zelleBreite = 58;
    const zelleHoehe = 42;
    const breite = (spalten.length + 1) * zelleBreite;
    const hoehe = (zeilen.length + 1) * zelleHoehe;
    const zelle = (x, y, klasse, text, textKlasse) => `<rect x="${x}" y="${y}" width="${zelleBreite}" height="${zelleHoehe}" class="${klasse}"/>` +
        `<rect x="${x}" y="${y}" width="${zelleBreite}" height="${zelleHoehe}" class="fig-linie" fill="none" stroke-width="2"/>` +
        (text
            ? `<text x="${x + zelleBreite / 2}" y="${y + zelleHoehe / 2 + 7}" class="${textKlasse}" text-anchor="middle" font-size="20">${text}</text>`
            : "");
    let teile = zelle(0, 0, "fig-tabelle-kopf", zeichen, "fig-text");
    spalten.forEach((wert, s) => {
        teile += zelle((s + 1) * zelleBreite, 0, "fig-tabelle-kopf", String(wert), "fig-text");
    });
    zeilen.forEach((wert, z) => {
        teile += zelle(0, (z + 1) * zelleHoehe, "fig-tabelle-kopf", String(wert), "fig-text");
        spalten.forEach((_, s) => {
            const istMarkiert = markiert[0] === z && markiert[1] === s;
            teile += zelle((s + 1) * zelleBreite, (z + 1) * zelleHoehe, istMarkiert ? "fig-stein-luecke" : "fig-tabelle-feld", istMarkiert ? "?" : "", "fig-text-marke");
        });
    });
    return huelle(breite, hoehe, teile);
}
/* -------------------------------------------------------- Rechenkästen */
/**
 * Rechenkasten: vier Zahlen in einem 2×2-Feld, daneben das Fähnchen mit der
 * Summe. `null` markiert das gesuchte Feld – es darf immer nur eines fehlen.
 */
export function rechenkasten(werte, summe) {
    const zelle = 72;
    const hoehe = 54;
    const oben = 26;
    const gitterBreite = zelle * 2;
    const fahneBreite = 62;
    const breite = gitterBreite + fahneBreite + 6;
    let teile = "";
    werte.slice(0, 4).forEach((wert, i) => {
        const x = (i % 2) * zelle;
        const y = oben + Math.floor(i / 2) * hoehe;
        const gesucht = wert === null;
        teile +=
            `<rect x="${x}" y="${y}" width="${zelle}" height="${hoehe}" class="${gesucht ? "fig-stein-luecke" : "fig-kasten"}"/>` +
                `<rect x="${x}" y="${y}" width="${zelle}" height="${hoehe}" class="fig-linie" fill="none" stroke-width="2.5"/>` +
                `<text x="${x + zelle / 2}" y="${y + hoehe / 2 + 8}" class="${gesucht ? "fig-text-marke" : "fig-text"}" text-anchor="middle" font-size="23">${gesucht ? "?" : wert}</text>`;
    });
    const fahneX = gitterBreite + 6;
    const gesuchteSumme = summe === null;
    teile +=
        `<path d="M${fahneX},0 L${fahneX + fahneBreite},0 L${fahneX + fahneBreite},40 L${fahneX},40 Z" class="${gesuchteSumme ? "fig-stein-luecke" : "fig-fahne"}"/>` +
            `<path d="M${fahneX},0 L${fahneX + fahneBreite},0 L${fahneX + fahneBreite},40 L${fahneX},40 Z" class="fig-linie" fill="none" stroke-width="2.5"/>` +
            `<text x="${fahneX + fahneBreite / 2}" y="${27}" class="${gesuchteSumme ? "fig-text-marke" : "fig-text"}" text-anchor="middle" font-size="22">${gesuchteSumme ? "?" : summe}</text>`;
    return huelle(breite, oben + hoehe * 2, teile);
}
/* ------------------------------------------------------- Rechendreiecke */
/**
 * Rechendreieck: drei Zahlen INNEN, drei Kästchen AUSSEN an den Seiten. Jedes
 * Außenkästchen ist die Summe der beiden Innenzahlen, die an seiner Seite
 * liegen.
 *
 * Die Reihenfolge ist überall dieselbe: innen [oben, links, rechts], außen
 * [links (oben+links), rechts (oben+rechts), unten (links+rechts)].
 *
 * `null` heißt „steht nicht da“ – wie im Heft dürfen mehrere Felder leer sein.
 * Das GESUCHTE Feld ist ein anderes: Nur es trägt ein Fragezeichen und ist
 * hervorgehoben. Ohne diese Unterscheidung stünden bei mehreren leeren Feldern
 * mehrere Fragezeichen da, und das Kind wüsste nicht, welches gemeint ist.
 */
export function rechendreieck(innen, aussen, gesucht) {
    const A = [165, 40]; // Spitze
    const B = [50, 235]; // unten links
    const C = [280, 235]; // unten rechts
    const mitte = [165, 170];
    // Die drei Innenfelder liegen zwischen Mitte und je einer Ecke …
    const innenOrte = [
        [165, 112],
        [118, 198],
        [212, 198],
    ];
    // … die Außenkästchen jeweils vor „ihrer“ Seite.
    const aussenOrte = [
        [52, 108],
        [278, 108],
        [165, 285],
    ];
    const dreieck = `<path d="M${A[0]},${A[1]} L${C[0]},${C[1]} L${B[0]},${B[1]} Z" class="fig-flaeche"/>` +
        `<path d="M${A[0]},${A[1]} L${C[0]},${C[1]} L${B[0]},${B[1]} Z" class="fig-linie" fill="none" stroke-width="2.5"/>`;
    // Das Ypsilon von der Mitte zu den Seitenmitten teilt die drei Bereiche.
    const seitenMitten = [
        [(A[0] + B[0]) / 2, (A[1] + B[1]) / 2],
        [(A[0] + C[0]) / 2, (A[1] + C[1]) / 2],
        [(B[0] + C[0]) / 2, (B[1] + C[1]) / 2],
    ];
    const teilung = seitenMitten
        .map(([x, y]) => `<line x1="${mitte[0]}" y1="${mitte[1]}" x2="${x}" y2="${y}" class="fig-linie" stroke-width="2"/>`)
        .join("");
    /*
     * Beschriftung eines Feldes: Zahl, Fragezeichen oder gar nichts. Das
     * Textelement wird IMMER ausgegeben, auch leer – so hat jedes der sechs
     * Felder seinen festen Platz in der Zeichenkette und die Figur lässt sich
     * eindeutig auslesen (der Test rechnet das Dreieck aus dem Bild nach).
     */
    const inhalt = (wert, istGesucht) => istGesucht ? "?" : wert === null ? "" : String(wert);
    const kreise = innen
        .slice(0, 3)
        .map((wert, i) => {
        const [x, y] = innenOrte[i];
        const istGesucht = gesucht.bereich === "innen" && gesucht.feld === i;
        const text = inhalt(wert, istGesucht);
        return (`<circle cx="${x}" cy="${y}" r="25" class="${istGesucht ? "fig-stein-luecke" : "fig-rad-innen"}"/>` +
            `<circle cx="${x}" cy="${y}" r="25" class="fig-linie" fill="none" stroke-width="2.5"/>` +
            `<text x="${x}" y="${y + 8}" class="${istGesucht ? "fig-text-marke" : "fig-text"}" text-anchor="middle" font-size="23">${text}</text>`);
    })
        .join("");
    const kaesten = aussen
        .slice(0, 3)
        .map((wert, i) => {
        const [x, y] = aussenOrte[i];
        const istGesucht = gesucht.bereich === "aussen" && gesucht.feld === i;
        const text = inhalt(wert, istGesucht);
        const [bx, by] = [x - 27, y - 19];
        return (`<rect x="${bx}" y="${by}" width="54" height="38" rx="6" class="${istGesucht ? "fig-stein-luecke" : "fig-fahne"}"/>` +
            `<rect x="${bx}" y="${by}" width="54" height="38" rx="6" class="fig-linie" fill="none" stroke-width="2.5"/>` +
            `<text x="${x}" y="${y + 8}" class="${istGesucht ? "fig-text-marke" : "fig-text"}" text-anchor="middle" font-size="22">${text}</text>`);
    })
        .join("");
    return huelle(330, 320, dreieck + teilung + kaesten + kreise);
}
/* --------------------------------------------------------- Zahlenfolgen */
/**
 * Zahlenfolge mit beschrifteten Pfeilen zwischen den Kästchen, wie im Heft.
 * `werte` enthält genau ein `null` – das gesuchte Feld.
 */
export function pfeilfolge(werte, schritte) {
    const kasten = 58;
    const hoehe = 46;
    const luecke = 34;
    const obenRaum = 42;
    const breite = werte.length * kasten + (werte.length - 1) * luecke;
    let teile = "";
    werte.forEach((wert, i) => {
        const x = i * (kasten + luecke);
        const gesucht = wert === null;
        teile +=
            `<rect x="${x}" y="${obenRaum}" width="${kasten}" height="${hoehe}" rx="5" class="${gesucht ? "fig-stein-luecke" : "fig-kasten"}"/>` +
                `<rect x="${x}" y="${obenRaum}" width="${kasten}" height="${hoehe}" rx="5" class="fig-linie" fill="none" stroke-width="2.5"/>` +
                `<text x="${x + kasten / 2}" y="${obenRaum + hoehe / 2 + 8}" class="${gesucht ? "fig-text-marke" : "fig-text"}" text-anchor="middle" font-size="22">${gesucht ? "?" : wert}</text>`;
    });
    schritte.forEach((schritt, i) => {
        const von = i * (kasten + luecke) + kasten;
        const bis = (i + 1) * (kasten + luecke);
        const mitte = (von + bis) / 2;
        teile +=
            `<path d="M${von + 2},${obenRaum + 6} Q${mitte},${obenRaum - 26} ${bis - 8},${obenRaum + 6}" class="fig-pfeil" fill="none"/>` +
                `<polygon points="${bis - 2},${obenRaum + 9} ${bis - 12},${obenRaum + 1} ${bis - 11},${obenRaum + 12}" class="fig-pfeil-spitze"/>` +
                `<text x="${mitte}" y="${obenRaum - 16}" class="fig-pfeil-text" text-anchor="middle" font-size="19">${schritt}</text>`;
    });
    return huelle(breite, obenRaum + hoehe + 4, teile);
}
/* ----------------------------------------------------------- Puzzleteile */
/** Breite und Höhe des Puzzlerechtecks. */
const PUZZLE_BREITE = 180;
const PUZZLE_HOEHE = 120;
/**
 * Zerschneidet ein Rechteck mit einer Treppenlinie in zwei Teile. `hoehen`
 * gibt die Höhe der Schnittlinie je Abschnitt an; `oben` wählt das Teil.
 */
export function puzzleteil(hoehen, oben) {
    const abschnitte = hoehen.length;
    const schritt = PUZZLE_BREITE / abschnitte;
    const schnitt = [];
    hoehen.forEach((h, i) => {
        schnitt.push([i * schritt, h]);
        schnitt.push([(i + 1) * schritt, h]);
    });
    const punkte = oben
        ? [[0, 0], [PUZZLE_BREITE, 0], ...[...schnitt].reverse()]
        : [...schnitt, [PUZZLE_BREITE, PUZZLE_HOEHE], [0, PUZZLE_HOEHE]];
    const p = punkte.map(([x, y]) => `${r(x)},${r(y)}`).join(" ");
    return huelle(PUZZLE_BREITE, PUZZLE_HOEHE, `<polygon points="${p}" class="fig-puzzle"/><polygon points="${p}" class="fig-linie" fill="none" stroke-width="3" stroke-linejoin="round"/>`);
}
/** Zufällige, gut unterscheidbare Schnittlinie für ein Puzzleteil. */
export function puzzleHoehen(zieher, abschnitte = 4) {
    const stufen = [36, 52, 68, 84];
    const hoehen = [];
    for (let i = 0; i < abschnitte; i++) {
        let wert = stufen[Math.floor(zieher() * stufen.length)] ?? 60;
        // Zwei gleiche Stufen hintereinander verschmelzen zu einer geraden Kante.
        while (hoehen.length > 0 && wert === hoehen[hoehen.length - 1]) {
            wert = stufen[Math.floor(zieher() * stufen.length)] ?? 60;
        }
        hoehen.push(wert);
    }
    return hoehen;
}
