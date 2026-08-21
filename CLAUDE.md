# CLAUDE.md

Kontext für jede Session, die an der Mathe-Schule weiterarbeitet. Offene
Punkte stehen in `ROADMAP.md`, die Historie in `CHANGELOG.md`.

## Was ist das Projekt?

Interaktive Lernplattform für Mathematik in der 2. Klasse (Deutsch), statische
Seite für GitHub Pages: zehn Themen mit je drei Stufen, Übungsrunden mit
sofortiger Rückmeldung, Gamification (Punkte, Level, Sterne, Streak,
Abzeichen) und ein Elternbereich. Feature-Liste: `README.md`.

## Projektkonventionen (unbedingt einhalten)

- **Kein Framework, keine Runtime-Dependencies.** Vanilla TypeScript, `tsc`
  kompiliert `src/` → `js/`. Das kompilierte `js/` wird **mitcommittet**
  (Pages liest direkt aus dem Repo-Root). devDependencies sind erlaubt.
- **Nach jeder inhaltlichen Änderung**: `npm run build`, `npm test`,
  `CHANGELOG.md` ergänzen, Version in `package.json` bumpen (Features = minor,
  Fixes/Doku = patch). Ohne neu gebautes `js/` weicht die ausgelieferte Seite
  vom Quellcode ab – die CI prüft das.
- **Sprache**: UI-Texte, Kommentare und Changelog durchgehend Deutsch.
- **Zielgruppe sind Siebenjährige.** Große Flächen, kurze Sätze, keine
  Fachbegriffe ohne Erklärung, nie strafende Formulierungen. Zahlenantworten
  sind immer nicht-negative ganze Zahlen – alles andere läuft über
  Auswahlknöpfe, damit die Zahlentastatur genügt.
- **State** liegt vollständig im `localStorage` unter `mathe2:fortschritt`.
  Kein Backend, keine Netzwerkaufrufe – die CSP in `index.html` erlaubt nur
  eigene Dateien.
- **Deutsche Anführungszeichen**: Das schließende `"` beendet in einem doppelt
  gequoteten TypeScript-String die Zeichenkette. In Texten mit `„…"` deshalb
  Template-Literale (Backticks) verwenden.

## Architekturüberblick

- `src/types.ts` – Domänen-Typen (`Aufgabe`, `Fortschritt`, `ThemaId`, …).
- `src/topics.ts` – die zehn Themen samt Beschreibung ihrer drei Stufen.
- `src/state.ts` – **einziger** Ort, der `localStorage` liest und schreibt.
- `src/random.ts` – `mulberry32`. Niemals `Math.random()` verwenden, sonst
  sind die Aufgaben-Generatoren nicht mehr testbar.
- `src/tasks/*` – die Aufgaben-Generatoren, nach Themengruppen sortiert
  (`zahlen`, `rechnen`, `groessen`, `geometrie`, `sachaufgaben`, `analogie`,
  `familien`, `mauern`); `tasks/index.ts` hält die Registry und baut Runden.
- `src/figures.ts` – Erklärbilder als SVG-Zeichenketten, ohne DOM-Zugriff und
  deshalb direkt testbar.
- `src/gamification.ts` – Punkte, Level, Sterne, Herzen, Streak, Abzeichen,
  Stufenanpassung.
- `src/raetsel.ts` – Lösungswörter, Buchstabencode und die passenden Aufgaben
  der Rätselseite. Jede Aufgabe muss ihre Zielzahl EXAKT treffen, sonst zeigt
  die Legende einen falschen Buchstaben (Test!).
- `src/views/*` – Start, Übung, Fortschritt, Elternbereich.
- `src/app.ts` / `src/router.ts` / `src/shell.ts` – Routentabelle,
  Hash-Router, App-Shell.
- `sw.js` (Repo-Root) – Service Worker, Network-First. Die einzige
  handgeschriebene JS-Datei; sie muss im Root liegen, weil ein Service Worker
  nur für seinen Auslieferungspfad gilt.

## Wichtigste Fallstricke

- **Aufgaben mit `vorstufe` laufen in zwei Schritten.** `views/uebung.ts`
  hält dafür `sitzung.phase`; `aktuellerSchritt()` entscheidet, was gerade
  gefragt wird. Die Hilfsaufgabe zählt NICHT in die Trefferbilanz – sie bringt
  ein Herz. Wer eine neue `vorstufe` ergänzt: Ihr Ergebnis muss im Zahlenraum
  bleiben und darf nie negativ werden (Test in `test/mauern.test.js`).
- **In einer Zahlenmauer fehlt immer genau ein Stein.** Nur dann ist er
  eindeutig bestimmt, weil alle Nachbarn sichtbar bleiben. Ein Test prüft das.
- **Rechenmeister und Rätselwort sind Betriebsarten der Übungsansicht**, keine
  eigenen Dateien – er hat aber einen eigenen Eintrag in `ANSICHTEN`, damit die Route
  `#/rechenmeister` bzw. `#/raetsel` auch offline vorgeladen wird.
- **Bei der Rechentabelle steht die Rechnung bewusst NICHT im Text.** Das
  Ablesen von Zeile und Spalte ist die eigentliche Übung; für Screenreader
  steckt die Aufgabe in der Bildbeschreibung. Ein Test hält das fest.
- **Eine neue Route braucht einen Eintrag in `ANSICHTEN` (`src/app.ts`).**
  Die Liste wird im Leerlauf komplett vorgeladen; nur dadurch bleibt die App
  nach dem Code-Splitting offline vollständig.
- **Farben in SVGs nur über CSS-Klassen** (`fig-*` in `style.css`), sonst
  bricht der Dunkelmodus. Ein Test erzwingt das.
- **Keine Inline-Styles.** Die CSP verbietet `style`-Attribute; `el()` setzt
  Maße deshalb über die `stil`-Eigenschaft per CSSOM.
- **Jeder `load…()` prüft, was er liest** – Typ UND Wertebereich. Der
  gespeicherte Zustand ist von Hand veränderbar; `ladeFortschritt()` in
  `state.ts` ist das Vorbild, `test/state.test.js` sichert es ab.
- **DOM nur über `el()` aus `dom.ts` bauen.** Text landet über
  `createTextNode`, Attribute über `setAttribute` – so kann kein
  gespeicherter Wert Markup einschleusen. `innerHTML` ist ausschließlich für
  die SVG-Zeichenketten aus `figures.ts` da (`svgBild()`), niemals für
  gespeicherte Daten.
- **Ein Generator, der eine Aufgabe erzeugt, muss auf jeder Stufe im
  Zahlenraum bleiben** und darf keine negativen Antworten produzieren –
  `test/generatoren.test.js` prüft 300 Durchläufe je Thema und Stufe.
- Gleicher Hash löst kein `hashchange` aus: Ein „Nochmal“-Knopf muss die
  Ansicht selbst neu aufbauen (siehe `baueSitzung()` in `views/uebung.ts`).

## Tests

`test/setup.js` stellt ein In-Memory-`localStorage` bereit, damit die
kompilierten `js/`-Module direkt mit `node:test` importierbar sind. Neue
Aufgabentypen ohne Test gelten als unvollständig.

## CI

`.github/workflows/ci.yml` läuft bei jedem Push/PR auf `main`: `npm ci` →
`npm run build` → **js/-Sync-Check** (`git diff --exit-code -- js/`) →
`npm test`.
