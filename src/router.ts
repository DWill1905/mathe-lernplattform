/**
 * Winziger Hash-Router. Routen-Handler dürfen asynchron sein – der Router
 * wartet auf sie und verwirft ein Ergebnis, das zu spät kommt (etwa weil
 * währenddessen weitergeklickt wurde).
 */

export type RouteHandler = (ziel: HTMLElement, parameter: readonly string[]) => void | Promise<void>;

export function pfadTeile(): string[] {
  const roh = location.hash.replace(/^#\/?/, "");
  return roh.split("/").filter((teil) => teil.length > 0);
}

export function starteRouter(ziel: HTMLElement, aufloesen: (teile: string[]) => RouteHandler): void {
  let laufendeNummer = 0;

  const anzeigen = (): void => {
    const nummer = ++laufendeNummer;
    const teile = pfadTeile();
    const handler = aufloesen(teile);
    const ergebnis = handler(ziel, teile);
    if (ergebnis instanceof Promise) {
      void ergebnis.then(() => {
        if (nummer !== laufendeNummer) return;
        ziel.scrollTo?.({ top: 0 });
      });
    }
    window.scrollTo({ top: 0 });
  };

  window.addEventListener("hashchange", anzeigen);
  anzeigen();
}
