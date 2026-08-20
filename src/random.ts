/**
 * Einzige Zufallsquelle des Projekts. `Math.random()` wird bewusst nirgends
 * verwendet: Mit einem Seed lässt sich jede Übungsrunde exakt reproduzieren –
 * das macht die Aufgaben-Generatoren testbar.
 */

export interface Rng {
  /** Gleichverteilte Zahl in [0, 1). */
  next(): number;
  /** Ganze Zahl in [min, max] – beide Grenzen eingeschlossen. */
  int(min: number, max: number): number;
  /** Ein zufälliges Element der Liste. */
  pick<T>(liste: readonly T[]): T;
  /** Neue, gemischte Kopie der Liste (Fisher-Yates). */
  shuffle<T>(liste: readonly T[]): T[];
  /** Trifft mit Wahrscheinlichkeit p zu. */
  chance(p: number): boolean;
}

/** Schneller 32-Bit-PRNG mit guter Verteilung (Public Domain). */
export function mulberry32(seed: number): Rng {
  let a = seed >>> 0;
  const next = (): number => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  const rng: Rng = {
    next,
    int(min, max) {
      if (max < min) [min, max] = [max, min];
      return min + Math.floor(next() * (max - min + 1));
    },
    pick(liste) {
      if (liste.length === 0) throw new Error("pick() auf leerer Liste");
      return liste[rng.int(0, liste.length - 1)]!;
    },
    shuffle(liste) {
      const kopie = liste.slice();
      for (let i = kopie.length - 1; i > 0; i--) {
        const j = rng.int(0, i);
        [kopie[i], kopie[j]] = [kopie[j]!, kopie[i]!];
      }
      return kopie;
    },
    chance(p) {
      return next() < p;
    },
  };
  return rng;
}

/** Seed aus der aktuellen Zeit – für echte Übungsrunden im Browser. */
export function zufallsSeed(): number {
  return (Date.now() ^ Math.floor(performance.now() * 1000)) >>> 0;
}
