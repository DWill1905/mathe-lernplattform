/**
 * Elternbereich: Überblick über den Lernstand, Stufen von Hand einstellen,
 * Namen ändern und den Fortschritt zurücksetzen.
 */

import { el } from "../dom.js";
import { ladeFortschritt, setzeZurueck, speichereFortschritt } from "../state.js";
import { THEMEN, istThemaId } from "../topics.js";
import type { RouteHandler } from "../router.js";
import type { Stufe, ThemaId } from "../types.js";

/** Aufgabentyp („einmaleins/reihe-7“) in eine lesbare Beschreibung übersetzen. */
export function fehlerText(typ: string): string {
  const [bereich = "", rest = ""] = typ.split("/");
  const gefunden = THEMEN.find((t) => t.id === bereich || (bereich === "sach" && t.id === "sachaufgaben"));
  const beschreibung = rest.replace(/-/g, " ");
  return gefunden ? `${gefunden.titel}: ${beschreibung}` : typ;
}

export const zeige: RouteHandler = (ziel) => {
  const fortschritt = ladeFortschritt();

  const einleitung = el(
    "section",
    { class: "karte" },
    el("h1", { class: "seiten-titel", text: "Für Eltern" }),
    el("p", {
      class: "fliesstext",
      text:
        "Die Übungen passen sich selbst an: Nach einer fast fehlerfreien Runde geht es eine Stufe " +
        "höher, nach einer sehr schwachen Runde eine Stufe zurück. Unten können Sie die Stufe auch " +
        "von Hand einstellen.",
    }),
    el("p", {
      class: "fliesstext",
      text:
        "Themen mit der Marke „Heft“ kommen im Übungsheft der 2. Klasse vor. Sie stehen auf der " +
        "Startseite oben, werden zuerst empfohlen und häufiger ins gemischte Training gezogen.",
    }),
    el("p", {
      class: "fliesstext",
      text:
        "Alle Daten bleiben auf diesem Gerät im Browserspeicher. Es gibt kein Konto, keinen Server " +
        "und keine Werbung.",
    })
  );

  const tabelle = el(
    "table",
    { class: "tabelle" },
    el(
      "thead",
      {},
      el(
        "tr",
        {},
        el("th", { text: "Thema" }),
        el("th", { text: "Aufgaben" }),
        el("th", { text: "Richtig" }),
        el("th", { text: "Stufe" })
      )
    )
  );
  const koerper = el("tbody", {});
  for (const eintrag of THEMEN) {
    const stand = fortschritt.themen[eintrag.id];
    const quote = stand.gesamt === 0 ? "–" : `${Math.round((stand.richtig / stand.gesamt) * 100)} %`;
    koerper.appendChild(
      el(
        "tr",
        {},
        el(
          "td",
          {},
          eintrag.titel,
          eintrag.ausHeft ? el("span", { class: "marke marke-heft", text: "Heft" }) : null
        ),
        el("td", { class: "zahl", text: String(stand.gesamt) }),
        el("td", { class: "zahl", text: quote }),
        el("td", {}, stufenWahl(eintrag.id, stand.stufe))
      )
    );
  }
  tabelle.appendChild(koerper);

  const uebersicht = el(
    "section",
    { class: "karte" },
    el("h2", { class: "abschnitt-titel", text: "Lernstand je Thema" }),
    el("div", { class: "tabelle-huelle" }, tabelle),
    el("details", {}, el("summary", { text: "Was wird in den Stufen geübt?" }), stufenErklaerung())
  );

  ziel.replaceChildren(einleitung, uebersicht, fehlerkarte(fortschritt.fehler), einstellungen(fortschritt.name));
};

function stufenWahl(id: ThemaId, aktuell: Stufe): HTMLElement {
  const auswahl = el("select", { class: "auswahlfeld", "aria-label": "Stufe einstellen" });
  for (const stufe of [1, 2, 3] as const) {
    const option = el("option", { value: String(stufe), text: `Stufe ${stufe}` });
    if (stufe === aktuell) option.setAttribute("selected", "");
    auswahl.appendChild(option);
  }
  auswahl.addEventListener("change", () => {
    const neu = Number(auswahl.value);
    if (!istThemaId(id) || ![1, 2, 3].includes(neu)) return;
    const fortschritt = ladeFortschritt();
    fortschritt.themen[id].stufe = neu as Stufe;
    speichereFortschritt(fortschritt);
  });
  return auswahl;
}

function stufenErklaerung(): HTMLElement {
  const liste = el("ul", { class: "liste" });
  for (const eintrag of THEMEN) {
    liste.appendChild(
      el(
        "li",
        {},
        el("strong", { text: `${eintrag.titel}: ` }),
        eintrag.stufen.map((text, i) => `${i + 1}. ${text}`).join(" · ")
      )
    );
  }
  return liste;
}

function fehlerkarte(fehler: Record<string, number>): HTMLElement {
  const karte = el(
    "section",
    { class: "karte" },
    el("h2", { class: "abschnitt-titel", text: "Wo es gerade hakt" })
  );
  const sortiert = Object.entries(fehler)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8);
  if (sortiert.length === 0) {
    karte.appendChild(
      el("p", { class: "hinweis", text: "Zurzeit gibt es keine auffälligen Fehler." })
    );
    return karte;
  }
  const liste = el("ul", { class: "liste" });
  for (const [typ, anzahl] of sortiert) {
    liste.appendChild(
      el("li", {}, el("strong", { text: fehlerText(typ) }), ` – ${anzahl}-mal falsch`)
    );
  }
  karte.append(
    el("p", {
      class: "hinweis",
      text:
        "Diese Aufgabenarten kommen ab zwei Fehlern gezielt häufiger dran. Jede richtige " +
        "Antwort baut den Zähler wieder ab – die Liste zeigt also den aktuellen Stand, nicht alle " +
        "Fehler seit Beginn.",
    }),
    liste
  );
  return karte;
}

function einstellungen(name: string): HTMLElement {
  const nameFeld = el("input", {
    class: "eingabe",
    type: "text",
    maxlength: "20",
    value: name,
    "aria-label": "Name des Kindes",
    placeholder: "Name des Kindes",
  });

  const speichern = el("button", {
    class: "knopf",
    type: "button",
    text: "Namen speichern",
    onclick: () => {
      const fortschritt = ladeFortschritt();
      fortschritt.name = nameFeld.value.trim().slice(0, 20);
      speichereFortschritt(fortschritt);
      hinweisZeigen(karte, "Name gespeichert.");
    },
  });

  const loeschen = el("button", {
    class: "knopf knopf-warnung",
    type: "button",
    text: "Fortschritt zurücksetzen",
    onclick: () => {
      if (!confirm("Wirklich den gesamten Fortschritt löschen? Das kann nicht rückgängig gemacht werden.")) {
        return;
      }
      setzeZurueck();
      location.hash = "#/";
      location.reload();
    },
  });

  const karte = el(
    "section",
    { class: "karte" },
    el("h2", { class: "abschnitt-titel", text: "Einstellungen" }),
    el("div", { class: "einstellung-zeile" }, nameFeld, speichern),
    el("p", {
      class: "hinweis",
      text: "Beim Zurücksetzen werden Punkte, Sterne, Abzeichen und alle Statistiken gelöscht.",
    }),
    loeschen
  );
  return karte;
}

function hinweisZeigen(karte: HTMLElement, text: string): void {
  const alt = karte.querySelector(".gespeichert");
  if (alt) alt.remove();
  karte.appendChild(el("p", { class: "gespeichert", role: "status", text }));
}
