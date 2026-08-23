import "./setup.js";
import test from "node:test";
import assert from "node:assert/strict";

import { aufgabeSprechen, rechnungSprechen, setzeVorlesen, vorlesenAn } from "../js/vorlesen.js";
import { GENERATOREN } from "../js/tasks/index.js";
import { THEMEN } from "../js/topics.js";
import { mulberry32 } from "../js/random.js";

/**
 * Eine Sprachausgabe liest Zeichen vor, keine Bedeutung. Ohne Übersetzung
 * kommt aus `37 + 48 =` je nach Gerät „37 Pluszeichen 48 Gleichheitszeichen“,
 * „37 48“ oder gar nichts – und das echte Minus (U+2212) sowie der Malpunkt
 * (U+00B7) kennt fast keine Stimme.
 */
test("Rechenzeichen werden als Wörter vorgelesen", () => {
  assert.equal(rechnungSprechen("37 + 48 ="), "37 plus 48");
  assert.equal(rechnungSprechen("100 − 40 ="), "100 minus 40");
  assert.equal(rechnungSprechen("7 · 8 ="), "7 mal 8");
  assert.equal(rechnungSprechen("30 : 5 ="), "30 geteilt durch 5");
  // Eine Lücke ist eine Frage, kein Fragezeichen zum Vorlesen.
  assert.equal(rechnungSprechen("? · 5 = 30"), "wie viel mal 5 ist gleich 30");
  assert.equal(rechnungSprechen("5 + ? = 13"), "5 plus wie viel ist gleich 13");
});

test("kein Rechenzeichen bleibt als Sonderzeichen stehen", () => {
  for (const stufe of [1, 2, 3]) {
    for (const eintrag of THEMEN) {
      const rng = mulberry32(777 + stufe);
      for (let i = 0; i < 150; i++) {
        const aufgabe = GENERATOREN[eintrag.id](rng, stufe);
        const text = aufgabeSprechen(aufgabe);
        assert.ok(
          !/[+−·=]/.test(text),
          `${eintrag.id} Stufe ${stufe}: „${text}“ enthält ein ungesprochenes Rechenzeichen`
        );
        assert.ok(text.length > 0, `${eintrag.id} Stufe ${stufe}: nichts vorzulesen`);
      }
    }
  }
});

test("Einheiten werden ausgeschrieben statt buchstabiert", () => {
  const text = aufgabeSprechen({
    typ: "t",
    frage: "Ein Seil ist 3 m lang und 40 cm dick. Es kostet 5 € 20 ct.",
    antwortfeld: { art: "zahl" },
    loesung: "1",
  });
  assert.match(text, /3 Meter/);
  assert.match(text, /40 Zentimeter/);
  assert.match(text, /5 Euro/);
  assert.match(text, /20 Cent/);
});

/**
 * Die Bildbeschreibung ist für jemanden gedacht, der das Bild NICHT sieht.
 * Ein Kind, das nur langsam liest, sieht es sehr wohl – und bekäme mit
 * „Uhr, die 7:30 Uhr zeigt“ die Lösung vorgesagt.
 */
test("die Bildbeschreibung wird nicht vorgelesen", () => {
  const text = aufgabeSprechen({
    typ: "uhrzeit/ablesen",
    frage: "Wie spät ist es?",
    bild: { svg: "<svg></svg>", beschriftung: "Uhr, die 7:30 Uhr zeigt" },
    antwortfeld: { art: "auswahl", optionen: ["7:30", "8:30"] },
    loesung: "7:30",
  });
  assert.ok(!text.includes("Uhr, die"), `die Beschreibung verrät die Lösung: ${text}`);
  // Die Möglichkeiten gehören dagegen dazu – wer nicht liest, kann sonst
  // zwar die Frage hören, aber nicht die Antworten.
  assert.match(text, /Zur Auswahl/);
  assert.match(text, /7:30/);
});

test("mehrzeilige Fragen bekommen Sprechpausen statt Zeilenumbrüche", () => {
  const text = aufgabeSprechen({
    typ: "geld/beziehungskette",
    frage: "Emma hat 17 €.\nJonas hat 9 € mehr als Lina.\nWie viel hat Jonas?",
    antwortfeld: { art: "zahl", einheit: "€" },
    loesung: "26",
  });
  assert.ok(!text.includes("\n"), "ein Zeilenumbruch wird nicht gesprochen");
  assert.match(text, /17 Euro\. Jonas/);
});

test("die Einstellung wird geprüft gespeichert", () => {
  localStorage.clear();
  assert.equal(vorlesenAn(), false, "Vorlesen ist standardmäßig aus");
  setzeVorlesen(true);
  assert.equal(vorlesenAn(), true);
  setzeVorlesen(false);
  assert.equal(vorlesenAn(), false);

  // Ein von Hand verbogener Wert darf nicht als „an“ durchgehen.
  localStorage.setItem("vorlesen:an", "vielleicht");
  assert.equal(vorlesenAn(), false);
});

test("die Einstellung liegt nicht im Spielstand-Bereich", () => {
  localStorage.clear();
  setzeVorlesen(true);
  assert.equal(localStorage.getItem("mathe2:fortschritt"), null);
  setzeVorlesen(false);
});

/* ------------------------------------------------------------ Stimmenwahl */

/**
 * Ein Teil der Stimmen in `getVoices()` sind ONLINE-Stimmen: Der Browser
 * schickt den Text an den Server des Herstellers. Bei einer App, die sonst
 * ausdrücklich ohne Netz auskommt und mit „alles bleibt auf dem Gerät“ wirbt,
 * wäre das ein stiller Wortbruch – deshalb hat eine Stimme auf dem Gerät
 * immer Vorrang.
 */
test("eine Stimme auf dem Gerät hat Vorrang vor einer Online-Stimme", async () => {
  const { waehleStimme } = await import("../js/vorlesen.js");

  const stimmen = [
    { lang: "en-US", localService: true },
    { lang: "de-DE", localService: false },
    { lang: "de-AT", localService: true },
  ];
  assert.equal(waehleStimme(stimmen).lang, "de-AT", "die Online-Stimme wurde vorgezogen");

  // Gibt es nur eine Online-Stimme auf Deutsch, ist sie besser als gar keine.
  assert.equal(waehleStimme([{ lang: "de-DE", localService: false }]).lang, "de-DE");

  // Gar keine deutsche Stimme: Dann spricht die Standardstimme mit lang="de-DE".
  assert.equal(waehleStimme([{ lang: "fr-FR", localService: true }]), undefined);
  assert.equal(waehleStimme([]), undefined);
});
