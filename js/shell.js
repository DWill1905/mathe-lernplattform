/**
 * App-Shell: Kopfleiste mit Level-Anzeige und die untere Navigation.
 * Die Shell wird bei jedem Routenwechsel aufgefrischt, damit Punkte und
 * Streak überall aktuell sind.
 */
import { el, leeren } from "./dom.js";
import { icon } from "./icons.js";
import { levelInfo } from "./gamification.js";
import { ladeFortschritt } from "./state.js";
const NAVIGATION = [
    { pfad: "#/", titel: "Start", symbol: "haus" },
    { pfad: "#/fortschritt", titel: "Fortschritt", symbol: "diagramm" },
    { pfad: "#/eltern", titel: "Eltern", symbol: "eltern" },
];
export function baueShell(wurzel) {
    leeren(wurzel);
    const kopf = el("header", { class: "kopf", id: "kopf" });
    const inhalt = el("main", { class: "inhalt", id: "inhalt", tabindex: "-1" });
    const fuss = el("nav", { class: "navigation", "aria-label": "Hauptnavigation" });
    wurzel.append(kopf, inhalt, fuss);
    // Einmalig: Fällt das Netz weg oder kommt es zurück, muss die Kopfzeile das
    // sofort zeigen. In `frischeShellAuf()` würden sich die Listener stapeln.
    if (!netzBeobachtet) {
        netzBeobachtet = true;
        window.addEventListener("online", frischeShellAuf);
        window.addEventListener("offline", frischeShellAuf);
    }
    verdrahteSprungmarke(inhalt);
    frischeShellAuf();
    return inhalt;
}
/**
 * Die Sprungmarke setzt den Fokus SELBST, statt über einen Anker zu springen.
 *
 * Über `href="#inhalt"` liefe sie in den Hash-Router: Der bekäme `#inhalt` als
 * Route vorgesetzt, fände dazu keine Ansicht und zeigte „Diese Seite gibt es
 * nicht“ – ausgerechnet dem, der die Sprungmarke braucht. Ein Inline-`onclick`
 * verbietet die CSP, also hängt der Haken hier.
 */
function verdrahteSprungmarke(inhalt) {
    const marke = document.getElementById("sprungmarke");
    if (!marke || marke.dataset["verdrahtet"] === "ja")
        return;
    marke.dataset["verdrahtet"] = "ja";
    marke.addEventListener("click", () => {
        // `tabindex="-1"` am `<main>` macht es fokussierbar, ohne es in die
        // Tab-Reihenfolge zu hängen.
        inhalt.focus();
        inhalt.scrollIntoView({ block: "start" });
    });
}
let netzBeobachtet = false;
/** Kopfzeile und Navigation neu zeichnen (Punkte ändern sich ständig). */
export function frischeShellAuf() {
    const kopf = document.getElementById("kopf");
    const fuss = document.querySelector(".navigation");
    if (!kopf || !fuss)
        return;
    const fortschritt = ladeFortschritt();
    const level = levelInfo(fortschritt.punkte);
    leeren(kopf);
    kopf.append(el("a", { class: "kopf-titel", href: "#/" }, icon("eule", "kopf-symbol"), el("span", { text: "Zahleneule" })), el("div", { class: "kopf-status" }, el("div", { class: "chip chip-level", title: `${fortschritt.punkte} Punkte` }, el("span", { class: "chip-zahl", text: level.stufe }), el("span", { class: "chip-text", text: level.titel })), fortschritt.streakTage > 0 &&
        el("div", { class: "chip chip-streak", title: "Tage hintereinander geübt" }, icon("flamme", "chip-symbol"), el("span", { class: "chip-zahl", text: fortschritt.streakTage })), 
    // `navigator.onLine` ist bewusst nur ein Hinweis, keine Sperre: Die App
    // arbeitet online wie offline gleich weiter.
    !navigator.onLine &&
        el("div", {
            class: "chip chip-offline",
            role: "status",
            title: "Kein Internet – die Zahleneule funktioniert trotzdem",
        }, icon("offline", "chip-symbol"), el("span", { class: "chip-text", text: "Offline" }))));
    const aktuell = location.hash === "" ? "#/" : location.hash;
    leeren(fuss);
    for (const punkt of NAVIGATION) {
        const istAktiv = punkt.pfad === "#/" ? aktuell === "#/" : aktuell.startsWith(punkt.pfad);
        fuss.appendChild(el("a", {
            class: `nav-punkt${istAktiv ? " nav-aktiv" : ""}`,
            href: punkt.pfad,
            "aria-current": istAktiv ? "page" : undefined,
        }, icon(punkt.symbol, "nav-symbol"), el("span", { class: "nav-titel", text: punkt.titel })));
    }
}
