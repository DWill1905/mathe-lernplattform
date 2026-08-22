/**
 * Der Übungsmodus – Herzstück der Anwendung.
 *
 * Eine Runde besteht aus zehn Aufgaben. Nach jeder Antwort gibt es sofort
 * Rückmeldung: Richtiges wird kurz bestätigt und läuft automatisch weiter,
 * bei einem Fehler bleibt der Rechenweg stehen, bis das Kind weiterklickt.
 *
 * Aufgaben mit einer `vorstufe` laufen in zwei Schritten: Erst rechnet das
 * Kind die Hilfsaufgabe selbst (das gibt ein Herz), danach steht sie als
 * Hinweis über der eigentlichen Aufgabe. Im Rechenmeister entfällt dieser
 * Schritt – dort zählt die Zeit.
 */
import { el, svgBild } from "../dom.js";
import { icon } from "../icons.js";
import { ERFOLGE, lobText, schwerpunkte, merkeMeisterErgebnis, werteMixAus, werteRundeAus, zeitText, } from "../gamification.js";
import { mulberry32, zufallsSeed } from "../random.js";
import { PUZZLE_TEILE, puzzleBild, puzzleStaende, waehleMotiv, } from "../bilder.js";
import { raeumeJubel, waehleJubel, zeigeJubel } from "../jubel.js";
import { normalisiere, rechnungPasst } from "../antwort.js";
import { aufgabeSprechen, schweig, sprich, vorlesenAn, vorlesenMoeglich } from "../vorlesen.js";
import { gleicheAb } from "../sync.js";
import { ladeFortschritt, merkeGestellteAufgaben } from "../state.js";
import { MEISTERLAENGE, MEISTER_THEMEN, RUNDENLAENGE, aufgabenSchluessel, gemischteRunde, runde, } from "../tasks/index.js";
import { THEMEN, istThemaId, thema } from "../topics.js";
import { pfadTeile } from "../router.js";
import { sterneAnzeige } from "./start.js";
/**
 * Wohin der Fokus nach dem nächsten Neuzeichnen soll.
 *
 * `replaceChildren()` wirft den alten Baum weg – mit ihm den gerade
 * angeklickten Knopf und damit den Fokus. Der landet dann auf `<body>`, und
 * wer mit der Tastatur bedient, muss sich von ganz oben durch Sprungmarke,
 * Kopfzeile und Navigation zurücktabben, um „Weiter" zu erreichen. Nach einer
 * falschen Antwort ist das der Moment, in dem der Rechenweg erklärt wird.
 *
 * Der Fokus geht bewusst auf die RÜCKMELDUNG und nicht auf den Weiter-Knopf:
 * Ein Kind hält eine Taste gern länger gedrückt, und ein fokussierter Knopf
 * würde bei der Wiederholung sofort auslösen – die Erklärung wäre weg, bevor
 * sie gelesen ist.
 */
let fokusZiel = null;
function setzeFokus() {
    const ziel = fokusZiel;
    fokusZiel = null;
    ziel?.focus();
}
/**
 * Welche Aufgabe zuletzt vorgelesen wurde. Ohne diesen Merker läse die
 * automatische Vorlesehilfe bei JEDEM Neuzeichnen los – also bei jeder
 * getippten Ziffer.
 */
let zuletztVorgelesen = "";
/** Aufräumhaken der laufenden Runde – Timer und Tastatur dürfen nie überleben. */
let timer = null;
let uhrTakt = null;
let tastatur = null;
function aufraeumen() {
    if (timer !== null) {
        clearTimeout(timer);
        timer = null;
    }
    if (uhrTakt !== null) {
        clearInterval(uhrTakt);
        uhrTakt = null;
    }
    if (tastatur) {
        document.removeEventListener("keydown", tastatur);
        tastatur = null;
    }
}
/** Routen, hinter denen diese Ansicht steckt (siehe `ANSICHTEN` in `app.ts`). */
const EIGENE_ROUTEN = new Set(["uebung", "rechenmeister", "puzzle"]);
/**
 * Markiert am `<body>`, dass gerade geübt wird. Auf sehr flachen Bildschirmen
 * (Handy im Querformat) blendet `style.css` daraufhin App-Kopf und Navigation
 * aus – sonst müsste das Kind mitten in der Aufgabe scrollen, um die
 * OK-Taste zu erreichen. Zurück geht es dort über „← Abbrechen“.
 */
const LAEUFT = "uebung-laeuft";
/**
 * Wer die Übung verlässt, darf ihre Nachwirkungen nicht mitnehmen: Ohne diesen
 * Haken bliebe der Tastatur-Listener am `document` hängen (auf der Startseite
 * würde eine Ziffer die Übung zurückholen und Eingabefelder schluckten
 * Zifferntasten) und ein noch laufender „Weiter“-Timer würde die gerade
 * geöffnete Seite überschreiben. `zeige()` räumt nur auf, wenn die Ansicht
 * selbst wieder aufgerufen wird – deshalb hier zusätzlich beim Routenwechsel.
 */
window.addEventListener("hashchange", () => {
    if (EIGENE_ROUTEN.has(pfadTeile()[0] ?? "start"))
        return;
    aufraeumen();
    // Nur hier, nicht in `aufraeumen()`: Das läuft bei JEDEM Neuzeichnen, und
    // die Rückmeldung zeichnet direkt nach dem Jubel neu – der Jubel hätte sich
    // im selben Moment selbst gelöscht. Sonst schwebte ein fliegendes Schwein
    // über der Startseite weiter.
    raeumeJubel();
    // Eine Stimme, die nach dem Abbrechen weiterredet, wäre gespenstisch.
    schweig();
    document.body.classList.remove(LAEUFT);
});
export const zeige = (ziel, parameter) => {
    aufraeumen();
    document.body.classList.add(LAEUFT);
    const ersteRoute = parameter[0];
    const wunsch = ersteRoute === "rechenmeister" ? "meister" : ersteRoute === "puzzle" ? "puzzle" : (parameter[1] ?? "mix");
    const sitzung = baueSitzung(wunsch);
    if (!sitzung) {
        ziel.replaceChildren(el("section", { class: "karte karte-mitte" }, el("h1", { text: "Dieses Thema kenne ich nicht" }), el("a", { class: "knopf knopf-gross", href: "#/", text: "Zur Startseite" })));
        return;
    }
    zeichne(ziel, sitzung);
};
/**
 * Baut eine frische Runde zum gewünschten Thema. Die Stufe kommt immer aus
 * dem gespeicherten Fortschritt – so übt ein Kind nach einem Aufstieg sofort
 * auf der neuen Stufe weiter, auch beim direkten „Nochmal üben“.
 */
function baueSitzung(wunsch) {
    // Eine frische Runde fängt beim Vorlesen wieder von vorne an.
    zuletztVorgelesen = "";
    const sitzung = baueRunde(wunsch);
    // Was gerade gestellt wurde, meidet die nächste Runde.
    if (sitzung)
        merkeGestellteAufgaben(sitzung.eintraege.map((e) => aufgabenSchluessel(e.aufgabe)));
    return sitzung;
}
function baueRunde(wunsch) {
    const fortschritt = ladeFortschritt();
    const rng = mulberry32(zufallsSeed());
    // Wo es zuletzt hakte, kommt gezielt häufiger dran.
    const wiederholen = schwerpunkte(fortschritt);
    // Die Aufgaben der letzten Runden – die Ziehung geht ihnen aus dem Weg.
    const zuletzt = new Set(fortschritt.letzteAufgaben);
    if (wunsch === "puzzle") {
        // Das Puzzle ist eine ganz normale gemischte Runde – nur mit einem Bild
        // darüber. Dadurch gelten Stufen, Schwerpunkte und das Gedächtnis auch hier.
        const stufen = {};
        for (const t of THEMEN)
            stufen[t.id] = fortschritt.themen[t.id].stufe;
        return neueSitzung(null, 2, gemischteRunde(rng, stufen, PUZZLE_TEILE, undefined, wiederholen, zuletzt), false, waehleMotiv(zufallsSeed()));
    }
    if (wunsch === "mix" || wunsch === "meister") {
        const stufen = {};
        for (const t of THEMEN)
            stufen[t.id] = fortschritt.themen[t.id].stufe;
        if (wunsch === "meister") {
            // Der Rechenmeister bleibt bewusst ungewichtet: Seine Bestzeit ist nur
            // vergleichbar, wenn die Aufgaben nicht mit wachsender Fehlerhistorie
            // immer schwerer werden.
            return neueSitzung(null, 2, gemischteRunde(rng, stufen, MEISTERLAENGE, MEISTER_THEMEN, new Set(), zuletzt), true);
        }
        return neueSitzung(null, 2, gemischteRunde(rng, stufen, RUNDENLAENGE, undefined, wiederholen, zuletzt));
    }
    if (istThemaId(wunsch)) {
        const stufe = fortschritt.themen[wunsch].stufe;
        return neueSitzung(wunsch, stufe, runde(wunsch, rng, stufe, RUNDENLAENGE, wiederholen, zuletzt).map((aufgabe) => ({
            thema: wunsch,
            aufgabe,
        })));
    }
    return null;
}
function neueSitzung(themaId, stufe, eintraege, meister = false, puzzle = null) {
    const sitzung = {
        themaId,
        meister,
        puzzle,
        jubelZaehler: 0,
        jubelStart: Math.abs(zufallsSeed()) % 7,
        startZeit: Date.now(),
        stufe,
        eintraege,
        index: 0,
        richtig: 0,
        ergebnisse: [],
        serie: 0,
        besteSerie: 0,
        fehlerTypen: [],
        richtigeTypen: [],
        eingabe: "",
        beantwortet: false,
        warRichtig: false,
        tippOffen: false,
        phase: "haupt",
        bonusVersucht: false,
        bonusRichtig: false,
        hauptEingabe: "",
        felder: [],
        feldIndex: 0,
        herzen: 0,
    };
    return sitzung;
}
/**
 * Setzt die nächste Aufgabe auf Anfang. Sie beginnt IMMER bei der eigentlichen
 * Frage: Wer die Hilfsaufgabe rechnen soll, ohne die große Aufgabe gesehen zu
 * haben, weiß gar nicht, wobei sie helfen soll.
 */
function aufgabeZuruecksetzen(sitzung) {
    sitzung.phase = "haupt";
    sitzung.bonusVersucht = false;
    sitzung.bonusRichtig = false;
    sitzung.hauptEingabe = "";
    sitzung.tippOffen = false;
    sitzung.felder = [];
    sitzung.feldIndex = 0;
}
/** Darf für die aktuelle Aufgabe ein Bonus gerechnet werden? */
function bonusMoeglich(sitzung) {
    const aufgabe = sitzung.eintraege[sitzung.index]?.aufgabe;
    // Im Rechenmeister nicht – dort läuft die Uhr. Und nicht, während der Bonus
    // selbst gerade dran ist.
    return (!!aufgabe?.vorstufe &&
        !sitzung.meister &&
        sitzung.phase === "haupt" &&
        !sitzung.bonusVersucht &&
        !sitzung.beantwortet);
}
function aktuellerSchritt(aufgabe, sitzung) {
    if (sitzung.phase === "vorstufe" && aufgabe.vorstufe) {
        return {
            frage: aufgabe.vorstufe.frage,
            // Die Rechnung wird BEWUSST nicht angezeigt – das Kind soll sie selbst
            // finden und ganz aufschreiben. Sonst bliebe nur das Ergebnis zu tippen.
            antwortfeld: { art: "rechnung" },
            loesung: `${aufgabe.vorstufe.rechnung} ${aufgabe.vorstufe.loesung}`,
        };
    }
    return {
        frage: aufgabe.frage,
        rechnung: aufgabe.rechnung,
        antwortfeld: aufgabe.antwortfeld,
        loesung: aufgabe.loesung,
        erklaerung: aufgabe.erklaerung,
    };
}
/* ------------------------------------------------------------- Zeichnen */
function zeichne(ziel, sitzung) {
    aufraeumen();
    if (sitzung.index >= sitzung.eintraege.length) {
        zeichneErgebnis(ziel, sitzung);
        return;
    }
    const eintrag = sitzung.eintraege[sitzung.index];
    const aufgabe = eintrag.aufgabe;
    const schritt = aktuellerSchritt(aufgabe, sitzung);
    const inVorstufe = sitzung.phase === "vorstufe";
    vielleichtVorlesen(sitzung, schritt);
    const nummer = sitzung.index + 1;
    const gesamt = sitzung.eintraege.length;
    const titel = sitzung.puzzle
        ? "Puzzle"
        : sitzung.meister
            ? "Rechenmeister"
            : sitzung.themaId
                ? thema(sitzung.themaId).titel
                : "Gemischtes Training";
    const kopf = el("section", { class: "uebung-kopf" }, el("div", { class: "uebung-kopf-zeile" }, 
    // Abbrechen und Vorlesen bleiben zusammen links; die Marke (oder die
    // Stoppuhr) gehört nach rechts. Als drei gleichrangige Kinder einer
    // `space-between`-Zeile landete der Lautsprecher sonst in der Mitte.
    el("div", { class: "uebung-kopf-links" }, el("a", { class: "knopf knopf-klein knopf-still", href: "#/", text: "← Abbrechen" }), vorleseKnopf(schritt)), sitzung.meister
        ? stoppuhr(sitzung)
        : el("span", {
            class: "marke",
            text: sitzung.themaId ? `${titel} · Stufe ${sitzung.stufe}` : titel,
        })), el("div", {
        class: "balken balken-uebung",
        role: "progressbar",
        "aria-valuemin": "1",
        "aria-valuemax": String(gesamt),
        "aria-valuenow": String(nummer),
        "aria-label": `Aufgabe ${nummer} von ${gesamt}`,
    }, el("div", { class: "balken-fuellung", stil: { width: `${(sitzung.index / gesamt) * 100}%` } })), el("div", { class: "uebung-zaehler" }, el("span", { text: `Aufgabe ${nummer} von ${gesamt}` }), el("span", { class: "uebung-bilanz" }, sitzung.herzen > 0 &&
        el("span", { class: "uebung-herzen" }, icon("herz", "herz-klein"), String(sitzung.herzen)), el("span", { class: "uebung-treffer", text: `${sitzung.richtig} richtig` }))));
    if (sitzung.puzzle) {
        /*
         * Das Puzzle rückt NEBEN den Zähler, nicht darüber. Als eigene Zeile
         * kostete es auf dem iPhone rund 150 px Höhe – genug, um die OK-Taste
         * unter den Fensterrand zu schieben (gemessen: 737 von 667 px auf dem
         * iPhone SE). Auf dem Tablet ist Platz, dort steht es wieder groß darunter.
         */
        // Der Fortschrittsbalken ist hier doppelt gemoppelt: Die aufgedeckten
        // Teile ZEIGEN den Fortschritt bereits. Weg damit – der Platz gehört dem
        // Bild und den Zifferntasten.
        kopf.querySelector(".balken-uebung")?.remove();
        const zaehler = kopf.lastElementChild;
        const reihe = el("div", { class: "uebung-kopf-fuss" });
        kopf.appendChild(reihe);
        if (zaehler)
            reihe.appendChild(zaehler);
        reihe.appendChild(puzzlestreifen(sitzung, sitzung.puzzle));
    }
    const karte = el("section", { class: `karte karte-aufgabe${inVorstufe ? " karte-vorstufe" : ""}` });
    if (!sitzung.themaId && !inVorstufe) {
        karte.appendChild(el("span", { class: "aufgabe-thema" }, icon(thema(eintrag.thema).symbol, "aufgabe-thema-symbol"), thema(eintrag.thema).titel));
    }
    /*
     * Im Bonus bleibt die EIGENTLICHE Aufgabe oben stehen. Vorher war sie
     * verdeckt, solange die Hilfsaufgabe dran war – dann half sie aber nichts,
     * weil niemand wusste, wobei sie helfen sollte.
     */
    if (inVorstufe) {
        karte.append(el("span", { class: "marke marke-bonus" }, icon("herz", "herz-klein"), "Bonusaufgabe"), el("p", { class: "hilfszeile hilfszeile-ziel", text: `Dafür: ${aufgabe.rechnung ?? aufgabe.frage}` }));
    }
    // Ist der Bonus gerechnet, steht sein Ergebnis über der Hauptaufgabe.
    if (!inVorstufe && aufgabe.vorstufe && sitzung.bonusVersucht) {
        karte.appendChild(el("p", { class: `hilfszeile${sitzung.bonusRichtig ? " hilfszeile-geschafft" : ""}` }, sitzung.bonusRichtig ? icon("herz", "herz-klein") : icon("gluehbirne", "tipp-symbol"), `Hilfsaufgabe: ${aufgabe.vorstufe.rechnung} ${aufgabe.vorstufe.loesung}`));
    }
    /*
     * Mehrzeilige Fragen sind die Ausnahme (bisher nur die Beziehungsketten).
     * In Fragegröße und fett wären vier Sätze am Stück eine Wand – im Heft
     * stehen sie in normaler Schrift. Deshalb bekommen sie eine eigene Klasse.
     */
    const mehrzeilig = schritt.frage.includes("\n");
    karte.appendChild(el("p", {
        class: `aufgabe-frage${mehrzeilig ? " aufgabe-frage-mehrzeilig" : ""}`,
        text: schritt.frage,
    }));
    // Die ganze Rechnung wird getippt – ohne Beispiel wüsste ein Kind nicht,
    // dass Gleichheitszeichen und Ergebnis dazugehören.
    if (inVorstufe && schritt.antwortfeld.art === "rechnung") {
        karte.appendChild(el("p", { class: "hinweis hinweis-format", text: "zum Beispiel so:  3 − 2 = 1" }));
    }
    if (aufgabe.bild && !inVorstufe) {
        const bild = svgBild(aufgabe.bild.svg, aufgabe.bild.beschriftung);
        if (aufgabe.bild.breit)
            bild.classList.add("bild-breit");
        karte.appendChild(bild);
    }
    if (schritt.rechnung)
        karte.appendChild(el("p", { class: "aufgabe-rechnung", text: schritt.rechnung }));
    karte.appendChild(antwortbereich(ziel, sitzung, schritt));
    /*
     * Der Bonus ist ein Angebot, keine Pflicht: Wer mag, rechnet die
     * Hilfsaufgabe selbst und bekommt ein Herz dafür. Wer nicht mag, beantwortet
     * einfach die eigentliche Aufgabe.
     */
    if (bonusMoeglich(sitzung) && aufgabe.vorstufe) {
        karte.appendChild(el("button", {
            class: "knopf knopf-klein knopf-bonus",
            onclick: () => {
                // Angefangene Eingabe der Hauptaufgabe parken, nicht wegwerfen.
                sitzung.hauptEingabe = sitzung.eingabe;
                sitzung.eingabe = "";
                sitzung.phase = "vorstufe";
                zeichne(ziel, sitzung);
            },
        }, icon("herz", "herz-klein"), "Hilfsaufgabe selbst rechnen"));
    }
    if (aufgabe.tipp && !sitzung.beantwortet && !sitzung.meister && !inVorstufe) {
        karte.appendChild(sitzung.tippOffen
            ? el("p", { class: "tipp tipp-offen" }, icon("gluehbirne", "tipp-symbol"), aufgabe.tipp)
            : el("button", {
                class: "knopf knopf-klein knopf-still knopf-tipp",
                onclick: () => {
                    sitzung.tippOffen = true;
                    zeichne(ziel, sitzung);
                },
            }, icon("gluehbirne", "tipp-symbol"), "Tipp anzeigen"));
    }
    if (sitzung.beantwortet)
        karte.appendChild(rueckmeldung(ziel, sitzung, schritt));
    ziel.replaceChildren(kopf, karte);
    setzeFokus();
}
/**
 * Der Vorleseknopf.
 *
 * Zweitklässler lesen noch langsam; wer an „Auf dem Dach sitzen 14 Tauben"
 * scheitert, scheitert an der Sprache und nicht an der Mathematik. Kann das
 * Gerät nicht sprechen, fällt der Knopf ersatzlos weg — ein Knopf, der nichts
 * tut, ist schlimmer als keiner.
 */
function vorleseKnopf(schritt) {
    if (!vorlesenMoeglich())
        return null;
    const text = schrittText(schritt);
    return el("button", {
        class: "knopf knopf-klein knopf-still knopf-vorlesen",
        type: "button",
        "aria-label": "Aufgabe vorlesen",
        title: "Aufgabe vorlesen",
        onclick: () => sprich(text),
    }, icon("lautsprecher", "vorlese-symbol"));
}
/**
 * Liest die Aufgabe von selbst vor, wenn das im Elternbereich eingeschaltet
 * ist. Steht bewusst NICHT in `zeichne()`: Das läuft bei jedem Tastendruck,
 * und die Stimme finge bei jeder Ziffer von vorne an.
 */
function vielleichtVorlesen(sitzung, schritt) {
    // Nur beim WECHSEL der Aufgabe – `zeichne()` läuft bei jedem Tastendruck,
    // und die Stimme finge sonst bei jeder getippten Ziffer von vorne an.
    const marke = `${sitzung.index}/${sitzung.phase}`;
    if (marke === zuletztVorgelesen)
        return;
    zuletztVorgelesen = marke;
    if (!vorlesenAn())
        return;
    sprich(schrittText(schritt));
}
/** Der sprechbare Text dessen, was gerade gefragt wird. */
function schrittText(schritt) {
    return aufgabeSprechen({
        typ: "",
        frage: schritt.frage,
        rechnung: schritt.rechnung,
        antwortfeld: schritt.antwortfeld,
        loesung: schritt.loesung,
    });
}
/**
 * Das Puzzle über der Aufgabe. Ein Teil deckt sich auf, sobald seine Aufgabe
 * beantwortet ist – richtig gerechnet wird es ganz sichtbar, falsch gerechnet
 * bleibt es blass. Ein fehlerfreies Puzzle ist am Ende also ganz klar.
 */
function puzzlestreifen(sitzung, puzzle) {
    // `phase` gehört zwingend dazu: Während der Bonusaufgabe steht `beantwortet`
    // ebenfalls auf `true`, aber die eigentliche Aufgabe ist offen – das Teil
    // wäre sonst schon blass, bevor das Kind sie überhaupt beantwortet hat.
    const stand = puzzleStaende(sitzung.index, sitzung.beantwortet && sitzung.phase === "haupt", sitzung.ergebnisse);
    const offen = stand.filter((t) => t !== "zu").length;
    const rahmen = el("div", { class: `puzzle-rahmen${sitzung.beantwortet ? " frisch" : ""}` }, 
    // Kurz halten: „3 von 12 Teilen" brach neben dem Zähler auf zwei Zeilen
    // um und kostete mehr Höhe als das Bild selbst. Der ganze Satz steht in
    // der Bildbeschreibung.
    el("p", {
        class: "puzzle-stand",
        text: offen >= PUZZLE_TEILE ? "Fertig!" : `${offen}/${PUZZLE_TEILE}`,
    }), svgBild(puzzleBild(puzzle, stand), `Puzzle, ${offen} von ${PUZZLE_TEILE} Teilen aufgedeckt`));
    return rahmen;
}
/**
 * Laufende Stoppuhr des Rechenmeisters. Sie schreibt nur in ihren eigenen
 * Textknoten – ein Neuzeichnen der ganzen Ansicht im Sekundentakt würde die
 * Eingabe stören.
 */
function stoppuhr(sitzung) {
    const anzeige = el("span", { text: zeitText(vergangeneSekunden(sitzung)) });
    uhrTakt = window.setInterval(() => {
        anzeige.textContent = zeitText(vergangeneSekunden(sitzung));
    }, 1000);
    return el("span", { class: "marke marke-uhr", role: "timer", "aria-label": "Verstrichene Zeit" }, icon("stoppuhr", "chip-symbol"), anzeige);
}
function vergangeneSekunden(sitzung) {
    return Math.max(0, Math.round((Date.now() - sitzung.startZeit) / 1000));
}
/* ---------------------------------------------------------- Antwortfeld */
function antwortbereich(ziel, sitzung, schritt) {
    if (schritt.antwortfeld.art === "auswahl") {
        const knoepfe = el("div", { class: "auswahl" });
        for (const option of schritt.antwortfeld.optionen) {
            const gewaehlt = sitzung.beantwortet && sitzung.eingabe === option;
            const istLoesung = sitzung.beantwortet && option === schritt.loesung;
            knoepfe.appendChild(el("button", {
                class: `knopf knopf-auswahl${istLoesung ? " knopf-richtig" : gewaehlt ? " knopf-falsch" : ""}`,
                type: "button",
                disabled: sitzung.beantwortet,
                text: option,
                onclick: () => pruefe(ziel, sitzung, option),
            }));
        }
        return knoepfe;
    }
    if (schritt.antwortfeld.art === "bildauswahl") {
        const karten = el("div", { class: "bildauswahl" });
        for (const option of schritt.antwortfeld.optionen) {
            const gewaehlt = sitzung.beantwortet && sitzung.eingabe === option.kennung;
            const istLoesung = sitzung.beantwortet && option.kennung === schritt.loesung;
            const knopf = el("button", {
                class: `bildkarte${istLoesung ? " bildkarte-richtig" : gewaehlt ? " bildkarte-falsch" : ""}`,
                type: "button",
                disabled: sitzung.beantwortet,
                "aria-label": `${option.kennung}: ${option.beschriftung}`,
                onclick: () => pruefe(ziel, sitzung, option.kennung),
            }, el("span", { class: "bildkarte-name", text: option.kennung }));
            knopf.insertBefore(svgBild(option.svg, option.beschriftung), knopf.firstChild);
            karten.appendChild(knopf);
        }
        return karten;
    }
    if (schritt.antwortfeld.art === "mauer") {
        return mauerBereich(ziel, sitzung, schritt, schritt.antwortfeld.reihen);
    }
    const istRechnung = schritt.antwortfeld.art === "rechnung";
    const einheit = schritt.antwortfeld.art === "zahl" ? schritt.antwortfeld.einheit : undefined;
    // Eine ganze Rechnung ist länger als eine Zahl – „100 − 40 = 60“ sind zwölf
    // Zeichen ohne Leerzeichen, mit Puffer nach oben.
    const maxZeichen = istRechnung ? 14 : 4;
    const anzeige = el("div", { class: `eingabe-anzeige${istRechnung ? " eingabe-anzeige-rechnung" : ""}`, "aria-live": "polite" }, el("span", {
        class: "eingabe-zahl",
        text: sitzung.eingabe || (istRechnung ? "…" : "?"),
    }), einheit ? el("span", { class: "eingabe-einheit", text: einheit }) : null);
    const absenden = () => {
        if (sitzung.beantwortet || sitzung.eingabe === "")
            return;
        pruefe(ziel, sitzung, sitzung.eingabe);
    };
    const tippe = (zeichen) => {
        if (sitzung.beantwortet || sitzung.eingabe.length >= maxZeichen)
            return;
        // Führende Null nur beim reinen Zahlenfeld ersetzen – in einer Rechnung
        // wäre „0“ ein gültiger Anfang („10 − 10 = 0“ endet damit).
        if (!istRechnung && sitzung.eingabe === "0")
            sitzung.eingabe = "";
        sitzung.eingabe += zeichen;
        zeichne(ziel, sitzung);
    };
    const loesche = () => {
        if (sitzung.beantwortet)
            return;
        sitzung.eingabe = sitzung.eingabe.slice(0, -1);
        zeichne(ziel, sitzung);
    };
    if (!sitzung.beantwortet) {
        tastatur = (ereignis) => {
            if (ereignis.ctrlKey || ereignis.metaKey || ereignis.altKey)
                return;
            if (/^\d$/.test(ereignis.key)) {
                ereignis.preventDefault();
                tippe(ereignis.key);
            }
            else if (istRechnung && ["+", "-", "−", "="].includes(ereignis.key)) {
                ereignis.preventDefault();
                tippe(ereignis.key === "-" ? "−" : ereignis.key);
            }
            else if (ereignis.key === "Backspace") {
                ereignis.preventDefault();
                loesche();
            }
            else if (ereignis.key === "Enter") {
                ereignis.preventDefault();
                absenden();
            }
        };
        document.addEventListener("keydown", tastatur);
    }
    const feld = el("div", { class: "tastenfeld" });
    for (const ziffer of ["1", "2", "3", "4", "5", "6", "7", "8", "9"]) {
        feld.appendChild(el("button", {
            class: "taste",
            type: "button",
            disabled: sitzung.beantwortet,
            text: ziffer,
            onclick: () => tippe(ziffer),
        }));
    }
    if (istRechnung) {
        for (const zeichen of ["+", "−", "="]) {
            feld.appendChild(el("button", {
                class: "taste taste-zeichen",
                type: "button",
                disabled: sitzung.beantwortet,
                text: zeichen,
                "aria-label": zeichen === "+" ? "Plus" : zeichen === "−" ? "Minus" : "Gleich",
                onclick: () => tippe(zeichen),
            }));
        }
    }
    feld.append(el("button", {
        class: "taste taste-hilfe",
        type: "button",
        "aria-label": istRechnung ? "Letztes Zeichen löschen" : "Letzte Ziffer löschen",
        disabled: sitzung.beantwortet,
        text: "←",
        onclick: loesche,
    }), el("button", {
        class: "taste",
        type: "button",
        disabled: sitzung.beantwortet,
        text: "0",
        onclick: () => tippe("0"),
    }), el("button", {
        class: "taste taste-ok",
        type: "button",
        disabled: sitzung.beantwortet || sitzung.eingabe === "",
        text: "OK",
        onclick: absenden,
    }));
    return el("div", { class: "eingabe-bereich" }, anzeige, feld);
}
/* ------------------------------------------------- Mauer zum Ausfüllen */
/**
 * Eine Zahlenmauer, in die MEHRERE Zahlen getippt werden. Die Steine sind
 * hier echte DOM-Knöpfe, kein SVG: Nur so lässt sich einer davon auswählen.
 *
 * Die Reihen kommen von unten nach oben, gezeichnet wird von oben nach unten.
 * Jede Reihe ist mittig gesetzt – dadurch entsteht die Pyramidenform von
 * allein, ohne gerechnete Versätze.
 */
function mauerBereich(ziel, sitzung, schritt, reihen) {
    const erwartet = schritt.loesung.split(",");
    if (sitzung.felder.length !== erwartet.length) {
        sitzung.felder = new Array(erwartet.length).fill("");
        sitzung.feldIndex = 0;
    }
    /*
     * ACHTUNG: Gezeichnet wird von OBEN nach unten, gezählt aber von UNTEN nach
     * oben – denn genau so steht die Lösungsfolge, und genau so füllt ein Kind
     * eine Mauer. Beides zu vermischen war ein Fehler: Die Zahlen landeten in
     * den falschen Steinen, und weil Eingabe und Vergleich dieselbe verdrehte
     * Reihenfolge benutzten, galt die Aufgabe trotzdem als richtig.
     */
    const nummern = new Map();
    let gezaehlt = 0;
    reihen.forEach((reihe, ebene) => reihe.forEach((wert, spalte) => {
        if (wert === null)
            nummern.set(`${ebene}/${spalte}`, gezaehlt++);
    }));
    const mauer = el("div", { class: "mauer" });
    for (let ebene = reihen.length - 1; ebene >= 0; ebene--) {
        const zeile = el("div", { class: "mauer-reihe" });
        reihen[ebene].forEach((wert, spalte) => {
            if (wert !== null) {
                zeile.appendChild(el("span", { class: "mauer-stein", text: String(wert) }));
                return;
            }
            const nummer = nummern.get(`${ebene}/${spalte}`);
            const eingabe = sitzung.felder[nummer] ?? "";
            const stimmt = sitzung.beantwortet && eingabe === erwartet[nummer];
            zeile.appendChild(el("button", {
                class: `mauer-stein mauer-stein-luecke` +
                    (sitzung.beantwortet ? (stimmt ? " mauer-stein-richtig" : " mauer-stein-falsch") : "") +
                    (!sitzung.beantwortet && nummer === sitzung.feldIndex ? " mauer-stein-aktiv" : ""),
                type: "button",
                disabled: sitzung.beantwortet,
                "aria-label": `Stein ${nummer + 1} von ${erwartet.length}${eingabe ? `, ${eingabe}` : ", leer"}`,
                text: sitzung.beantwortet && !stimmt ? erwartet[nummer] : eingabe || "?",
                onclick: () => {
                    sitzung.feldIndex = nummer;
                    zeichne(ziel, sitzung);
                },
            }));
        });
        mauer.appendChild(zeile);
    }
    const offen = sitzung.felder.filter((wert) => wert === "").length;
    const tippe = (ziffer) => {
        if (sitzung.beantwortet)
            return;
        const jetzt = sitzung.felder[sitzung.feldIndex] ?? "";
        if (jetzt.length >= 3)
            return;
        sitzung.felder[sitzung.feldIndex] = (jetzt === "0" ? "" : jetzt) + ziffer;
        zeichne(ziel, sitzung);
    };
    const loesche = () => {
        if (sitzung.beantwortet)
            return;
        sitzung.felder[sitzung.feldIndex] = (sitzung.felder[sitzung.feldIndex] ?? "").slice(0, -1);
        zeichne(ziel, sitzung);
    };
    /**
     * Ein Druck auf OK schaltet zum nächsten leeren Stein weiter – und erst wenn
     * alle gefüllt sind, wird abgegeben. So kommt ein Kind mit einer einzigen
     * Taste durch die ganze Mauer.
     */
    const weiter = () => {
        if (sitzung.beantwortet)
            return;
        if (offen === 0) {
            pruefe(ziel, sitzung, sitzung.felder.join(","));
            return;
        }
        const naechster = sitzung.felder.findIndex((wert, i) => wert === "" && i > sitzung.feldIndex);
        sitzung.feldIndex = naechster >= 0 ? naechster : sitzung.felder.findIndex((wert) => wert === "");
        zeichne(ziel, sitzung);
    };
    if (!sitzung.beantwortet) {
        tastatur = (ereignis) => {
            if (ereignis.ctrlKey || ereignis.metaKey || ereignis.altKey)
                return;
            if (/^\d$/.test(ereignis.key)) {
                ereignis.preventDefault();
                tippe(ereignis.key);
            }
            else if (ereignis.key === "Backspace") {
                ereignis.preventDefault();
                loesche();
            }
            else if (ereignis.key === "Enter" || ereignis.key === "Tab") {
                ereignis.preventDefault();
                weiter();
            }
        };
        document.addEventListener("keydown", tastatur);
    }
    const feld = el("div", { class: "tastenfeld" });
    for (const ziffer of ["1", "2", "3", "4", "5", "6", "7", "8", "9"]) {
        feld.appendChild(el("button", {
            class: "taste",
            type: "button",
            disabled: sitzung.beantwortet,
            text: ziffer,
            onclick: () => tippe(ziffer),
        }));
    }
    feld.append(el("button", {
        class: "taste taste-hilfe",
        type: "button",
        "aria-label": "Letzte Ziffer löschen",
        disabled: sitzung.beantwortet,
        text: "←",
        onclick: loesche,
    }), el("button", {
        class: "taste",
        type: "button",
        disabled: sitzung.beantwortet,
        text: "0",
        onclick: () => tippe("0"),
    }), el("button", {
        class: "taste taste-ok",
        type: "button",
        disabled: sitzung.beantwortet || (sitzung.felder[sitzung.feldIndex] === "" && offen > 0),
        text: offen === 0 ? "Fertig" : "Weiter",
        onclick: weiter,
    }));
    return el("div", { class: "eingabe-bereich eingabe-bereich-mauer" }, mauer, offen > 0 && !sitzung.beantwortet
        ? el("p", {
            class: "hinweis mauer-stand",
            text: offen === 1 ? "Noch ein Stein fehlt." : `Noch ${offen} Steine fehlen.`,
        })
        : null, feld);
}
/* ---------------------------------------------------------- Rückmeldung */
function rueckmeldung(ziel, sitzung, schritt) {
    const inVorstufe = sitzung.phase === "vorstufe";
    /** Zurück zur Hauptaufgabe (nach dem Bonus) oder weiter zur nächsten Aufgabe. */
    const weiter = () => {
        sitzung.beantwortet = false;
        if (inVorstufe) {
            // Die angefangene Eingabe der Hauptaufgabe kommt zurück.
            sitzung.phase = "haupt";
            sitzung.eingabe = sitzung.hauptEingabe;
        }
        else {
            sitzung.eingabe = "";
            sitzung.index++;
            aufgabeZuruecksetzen(sitzung);
        }
        zeichne(ziel, sitzung);
    };
    if (sitzung.warRichtig) {
        timer = window.setTimeout(weiter, inVorstufe ? 1300 : 900);
        return inVorstufe
            ? el("div", { class: "rueckmeldung rueckmeldung-herz", role: "status" }, icon("herz", "herz"), el("span", { text: "Richtig! Ein Herz für dich." }))
            : el("div", { class: "rueckmeldung rueckmeldung-richtig", role: "status" }, icon("haken", "rueckmeldung-symbol"), el("span", { text: "Richtig!" }));
    }
    const kasten = el("div", { class: "rueckmeldung rueckmeldung-falsch", role: "status", tabindex: "-1" }, el("p", { class: "rueckmeldung-zeile" }, icon("gedanke", "rueckmeldung-symbol"), 
    // Bei der Mauer stünde hier eine nackte Zahlenliste. Die richtigen Werte
    // stehen dort schon IN den falsch gefüllten Steinen.
    el("span", {
        text: schritt.antwortfeld.art === "mauer"
            ? "Schau dir die roten Steine an – dort steht die richtige Zahl."
            : `Richtig ist: ${schritt.loesung}`,
    })), schritt.erklaerung ? el("p", { class: "rueckmeldung-weg", text: schritt.erklaerung }) : null, el("button", {
        class: "knopf knopf-gross",
        type: "button",
        text: inVorstufe ? "Weiter zur Aufgabe" : "Weiter",
        onclick: weiter,
    }));
    // Von hier aus ist „Weiter" der nächste Tabstopp – statt einmal quer durch
    // die ganze Seite.
    fokusZiel = kasten;
    return kasten;
}
function pruefe(ziel, sitzung, antwort) {
    const eintrag = sitzung.eintraege[sitzung.index];
    const schritt = aktuellerSchritt(eintrag.aufgabe, sitzung);
    const richtig = schritt.antwortfeld.art === "rechnung"
        ? rechnungPasst(antwort, schritt.loesung)
        : normalisiere(antwort) === normalisiere(schritt.loesung);
    sitzung.eingabe = antwort;
    sitzung.beantwortet = true;
    sitzung.warRichtig = richtig;
    if (sitzung.phase === "vorstufe") {
        // Der Bonus bringt ein Herz, zählt aber nicht in die Trefferbilanz – er
        // ist freiwillig, also darf er die Runde weder retten noch verderben.
        sitzung.bonusVersucht = true;
        sitzung.bonusRichtig = richtig;
        if (richtig) {
            sitzung.herzen++;
            jubele(sitzung);
        }
        zeichne(ziel, sitzung);
        return;
    }
    sitzung.ergebnisse.push(richtig);
    if (richtig) {
        sitzung.richtig++;
        sitzung.serie++;
        sitzung.besteSerie = Math.max(sitzung.besteSerie, sitzung.serie);
        sitzung.richtigeTypen.push(eintrag.aufgabe.typ);
        jubele(sitzung);
    }
    else {
        sitzung.serie = 0;
        sitzung.fehlerTypen.push(eintrag.aufgabe.typ);
    }
    zeichne(ziel, sitzung);
}
/**
 * Feiert eine richtige Antwort. Die Art wechselt reihum statt zufällig: So
 * kommt nie zweimal hintereinander dasselbe, und über eine Runde sieht ein
 * Kind mehrere verschiedene Überraschungen.
 *
 * Der Zähler steht in der Sitzung, nicht im Modul – sonst hinge die Reihenfolge
 * daran, was vorher in einer ANDEREN Runde passiert ist.
 */
function jubele(sitzung) {
    zeigeJubel(waehleJubel(sitzung.jubelZaehler + sitzung.jubelStart));
    sitzung.jubelZaehler++;
}
/* -------------------------------------------------------------- Ergebnis */
function zeichneErgebnis(ziel, sitzung) {
    const fortschritt = ladeFortschritt();
    let ergebnis;
    let sekunden = 0;
    let neueBestleistung = false;
    if (sitzung.themaId) {
        ergebnis = werteRundeAus(fortschritt, {
            thema: sitzung.themaId,
            stufe: sitzung.stufe,
            richtig: sitzung.richtig,
            gesamt: sitzung.eintraege.length,
            besteSerie: sitzung.besteSerie,
            fehlerTypen: sitzung.fehlerTypen,
            richtigeTypen: sitzung.richtigeTypen,
            herzen: sitzung.herzen,
        });
    }
    else {
        const proThema = new Map();
        sitzung.eintraege.forEach((eintrag, i) => {
            const stand = proThema.get(eintrag.thema) ?? { richtig: 0, gesamt: 0 };
            stand.gesamt++;
            if (sitzung.ergebnisse[i])
                stand.richtig++;
            proThema.set(eintrag.thema, stand);
        });
        const eingabe = {
            richtig: sitzung.richtig,
            gesamt: sitzung.eintraege.length,
            proThema: [...proThema.entries()].map(([id, stand]) => ({ thema: id, ...stand })),
            fehlerTypen: sitzung.fehlerTypen,
            richtigeTypen: sitzung.richtigeTypen,
            besteSerie: sitzung.besteSerie,
            herzen: sitzung.herzen,
        };
        if (sitzung.puzzle && sitzung.richtig === sitzung.eintraege.length) {
            fortschritt.puzzleGeloest++;
        }
        if (sitzung.meister) {
            sekunden = vergangeneSekunden(sitzung);
            neueBestleistung = merkeMeisterErgebnis(fortschritt, sitzung.richtig, sekunden);
        }
        ergebnis = werteMixAus(fortschritt, eingabe);
    }
    // Nach jeder Runde mit den anderen Geräten abgleichen – im Hintergrund, das
    // Ergebnis der Runde steht davon unabhängig schon auf dem Schirm.
    void gleicheAb();
    const nochmal = () => {
        const wunsch = sitzung.puzzle ? "puzzle" : sitzung.meister ? "meister" : (sitzung.themaId ?? "mix");
        const neue = baueSitzung(wunsch);
        if (neue)
            zeichne(ziel, neue);
    };
    const karte = el("section", { class: "karte karte-ergebnis" }, el("div", { class: "ergebnis-sterne" }, sterneAnzeige(ergebnis.sterne)), el("h1", { class: "ergebnis-titel", text: lobText(ergebnis.richtig, ergebnis.gesamt) }), el("p", {
        class: "ergebnis-bilanz",
        text: `${ergebnis.richtig} von ${ergebnis.gesamt} Aufgaben richtig · +${ergebnis.punkte} Punkte`,
    }));
    if (ergebnis.herzen > 0) {
        karte.appendChild(el("p", { class: "ergebnis-herzen" }, icon("herz", "herz"), ` ${ergebnis.herzen} ${ergebnis.herzen === 1 ? "Hilfsaufgabe" : "Hilfsaufgaben"} selbst gelöst`));
    }
    if (sitzung.puzzle) {
        // Am Ende sind alle Aufgaben durch – deshalb steht hier die volle Anzahl.
        const stand = puzzleStaende(PUZZLE_TEILE, false, sitzung.ergebnisse);
        const alleRichtig = sitzung.ergebnisse.every((e) => e);
        karte.append(el("p", { class: "hinweis", text: `Dein Puzzle: ${sitzung.puzzle.name}` }), el("div", { class: "puzzle-rahmen puzzle-rahmen-gross" }, svgBild(puzzleBild(sitzung.puzzle, stand), `Fertiges Puzzle: ${sitzung.puzzle.name}`)), el("p", {
            class: alleRichtig ? "ergebnis-aufstieg" : "hinweis",
            text: alleRichtig
                ? "Alle Teile leuchten – kein einziger Fehler!"
                : "Die blassen Teile waren die Aufgaben, die noch nicht saßen.",
        }));
    }
    if (sitzung.meister) {
        karte.appendChild(el("p", { class: "ergebnis-zeit" }, icon("stoppuhr", "ergebnis-symbol"), `Deine Zeit: ${zeitText(sekunden)}`));
        karte.appendChild(el("p", {
            class: neueBestleistung ? "ergebnis-aufstieg" : "hinweis",
            text: neueBestleistung
                ? "Neue Bestleistung!"
                : `Deine Bestleistung: ${fortschritt.meister.besteTreffer} richtig in ${zeitText(fortschritt.meister.besteZeit)}.`,
        }));
    }
    if (ergebnis.stufeAufgestiegen && sitzung.themaId) {
        karte.appendChild(el("p", {
            class: "ergebnis-aufstieg",
            text: `Stark! Ab jetzt übst du bei ${thema(sitzung.themaId).titel} auf Stufe ${sitzung.stufe + 1}.`,
        }));
    }
    for (const id of ergebnis.neueErfolge) {
        const erfolg = ERFOLGE.find((e) => e.id === id);
        if (!erfolg)
            continue;
        karte.appendChild(el("div", { class: "erfolg-neu" }, icon(erfolg.symbol, "erfolg-symbol"), el("span", {}, el("strong", { text: `Neues Abzeichen: ${erfolg.titel}` }), el("br"), erfolg.text)));
    }
    karte.appendChild(el("div", { class: "ergebnis-knoepfe" }, el("button", {
        class: "knopf knopf-gross knopf-haupt",
        type: "button",
        text: sitzung.puzzle ? "Neues Puzzle" : "Nochmal üben",
        onclick: nochmal,
    }), el("a", { class: "knopf knopf-gross", href: "#/", text: "Anderes Thema" })));
    ziel.replaceChildren(karte);
}
