import { el } from "../dom.js";
import { empfehlung, levelInfo } from "../gamification.js";
import { ladeFortschritt, speichereFortschritt } from "../state.js";
import { THEMEN, thema } from "../topics.js";
import type { RouteHandler } from "../router.js";

/** Sterne als Text – barrierefrei mit Klartext-Beschriftung. */
export function sterneAnzeige(anzahl: number): HTMLElement {
  const text = "★★★☆☆☆".slice(3 - anzahl, 6 - anzahl);
  return el("span", { class: "sterne", "aria-label": `${anzahl} von 3 Sternen`, text });
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
      el("span", { class: "knopf-symbol", "aria-hidden": "true", text: "🎲" }),
      el(
        "span",
        {},
        el("span", { class: "knopf-titel", text: "Gemischtes Training" }),
        el("span", { class: "knopf-unter", text: "10 Aufgaben aus allen Themen" })
      )
    ),
    el(
      "a",
      { class: "knopf knopf-gross", href: "#/rechenmeister" },
      el("span", { class: "knopf-symbol", "aria-hidden": "true", text: "⏱️" }),
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
      el("span", { class: "knopf-symbol", "aria-hidden": "true", text: naechstes.symbol }),
      el(
        "span",
        {},
        el("span", { class: "knopf-titel", text: `Weiter mit ${naechstes.titel}` }),
        el("span", { class: "knopf-unter", text: naechstes.kurz })
      )
    )
  );

  const kacheln = el("div", { class: "kacheln" });
  for (const eintrag of THEMEN) {
    const stand = fortschritt.themen[eintrag.id];
    kacheln.appendChild(
      el(
        "a",
        { class: `kachel kachel-${eintrag.farbe}`, href: `#/uebung/${eintrag.id}` },
        el("span", { class: "kachel-symbol", "aria-hidden": "true", text: eintrag.symbol }),
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

  ziel.replaceChildren(
    begruessung,
    schnellstart,
    el("h2", { class: "abschnitt-titel", text: "Alle Themen" }),
    kacheln
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
