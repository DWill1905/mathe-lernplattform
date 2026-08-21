/**
 * Der Übungsmodus – Herzstück der Anwendung.
 *
 * Eine Runde besteht aus zehn Aufgaben. Nach jeder Antwort gibt es sofort
 * Rückmeldung: Richtiges wird kurz bestätigt und läuft automatisch weiter,
 * bei einem Fehler bleibt der Rechenweg stehen, bis das Kind weiterklickt.
 */

import { el, svgBild } from "../dom.js";
import {
  ERFOLGE,
  lobText,
  merkeMeisterErgebnis,
  werteMixAus,
  werteRundeAus,
  zeitText,
  type MixEingabe,
} from "../gamification.js";
import { mulberry32, zufallsSeed } from "../random.js";
import { ladeFortschritt } from "../state.js";
import { MEISTERLAENGE, MEISTER_THEMEN, RUNDENLAENGE, gemischteRunde, runde } from "../tasks/index.js";
import { THEMEN, istThemaId, thema } from "../topics.js";
import type { RouteHandler } from "../router.js";
import type { Aufgabe, RundenErgebnis, Stufe, ThemaId } from "../types.js";
import { sterneAnzeige } from "./start.js";

interface Eintrag {
  thema: ThemaId;
  aufgabe: Aufgabe;
}

interface Sitzung {
  /** `null` steht für das gemischte Training und den Rechenmeister. */
  themaId: ThemaId | null;
  /** Runde gegen die Uhr (Rechenmeister). */
  meister: boolean;
  /** Startzeitpunkt in Millisekunden – nur im Rechenmeister genutzt. */
  startZeit: number;
  stufe: Stufe;
  eintraege: Eintrag[];
  index: number;
  richtig: number;
  /** Ergebnis je bereits beantworteter Aufgabe – Grundlage der Themenbilanz. */
  ergebnisse: boolean[];
  serie: number;
  besteSerie: number;
  fehlerTypen: string[];
  eingabe: string;
  beantwortet: boolean;
  warRichtig: boolean;
  tippOffen: boolean;
}

/** Aufräumhaken der laufenden Runde – Timer und Tastatur dürfen nie überleben. */
let timer: number | null = null;
let uhrTakt: number | null = null;
let tastatur: ((ereignis: KeyboardEvent) => void) | null = null;

function aufraeumen(): void {
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

export const zeige: RouteHandler = (ziel, parameter) => {
  aufraeumen();
  const sitzung = baueSitzung(parameter[0] === "rechenmeister" ? "meister" : (parameter[1] ?? "mix"));
  if (!sitzung) {
    ziel.replaceChildren(
      el(
        "section",
        { class: "karte karte-mitte" },
        el("h1", { text: "Dieses Thema kenne ich nicht" }),
        el("a", { class: "knopf knopf-gross", href: "#/", text: "Zur Startseite" })
      )
    );
    return;
  }
  zeichne(ziel, sitzung);
};

/**
 * Baut eine frische Runde zum gewünschten Thema. Die Stufe kommt immer aus
 * dem gespeicherten Fortschritt – so übt ein Kind nach einem Aufstieg sofort
 * auf der neuen Stufe weiter, auch beim direkten „Nochmal üben“.
 */
function baueSitzung(wunsch: string): Sitzung | null {
  const fortschritt = ladeFortschritt();
  const rng = mulberry32(zufallsSeed());

  if (wunsch === "mix" || wunsch === "meister") {
    const stufen = {} as Record<ThemaId, Stufe>;
    for (const t of THEMEN) stufen[t.id] = fortschritt.themen[t.id].stufe;
    if (wunsch === "meister") {
      return neueSitzung(null, 2, gemischteRunde(rng, stufen, MEISTERLAENGE, MEISTER_THEMEN), true);
    }
    return neueSitzung(null, 2, gemischteRunde(rng, stufen, RUNDENLAENGE));
  }
  if (istThemaId(wunsch)) {
    const stufe = fortschritt.themen[wunsch].stufe;
    return neueSitzung(
      wunsch,
      stufe,
      runde(wunsch, rng, stufe, RUNDENLAENGE).map((aufgabe) => ({ thema: wunsch, aufgabe }))
    );
  }
  return null;
}

function neueSitzung(
  themaId: ThemaId | null,
  stufe: Stufe,
  eintraege: Eintrag[],
  meister = false
): Sitzung {
  return {
    themaId,
    meister,
    startZeit: Date.now(),
    stufe,
    eintraege,
    index: 0,
    richtig: 0,
    ergebnisse: [],
    serie: 0,
    besteSerie: 0,
    fehlerTypen: [],
    eingabe: "",
    beantwortet: false,
    warRichtig: false,
    tippOffen: false,
  };
}

/* ------------------------------------------------------------- Zeichnen */

function zeichne(ziel: HTMLElement, sitzung: Sitzung): void {
  aufraeumen();
  if (sitzung.index >= sitzung.eintraege.length) {
    zeichneErgebnis(ziel, sitzung);
    return;
  }

  const eintrag = sitzung.eintraege[sitzung.index]!;
  const aufgabe = eintrag.aufgabe;
  const nummer = sitzung.index + 1;
  const gesamt = sitzung.eintraege.length;
  const titel = sitzung.meister
    ? "Rechenmeister"
    : sitzung.themaId
      ? thema(sitzung.themaId).titel
      : "Gemischtes Training";

  const kopf = el(
    "section",
    { class: "uebung-kopf" },
    el(
      "div",
      { class: "uebung-kopf-zeile" },
      el("a", { class: "knopf knopf-klein knopf-still", href: "#/", text: "← Abbrechen" }),
      sitzung.meister
        ? stoppuhr(sitzung)
        : el("span", {
            class: "marke",
            text: sitzung.themaId ? `${titel} · Stufe ${sitzung.stufe}` : titel,
          })
    ),
    el(
      "div",
      {
        class: "balken balken-uebung",
        role: "progressbar",
        "aria-valuemin": "1",
        "aria-valuemax": String(gesamt),
        "aria-valuenow": String(nummer),
        "aria-label": `Aufgabe ${nummer} von ${gesamt}`,
      },
      el("div", { class: "balken-fuellung", stil: { width: `${(sitzung.index / gesamt) * 100}%` } })
    ),
    el(
      "div",
      { class: "uebung-zaehler" },
      el("span", { text: `Aufgabe ${nummer} von ${gesamt}` }),
      el("span", { class: "uebung-treffer", text: `${sitzung.richtig} richtig` })
    )
  );

  const karte = el("section", { class: "karte karte-aufgabe" });
  if (!sitzung.themaId) {
    karte.appendChild(
      el("span", { class: "aufgabe-thema", text: `${thema(eintrag.thema).symbol} ${thema(eintrag.thema).titel}` })
    );
  }
  karte.appendChild(el("p", { class: "aufgabe-frage", text: aufgabe.frage }));
  if (aufgabe.bild) karte.appendChild(svgBild(aufgabe.bild.svg, aufgabe.bild.beschriftung));
  if (aufgabe.rechnung) karte.appendChild(el("p", { class: "aufgabe-rechnung", text: aufgabe.rechnung }));

  karte.appendChild(antwortbereich(ziel, sitzung, aufgabe));

  if (aufgabe.tipp && !sitzung.beantwortet && !sitzung.meister) {
    karte.appendChild(
      sitzung.tippOffen
        ? el("p", { class: "tipp tipp-offen", text: `💡 ${aufgabe.tipp}` })
        : el("button", {
            class: "knopf knopf-klein knopf-still",
            text: "💡 Tipp anzeigen",
            onclick: () => {
              sitzung.tippOffen = true;
              zeichne(ziel, sitzung);
            },
          })
    );
  }

  if (sitzung.beantwortet) karte.appendChild(rueckmeldung(ziel, sitzung, aufgabe));

  ziel.replaceChildren(kopf, karte);
}

/**
 * Laufende Stoppuhr des Rechenmeisters. Sie schreibt nur in ihren eigenen
 * Textknoten – ein Neuzeichnen der ganzen Ansicht im Sekundentakt würde die
 * Eingabe stören.
 */
function stoppuhr(sitzung: Sitzung): HTMLElement {
  const anzeige = el("span", { text: zeitText(vergangeneSekunden(sitzung)) });
  uhrTakt = window.setInterval(() => {
    anzeige.textContent = zeitText(vergangeneSekunden(sitzung));
  }, 1000);
  return el(
    "span",
    { class: "marke marke-uhr", role: "timer", "aria-label": "Verstrichene Zeit" },
    el("span", { "aria-hidden": "true", text: "⏱️ " }),
    anzeige
  );
}

function vergangeneSekunden(sitzung: Sitzung): number {
  return Math.max(0, Math.round((Date.now() - sitzung.startZeit) / 1000));
}

/* ---------------------------------------------------------- Antwortfeld */

function antwortbereich(ziel: HTMLElement, sitzung: Sitzung, aufgabe: Aufgabe): HTMLElement {
  if (aufgabe.antwortfeld.art === "auswahl") {
    const knoepfe = el("div", { class: "auswahl" });
    for (const option of aufgabe.antwortfeld.optionen) {
      const gewaehlt = sitzung.beantwortet && sitzung.eingabe === option;
      const istLoesung = sitzung.beantwortet && option === aufgabe.loesung;
      knoepfe.appendChild(
        el("button", {
          class: `knopf knopf-auswahl${istLoesung ? " knopf-richtig" : gewaehlt ? " knopf-falsch" : ""}`,
          type: "button",
          disabled: sitzung.beantwortet,
          text: option,
          onclick: () => pruefe(ziel, sitzung, option),
        })
      );
    }
    return knoepfe;
  }

  const einheit = aufgabe.antwortfeld.einheit;
  const anzeige = el(
    "div",
    { class: "eingabe-anzeige", "aria-live": "polite" },
    el("span", { class: "eingabe-zahl", text: sitzung.eingabe || "?" }),
    einheit ? el("span", { class: "eingabe-einheit", text: einheit }) : null
  );

  const absenden = (): void => {
    if (sitzung.beantwortet || sitzung.eingabe === "") return;
    pruefe(ziel, sitzung, sitzung.eingabe);
  };
  const tippe = (ziffer: string): void => {
    if (sitzung.beantwortet || sitzung.eingabe.length >= 4) return;
    if (sitzung.eingabe === "0") sitzung.eingabe = "";
    sitzung.eingabe += ziffer;
    zeichne(ziel, sitzung);
  };
  const loesche = (): void => {
    if (sitzung.beantwortet) return;
    sitzung.eingabe = sitzung.eingabe.slice(0, -1);
    zeichne(ziel, sitzung);
  };

  if (!sitzung.beantwortet) {
    tastatur = (ereignis: KeyboardEvent): void => {
      if (ereignis.ctrlKey || ereignis.metaKey || ereignis.altKey) return;
      if (/^\d$/.test(ereignis.key)) {
        ereignis.preventDefault();
        tippe(ereignis.key);
      } else if (ereignis.key === "Backspace") {
        ereignis.preventDefault();
        loesche();
      } else if (ereignis.key === "Enter") {
        ereignis.preventDefault();
        absenden();
      }
    };
    document.addEventListener("keydown", tastatur);
  }

  const feld = el("div", { class: "tastenfeld" });
  for (const ziffer of ["1", "2", "3", "4", "5", "6", "7", "8", "9"]) {
    feld.appendChild(
      el("button", {
        class: "taste",
        type: "button",
        disabled: sitzung.beantwortet,
        text: ziffer,
        onclick: () => tippe(ziffer),
      })
    );
  }
  feld.append(
    el("button", {
      class: "taste taste-hilfe",
      type: "button",
      "aria-label": "Letzte Ziffer löschen",
      disabled: sitzung.beantwortet,
      text: "←",
      onclick: loesche,
    }),
    el("button", {
      class: "taste",
      type: "button",
      disabled: sitzung.beantwortet,
      text: "0",
      onclick: () => tippe("0"),
    }),
    el("button", {
      class: "taste taste-ok",
      type: "button",
      disabled: sitzung.beantwortet || sitzung.eingabe === "",
      text: "OK",
      onclick: absenden,
    })
  );

  return el("div", { class: "eingabe-bereich" }, anzeige, feld);
}

/* ---------------------------------------------------------- Rückmeldung */

function rueckmeldung(ziel: HTMLElement, sitzung: Sitzung, aufgabe: Aufgabe): HTMLElement {
  const weiter = (): void => {
    sitzung.index++;
    sitzung.eingabe = "";
    sitzung.beantwortet = false;
    sitzung.tippOffen = false;
    zeichne(ziel, sitzung);
  };

  if (sitzung.warRichtig) {
    timer = window.setTimeout(weiter, 900);
    return el(
      "div",
      { class: "rueckmeldung rueckmeldung-richtig", role: "status" },
      el("span", { class: "rueckmeldung-symbol", "aria-hidden": "true", text: "✅" }),
      el("span", { text: "Richtig!" })
    );
  }

  return el(
    "div",
    { class: "rueckmeldung rueckmeldung-falsch", role: "status" },
    el(
      "p",
      { class: "rueckmeldung-zeile" },
      el("span", { class: "rueckmeldung-symbol", "aria-hidden": "true", text: "💭" }),
      el("span", { text: `Richtig ist: ${aufgabe.loesung}` })
    ),
    aufgabe.erklaerung ? el("p", { class: "rueckmeldung-weg", text: aufgabe.erklaerung }) : null,
    el("button", { class: "knopf knopf-gross", type: "button", text: "Weiter", onclick: weiter })
  );
}

function pruefe(ziel: HTMLElement, sitzung: Sitzung, antwort: string): void {
  const eintrag = sitzung.eintraege[sitzung.index]!;
  const richtig = normalisiere(antwort) === normalisiere(eintrag.aufgabe.loesung);
  sitzung.eingabe = antwort;
  sitzung.beantwortet = true;
  sitzung.warRichtig = richtig;
  sitzung.ergebnisse.push(richtig);
  if (richtig) {
    sitzung.richtig++;
    sitzung.serie++;
    sitzung.besteSerie = Math.max(sitzung.besteSerie, sitzung.serie);
  } else {
    sitzung.serie = 0;
    sitzung.fehlerTypen.push(eintrag.aufgabe.typ);
  }
  zeichne(ziel, sitzung);
}

/** Groß-/Kleinschreibung und Leerzeichen sollen nie über richtig/falsch entscheiden. */
function normalisiere(wert: string): string {
  return wert.trim().replace(/\s+/g, " ").toLowerCase();
}

/* -------------------------------------------------------------- Ergebnis */

function zeichneErgebnis(ziel: HTMLElement, sitzung: Sitzung): void {
  const fortschritt = ladeFortschritt();
  let ergebnis: RundenErgebnis;
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
    });
  } else {
    const proThema = new Map<ThemaId, { richtig: number; gesamt: number }>();
    sitzung.eintraege.forEach((eintrag, i) => {
      const stand = proThema.get(eintrag.thema) ?? { richtig: 0, gesamt: 0 };
      stand.gesamt++;
      if (sitzung.ergebnisse[i]) stand.richtig++;
      proThema.set(eintrag.thema, stand);
    });
    const eingabe: MixEingabe = {
      richtig: sitzung.richtig,
      gesamt: sitzung.eintraege.length,
      proThema: [...proThema.entries()].map(([id, stand]) => ({ thema: id, ...stand })),
      fehlerTypen: sitzung.fehlerTypen,
      besteSerie: sitzung.besteSerie,
    };
    if (sitzung.meister) {
      sekunden = vergangeneSekunden(sitzung);
      neueBestleistung = merkeMeisterErgebnis(fortschritt, sitzung.richtig, sekunden);
    }
    ergebnis = werteMixAus(fortschritt, eingabe);
  }

  const nochmal = (): void => {
    const neue = baueSitzung(sitzung.meister ? "meister" : (sitzung.themaId ?? "mix"));
    if (neue) zeichne(ziel, neue);
  };
  const karte = el(
    "section",
    { class: "karte karte-ergebnis" },
    el("div", { class: "ergebnis-sterne" }, sterneAnzeige(ergebnis.sterne)),
    el("h1", { class: "ergebnis-titel", text: lobText(ergebnis.richtig, ergebnis.gesamt) }),
    el("p", {
      class: "ergebnis-bilanz",
      text: `${ergebnis.richtig} von ${ergebnis.gesamt} Aufgaben richtig · +${ergebnis.punkte} Punkte`,
    })
  );

  if (sitzung.meister) {
    karte.appendChild(
      el(
        "p",
        { class: "ergebnis-zeit" },
        el("span", { "aria-hidden": "true", text: "⏱️ " }),
        `Deine Zeit: ${zeitText(sekunden)}`
      )
    );
    karte.appendChild(
      el("p", {
        class: neueBestleistung ? "ergebnis-aufstieg" : "hinweis",
        text: neueBestleistung
          ? "Neue Bestleistung!"
          : `Deine Bestleistung: ${fortschritt.meister.besteTreffer} richtig in ${zeitText(fortschritt.meister.besteZeit)}.`,
      })
    );
  }

  if (ergebnis.stufeAufgestiegen && sitzung.themaId) {
    karte.appendChild(
      el("p", {
        class: "ergebnis-aufstieg",
        text: `Stark! Ab jetzt übst du bei ${thema(sitzung.themaId).titel} auf Stufe ${sitzung.stufe + 1}.`,
      })
    );
  }

  for (const id of ergebnis.neueErfolge) {
    const erfolg = ERFOLGE.find((e) => e.id === id);
    if (!erfolg) continue;
    karte.appendChild(
      el(
        "div",
        { class: "erfolg-neu" },
        el("span", { class: "erfolg-symbol", "aria-hidden": "true", text: erfolg.symbol }),
        el("span", {}, el("strong", { text: `Neues Abzeichen: ${erfolg.titel}` }), el("br"), erfolg.text)
      )
    );
  }

  karte.appendChild(
    el(
      "div",
      { class: "ergebnis-knoepfe" },
      el("button", {
        class: "knopf knopf-gross knopf-haupt",
        type: "button",
        text: "Nochmal üben",
        onclick: nochmal,
      }),
      el("a", { class: "knopf knopf-gross", href: "#/", text: "Anderes Thema" })
    )
  );

  ziel.replaceChildren(karte);
}
