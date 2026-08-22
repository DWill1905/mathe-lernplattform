/**
 * Vergleich einer Antwort mit der Lösung. Bewusst ohne DOM-Zugriff und
 * deshalb direkt testbar – in der Ansicht stand er vorher als private
 * Funktion und ließ sich gar nicht prüfen.
 */
/** Groß-/Kleinschreibung und Leerzeichen entscheiden nie über richtig/falsch. */
export function normalisiere(wert) {
    return wert.trim().replace(/\s+/g, " ").toLowerCase();
}
/**
 * Vergleich einer selbst getippten Rechnung wie `3 − 2 = 1`.
 *
 * Leerzeichen und die Schreibweise des Minuszeichens dürfen nie über
 * richtig/falsch entscheiden: Auf einer Tastatur liegt der Bindestrich, in der
 * Aufgabe steht das echte Minus (U+2212).
 *
 * Beim Plus zählt auch die vertauschte Reihenfolge – `3 + 4 = 7` ist dieselbe
 * Hilfsaufgabe wie `4 + 3 = 7`, und ein Kind, das das erkennt, hat die Sache
 * eher besser verstanden.
 */
export function rechnungPasst(eingabe, loesung) {
    const a = glatt(eingabe);
    const b = glatt(loesung);
    if (a === b)
        return true;
    const teile = b.match(/^(\d+)\+(\d+)=(\d+)$/);
    return teile ? a === `${teile[2]}+${teile[1]}=${teile[3]}` : false;
}
function glatt(wert) {
    return wert
        .replace(/\s+/g, "")
        .replace(/[-–—]/g, "−")
        .replace(/[*x×]/gi, "·");
}
