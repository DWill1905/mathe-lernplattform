/**
 * Das Sammelbild in groß: das Haus, das sich mit jedem fünften richtigen
 * Ergebnis weiter einrichtet, und die Liste der schon gesammelten Sticker.
 */
import { el, svgBild } from "../dom.js";
import { icon } from "../icons.js";
import { fehlendeSticker } from "../gamification.js";
import { RICHTIGE_PRO_STICKER, STICKER, STICKER_ANZAHL, sammelbild } from "../sammelbild.js";
import { ladeFortschritt } from "../state.js";
export const zeige = (ziel) => {
    const fortschritt = ladeFortschritt();
    const geklebt = new Set(fortschritt.sticker);
    const fehlt = fehlendeSticker(fortschritt).length;
    const bisZumNaechsten = RICHTIGE_PRO_STICKER - fortschritt.stickerZaehler;
    const bild = el("section", { class: "karte" }, el("h1", { class: "seiten-titel", text: "Dein Sammelbild" }), svgBild(sammelbild([...geklebt]), `Ein Haus im Wald mit ${geklebt.size} von ${STICKER_ANZAHL} eingeklebten Stickern`), el("p", { class: "sammelbild-stand" }, icon("haus", "rueckmeldung-symbol"), el("span", {
        text: fehlt === 0
            ? `Fertig! Alle ${STICKER_ANZAHL} Sticker kleben im Haus.`
            : `${geklebt.size} von ${STICKER_ANZAHL} Stickern`,
    })), el("p", {
        class: "sammelbild-hinweis",
        text: fehlt === 0
            ? "Du hast das ganze Haus eingerichtet. Die Eule sitzt auf dem Dach."
            : bisZumNaechsten === 1
                ? "Noch eine richtige Aufgabe bis zum nächsten Sticker."
                : `Noch ${bisZumNaechsten} richtige Aufgaben bis zum nächsten Sticker.`,
    }));
    const liste = el("section", { class: "karte" }, el("h2", { class: "abschnitt-titel", text: "Alle Sticker" }), el("ul", { class: "stickerliste" }, ...STICKER.map((eintrag) => el("li", { class: `stickerliste-punkt${geklebt.has(eintrag.nummer) ? "" : " stickerliste-offen"}` }, el("span", { class: "stickerliste-name", text: eintrag.name }), 
    // Fehlende Sticker bleiben ohne Zusatztext: Auf einem schmalen
    // Telefon quetschte ein „fehlt noch“ den Namen aus der Karte.
    geklebt.has(eintrag.nummer) ? icon("haken", "stickerliste-haken") : null))));
    ziel.replaceChildren(bild, liste);
};
