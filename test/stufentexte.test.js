import "./setup.js";
import test from "node:test";
import assert from "node:assert/strict";

import { mulberry32 } from "../js/random.js";
import { GENERATOREN } from "../js/tasks/index.js";
import { THEMEN } from "../js/topics.js";

/*
 * Die Stufentexte stehen im Elternbereich und sind dort die einzige Auskunft,
 * was auf welcher Stufe geübt wird. Sie veralteten still: Nach den
 * Geld-Heftseiten stand bei Stufe 1 noch „Münzen zusammenzählen“, obwohl
 * dort längst passende Münzen gesucht und Geldgeschichten gelesen wurden.
 *
 * Jeder Aufgabentyp nennt hier ein Stichwort, das im Text JEDER Stufe
 * vorkommen muss, auf der er gezogen wird. Ein neuer Typ ohne Eintrag lässt
 * den Test fallen – dann gehört er in die Liste UND in den Stufentext.
 */
const STICHWORT = {
  "plusminus/bis20": /bis 20/,
  "plusminus/zehner": /volle Zehner/,
  "plusminus/mehrere-summanden": /mehrere Summanden/,
  "plusminus/ergaenzen": /Ergänzen/,
  "plusminus/ohne-uebergang": /ohne Zehnerübergang/,
  "plusminus/zehner-dazu": /bis 100/,
  "plusminus/mit-uebergang": /mit Zehnerübergang/,
  "plusminus/platzhalter": /Platzhalter/,
  "plusminus/tabelle": /Rechentabellen/,
  "plusminus/tabelle-minus": /Rechentabellen/,
  "plusminus/tabelle-unloesbar": /Rechentabellen/,
  "analogie/einer-zehner": /Einern zu den Zehnern|Zehneraufgaben/,
  "analogie/nachbar-plus": /Nachbaraufgaben/,
  "analogie/nachbar-minus": /Nachbaraufgaben mit Minus/,
  "analogie/zehner-davor": /Zehner davor/,
  "analogie/plus-zehn": /plus und minus 10/,
  "analogie/minus-zehn": /plus und minus 10/,
  "analogie/uebergang-davor": /über den Zehner/,
  "analogie/tabelle": /Tabellenzeilen/,
  "analogie/luecke": /Lücken/,
  "analogie/hunderter": /Hunderter/,
  "familien/umkehr-plus": /Umkehraufgaben|Lückenaufgaben/,
  "familien/umkehr-minus": /Umkehraufgaben|Lückenaufgaben/,
  "familien/tausch": /Tauschaufgaben|vier Formen/,
  "familien/vier-aufgaben": /ganze Familien|vier Formen/,
  "familien/dritte-zahl": /dritte Zahl|vier Formen/,
  "familien/luecke": /Lückenaufgaben/,
  "zahlenraum/nachbarzahl": /Vorgänger/,
  "zahlenraum/zerlegen": /Zehner und Einer/,
  "zahlenraum/zehner-einer": /Zehner und Einer/,
  "zahlenraum/vergleich": /größer\/kleiner/,
  "zahlenraum/vergleichszeichen": /größer\/kleiner/,
  "zahlenraum/hunderterfeld": /Hunderterfeld/,
  "zahlenraum/hunderterfeld-muster": /Hunderterfeld/,
  "zahlenraum/hunderterfeld-stueck": /Hunderterfeld/,
  "zahlenraum/nachbarzehner": /Nachbarzehner/,
  "zahlenraum/nachbarzehner-paar": /Nachbarzehner/,
  "zahlenraum/zwischen-zehnern": /Nachbarzehner/,
  "zahlenraum/pfeilfolge": /Pfeilschritten|Regeln/,
  "zahlenraum/folge": /Zahlenfolgen/,
  "zahlenraum/reihe-luecke": /Zahlenfolgen|Regeln/,
  "zahlenraum/zahlenstrahl": /Zahlenstrahl/,
  "zahlenraum/rechenstrich": /Rechenstrich|Mitte/,
  "zahlenraum/ordnen": /ordnen/,
  "zahlenraum/ordnen-reihe": /ordnen/,
  "zahlenraum/runden": /runden/,
  "zahlenraum/mitte": /Mitte/,
  "zahlenraum/regel": /Regeln/,
  "zahlenraum/regel-reihe": /Regeln/,
  "zahlenraum/folge-schwer": /Regeln/,
  "mauern/mauer-oben": /Zahlenmauer/,
  "mauern/mauer-unten": /[Mm]auer/,
  "mauern/mauer-gross": /Mauer/,
  "mauern/mauer-fuellen": /Mauern ausfüllen/,
  "mauern/mauer-zehn": /Mauern/,
  "mauern/mauer-zehn-fuellen": /Mauern/,
  "mauern/kasten-summe": /Rechenkasten|Kästen/,
  "mauern/kasten-feld": /Kasten|Kästen/,
  "mauern/rechenrad": /Räder|Rechenrad/,
  "mauern/rechenrad-differenz": /Räder|Rechenrad/,
  "mauern/dreieck-aussen": /[Dd]reieck/,
  "mauern/dreieck-innen": /[Dd]reieck/,
  "geld/muenzen-zaehlen": /Münzen zusammenzählen/,
  "geld/muenze-vergleich": /vergleichen/,
  "geld/welche-muenzen": /passende Münzen/,
  "geld/beziehungskette": /Geldgeschichten|Preise vergleichen|Bezahlen/,
  "geld/in-cent": /umrechnen/,
  "geld/in-euro": /umrechnen/,
  "geld/addieren": /Preise/,
  "geld/unterschied": /Preise vergleichen|Bezahlen/,
  "geld/rest-muenzen": /Beträge legen|Bezahlen/,
  "geld/geldtabelle": /Geldtabelle/,
  "geld/immer-zehn": /immer 10 Euro|Bezahlen/,
  "geld/rueckgeld": /Rückgeld/,
  "geld/reicht-es": /Bezahlen/,
  "geld/betrag-legen": /Bezahlen/,
  "geld/zu-viel": /zu viel/,
  "geometrie/form-erkennen": /Formen erkennen/,
  "geometrie/form-mit-ecken": /Formen erkennen|Ecken/,
  "geometrie/muster-rechts": /Muster/,
  "geometrie/muster-links": /Muster/,
  "geometrie/grundmuster": /Grundmuster|Muster/,
  "geometrie/puzzle": /Puzzle|Formen erkennen|passt nicht/,
  "geometrie/passt-nicht": /passt nicht|Formen/,
  "geometrie/ecken-zaehlen": /Ecken/,
  "geometrie/seiten-zaehlen": /Seiten/,
  "geometrie/symmetrie": /Spiegelachsen/,
  "geometrie/koerper": /Körper/,
  "geometrie/umfang-quadrat": /Umfang/,
  "geometrie/umfang-rechteck": /Umfang/,
  "einmaleins/punktefeld": /Punktefelder/,
  "einmaleins/umkehr": /Umkehraufgaben/,
  "geteilt/umkehr": /Lückenaufgaben|Rest/,
  "geteilt/mit-rest": /mit Rest/,
  "uhrzeit/ablesen": /[Ss]tunden|Minuten/,
  "uhrzeit/uhr-finden": /passende Uhr/,
  "uhrzeit/sprechweise": /Viertel nach/,
  "uhrzeit/spaeter": /Zeitspannen/,
  "uhrzeit/zeitspanne": /Zeitspannen/,
  "laengen/m-in-cm": /Meter in Zentimeter/,
  "laengen/cm-in-m": /und zurück/,
  "laengen/bis-zum-meter": /bis zum Meter/,
  "laengen/cm-in-mm": /cm und mm/,
  "laengen/vergleich": /vergleichen/,
  "laengen/gemischt": /gemischt/,
  "laengen/addieren": /zusammenzählen/,
  "laengen/rest": /Reststücke/,
  "sach/dazu": /Rechenschritt/,
  "sach/weg": /Rechenschritt/,
  "sach/mehr-als": /Rechenschritt/,
  "sach/packungen": /Mal/,
  "sach/verteilen": /Geteilt/,
  "sach/zwei-schritte": /zwei Rechenschritte/,
  "sach/einkauf": /Rückgeld/,
  "sach/vergleich": /Vergleichen/,
  "knobeln/verdoppeln": /Verdoppeln/,
  "knobeln/halbieren": /Halbieren/,
  "knobeln/gerade": /gerade\/ungerade/,
  "knobeln/muster": /Muster/,
  "knobeln/nachbarn": /Nachbarzahlen/,
  "knobeln/raetsel-plus": /Zahlenrätsel/,
  "knobeln/raetsel-minus": /Zahlenrätsel/,
  "knobeln/raetsel-mal": /Zahlenrätsel/,
};

/** Einmaleins- und Geteilt-Reihen tragen die Zahl im Typ; ihr Stichwort ist die Reihe selbst. */
function stichwort(typ) {
  const reihe = typ.match(/^einmaleins\/reihe-(\d+)$/);
  if (reihe) return new RegExp(`${reihe[1]}er|alle Reihen`);
  const teiler = typ.match(/^geteilt\/durch-(\d+)$/);
  if (teiler) return new RegExp(`:${teiler[1]}\\b|alle Reihen|mit Rest`);
  return STICHWORT[typ];
}

test("jeder Aufgabentyp kommt im Text seiner Stufe vor", () => {
  for (const thema of THEMEN) {
    for (const stufe of [1, 2, 3]) {
      const text = thema.stufen[stufe - 1];
      const rng = mulberry32(31 + stufe);
      const typen = new Set();
      for (let i = 0; i < 1500; i++) typen.add(GENERATOREN[thema.id](rng, stufe).typ);
      for (const typ of typen) {
        const wort = stichwort(typ);
        assert.ok(wort, `${typ} hat kein Stichwort – Liste und Stufentext ergänzen`);
        assert.match(text, wort, `${thema.id} Stufe ${stufe}: „${text}“ erwähnt ${typ} nicht`);
      }
    }
  }
});
