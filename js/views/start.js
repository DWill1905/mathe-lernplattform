import { el, svgBild } from "../dom.js";
import { icon } from "../icons.js";
import { themenbild } from "../bilder.js";
import { empfehlung, levelInfo } from "../gamification.js";
import { ladeFortschritt, speichereFortschritt } from "../state.js";
import { HEFT_THEMEN, WEITERE_THEMEN, thema } from "../topics.js";
/** Drei Sterne, davon `anzahl` gefüllt – mit Klartext für Screenreader. */
export function sterneAnzeige(anzahl) {
    const reihe = el("span", { class: "sterne", role: "img", "aria-label": `${anzahl} von 3 Sternen` });
    for (let i = 1; i <= 3; i++) {
        reihe.appendChild(icon(i <= anzahl ? "stern" : "sternLeer", i <= anzahl ? "stern-voll" : "stern-leer"));
    }
    return reihe;
}
export const zeige = (ziel) => {
    const fortschritt = ladeFortschritt();
    const level = levelInfo(fortschritt.punkte);
    const naechstes = thema(empfehlung(fortschritt));
    /*
     * Die Begrüßung ist bewusst schmal: Sie stand früher als hohe Karte über
     * allem und schob die eigentliche Auswahl aus dem Bild. Level und Punkte
     * sind Beiwerk, die Themen sind die Hauptsache.
     */
    const begruessung = el("section", { class: "karte karte-begruessung" }, el("div", { class: "begruessung-zeile" }, el("h1", {
        class: "begruessung-titel",
        text: fortschritt.name ? `Hallo ${fortschritt.name}!` : "Hallo!",
    }), el("span", { class: "marke marke-level", text: `Level ${level.stufe}` })), el("div", {
        class: "balken",
        role: "progressbar",
        "aria-valuemin": "0",
        "aria-valuemax": "100",
        "aria-valuenow": String(Math.round(level.anteil * 100)),
        "aria-label": `Fortschritt bis Level ${level.stufe + 1}`,
    }, el("div", { class: "balken-fuellung", stil: { width: `${Math.round(level.anteil * 100)}%` } })), el("p", { class: "level-rest", text: `${fortschritt.punkte} Punkte · ${level.titel}` }));
    if (!fortschritt.name)
        begruessung.appendChild(namensFeld());
    /** Ein großer Bildknopf – Bild oben, ein kurzer Titel darunter. */
    const bildknopf = (ziel_, bild, titel, klasse) => el("a", { class: `bildknopf ${klasse}`, href: ziel_ }, el("span", { class: "bildknopf-bild" }, svgBild(themenbild(bild), "")), el("span", { class: "bildknopf-titel", text: titel }));
    const schnellstart = el("section", { class: "schnellstart" }, bildknopf("#/uebung/mix", "mix", "Gemischt", "bildknopf-haupt"), bildknopf("#/puzzle", "puzzle", "Puzzle", ""), bildknopf("#/rechenmeister", "meister", "Auf Zeit", ""));
    const weiter = el("a", { class: "weiterknopf", href: `#/uebung/${naechstes.id}` }, el("span", { class: "weiterknopf-bild" }, svgBild(themenbild(naechstes.id), "")), el("span", { class: "weiterknopf-text" }, el("span", { class: "weiterknopf-oben", text: "Mach weiter mit" }), el("span", { class: "weiterknopf-titel", text: naechstes.titel })), icon("pfeil", "weiterknopf-pfeil"));
    /*
     * Themenkacheln: großes Bild, kurzer Titel, Sterne. Die frühere
     * Beschreibungszeile ist weg – drei Zeilen Fließtext je Kachel waren für ein
     * Kind der 2. Klasse, das gerade erst liest, nur Lärm. Der Text lebt als
     * `title` weiter, damit die Information nicht verloren geht.
     */
    const kachelgitter = (liste, klein = false) => {
        const kacheln = el("div", { class: `kacheln${klein ? " kacheln-klein" : ""}` });
        for (const eintrag of liste) {
            const stand = fortschritt.themen[eintrag.id];
            kacheln.appendChild(el("a", {
                class: `kachel kachel-${eintrag.farbe}`,
                href: `#/uebung/${eintrag.id}`,
                title: eintrag.kurz,
                "aria-label": `${eintrag.titel}: ${eintrag.kurz}. Stufe ${stand.stufe}, ${stand.sterne} von 3 Sternen`,
            }, el("span", { class: "kachel-bild" }, svgBild(themenbild(eintrag.id), "")), el("span", { class: "kachel-titel", text: eintrag.titel }), el("span", { class: "kachel-fuss" }, el("span", { class: "marke", text: `Stufe ${stand.stufe}` }), sterneAnzeige(stand.sterne))));
        }
        return kacheln;
    };
    ziel.replaceChildren(begruessung, schnellstart, weiter, el("h2", { class: "abschnitt-titel", text: "Aus dem Übungsheft" }), kachelgitter(HEFT_THEMEN), el("h2", { class: "abschnitt-titel abschnitt-titel-weit", text: "Weitere Themen" }), kachelgitter(WEITERE_THEMEN, true));
};
function namensFeld() {
    const eingabe = el("input", {
        class: "eingabe",
        type: "text",
        maxlength: "20",
        placeholder: "Dein Name",
        "aria-label": "Dein Name",
    });
    const speichern = () => {
        const name = eingabe.value.trim();
        if (!name)
            return;
        const fortschritt = ladeFortschritt();
        fortschritt.name = name.slice(0, 20);
        speichereFortschritt(fortschritt);
        location.reload();
    };
    eingabe.addEventListener("keydown", (ereignis) => {
        if (ereignis.key === "Enter")
            speichern();
    });
    return el("form", {
        class: "namensfeld",
        onsubmit: (ereignis) => {
            ereignis.preventDefault();
            speichern();
        },
    }, el("label", { class: "namensfeld-text", text: "Wie heißt du?" }), el("div", { class: "namensfeld-zeile" }, eingabe, el("button", { class: "knopf", type: "submit", text: "Los" })));
}
