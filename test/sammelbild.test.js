import "./setup.js";
import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

import { mulberry32 } from "../js/random.js";
import {
  BILD_BREITE,
  BILD_HOEHE,
  HAUS,
  RICHTIGE_PRO_STICKER,
  STICKER,
  STICKER_ANZAHL,
  ZIMMER,
  istStickerNummer,
  sammelbild,
  stickerBild,
} from "../js/sammelbild.js";
import {
  bucheRichtigeFuerSticker,
  fehlendeSticker,
  loeseStickerEin,
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

test("jeder Sticker bleibt in seinem Zimmer, der Rest bleibt draußen", () => {
  // Möbel, die in die Wand ragen, sehen nicht nur schlampig aus – im
  // gestrichelten Umriss verrät der Überstand schon vor dem Kleben, dass hier
  // etwas nicht stimmt. Gemessen wird gegen ZIMMER, dieselbe Quelle, aus der
  // `haus()` die Wände zeichnet.
  const zimmer = new Map(ZIMMER.map((z) => [z.name, z]));
  assert.equal(zimmer.size, ZIMMER.length, "zwei Zimmer heißen gleich");

  let drinnen = 0;
  let draussen = 0;
  for (const eintrag of STICKER) {
    const links = eintrag.x - eintrag.breite / 2;
    const rechts = eintrag.x + eintrag.breite / 2;
    const oben = eintrag.y - eintrag.hoehe / 2;
    const unten = eintrag.y + eintrag.hoehe / 2;

    if (eintrag.zimmer) {
      const raum = zimmer.get(eintrag.zimmer);
      assert.ok(raum, `${eintrag.name} steht im Zimmer „${eintrag.zimmer}“, das es nicht gibt`);
      assert.ok(links >= raum.links, `${eintrag.name} ragt in die linke Wand (${links} < ${raum.links})`);
      assert.ok(rechts <= raum.rechts, `${eintrag.name} ragt in die rechte Wand (${rechts} > ${raum.rechts})`);
      assert.ok(oben >= raum.oben, `${eintrag.name} ragt in die Decke (${oben} < ${raum.oben})`);
      assert.ok(unten <= raum.unten, `${eintrag.name} ragt in den Boden (${unten} > ${raum.unten})`);
      drinnen++;
    } else {
      // Ohne Zimmer gehört der Platz nach draußen – oder aufs Dach.
      const imHaus =
        rechts > HAUS.links && links < HAUS.rechts && unten > HAUS.oben && oben < HAUS.unten;
      assert.ok(!imHaus, `${eintrag.name} steht ohne Zimmer mitten im Haus`);
      draussen++;
    }
  }
  assert.ok(drinnen >= 16, "der Test misst fast nichts");
  assert.ok(draussen >= 3, "draußen steht nichts mehr");
});

test("das Haus wird aus denselben Zahlen gezeichnet, gegen die geprüft wird", () => {
  // Stünden die Wände woanders als in ZIMMER, prüfte der Test oben gegen
  // Fantasiekanten. Deshalb wird jedes Zimmer im BILD wiedergefunden.
  const bild = sammelbild([]);
  for (const z of ZIMMER) {
    const rechteck =
      `<rect x="${z.links}" y="${z.oben}" width="${z.rechts - z.links}" ` +
      `height="${z.unten - z.oben}" rx="3" class="bild-hell"/>`;
    assert.ok(bild.includes(rechteck), `${z.name} steht nicht so im Bild wie in ZIMMER`);
  }
  const mauerwerk =
    `<rect x="${HAUS.links}" y="${HAUS.oben}" width="${HAUS.rechts - HAUS.links}" ` +
    `height="${HAUS.unten - HAUS.oben}" rx="6" class="bild-braun"/>`;
  assert.ok(bild.includes(mauerwerk), "das Mauerwerk steht nicht, wo HAUS es angibt");
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

const luecken = (svg) => (svg.match(/class="sticker-leer[ "]/g) ?? []).length;

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

  // Eingelöst fängt der Zähler wieder bei null an – und weiter geht es von vorn.
  loeseStickerEin(stand, stickerAngebot(stand, mulberry32(3))[0]);
  assert.equal(stand.stickerZaehler, 0, "der Zähler fängt nach dem Einlösen nicht bei null an");
  for (let i = 1; i < RICHTIGE_PRO_STICKER; i++) assert.equal(bucheRichtigeFuerSticker(stand), false);
  assert.equal(bucheRichtigeFuerSticker(stand), true);
});

test("ein verdienter Sticker bleibt gut, auch wenn die Auswahl abbricht", () => {
  // Fünf richtige Antworten – die drei Karten stehen auf dem Schirm, und genau
  // jetzt macht das Kind die App zu.
  let stand = standMit();
  for (let i = 0; i < RICHTIGE_PRO_STICKER; i++) bucheRichtigeFuerSticker(stand);
  assert.equal(stand.stickerZaehler, RICHTIGE_PRO_STICKER);

  // So kommt der Stand nach dem Neustart zurück.
  stand = pruefeFortschritt(stand);
  assert.equal(stand.stickerZaehler, RICHTIGE_PRO_STICKER, "der verdiente Sticker ging beim Laden verloren");
  assert.deepEqual(stand.sticker, [], "geklebt wurde nie etwas");

  // Die nächste richtige Antwort bietet ihn wieder an …
  assert.equal(bucheRichtigeFuerSticker(stand), true, "der verdiente Sticker kam nicht wieder");
  // … und der Zähler läuft nicht über: Sonst häuften sich Sticker an, die
  // niemand mehr auswählen kann.
  for (let i = 0; i < 10; i++) bucheRichtigeFuerSticker(stand);
  assert.equal(stand.stickerZaehler, RICHTIGE_PRO_STICKER, "der Zähler läuft über die Belohnung hinaus");
});

test("eingelöst wird nur, was wirklich klebt", () => {
  const stand = standMit([4], RICHTIGE_PRO_STICKER);

  // Ein schon geklebter Sticker löst nichts ein – sonst wäre die Belohnung mit
  // einem Fehlgriff verbraucht.
  loeseStickerEin(stand, 4);
  assert.equal(stand.stickerZaehler, RICHTIGE_PRO_STICKER, "ein doppelter Sticker hat die Belohnung verbraucht");
  loeseStickerEin(stand, 999);
  assert.equal(stand.stickerZaehler, RICHTIGE_PRO_STICKER, "eine unbekannte Nummer hat die Belohnung verbraucht");

  loeseStickerEin(stand, 2);
  assert.deepEqual(stand.sticker, [2, 4]);
  assert.equal(stand.stickerZaehler, 0, "nach dem Einlösen zählt es nicht neu");
});

test("im Rechenmeister wird gezählt, aber nichts angeboten", () => {
  // Der Rechenmeister läuft gegen die Uhr; eine Auswahlkarte mittendrin kostet
  // Sekunden und verfälscht die Bestzeit.
  const stand = standMit();
  for (let i = 0; i < RICHTIGE_PRO_STICKER * 2; i++) {
    assert.equal(bucheRichtigeFuerSticker(stand, true), false, `Antwort ${i + 1} unterbrach den Lauf`);
  }
  // Die richtigen Antworten sind trotzdem echt.
  assert.equal(stand.stickerZaehler, RICHTIGE_PRO_STICKER, "im Rechenmeister zählt nichts mit");

  // In der nächsten gewöhnlichen Runde kommt der Sticker sofort.
  assert.equal(bucheRichtigeFuerSticker(stand), true, "der im Lauf verdiente Sticker kam nie");
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
  loeseStickerEin(stand, 4);
  assert.deepEqual(stand.sticker, [4], "derselbe Sticker wurde doppelt geklebt");
  loeseStickerEin(stand, 999);
  loeseStickerEin(stand, -1);
  loeseStickerEin(stand, 2.5);
  assert.deepEqual(stand.sticker, [4], "eine unbekannte Nummer kam ins Bild");
  loeseStickerEin(stand, 2);
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

  // Der volle Zähler ist ein gültiger Stand: Er heißt „ein Sticker steht noch
  // aus“ und muss einen Neustart überleben.
  assert.equal(
    pruefeFortschritt({ stickerZaehler: RICHTIGE_PRO_STICKER }).stickerZaehler,
    RICHTIGE_PRO_STICKER
  );
  assert.equal(pruefeFortschritt({ stickerZaehler: RICHTIGE_PRO_STICKER - 1 }).stickerZaehler, 4);

  // Ein unmöglicher Zähler fällt auf null zurück statt auf den Höchstwert:
  // Gekappt gäbe es sofort einen Sticker geschenkt – wer den Spielstand von
  // Hand aufdreht, soll nichts davon haben.
  assert.equal(pruefeFortschritt({ stickerZaehler: RICHTIGE_PRO_STICKER + 1 }).stickerZaehler, 0);
  assert.equal(pruefeFortschritt({ stickerZaehler: 99 }).stickerZaehler, 0);
  assert.equal(pruefeFortschritt({ stickerZaehler: -3 }).stickerZaehler, 0);
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
