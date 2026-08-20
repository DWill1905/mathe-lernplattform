/**
 * App-Shell: Kopfleiste mit Level-Anzeige und die untere Navigation.
 * Die Shell wird bei jedem Routenwechsel aufgefrischt, damit Punkte und
 * Streak überall aktuell sind.
 */
import { el, leeren } from "./dom.js";
import { levelInfo } from "./gamification.js";
import { ladeFortschritt } from "./state.js";
const NAVIGATION = [
    { pfad: "#/", titel: "Start", symbol: "🏠" },
    { pfad: "#/fortschritt", titel: "Fortschritt", symbol: "📈" },
    { pfad: "#/eltern", titel: "Eltern", symbol: "👨‍👩‍👧" },
];
export function baueShell(wurzel) {
    leeren(wurzel);
    const kopf = el("header", { class: "kopf", id: "kopf" });
    const inhalt = el("main", { class: "inhalt", id: "inhalt", tabindex: "-1" });
    const fuss = el("nav", { class: "navigation", "aria-label": "Hauptnavigation" });
    wurzel.append(kopf, inhalt, fuss);
    frischeShellAuf();
    return inhalt;
}
/** Kopfzeile und Navigation neu zeichnen (Punkte ändern sich ständig). */
export function frischeShellAuf() {
    const kopf = document.getElementById("kopf");
    const fuss = document.querySelector(".navigation");
    if (!kopf || !fuss)
        return;
    const fortschritt = ladeFortschritt();
    const level = levelInfo(fortschritt.punkte);
    leeren(kopf);
    kopf.append(el("a", { class: "kopf-titel", href: "#/" }, el("span", { class: "kopf-symbol", "aria-hidden": "true", text: "🦉" }), el("span", { text: "Mathe-Schule" })), el("div", { class: "kopf-status" }, el("div", { class: "chip chip-level", title: `${fortschritt.punkte} Punkte` }, el("span", { class: "chip-zahl", text: level.stufe }), el("span", { class: "chip-text", text: level.titel })), fortschritt.streakTage > 0 &&
        el("div", { class: "chip chip-streak", title: "Tage hintereinander geübt" }, el("span", { "aria-hidden": "true", text: "🔥" }), el("span", { class: "chip-zahl", text: fortschritt.streakTage }))));
    const aktuell = location.hash === "" ? "#/" : location.hash;
    leeren(fuss);
    for (const punkt of NAVIGATION) {
        const istAktiv = punkt.pfad === "#/" ? aktuell === "#/" : aktuell.startsWith(punkt.pfad);
        fuss.appendChild(el("a", {
            class: `nav-punkt${istAktiv ? " nav-aktiv" : ""}`,
            href: punkt.pfad,
            "aria-current": istAktiv ? "page" : undefined,
        }, el("span", { class: "nav-symbol", "aria-hidden": "true", text: punkt.symbol }), el("span", { class: "nav-titel", text: punkt.titel })));
    }
}
