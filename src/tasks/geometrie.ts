import type { Rng } from "../random.js";
import type { Aufgabe, Stufe } from "../types.js";
import {
  ALLE_FORMEN,
  eckenZahl,
  form,
  formVariante,
  formenreihe,
  mitArtikel,
  puzzleHoehen,
  puzzleteil,
  spiegelachse,
  type FormName,
  type Zeichenform,
} from "../figures.js";
import { auswahlfeld, zahlfeld } from "./helpers.js";

/** Körper mit ihren Kennzahlen – für die Fragen der dritten Stufe. */
const KOERPER: readonly { name: string; ecken: number; flaechen: number; kanten: number }[] = [
  { name: "Würfel", ecken: 8, flaechen: 6, kanten: 12 },
  { name: "Quader", ecken: 8, flaechen: 6, kanten: 12 },
];

export function geometrie(rng: Rng, stufe: Stufe): Aufgabe {
  // Die Musteraufgaben brauchen die Stufe: Sie bestimmt, wie lang das
  // Grundmuster werden darf.
  const varianten: ((rng: Rng, stufe: Stufe) => Aufgabe)[] =
    stufe === 1
      ? [formErkennen, formErkennen, formMitEcken, puzzle, passtNicht, musterRechts]
      : stufe === 2
        ? [
            eckenZaehlen,
            seitenZaehlen,
            formMitEcken,
            puzzle,
            passtNicht,
            musterRechts,
            musterLinks,
            grundmusterAufgabe,
          ]
        : [symmetrie, koerper, umfangQuadrat, umfangRechteck, passtNicht, musterLinks, grundmusterAufgabe];
  return rng.pick(varianten)(rng, stufe);
}

/* ------------------------------------------- Formen und Muster (Heft) */

/**
 * Die Gruppen aus „Welche Form passt jeweils nicht?“ im Heft: ein Kästchen
 * heißt „Quadrate“ und enthält lauter Quadrate – und einen Fast-Treffer.
 * Verglichen wird also die Form selbst, nicht die Eckenzahl: Ein Rechteck
 * unter Quadraten hat genauso vier Ecken, und genau darum geht es.
 */
const FORMGRUPPEN: readonly {
  mehrzahl: string;
  form: FormName;
  ausreisser: readonly Zeichenform[];
  warum: string;
}[] = [
  {
    mehrzahl: "Quadrate",
    form: "Quadrat",
    ausreisser: ["Rechteck", "Trapez"],
    warum: "Beim Quadrat sind alle vier Seiten gleich lang.",
  },
  {
    mehrzahl: "Rechtecke",
    form: "Rechteck",
    // Kein Quadrat als Ausreißer: Ein Quadrat IST ein Rechteck – die Aufgabe
    // hätte dann keine richtige Antwort.
    ausreisser: ["Trapez", "Raute"],
    warum: "Beim Rechteck stehen alle vier Ecken gerade, wie bei einer Postkarte.",
  },
  {
    mehrzahl: "Dreiecke",
    form: "Dreieck",
    ausreisser: ["Quadrat", "Rechteck", "Trapez"],
    warum: "Ein Dreieck hat genau drei Ecken.",
  },
  {
    mehrzahl: "Kreise",
    form: "Kreis",
    ausreisser: ["Ellipse", "Sechseck"],
    warum: "Ein Kreis ist überall gleich rund.",
  },
];

/**
 * Wie eine Form heißt. „Ellipse“ ist kein Wort für die 2. Klasse – sie wird
 * deshalb beschrieben statt benannt.
 */
function formName(name: Zeichenform, gross = true): string {
  if (name === "Ellipse") return `${gross ? "Eine" : "eine"} in die Länge gezogene Form`;
  return mitArtikel(name, gross);
}

/**
 * „Welche Form passt nicht?“ wie im Heft: drei Formen einer benannten Gruppe
 * – verschieden groß und leicht gedreht, denn sie trotzdem wiederzuerkennen
 * ist Teil der Übung – und ein Fast-Treffer dazwischen.
 */
function passtNicht(rng: Rng): Aufgabe {
  const gruppe = rng.pick(FORMGRUPPEN);
  const ausreisser = rng.pick([...gruppe.ausreisser]);

  // Drei deutlich verschiedene Größen: Zwei gleiche Karten wären nicht
  // entscheidbar, und im Heft liegen die Formen ohnehin bunt gemischt.
  const groessen = rng.shuffle([0.62, 0.8, 1]);
  const karten: { name: Zeichenform; svg: string }[] = groessen.map((groesse, i) => ({
    name: gruppe.form,
    svg: formVariante(gruppe.form, { groesse, drehung: [-16, 0, 14][i]! }),
  }));
  karten.push({ name: ausreisser, svg: formVariante(ausreisser, { groesse: 0.9, drehung: 8 }) });

  const kennungen = ["A", "B", "C", "D"];
  const gemischt = rng.shuffle(karten);
  return {
    typ: "geometrie/passt-nicht",
    frage: `Das sollen alles ${gruppe.mehrzahl} sein. Welche Form passt nicht dazu?`,
    antwortfeld: {
      art: "bildauswahl",
      // Die Karten werden NICHT benannt – drei gleiche Namen und ein anderer
      // wären die Lösung im Klartext. Wie beim Puzzle heißen sie deshalb nur
      // nach ihrer Kennung.
      optionen: gemischt.map((karte, i) => ({
        kennung: kennungen[i]!,
        svg: karte.svg,
        beschriftung: `Form ${kennungen[i]}`,
      })),
    },
    loesung: kennungen[gemischt.findIndex((karte) => karte.name === ausreisser)]!,
    tipp: gruppe.warum,
    erklaerung: `${formName(ausreisser)} ist kein ${gruppe.form}. ${gruppe.warum}`,
  };
}

/**
 * Die vier Formen, aus denen das Heft seine Muster baut. Fünf- und Sechsecke
 * kämen dort nicht vor und wären in einem 60 Pixel breiten Kästchen ohnehin
 * kaum auseinanderzuhalten.
 */
const MUSTERFORMEN: readonly FormName[] = ["Quadrat", "Rechteck", "Dreieck", "Kreis"];

function musterRechts(rng: Rng, stufe: Stufe): Aufgabe {
  return muster(rng, false, stufe);
}

function musterLinks(rng: Rng, stufe: Stufe): Aufgabe {
  return muster(rng, true, stufe);
}

/**
 * Muster fortsetzen. Im Heft geht das ausdrücklich in BEIDE Richtungen – nach
 * links ist die schwerere Übung, weil das Grundmuster dafür rückwärts gedacht
 * werden muss. Und die Grundmuster dort dürfen eine Form wiederholen
 * (Quadrat, Quadrat, Dreieck, Dreieck), sind also nicht einfach eine Folge
 * verschiedener Formen.
 */
function muster(rng: Rng, nachLinks: boolean, stufe: Stufe): Aufgabe {
  const laenge = stufe === 1 ? 2 : stufe === 2 ? rng.pick([2, 3]) : rng.pick([3, 4]);
  const grund = grundmuster(rng, laenge);
  // Es sollen immer mindestens zwei volle Durchläufe zu sehen sein – und
  // höchstens acht Kästchen, sonst schrumpfen sie auf dem Telefon zu sehr.
  const kaestchen = laenge === 4 ? 8 : 6;
  const luecke = nachLinks ? 0 : kaestchen - 1;
  const reihe: (FormName | null)[] = [];
  for (let i = 0; i < kaestchen; i++) reihe.push(i === luecke ? null : grund[i % laenge]!);
  const loesung = grund[luecke % laenge]!;

  // Die Ablenker kommen zuerst aus dem Muster selbst – sonst fiele die
  // richtige Karte schon dadurch auf, dass nur sie im Bild vorkommt.
  const ablenker = [
    ...new Set(grund.filter((f) => f !== loesung)),
    ...rng.shuffle(MUSTERFORMEN.filter((f) => !grund.includes(f))),
  ].slice(0, 3);

  const kennungen = ["A", "B", "C", "D"];
  const gemischt = rng.shuffle([loesung, ...ablenker]);
  return {
    typ: nachLinks ? "geometrie/muster-links" : "geometrie/muster-rechts",
    frage: nachLinks
      ? "Welche Form gehört vorne an das Muster – links vom ersten Kästchen?"
      : "Wie geht das Muster nach rechts weiter?",
    bild: {
      svg: formenreihe(reihe),
      beschriftung: `Musterreihe aus Formen mit einer Lücke ${nachLinks ? "am Anfang" : "am Ende"}`,
      breit: true,
    },
    antwortfeld: {
      art: "bildauswahl",
      optionen: gemischt.map((name, i) => ({
        kennung: kennungen[i]!,
        svg: form(name),
        beschriftung: mitArtikel(name),
      })),
    },
    loesung: kennungen[gemischt.indexOf(loesung)]!,
    tipp: "Suche zuerst das kleinste Stück, das sich immer wiederholt.",
    erklaerung: `Das Grundmuster ist: ${grund.join(", ")}. Danach beginnt es wieder von vorn.`,
  };
}

/**
 * „Kreise erst das Grundmuster ein.“ Im Heft ist das der erste Arbeitsschritt
 * jeder Musteraufgabe, und er hat es in sich: Gesucht ist das KLEINSTE Stück,
 * das sich wiederholt. Ein Ausschnitt an anderer Stelle passt nicht, und das
 * doppelte Grundmuster wiederholt sich zwar auch – ist aber nicht das
 * kleinste.
 */
function grundmusterAufgabe(rng: Rng, stufe: Stufe): Aufgabe {
  const laenge = stufe === 3 ? rng.pick([3, 4]) : rng.pick([2, 3]);
  const grund = grundmuster(rng, laenge);
  const kaestchen = laenge === 4 ? 8 : 6;
  const reihe: FormName[] = [];
  for (let i = 0; i < kaestchen; i++) reihe.push(grund[i % laenge]!);

  // Ein Vorschlag ist falsch, sobald er die Reihe nicht wiederherstellt ODER
  // länger ist als das Grundmuster.
  const baut = (stueck: readonly FormName[]): boolean =>
    reihe.every((form, i) => form === stueck[i % stueck.length]);
  const vorschlaege: FormName[][] = [grund];
  const kandidaten: FormName[][] = [
    // Der klassische Fehlgriff: dasselbe Fenster, nur eins verschoben.
    grund.map((_, i) => grund[(i + 1) % laenge]!),
    // Das doppelte Grundmuster – wiederholt sich, ist aber nicht das kleinste.
    [...grund, ...grund],
    // Ein Stück zu kurz und eins zu lang.
    reihe.slice(0, Math.max(2, laenge - 1)),
    reihe.slice(0, laenge + 1),
    reihe.slice(1, laenge + 1),
  ];
  for (const kandidat of kandidaten) {
    if (vorschlaege.length >= 4) break;
    if (kandidat.length === laenge && baut(kandidat)) continue;
    if (vorschlaege.some((vorhanden) => vorhanden.join() === kandidat.join())) continue;
    vorschlaege.push(kandidat);
  }

  const kennungen = ["A", "B", "C", "D"];
  const gemischt = rng.shuffle(vorschlaege);
  // Alle Karten gleich breit zeichnen, damit die Formen überall gleich groß
  // sind – sonst entscheidet die Kästchengröße statt des Musters.
  const plaetze = Math.max(...vorschlaege.map((stueck) => stueck.length));
  return {
    typ: "geometrie/grundmuster",
    frage: "Welches ist das Grundmuster? Gesucht ist das kleinste Stück, das sich immer wiederholt.",
    bild: {
      svg: formenreihe(reihe),
      beschriftung: `Musterreihe: ${reihe.join(", ")}`,
      breit: true,
    },
    antwortfeld: {
      art: "bildauswahl",
      optionen: gemischt.map((stueck, i) => ({
        kennung: kennungen[i]!,
        svg: formenreihe(stueck, plaetze),
        beschriftung: stueck.join(", "),
      })),
    },
    loesung: kennungen[gemischt.findIndex((stueck) => stueck.join() === grund.join())]!,
    tipp: "Geh die Reihe von vorne durch: Ab welcher Stelle fängt sie wieder von vorne an?",
    erklaerung: `Das Grundmuster ist ${grund.join(", ")} – es wiederholt sich ${kaestchen / laenge}-mal.`,
  };
}

/**
 * Ein Grundmuster der gewünschten Länge. Formen dürfen sich darin
 * wiederholen, das Muster selbst aber nicht: „Quadrat, Quadrat“ ist kein
 * Zweiermuster, sondern ein Einermuster – dann gäbe es zwei richtige
 * Antworten auf die Frage nach dem Grundmuster.
 */
function grundmuster(rng: Rng, laenge: number): FormName[] {
  for (let versuch = 0; versuch < 60; versuch++) {
    const kandidat = Array.from({ length: laenge }, () => rng.pick(MUSTERFORMEN));
    if (new Set(kandidat).size < 2) continue;
    const kuerzer = [1, 2, 3].some(
      (teil) => teil < laenge && laenge % teil === 0 && kandidat.every((f, i) => f === kandidat[i % teil])
    );
    if (!kuerzer) return kandidat;
  }
  return rng.shuffle([...MUSTERFORMEN]).slice(0, laenge);
}

function formErkennen(rng: Rng): Aufgabe {
  const gewaehlt = rng.pick(ALLE_FORMEN);
  const ablenker = ALLE_FORMEN.filter((f) => f !== gewaehlt);
  return {
    typ: "geometrie/form-erkennen",
    frage: "Welche Form ist das?",
    bild: { svg: form(gewaehlt), beschriftung: mitArtikel(gewaehlt) },
    antwortfeld: auswahlfeld(rng, gewaehlt, ablenker),
    loesung: gewaehlt,
    tipp: "Zähle die Ecken – das verrät oft schon den Namen.",
  };
}

function formMitEcken(rng: Rng): Aufgabe {
  const kandidaten = ALLE_FORMEN.filter((f) => eckenZahl(f) > 0);
  const gewaehlt = rng.pick(kandidaten);
  const anzahl = eckenZahl(gewaehlt);
  const ablenker = kandidaten.filter((f) => eckenZahl(f) !== anzahl);
  return {
    typ: "geometrie/form-mit-ecken",
    frage: `Welche Form hat genau ${anzahl} Ecken?`,
    antwortfeld: auswahlfeld(rng, gewaehlt, ablenker),
    loesung: gewaehlt,
    tipp: "Dreieck: 3, Viereck: 4, Fünfeck: 5 …",
  };
}

function eckenZaehlen(rng: Rng): Aufgabe {
  const gewaehlt = rng.pick(ALLE_FORMEN.filter((f) => eckenZahl(f) > 0));
  const anzahl = eckenZahl(gewaehlt);
  return {
    typ: "geometrie/ecken-zaehlen",
    frage: "Wie viele Ecken hat diese Form?",
    bild: { svg: form(gewaehlt), beschriftung: mitArtikel(gewaehlt) },
    antwortfeld: zahlfeld(),
    loesung: String(anzahl),
    tipp: "Tippe die Ecken der Reihe nach ab.",
    erklaerung: `${mitArtikel(gewaehlt)} hat ${anzahl} Ecken.`,
  };
}

function seitenZaehlen(rng: Rng): Aufgabe {
  const gewaehlt = rng.pick(ALLE_FORMEN.filter((f) => eckenZahl(f) > 0));
  const anzahl = eckenZahl(gewaehlt);
  return {
    typ: "geometrie/seiten-zaehlen",
    frage: "Wie viele Seiten hat diese Form?",
    bild: { svg: form(gewaehlt), beschriftung: mitArtikel(gewaehlt) },
    antwortfeld: zahlfeld(),
    loesung: String(anzahl),
    tipp: "Eine Form hat immer so viele Seiten wie Ecken.",
    erklaerung: `${mitArtikel(gewaehlt)} hat ${anzahl} Seiten – genauso viele wie Ecken.`,
  };
}

function symmetrie(rng: Rng): Aufgabe {
  const gewaehlt: FormName = rng.pick(["Quadrat", "Rechteck", "Kreis", "Raute"] as const);
  const istAchse = rng.chance(0.5);
  return {
    typ: "geometrie/symmetrie",
    frage: "Ist die eingezeichnete Linie eine Spiegelachse?",
    bild: {
      svg: spiegelachse(gewaehlt, istAchse),
      beschriftung: `${mitArtikel(gewaehlt)} mit einer eingezeichneten Linie`,
    },
    antwortfeld: { art: "auswahl", optionen: ["Ja", "Nein"] },
    loesung: istAchse ? "Ja" : "Nein",
    tipp: "Stell dir vor, du faltest die Form an der Linie. Passen beide Hälften genau aufeinander?",
    erklaerung: istAchse
      ? "Beim Falten an dieser Linie liegen beide Hälften genau aufeinander."
      : "Beim Falten an dieser schrägen Linie passen die Hälften nicht aufeinander.",
  };
}

function koerper(rng: Rng): Aufgabe {
  const gewaehlt = rng.pick(KOERPER);
  const frageArt = rng.pick(["ecken", "flaechen", "kanten"] as const);
  const loesung =
    frageArt === "ecken" ? gewaehlt.ecken : frageArt === "flaechen" ? gewaehlt.flaechen : gewaehlt.kanten;
  const wort = frageArt === "ecken" ? "Ecken" : frageArt === "flaechen" ? "Flächen" : "Kanten";
  return {
    typ: "geometrie/koerper",
    frage: `Wie viele ${wort} hat ein ${gewaehlt.name}?`,
    antwortfeld: zahlfeld(),
    loesung: String(loesung),
    tipp: "Denk an einen Würfel: oben, unten und vier Seiten.",
    erklaerung: `Ein ${gewaehlt.name} hat ${gewaehlt.flaechen} Flächen, ${gewaehlt.ecken} Ecken und ${gewaehlt.kanten} Kanten.`,
  };
}

function umfangQuadrat(rng: Rng): Aufgabe {
  const seite = rng.int(2, 20);
  return {
    typ: "geometrie/umfang-quadrat",
    frage: `Ein Quadrat hat Seiten von ${seite} cm. Wie lang ist der Umfang?`,
    bild: { svg: form("Quadrat"), beschriftung: "Ein Quadrat" },
    antwortfeld: zahlfeld("cm"),
    loesung: String(seite * 4),
    tipp: "Beim Quadrat sind alle vier Seiten gleich lang.",
    erklaerung: `4 · ${seite} cm = ${seite * 4} cm`,
  };
}

function umfangRechteck(rng: Rng): Aufgabe {
  const laenge = rng.int(4, 20);
  const breite = rng.int(2, laenge - 1);
  return {
    typ: "geometrie/umfang-rechteck",
    frage: `Ein Rechteck ist ${laenge} cm lang und ${breite} cm breit. Wie lang ist der Umfang?`,
    bild: { svg: form("Rechteck"), beschriftung: "Ein Rechteck" },
    antwortfeld: zahlfeld("cm"),
    loesung: String((laenge + breite) * 2),
    tipp: "Jede Länge und jede Breite kommt zweimal vor.",
    erklaerung: `${laenge} + ${breite} + ${laenge} + ${breite} = ${(laenge + breite) * 2} cm`,
  };
}

/**
 * Puzzleteile wie auf der Rätselseite: Ein Rechteck ist mit einer
 * Treppenlinie zerschnitten, gesucht ist das passende Gegenstück.
 */
function puzzle(rng: Rng): Aufgabe {
  const richtig = puzzleHoehen(() => rng.next());
  const varianten: number[][] = [richtig];
  for (let versuch = 0; versuch < 60 && varianten.length < 4; versuch++) {
    const kandidat = puzzleHoehen(() => rng.next());
    if (!varianten.some((vorhanden) => vorhanden.join() === kandidat.join())) varianten.push(kandidat);
  }

  const kennungen = ["A", "B", "C", "D"];
  const gemischt = rng.shuffle(varianten);
  const optionen = gemischt.map((hoehen, i) => ({
    kennung: kennungen[i]!,
    svg: puzzleteil(hoehen, false),
    beschriftung: `Unteres Teil ${kennungen[i]}`,
  }));
  const loesung = kennungen[gemischt.findIndex((v) => v.join() === richtig.join())]!;

  return {
    typ: "geometrie/puzzle",
    frage: "Welches untere Teil passt genau zum oberen Teil?",
    bild: { svg: puzzleteil(richtig, true), beschriftung: "Oberes Puzzleteil mit gezackter Kante" },
    antwortfeld: { art: "bildauswahl", optionen },
    loesung,
    tipp: "Wo das obere Teil eine Zacke nach unten hat, braucht das untere Teil eine Lücke.",
    erklaerung: "Zusammen müssen beide Teile wieder ein glattes Rechteck ergeben.",
  };
}
