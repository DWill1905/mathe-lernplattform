# Mathe-Schule – Lernplattform für die 2. Klasse

Eine interaktive, komplett kostenlose Lernplattform für Mathematik in der
2. Klasse. Sie läuft als statische Seite im Browser: kein Konto, kein Server,
keine Werbung, kein Tracking. Der gesamte Lernstand bleibt im `localStorage`
des Geräts.

## Was Kinder hier üben

| Thema | Inhalte |
| --- | --- |
| 🔢 Zahlen bis 100 | Vorgänger/Nachfolger, Zehner und Einer, Nachbarzehner, Zahlenstrahl, Runden, Zahlenfolgen |
| ➕ Plus & Minus | bis 20, mit vollen Zehnern, bis 100 ohne und mit Zehnerübergang, Platzhalteraufgaben |
| 💡 Rechentricks | Analogieaufgaben: 3 + 4 → 30 + 40, 3 + 2 → 13 + 2, plus/minus 10, Hunderter, Tabellenzeilen |
| 💖 Hilfsaufgaben | Bei Rechentricks und Umkehraufgaben rechnet das Kind zuerst die Hilfsaufgabe selbst – das gibt ein Herz |
| 👨‍👩‍👧‍👦 Aufgabenfamilien | „3 Zahlen, 4 Aufgaben“: Tausch- und Umkehraufgaben, Lücken in allen vier Formen |
| 🧱 Mauern & Räder | Zahlenmauern mit fehlendem Stein, Rechenräder mit Zielzahl in der Mitte |
| ✖️ Einmaleins | alle Reihen von 1 bis 10, Punktefelder, Umkehraufgaben |
| ➗ Geteilt | Teilen ohne Rest, Aufgaben mit Rest |
| 💶 Geld | Münzen zählen, Euro und Cent umrechnen, bezahlen und Rückgeld |
| 🕒 Uhrzeit | analoge Uhr lesen, „halb“ und „Viertel vor/nach“, Zeitspannen |
| 📏 Längen | m, cm und mm umrechnen, vergleichen, damit rechnen |
| 🔷 Formen | Figuren erkennen, Ecken und Seiten zählen, Spiegelachsen, Umfang, Körper |
| 📖 Sachaufgaben | Rechengeschichten mit einem und zwei Rechenschritten |
| 🧩 Knobeln | Verdoppeln/Halbieren, gerade und ungerade, Muster, Zahlenrätsel |

Jedes Thema hat **drei Stufen**. Die Plattform stellt sich selbst ein: Nach
einer fast fehlerfreien Runde geht es eine Stufe höher, nach einer sehr
schwachen Runde eine Stufe zurück. Im Elternbereich lässt sich die Stufe auch
von Hand setzen.

## Weitere Funktionen

- **Übungsrunden mit zehn Aufgaben**, sofortiger Rückmeldung und – bei einem
  Fehler – dem ausgeschriebenen Rechenweg.
- **Zahlentastatur** statt Systemtastatur; auf dem Rechner funktionieren auch
  die Zifferntasten, Rücktaste und Enter.
- **Zweischrittige Aufgaben**: Bei Rechentricks und Umkehraufgaben rechnet das
  Kind erst die Hilfsaufgabe (`3 + 4 = ?`). Stimmt sie, springt ein animiertes
  Herz auf und es gibt Extrapunkte; danach steht die Hilfsaufgabe als Hinweis
  über der großen Aufgabe (`30 + 40 = ?`).
- **Tipps** zu jeder Aufgabe, die das Kind selbst aufklappen kann.
- **Gemischtes Training** über alle Themen hinweg.
- **Rechenmeister**: 20 Aufgaben gegen die Uhr aus Plus/Minus, Rechentricks,
  Aufgabenfamilien und Zahlenmauern – mit Stoppuhr und gespeicherter
  Bestleistung.
- **Punkte, Level, Sterne, Tagesserie und zwölf Abzeichen** als Motivation.
- **Fortschrittsseite** mit Trefferquoten je Thema und einer Übersicht der
  letzten zwei Wochen.
- **Elternbereich** mit Lernstandstabelle und den häufigsten Fehlerarten.
- **Offlinefähig** (Service Worker) und als App installierbar.
- **Hell- und Dunkelmodus**, große Schaltflächen, Tastatur- und
  Screenreader-tauglich.

## Loslegen

```bash
npm install     # nur TypeScript, keine Laufzeit-Abhängigkeiten
npm run build   # kompiliert src/ nach js/
npm run serve   # http://localhost:8080
npm test        # baut und prüft mit node:test
```

Die Seite braucht keinen Build-Server: `index.html`, `style.css` und das
kompilierte `js/` liegen im Wurzelverzeichnis und sind mit eingecheckt. Für
GitHub Pages genügt es deshalb, den Branch `main` als Quelle einzustellen.

## Aufbau

```
index.html          Einstiegsseite (inkl. Content-Security-Policy)
style.css           gesamte Gestaltung, Hell- und Dunkelmodus über Variablen
sw.js               Service Worker (Network-First) – einzige handgeschriebene JS-Datei
src/
  app.ts            Routentabelle, Code-Splitting, Service-Worker-Anmeldung
  router.ts         Hash-Router
  shell.ts          Kopfleiste und untere Navigation
  types.ts          Domänen-Typen
  topics.ts         Themen und ihre drei Stufen
  state.ts          einziger Ort, der localStorage liest/schreibt
  gamification.ts   Punkte, Level, Sterne, Streak, Abzeichen
  random.ts         mulberry32 – die einzige Zufallsquelle
  figures.ts        Erklärbilder als SVG (Uhr, Geld, Formen, Zahlenmauern, Rechenräder …)
  dom.ts            el()-Helfer zum DOM-Bauen ohne Framework
  tasks/            Aufgaben-Generatoren je Themengruppe
  views/            Start, Übung, Fortschritt, Elternbereich
test/               node:test gegen das kompilierte js/
```

## Datenschutz

Es gibt keinen Server und keine Netzwerkaufrufe. Alles, was gespeichert wird,
steht unter dem Schlüssel `mathe2:fortschritt` im Browserspeicher des Geräts
und lässt sich im Elternbereich vollständig löschen.
