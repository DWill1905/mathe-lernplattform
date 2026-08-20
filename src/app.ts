/**
 * Einstiegspunkt: Routentabelle, Code-Splitting und Service-Worker.
 *
 * Ansichten werden per `import()` nachgeladen. Damit die Seite auch offline
 * vollständig bleibt, lädt `alleVorladen()` im Leerlauf jede Ansicht nach –
 * eine neue Route braucht deshalb IMMER zwei Einträge: die Ladefunktion in
 * `ANSICHTEN` und (dadurch automatisch) ihren Platz im Vorladen.
 */

import { el } from "./dom.js";
import { starteRouter, type RouteHandler } from "./router.js";
import { baueShell, frischeShellAuf } from "./shell.js";

interface Ansicht {
  zeige: RouteHandler;
}

const ANSICHTEN: Record<string, () => Promise<Ansicht>> = {
  start: () => import("./views/start.js"),
  uebung: () => import("./views/uebung.js"),
  fortschritt: () => import("./views/fortschritt.js"),
  eltern: () => import("./views/eltern.js"),
};

function nichtGefunden(ziel: HTMLElement): void {
  ziel.replaceChildren(
    el(
      "section",
      { class: "karte karte-mitte" },
      el("h1", { text: "Diese Seite gibt es nicht" }),
      el("p", { text: "Vielleicht hilft ein Blick auf die Startseite." }),
      el("a", { class: "knopf knopf-gross", href: "#/", text: "Zur Startseite" })
    )
  );
}

function aufloesen(teile: string[]): RouteHandler {
  const name = teile[0] ?? "start";
  const laden = ANSICHTEN[name];
  if (!laden) return nichtGefunden;
  return async (ziel, parameter) => {
    try {
      const modul = await laden();
      await modul.zeige(ziel, parameter);
    } catch (fehler) {
      zeigeFehler(ziel, fehler);
    } finally {
      frischeShellAuf();
    }
  };
}

function zeigeFehler(ziel: HTMLElement, fehler: unknown): void {
  console.error(fehler);
  ziel.replaceChildren(
    el(
      "section",
      { class: "karte karte-mitte" },
      el("h1", { text: "Da ist etwas schiefgelaufen" }),
      el("p", { text: "Lade die Seite neu. Dein Fortschritt bleibt gespeichert." }),
      el("button", { class: "knopf knopf-gross", onclick: () => location.reload(), text: "Neu laden" })
    )
  );
}

/** Alle übrigen Ansichten im Leerlauf nachladen – hält die App offline vollständig. */
function alleVorladen(): void {
  const nachladen = (): void => {
    for (const laden of Object.values(ANSICHTEN)) void laden().catch(() => undefined);
  };
  if ("requestIdleCallback" in window) {
    (window as unknown as { requestIdleCallback: (cb: () => void) => void }).requestIdleCallback(nachladen);
  } else {
    setTimeout(nachladen, 2000);
  }
}

function starte(): void {
  const wurzel = document.getElementById("app");
  if (!wurzel) throw new Error("Kein Wurzelelement #app gefunden");
  const inhalt = baueShell(wurzel);
  starteRouter(inhalt, aufloesen);
  alleVorladen();

  if ("serviceWorker" in navigator && location.protocol.startsWith("http")) {
    window.addEventListener("load", () => {
      void navigator.serviceWorker.register("./sw.js").catch(() => undefined);
    });
  }
}

starte();
