/**
 * Elternbereich: Überblick über den Lernstand, Stufen von Hand einstellen,
 * Namen ändern und den Fortschritt zurücksetzen.
 */

import { el } from "../dom.js";
import { SCHWERPUNKT_AB, TEMPO_AB, muehsameTypen, schwerpunkte } from "../gamification.js";
import { ladeFortschritt, setzeZurueck, speichereFortschritt } from "../state.js";
import {
  eingerichtet,
  familienCode,
  gleicheAb,
  neuerFamilienCode,
  normalisiereCode,
  setzeFamilienCode,
  zuletztAbgeglichen,
  type AbgleichErgebnis,
} from "../sync.js";
import { THEMEN, istThemaId } from "../topics.js";
import type { RouteHandler } from "../router.js";
import type { Fortschritt, Stufe, ThemaId } from "../types.js";

/**
 * Kennungen, deren Präfix nicht wörtlich einer Themen-Id entspricht. Ohne
 * diese Zuordnung stünde die rohe Kennung („puzzle/rechnung“) im Elternbereich.
 */
const BEREICHS_ALIAS: Record<string, ThemaId> = {
  sach: "sachaufgaben",
  puzzle: "plusminus",
};

/**
 * Was nach einem Abgleich in der Karte stehen soll – `null` heißt „alles gut,
 * kein Wort nötig“. Bewusst ohne DOM-Zugriff und deshalb direkt testbar.
 *
 * Der Grund der Gegenstelle wird DURCHGEREICHT: Bei fehlender KV-Bindung steht
 * dort die ganze Anleitung. Ohne sie sähe ein Elternteil nur eine Karte, die
 * aussieht, als hätte alles geklappt.
 */
export function abgleichMeldung(ergebnis: AbgleichErgebnis): string | null {
  if (ergebnis.art === "fehler") return `Das hat nicht geklappt: ${ergebnis.meldung}`;
  if (ergebnis.art === "aus") return "Dieses Gerät ist nicht verbunden.";
  return null;
}

/**
 * Meldung, die ein Neuzeichnen überleben muss.
 *
 * Ein geglückter Abgleich zeichnet die Karte neu (Code und Zeitpunkt ändern
 * sich). Stünde die Fehlermeldung nur im alten Absatz, wäre sie im selben
 * Moment weg – ein misslungener Abgleich sähe dann aus wie ein geglückter.
 * Genau das ist beim „Verbinden“ und beim „Code erzeugen“ passiert: Dort lief
 * `gleicheAb()` ganz ohne Auswertung ins Leere.
 */
let uebertrag: string | null = null;

/** Aufgabentyp („einmaleins/reihe-7“) in eine lesbare Beschreibung übersetzen. */
export function fehlerText(typ: string): string {
  const [bereich = "", rest = ""] = typ.split("/");
  const id = BEREICHS_ALIAS[bereich] ?? bereich;
  const gefunden = THEMEN.find((t) => t.id === id);
  const beschreibung = rest.replace(/-/g, " ");
  return gefunden ? `${gefunden.titel}: ${beschreibung}` : typ;
}

export const zeige: RouteHandler = (ziel) => {
  const fortschritt = ladeFortschritt();

  /*
   * Wer hier regelmäßig vorbeischaut, will die ZAHLEN sehen – Lernstand,
   * Fehler, Tempo. Die Erklärung, wie die Zahleneule funktioniert, braucht
   * man einmal; danach war sie eine Textwand VOR allen Daten. Der wichtigste
   * Satz (die Übungen passen sich selbst an) bleibt sichtbar, der Rest ist
   * aufklappbar – nichts davon ist gestrichen.
   */
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
    el(
      "details",
      {},
      el("summary", { text: "Mehr über die Zahleneule" }),
      el("p", {
        class: "fliesstext",
        text:
          "Themen mit der Marke „Heft“ kommen im Übungsheft der 2. Klasse vor. Sie stehen auf der " +
          "Startseite oben, werden zuerst empfohlen und häufiger ins gemischte Training gezogen.",
      }),
      el("p", {
        class: "fliesstext",
        text:
          "Die Zahleneule funktioniert ohne Internet. Nach dem ersten Aufruf liegt sie vollständig " +
          "auf dem Gerät – im Zug, im Ferienhaus oder bei ausgefallenem WLAN lässt sich genauso üben. " +
          "Über das Browsermenü („Zum Startbildschirm hinzufügen“) landet sie als eigenes Symbol auf " +
          "dem Tablet und startet ohne Adresszeile.",
      }),
      el("p", {
        class: "fliesstext",
        text:
          "Alle Daten bleiben auf diesem Gerät im Browserspeicher. Es gibt kein Konto, keinen Server " +
          "und keine Werbung.",
      })
    )
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

  ziel.replaceChildren(
    einleitung,
    uebersicht,
    fehlerkarte(fortschritt.fehler),
    tempokarte(fortschritt),
    abgleichKarte(ziel),
    einstellungen(fortschritt.name)
  );
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
    // Nur ab dem Schwellenwert wird eine Art tatsächlich gezielt wiederholt –
    // die Liste darf das nicht für jeden Einzelfehler behaupten.
    const wirdWiederholt = anzahl >= SCHWERPUNKT_AB;
    liste.appendChild(
      el(
        "li",
        {},
        el("strong", { text: fehlerText(typ) }),
        ` – ${anzahl}-mal falsch`,
        wirdWiederholt ? el("span", { class: "marke marke-heft", text: "wird wiederholt" }) : null
      )
    );
  }
  karte.append(
    el("p", {
      class: "hinweis",
      text:
        `Ab ${SCHWERPUNKT_AB} Fehlern kommt eine Aufgabenart gezielt häufiger dran; solche Zeilen ` +
        "sind unten markiert. Jede richtige Antwort baut den Zähler wieder ab – die Liste zeigt " +
        "also den aktuellen Stand, nicht alle Fehler seit Beginn.",
    }),
    liste
  );
  return karte;
}

/**
 * Die Flüssigkeits-Auswertung: Aufgabenarten, die richtig, aber auffällig
 * langsam gelöst werden. Richtig ist nicht gleich sicher – wer 7 · 8 erst
 * nach zwanzig Sekunden hat, zählt noch, statt abzurufen.
 *
 * Diese Zeiten stehen NUR hier. Das Kind bekommt nie eine Uhr zu sehen.
 */
function tempokarte(fortschritt: Fortschritt): HTMLElement {
  const karte = el(
    "section",
    { class: "karte" },
    el("h2", { class: "abschnitt-titel", text: "Richtig, aber langsam" })
  );
  const befunde = muehsameTypen(fortschritt);

  if (befunde.length === 0) {
    karte.appendChild(
      el("p", {
        class: "hinweis",
        text:
          "Keine Auffälligkeiten: Was oft genug geübt wurde, geht ähnlich flott von der Hand " +
          "wie vergleichbare Aufgaben.",
      })
    );
  } else {
    // Ob eine Art wirklich häufiger drankommt, entscheidet `schwerpunkte()` –
    // Fehler gehen vor, und die Plätze sind begrenzt. Die Karte darf nur
    // behaupten, was dort tatsächlich gewählt wurde.
    const wiederholt = schwerpunkte(fortschritt);
    const liste = el("ul", { class: "liste" });
    for (const befund of befunde) {
      liste.appendChild(
        el(
          "li",
          {},
          el("strong", { text: fehlerText(befund.typ) }),
          ` – etwa ${Math.round(befund.sekunden)} Sekunden, vergleichbare Aufgaben brauchen ` +
            `etwa ${Math.round(befund.ueblich)}`,
          wiederholt.has(befund.typ)
            ? el("span", { class: "marke marke-heft", text: "wird wiederholt" })
            : null
        )
      );
    }
    karte.append(liste);
  }

  karte.appendChild(
    el("p", {
      class: "hinweis",
      text:
        "Gemessen wird nur bei richtigen Antworten und erst ab " +
        `${TEMPO_AB} Messungen je Aufgabenart; verglichen wird immer mit ähnlichen Aufgaben ` +
        "desselben Themas. Dem Kind werden keine Zeiten angezeigt – langsame Arten kommen " +
        "einfach häufiger dran, bis sie flüssig sitzen.",
    })
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

/**
 * Die Synchronisierung zwischen Geräten. Sie steht bewusst im Elternbereich:
 * Einen Code erzeugen und übertragen ist Sache der Eltern, nicht des Kindes.
 */
function abgleichKarte(ziel: HTMLElement): HTMLElement {
  const karte = el("section", { class: "karte" }, el("h2", { class: "abschnitt-titel", text: "Auf mehreren Geräten" }));
  // Eine Meldung aus dem letzten Abgleich – sie hat das Neuzeichnen überdauert
  // und wird jetzt einmal gezeigt, danach ist sie verbraucht.
  if (uebertrag) {
    karte.appendChild(el("p", { class: "hinweis hinweis-fehler", role: "status", text: uebertrag }));
    uebertrag = null;
  }
  const neu = (): void => {
    void zeige(ziel, []);
  };
  /** Abgleich anstoßen und das Ergebnis IMMER anzeigen, auch den Fehlschlag. */
  const abgleichen = (): void => {
    void gleicheAb().then((ergebnis) => {
      uebertrag = abgleichMeldung(ergebnis);
      neu();
    });
  };

  if (!eingerichtet()) {
    karte.appendChild(
      el("p", {
        class: "fliesstext",
        text:
          "Noch nicht eingerichtet. Damit der Lernstand zwischen Tablet und Handy wandern kann, " +
          "muss einmalig eine Gegenstelle eingetragen werden – wie das geht, steht in der " +
          "README des Projekts unter „Auf mehreren Geräten“.",
      })
    );
    return karte;
  }

  const code = familienCode();
  if (!code) {
    const feld = el("input", {
      class: "eingabe",
      type: "text",
      maxlength: "12",
      autocapitalize: "characters",
      placeholder: "Code vom anderen Gerät",
      "aria-label": "Familiencode vom anderen Gerät",
    }) as HTMLInputElement;
    const meldung = el("p", { class: "hinweis" });

    karte.append(
      el("p", {
        class: "fliesstext",
        text:
          "Auf dem ERSTEN Gerät einen Code erzeugen, auf allen weiteren denselben Code eintippen. " +
          "Danach gleichen sich die Geräte beim Start und nach jeder Runde ab.",
      }),
      el("button", {
        class: "knopf knopf-haupt",
        type: "button",
        text: "Code für dieses Gerät erzeugen",
        onclick: () => {
          setzeFamilienCode(neuerFamilienCode());
          // Erst den frischen Code zeigen, dann abgleichen – eine lahmende
          // Gegenstelle darf die Karte nicht minutenlang leer stehen lassen.
          neu();
          abgleichen();
        },
      }),
      el("p", { class: "hinweis", text: "oder einen vorhandenen Code eintippen:" }),
      el(
        "form",
        {
          class: "namensfeld-zeile",
          onsubmit: (ereignis: Event) => {
            ereignis.preventDefault();
            const geprueft = normalisiereCode(feld.value);
            if (!geprueft) {
              meldung.textContent = "Das sind nicht acht gültige Zeichen.";
              return;
            }
            setzeFamilienCode(geprueft);
            neu();
            abgleichen();
          },
        },
        feld,
        el("button", { class: "knopf", type: "submit", text: "Verbinden" })
      ),
      meldung
    );
    return karte;
  }

  const zuletzt = zuletztAbgeglichen();
  const meldung = el("p", { class: "hinweis" });
  karte.append(
    el("p", { class: "fliesstext", text: "Dieses Gerät gehört zum Code:" }),
    el("p", { class: "familiencode", text: code.replace(/(.{4})(.{4})/, "$1-$2") }),
    el("p", {
      class: "hinweis",
      text: zuletzt
        ? `Zuletzt abgeglichen: ${new Date(zuletzt).toLocaleString("de-DE")}`
        : "Noch nicht abgeglichen.",
    }),
    el(
      "div",
      { class: "knopfzeile" },
      el("button", {
        class: "knopf",
        type: "button",
        text: "Jetzt abgleichen",
        onclick: () => {
          meldung.textContent = "Wird abgeglichen …";
          abgleichen();
        },
      }),
      el("button", {
        class: "knopf knopf-still",
        type: "button",
        text: "Dieses Gerät lösen",
        onclick: () => {
          setzeFamilienCode(null);
          neu();
        },
      })
    ),
    meldung,
    el("p", {
      class: "fliesstext hinweis",
      text:
        "Beim Abgleich werden gesammelte Punkte, Herzen, Sterne und Erfolge beider Geräte " +
        "zusammengeführt – dabei geht nichts verloren. Stufe, Streak und Fehlerbilanz kommen von " +
        "dem Gerät, auf dem zuletzt geübt wurde.",
    })
  );
  return karte;
}

function hinweisZeigen(karte: HTMLElement, text: string): void {
  const alt = karte.querySelector(".gespeichert");
  if (alt) alt.remove();
  karte.appendChild(el("p", { class: "gespeichert", role: "status", text }));
}
