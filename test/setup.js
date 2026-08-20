/**
 * In-Memory-`localStorage` für die Tests. Damit lassen sich die kompilierten
 * Module aus `js/` direkt mit `node:test` importieren – ohne Browser und ohne
 * Test-Framework als Abhängigkeit.
 */

class SpeicherAttrappe {
  #daten = new Map();

  get length() {
    return this.#daten.size;
  }

  getItem(schluessel) {
    return this.#daten.has(String(schluessel)) ? this.#daten.get(String(schluessel)) : null;
  }

  setItem(schluessel, wert) {
    this.#daten.set(String(schluessel), String(wert));
  }

  removeItem(schluessel) {
    this.#daten.delete(String(schluessel));
  }

  clear() {
    this.#daten.clear();
  }

  key(index) {
    return [...this.#daten.keys()][index] ?? null;
  }
}

globalThis.localStorage = new SpeicherAttrappe();
