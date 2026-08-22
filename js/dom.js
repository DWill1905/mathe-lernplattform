/**
 * Minimaler Helfer zum deklarativen DOM-Bauen – kein Framework, keine
 * Laufzeit-Abhängigkeit. Text landet immer über `createTextNode`, Attribute
 * über `setAttribute`: So kann kein gespeicherter Wert Markup einschleusen.
 */
export function el(tag, props = {}, ...kinder) {
    const node = document.createElement(tag);
    for (const [schluessel, wert] of Object.entries(props)) {
        if (wert === null || wert === undefined || wert === false)
            continue;
        if (schluessel === "class") {
            node.className = String(wert);
        }
        else if (schluessel === "stil") {
            for (const [eigenschaft, cssWert] of Object.entries(wert)) {
                node.style.setProperty(eigenschaft, cssWert);
            }
        }
        else if (schluessel === "text") {
            node.appendChild(document.createTextNode(String(wert)));
        }
        else if (schluessel.startsWith("on") && typeof wert === "function") {
            node.addEventListener(schluessel.slice(2).toLowerCase(), wert);
        }
        else if (wert === true) {
            node.setAttribute(schluessel, "");
        }
        else {
            node.setAttribute(schluessel, String(wert));
        }
    }
    anhaengen(node, kinder);
    return node;
}
export function anhaengen(ziel, kinder) {
    for (const kind of kinder) {
        if (kind === null || kind === undefined || kind === false)
            continue;
        ziel.appendChild(typeof kind === "object" ? kind : document.createTextNode(String(kind)));
    }
}
/** Ersetzt den kompletten Inhalt eines Knotens. */
export function leeren(node) {
    while (node.firstChild)
        node.removeChild(node.firstChild);
}
/**
 * Setzt ein Symbol aus `icons.ts` ein. Wie `svgBild()` nur für konstante,
 * projekteigene SVG-Zeichenketten – niemals für gespeicherte Daten.
 */
export function svgSymbol(quelle, klasse = "symbol") {
    const huelle = el("span", { class: klasse, "aria-hidden": "true" });
    huelle.innerHTML = quelle;
    return huelle;
}
/**
 * Die barrierefreien Attribute eines eingesetzten Bildes.
 *
 * Ohne Beschriftung ist das Bild SCHMUCK und muss vor der Vorlesehilfe
 * verschwinden: `role="img"` mit leerem `aria-label` meldet stattdessen ein
 * namenloses Bild, und auf der Startseite steht neben jedem Motiv ohnehin
 * schon der Titel – ein Kind hörte dort dreizehnmal „Grafik“ vor dem Namen.
 *
 * Rein und ohne DOM-Zugriff, damit die Entscheidung prüfbar bleibt.
 */
export function bildAttribute(beschriftung) {
    const beschriftet = beschriftung.trim().length > 0;
    return beschriftet
        ? { class: "bild", role: "img", "aria-label": beschriftung }
        : { class: "bild", "aria-hidden": "true" };
}
/**
 * Setzt eine SVG-Zeichenkette als Bild ein. Die Zeichenketten stammen
 * ausschließlich aus `figures.ts` (eigener, konstanter Code) – niemals aus
 * gespeicherten oder eingegebenen Daten.
 *
 * Eine leere `beschriftung` heißt ausdrücklich „nur Schmuck“ (siehe
 * `bildAttribute`), nicht „Beschriftung vergessen“.
 */
export function svgBild(quelle, beschriftung) {
    const huelle = el("figure", bildAttribute(beschriftung));
    huelle.innerHTML = quelle;
    return huelle;
}
