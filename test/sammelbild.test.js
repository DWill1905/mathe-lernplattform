import "./setup.js";
import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

import { mulberry32 } from "../js/random.js";
import {
  BILD_BREITE,
  BILD_HOEHE,
  RICHTIGE_PRO_STICKER,
  STICKER,
  STICKER_ANZAHL,
  istStickerNummer,
  sammelbild,
  stickerBild,
} from "../js/sammelbild.js";
import {
  bucheRichtigeFuerSticker,
  fehlendeSticker,
  klebeSticker,
  stickerAngebot,
} from "../js/gamification.js";
import { pruefeFortschritt, standardFortschritt } from "../js/state.js";
import { verschmelze } from "../js/sync.js";

/**
 * Das Sammelbild: ein Haus, das sich nach je fünf richtigen Aufgaben weiter
 * einrichtet.
 *
 * Geprüft wird aus dem ERGEBNIS – wo ein Sticker klebt, wird aus dem erzeugten
 * SVG zurückgelesen, nicht aus der Tabelle daneben.
 */

const CSS = readFileSync(new URL("../style.css", import.meta.url), "utf8");
const ALLE = STICKER.map((s) => s.nummer);

/* -------------------------------------------------------- Die Sticker */

test("jeder Sticker hat eine eigene Nummer, einen Namen und eine Zeichnung", () => {
  assert.equal(STICKER_ANZAHL, STICKER.length);
  assert.ok(STICKER_ANZAHL >= 20, `nur ${STICKER_ANZAHL} Sticker – das füllt kein Haus`);

  const nummern = STICKER.map((s) => s.nummer);
  assert.equal(new Set(nummern).size, STICKER_ANZAHL, "zwei Sticker teilen sich eine Nummer");
  assert.deepEqual(
    [...nummern].sort((a, b) => a - b),
    Array.from({ length: STICKER_ANZAHL }, (_, i) => i + 1),
    "die Nummern sollen lückenlos bei 1 anfangen"
  );

  const namen = STICKER.map((s) => s.name);
  assert.equal(new Set(namen).size, STICKER_ANZAHL, "zwei Sticker heißen gleich");
  for (const eintrag of STICKER) {
    assert.ok(eintrag.name.length > 2, `„${eintrag.name}“ ist kein Name`);
    assert.ok(eintrag.zeichnung.includes("<"), `${eintrag.name} zeichnet nichts`);
    assert.ok(eintrag.breite > 0 && eintrag.hoehe > 0, `${eintrag.name} hat kein Feld`);
  }

  // Genau eine Krönung – zwei „zuletzt“ blockierten sich gegenseitig.
  assert.equal(STICKER.filter((s) => s.zuletzt).length, 1);
});

test("jeder Sticker liegt vollständig im Bild und keiner auf einem anderen", () => {
  const plaetze = new Set();
  for (const eintrag of STICKER) {
    const links = eintrag.x - eintrag.breite / 2;
    const oben = eintrag.y - eintrag.hoehe / 2;
    assert.ok(links >= 0, `${eintrag.name} ragt links hinaus (${links})`);
    assert.ok(oben >= 0, `${eintrag.name} ragt oben hinaus (${oben})`);
    assert.ok(links + eintrag.breite <= BILD_BREITE, `${eintrag.name} ragt rechts hinaus`);
    assert.ok(oben + eintrag.hoehe <= BILD_HOEHE, `${eintrag.name} ragt unten hinaus`);
    plaetze.add(`${eintrag.x}/${eintrag.y}`);
  }
  assert.equal(plaetze.size, STICKER_ANZAHL, "zwei Sticker kleben an derselben Stelle");
});

test("die Zeichnungen färben nur über bild-Klassen, die es auch gibt", () => {
  const bilder = [sammelbild([]), sammelbild(ALLE), ...ALLE.map(stickerBild)];
  const gesehen = new Set();
  for (const bild of bilder) {
    assert.ok(!/(fill|stroke)="(#|rgb|hsl)/.test(bild), `feste Farbe im SVG: ${bild.slice(0, 120)}`);
    for (const treffer of bild.matchAll(/class="([a-z0-9 -]+)"/g)) {
      for (const klasse of treffer[1].split(" ")) {
        if (klasse.startsWith("bild-") || klasse.startsWith("sticker-")) gesehen.add(klasse);
      }
    }
  }
  assert.ok(gesehen.size >= 10, "der Test misst nichts");
  for (const klasse of gesehen) {
    assert.ok(CSS.includes(`.${klasse} {`), `Klasse ${klasse} fehlt in style.css`);
  }
});

/* ----------------------------------------------------------- Das Bild */

/** Liest aus dem Bild zurück, wo welcher Sticker klebt. */
function geklebteStellen(svg) {
  return [...svg.matchAll(/<g(?: class="[a-z-]+")? transform="translate\(([\d.]+) ([\d.]+)\) scale\(/g)].map(
    (t) => ({ links: Number(t[1]), oben: Number(t[2]) })
  );
}

const luecken = (svg) => (svg.match(/class="sticker-leer"/g) ?? []).length;

test("ein leeres Bild zeigt nur Lücken, ein volles nur Sticker", () => {
  const leer = sammelbild([]);
  assert.equal(luecken(leer), STICKER_ANZAHL);
  assert.equal(geklebteStellen(leer).length, 0);

  const voll = sammelbild(ALLE);
  assert.equal(luecken(voll), 0);
  assert.equal(geklebteStellen(voll).length, STICKER_ANZAHL);

  // Ohne Lücken sieht man gar nicht, wie viel noch fehlt – das muss abschaltbar
  // bleiben, aber nicht aus Versehen passieren.
  assert.equal(luecken(sammelbild([], null, false)), 0);
});

test("ein geklebter Sticker sitzt an genau seinem Platz", () => {
  for (const eintrag of STICKER) {
    const bild = sammelbild([eintrag.nummer]);
    assert.equal(luecken(bild), STICKER_ANZAHL - 1, `${eintrag.name}: falsch viele Lücken`);
    const stellen = geklebteStellen(bild);
    assert.equal(stellen.length, 1, `${eintrag.name}: falsch viele Zeichnungen`);
    assert.equal(stellen[0].links, eintrag.x - eintrag.breite / 2, `${eintrag.name} klebt zu weit seitlich`);
    assert.equal(stellen[0].oben, eintrag.y - eintrag.hoehe / 2, `${eintrag.name} klebt zu hoch oder zu tief`);
  }
});

test("nur der frisch geklebte Sticker ploppt auf", () => {
  const bild = sammelbild([3, 7, 11], 7);
  assert.equal((bild.match(/class="sticker-neu"/g) ?? []).length, 1);
  // Ohne frischen Sticker bewegt sich nichts.
  assert.ok(!sammelbild([3, 7, 11]).includes("sticker-neu"));
});

/* ------------------------------------------------------------ Zählen */

function standMit(sticker = [], stickerZaehler = 0) {
  return { ...standardFortschritt(), sticker: [...sticker], stickerZaehler };
}

test("erst die fünfte richtige Antwort bringt einen Sticker", () => {
  const stand = standMit();
  for (let i = 1; i < RICHTIGE_PRO_STICKER; i++) {
    assert.equal(bucheRichtigeFuerSticker(stand), false, `Antwort ${i} bringt schon einen Sticker`);
    assert.equal(stand.stickerZaehler, i);
  }
  assert.equal(bucheRichtigeFuerSticker(stand), true, "die fünfte Antwort bringt keinen");
  assert.equal(stand.stickerZaehler, 0, "der Zähler fängt wieder bei null an");

  // Und weiter geht es von vorn.
  for (let i = 1; i < RICHTIGE_PRO_STICKER; i++) assert.equal(bucheRichtigeFuerSticker(stand), false);
  assert.equal(bucheRichtigeFuerSticker(stand), true);
});

test("ist das Haus voll, läuft der Zähler nicht ins Leere weiter", () => {
  const stand = standMit(ALLE);
  for (let i = 0; i < 20; i++) assert.equal(bucheRichtigeFuerSticker(stand), false);
  assert.equal(stand.stickerZaehler, 0, "der Zähler zählt weiter, obwohl es nichts mehr zu holen gibt");
  assert.deepEqual(fehlendeSticker(stand), []);
});

/* ----------------------------------------------------------- Auswahl */

test("zur Wahl stehen nur fehlende Sticker, höchstens drei", () => {
  const schon = [1, 2, 3, 4, 5, 6];
  const stand = standMit(schon);
  for (let seed = 1; seed <= 60; seed++) {
    const angebot = stickerAngebot(stand, mulberry32(seed));
    assert.equal(angebot.length, 3);
    assert.equal(new Set(angebot).size, 3, "derselbe Sticker doppelt im Angebot");
    for (const nummer of angebot) {
      assert.ok(istStickerNummer(nummer), `${nummer} ist kein Sticker`);
      assert.ok(!schon.includes(nummer), `${nummer} klebt schon`);
    }
  }
});

test("die Eule kommt erst, wenn sie als Einzige fehlt", () => {
  const eule = STICKER.find((s) => s.zuletzt).nummer;
  const fastVoll = standMit(ALLE.filter((n) => n !== eule && n !== 1));
  for (let seed = 1; seed <= 40; seed++) {
    const angebot = stickerAngebot(fastVoll, mulberry32(seed));
    assert.ok(!angebot.includes(eule), "die Eule kam vor dem Schluss");
  }

  const nurNochEule = standMit(ALLE.filter((n) => n !== eule));
  assert.deepEqual(stickerAngebot(nurNochEule, mulberry32(7)), [eule]);
  assert.deepEqual(stickerAngebot(standMit(ALLE), mulberry32(7)), []);
});

test("ein Sticker klebt nur einmal, und Unbekanntes klebt gar nicht", () => {
  const stand = standMit([4]);
  klebeSticker(stand, 4);
  assert.deepEqual(stand.sticker, [4], "derselbe Sticker wurde doppelt geklebt");
  klebeSticker(stand, 999);
  klebeSticker(stand, -1);
  klebeSticker(stand, 2.5);
  assert.deepEqual(stand.sticker, [4], "eine unbekannte Nummer kam ins Bild");
  klebeSticker(stand, 2);
  assert.deepEqual(stand.sticker, [2, 4], "geklebte Sticker sollen sortiert bleiben");
});

/* ------------------------------------------------- Spielstand und Abgleich */

test("der Spielstand nimmt nur echte Stickernummern an", () => {
  const geprueft = pruefeFortschritt({
    sticker: [3, 3, "sieben", -2, 0, 99, STICKER_ANZAHL, 1.5, null],
    stickerZaehler: 4,
  });
  assert.deepEqual(geprueft.sticker, [3, STICKER_ANZAHL]);
  assert.equal(geprueft.stickerZaehler, 4);

  // Ein unmöglicher Zähler fällt auf null zurück statt auf den Höchstwert:
  // Gekappt auf 4 gäbe es bei der nächsten richtigen Antwort einen Sticker
  // geschenkt – wer den Spielstand von Hand aufdreht, soll nichts davon haben.
  assert.equal(pruefeFortschritt({ stickerZaehler: RICHTIGE_PRO_STICKER }).stickerZaehler, 0);
  assert.equal(pruefeFortschritt({ stickerZaehler: 99 }).stickerZaehler, 0);
  assert.equal(pruefeFortschritt({ stickerZaehler: -3 }).stickerZaehler, 0);
  assert.equal(pruefeFortschritt({ stickerZaehler: RICHTIGE_PRO_STICKER - 1 }).stickerZaehler, 4);
  assert.deepEqual(pruefeFortschritt({ sticker: "alles" }).sticker, []);
  assert.deepEqual(pruefeFortschritt({}).sticker, []);
});

test("beim Abgleich gehen geklebte Sticker nie verloren", () => {
  const a = { ...standardFortschritt(), sticker: [1, 4, 9], stickerZaehler: 3, letzterTag: "2026-09-10" };
  const b = { ...standardFortschritt(), sticker: [4, 7], stickerZaehler: 1, letzterTag: "2026-09-18" };

  const zusammen = verschmelze(a, b);
  assert.deepEqual(zusammen.sticker, [1, 4, 7, 9], "die Sammlung wurde nicht vereinigt");
  // Der Zwischenstand kommt wie die Fehlerbilanz vom zuletzt benutzten Gerät.
  assert.equal(zusammen.stickerZaehler, 1);
  assert.deepEqual(verschmelze(b, a).sticker, [1, 4, 7, 9], "die Reihenfolge darf nichts ändern");
});
