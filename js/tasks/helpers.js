/** Zahleneingabe – Lösungen sind immer nicht-negative ganze Zahlen. */
export function zahlfeld(einheit) {
    return einheit ? { art: "zahl", einheit } : { art: "zahl" };
}
/**
 * Auswahlfeld aus der richtigen Antwort und passenden Ablenkern. Doppelte
 * Einträge fallen heraus, die Reihenfolge wird gemischt.
 */
export function auswahlfeld(rng, richtig, ablenker, anzahl = 4) {
    const menge = new Set([richtig]);
    for (const eintrag of rng.shuffle(ablenker)) {
        if (menge.size >= anzahl)
            break;
        menge.add(eintrag);
    }
    return { art: "auswahl", optionen: rng.shuffle([...menge]) };
}
/** Nachbarzahlen als Ablenker – nie negativ, nie die Lösung selbst. */
export function zahlAblenker(richtig, spanne = 10, max = Infinity) {
    const kandidaten = new Set();
    for (let d = 1; d <= spanne; d++) {
        if (richtig - d >= 0)
            kandidaten.add(richtig - d);
        if (richtig + d <= max)
            kandidaten.add(richtig + d);
    }
    kandidaten.delete(richtig);
    return [...kandidaten].map(String);
}
/** Kleine Namensliste für Sachaufgaben. */
export const NAMEN = [
    "Mia",
    "Leon",
    "Emma",
    "Ben",
    "Lina",
    "Paul",
    "Ida",
    "Jonas",
    "Sofia",
    "Elias",
    "Marie",
    "Noah",
];
/**
 * Der Wesfall eines Namens: „Mias Pizza“, aber „Jonas’ Pizza“. Namen auf
 * s, ß, x oder z bekommen im Deutschen nur einen Apostroph – ohne diese
 * Prüfung stand „Jonass Pizza“ in der Aufgabe.
 */
export function wesfall(name) {
    return /[sßxz]$/.test(name) ? `${name}’` : `${name}s`;
}
/** Zwei verschiedene Namen. */
export function zweiNamen(rng) {
    const [a, b] = rng.shuffle(NAMEN);
    return [a, b];
}
/** Zahl im deutschen Format (relevant erst ab 1000, aber einheitlich). */
export function de(zahl) {
    return zahl.toLocaleString("de-DE");
}
/** Cent-Betrag als „3 € 40 ct“ bzw. „40 ct“. */
export function geldText(cent) {
    const euro = Math.floor(cent / 100);
    const rest = cent % 100;
    if (euro === 0)
        return `${rest} ct`;
    if (rest === 0)
        return `${euro} €`;
    return `${euro} € ${rest} ct`;
}
/** Uhrzeit als „14:05“. */
export function uhrText(stunde, minute) {
    return `${stunde}:${String(minute).padStart(2, "0")}`;
}
