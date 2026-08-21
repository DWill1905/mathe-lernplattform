import { el } from "../dom.js";
import { ERFOLGE, levelInfo, zeitText } from "../gamification.js";
import { ladeFortschritt, tagesSchluessel } from "../state.js";
import { THEMEN } from "../topics.js";
import type { RouteHandler } from "../router.js";
import type { Fortschritt } from "../types.js";
import { sterneAnzeige } from "./start.js";

const WOCHENTAGE = ["So", "Mo", "Di", "Mi", "Do", "Fr", "Sa"];

export const zeige: RouteHandler = (ziel) => {
  const fortschritt = ladeFortschritt();
  const level = levelInfo(fortschritt.punkte);
  const gesamt = summe(fortschritt, "gesamt");
  const richtig = summe(fortschritt, "richtig");
  const quote = gesamt === 0 ? 0 : Math.round((richtig / gesamt) * 100);
  const sterne = Object.values(fortschritt.themen).reduce((s, t) => s + t.sterne, 0);

  const uebersicht = el(
    "section",
    { class: "karte" },
    el("h1", { class: "seiten-titel", text: "Dein Fortschritt" }),
    el(
      "div",
      { class: "kennzahlen" },
      kennzahl("Level", String(level.stufe), level.titel),
      kennzahl("Punkte", String(fortschritt.punkte), "insgesamt gesammelt"),
      kennzahl("Aufgaben", String(gesamt), `davon ${richtig} richtig`),
      kennzahl("Trefferquote", `${quote} %`, "über alle Themen"),
      kennzahl("Sterne", `${sterne} / ${THEMEN.length * 3}`, "aus allen Themen"),
      kennzahl("Serie", String(fortschritt.streakTage), fortschritt.streakTage === 1 ? "Tag" : "Tage in Folge"),
      kennzahl(
        "Herzen",
        String(fortschritt.herzen),
        fortschritt.herzen === 1 ? "Hilfsaufgabe gelöst" : "Hilfsaufgaben gelöst"
      ),
      fortschritt.meister.besteTreffer > 0
        ? kennzahl(
            "Rechenmeister",
            `${fortschritt.meister.besteTreffer} / 20`,
            `Bestzeit ${zeitText(fortschritt.meister.besteZeit)}`
          )
        : kennzahl("Rechenmeister", "–", "noch nicht gelaufen")
    )
  );

  const themenliste = el("section", { class: "karte" }, el("h2", { class: "abschnitt-titel", text: "Themen" }));
  for (const eintrag of THEMEN) {
    const stand = fortschritt.themen[eintrag.id];
    const themenQuote = stand.gesamt === 0 ? 0 : Math.round((stand.richtig / stand.gesamt) * 100);
    themenliste.appendChild(
      el(
        "a",
        { class: "themenzeile", href: `#/uebung/${eintrag.id}` },
        el("span", { class: "themenzeile-symbol", "aria-hidden": "true", text: eintrag.symbol }),
        el(
          "span",
          { class: "themenzeile-mitte" },
          el(
            "span",
            { class: "themenzeile-kopf" },
            el("strong", { text: eintrag.titel }),
            el("span", { class: "marke", text: `Stufe ${stand.stufe}` })
          ),
          el(
            "span",
            { class: "balken balken-schmal" },
            el("span", { class: "balken-fuellung", stil: { width: `${themenQuote}%` } })
          ),
          el("span", {
            class: "themenzeile-text",
            text:
              stand.gesamt === 0
                ? "Noch nicht geübt"
                : `${stand.richtig} von ${stand.gesamt} richtig (${themenQuote} %)`,
          })
        ),
        sterneAnzeige(stand.sterne)
      )
    );
  }

  // Nur bekannte Kennungen zählen: Ein von Hand bearbeiteter oder veralteter
  // Spielstand darf nicht „23 von 15 Abzeichen“ behaupten.
  const gesammelt = ERFOLGE.filter((e) => fortschritt.erfolge.includes(e.id)).length;
  const abzeichen = el(
    "section",
    { class: "karte" },
    el("h2", { class: "abschnitt-titel", text: "Abzeichen" }),
    el("p", {
      class: "hinweis",
      text: `${gesammelt} von ${ERFOLGE.length} Abzeichen gesammelt.`,
    })
  );
  const gitter = el("div", { class: "abzeichen" });
  for (const erfolg of ERFOLGE) {
    const geschafft = fortschritt.erfolge.includes(erfolg.id);
    gitter.appendChild(
      el(
        "div",
        { class: `abzeichen-karte${geschafft ? "" : " abzeichen-offen"}` },
        el("span", { class: "abzeichen-symbol", "aria-hidden": "true", text: geschafft ? erfolg.symbol : "🔒" }),
        el("strong", { class: "abzeichen-titel", text: erfolg.titel }),
        el("span", { class: "abzeichen-text", text: erfolg.text })
      )
    );
  }
  abzeichen.appendChild(gitter);

  ziel.replaceChildren(uebersicht, aktivitaet(fortschritt), themenliste, abzeichen);
};

function summe(f: Fortschritt, feld: "gesamt" | "richtig"): number {
  return Object.values(f.themen).reduce((s, t) => s + t[feld], 0);
}

function kennzahl(titel: string, wert: string, unter: string): HTMLElement {
  return el(
    "div",
    { class: "kennzahl" },
    el("span", { class: "kennzahl-titel", text: titel }),
    el("span", { class: "kennzahl-wert", text: wert }),
    el("span", { class: "kennzahl-unter", text: unter })
  );
}

/** Balken für die letzten 14 Tage – zeigt, wie regelmäßig geübt wird. */
function aktivitaet(f: Fortschritt): HTMLElement {
  const tage: { tag: string; gesamt: number; datum: Date }[] = [];
  for (let i = 13; i >= 0; i--) {
    const datum = new Date();
    datum.setDate(datum.getDate() - i);
    const schluessel = tagesSchluessel(datum);
    const eintrag = f.verlauf.find((e) => e.tag === schluessel);
    tage.push({ tag: schluessel, gesamt: eintrag?.gesamt ?? 0, datum });
  }
  const hoechster = Math.max(10, ...tage.map((t) => t.gesamt));

  const saeulen = el("div", { class: "aktivitaet" });
  for (const tag of tage) {
    const anteil = Math.round((tag.gesamt / hoechster) * 100);
    saeulen.appendChild(
      el(
        "div",
        {
          class: "aktivitaet-tag",
          title: `${tag.datum.toLocaleDateString("de-DE")}: ${tag.gesamt} Aufgaben`,
        },
        el(
          "div",
          { class: "aktivitaet-saeule" },
          el("div", {
            class: `aktivitaet-fuellung${tag.gesamt > 0 ? "" : " aktivitaet-leer"}`,
            stil: { height: `${Math.max(anteil, tag.gesamt > 0 ? 12 : 4)}%` },
          })
        ),
        el("span", { class: "aktivitaet-text", text: WOCHENTAGE[tag.datum.getDay()] ?? "" })
      )
    );
  }

  return el(
    "section",
    { class: "karte" },
    el("h2", { class: "abschnitt-titel", text: "Die letzten zwei Wochen" }),
    saeulen
  );
}
