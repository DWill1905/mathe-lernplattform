import { el } from "../dom.js";
import { icon } from "../icons.js";
import { empfehlung, levelInfo } from "../gamification.js";
import { ladeFortschritt, speichereFortschritt } from "../state.js";
import { HEFT_THEMEN, WEITERE_THEMEN, thema } from "../topics.js";
import type { RouteHandler } from "../router.js";

/** Drei Sterne, davon `anzahl` gefüllt – mit Klartext für Screenreader. */
export function sterneAnzeige(anzahl: number): HTMLElement {
  const reihe = el("span", { class: "sterne", role: "img", "aria-label": `${anzahl} von 3 Sternen` });
  for (let i = 1; i <= 3; i++) {
    reihe.appendChild(icon(i <= anzahl ? "stern" : "sternLeer", i <= anzahl ? "stern-voll" : "stern-leer"));
  }
  return reihe;
}

export const zeige: RouteHandler = (ziel) => {
  const fortschritt = ladeFortschritt();
  const level = levelInfo(fortschritt.punkte);
  const naechstes = thema(empfehlung(fortschritt));

  const begruessung = el(
    "section",
    { class: "karte karte-begruessung" },
    el("h1", { class: "begruessung-titel", text: fortschritt.name ? `Hallo ${fortschritt.name}!` : "Hallo!" }),
    el("p", { class: "begruessung-text", text: "Womit möchtest du heute rechnen?" }),
    el(
      "div",
      { class: "level-leiste" },
      el(
        "div",
        { class: "level-kopf" },
        el("span", { class: "level-titel", text: `Level ${level.stufe} · ${level.titel}` }),
        el("span", { class: "level-punkte", text: `${fortschritt.punkte} Punkte` })
      ),
      el(
        "div",
        {
          class: "balken",
          role: "progressbar",
          "aria-valuemin": "0",
          "aria-valuemax": "100",
          "aria-valuenow": String(Math.round(level.anteil * 100)),
          "aria-label": "Fortschritt bis zum nächsten Level",
        },
        el("div", { class: "balken-fuellung", stil: { width: `${Math.round(level.anteil * 100)}%` } })
      ),
      el("p", {
        class: "level-rest",
        text:
          level.levelBreite - level.imLevel > 0
            ? `Noch ${level.levelBreite - level.imLevel} Punkte bis Level ${level.stufe + 1}.`
            : "Nächstes Level erreicht!",
      })
    )
  );

  if (!fortschritt.name) begruessung.appendChild(namensFeld());

  const schnellstart = el(
    "section",
    { class: "schnellstart" },
    el(
      "a",
      { class: "knopf knopf-gross knopf-haupt", href: "#/uebung/mix" },
      icon("wuerfel", "knopf-symbol"),
      el(
        "span",
        {},
        el("span", { class: "knopf-titel", text: "Gemischtes Training" }),
        el("span", { class: "knopf-unter", text: "10 Aufgaben aus allen Themen" })
      )
    ),
    el(
      "a",
      { class: "knopf knopf-gross", href: "#/raetsel" },
      icon("buchstaben", "knopf-symbol"),
      el(
        "span",
        {},
        el("span", { class: "knopf-titel", text: "Rätselwort" }),
        el("span", { class: "knopf-unter", text: "Rechne und finde das geheime Wort" })
      )
    ),
    el(
      "a",
      { class: "knopf knopf-gross", href: "#/rechenmeister" },
      icon("stoppuhr", "knopf-symbol"),
      el(
        "span",
        {},
        el("span", { class: "knopf-titel", text: "Rechenmeister" }),
        el("span", {
          class: "knopf-unter",
          text:
            fortschritt.meister.besteTreffer > 0
              ? `20 Aufgaben gegen die Uhr · Bestleistung ${fortschritt.meister.besteTreffer} richtig`
              : "20 Aufgaben gegen die Uhr",
        })
      )
    ),
    el(
      "a",
      { class: "knopf knopf-gross", href: `#/uebung/${naechstes.id}` },
      icon(naechstes.symbol, "knopf-symbol"),
      el(
        "span",
        {},
        el("span", { class: "knopf-titel", text: `Weiter mit ${naechstes.titel}` }),
        el("span", { class: "knopf-unter", text: naechstes.kurz })
      )
    )
  );

  const kachelgitter = (liste: typeof HEFT_THEMEN): HTMLElement => {
    const kacheln = el("div", { class: "kacheln" });
    for (const eintrag of liste) {
      const stand = fortschritt.themen[eintrag.id];
      kacheln.appendChild(
        el(
          "a",
          { class: `kachel kachel-${eintrag.farbe}`, href: `#/uebung/${eintrag.id}` },
          icon(eintrag.symbol, "kachel-symbol"),
          el("span", { class: "kachel-titel", text: eintrag.titel }),
          el("span", { class: "kachel-kurz", text: eintrag.kurz }),
          el(
            "span",
            { class: "kachel-fuss" },
            el("span", { class: "marke", text: `Stufe ${stand.stufe}` }),
            sterneAnzeige(stand.sterne)
          )
        )
      );
    }
    return kacheln;
  };

  ziel.replaceChildren(
    begruessung,
    schnellstart,
    el("h2", { class: "abschnitt-titel", text: "Aus dem Übungsheft" }),
    kachelgitter(HEFT_THEMEN),
    el("h2", { class: "abschnitt-titel abschnitt-titel-weit", text: "Weitere Themen" }),
    el("p", { class: "hinweis", text: "Zusatzübungen, die im Heft nicht vorkommen." }),
    kachelgitter(WEITERE_THEMEN)
  );
};

function namensFeld(): HTMLElement {
  const eingabe = el("input", {
    class: "eingabe",
    type: "text",
    maxlength: "20",
    placeholder: "Dein Name",
    "aria-label": "Dein Name",
  });
  const speichern = (): void => {
    const name = eingabe.value.trim();
    if (!name) return;
    const fortschritt = ladeFortschritt();
    fortschritt.name = name.slice(0, 20);
    speichereFortschritt(fortschritt);
    location.reload();
  };
  eingabe.addEventListener("keydown", (ereignis) => {
    if ((ereignis as KeyboardEvent).key === "Enter") speichern();
  });
  return el(
    "form",
    {
      class: "namensfeld",
      onsubmit: (ereignis: Event) => {
        ereignis.preventDefault();
        speichern();
      },
    },
    el("label", { class: "namensfeld-text", text: "Wie heißt du?" }),
    el("div", { class: "namensfeld-zeile" }, eingabe, el("button", { class: "knopf", type: "submit", text: "Los" }))
  );
}
