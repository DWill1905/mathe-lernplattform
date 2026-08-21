# Changelog

Alle nennenswerten Änderungen an der Mathe-Schule. Das Format orientiert sich
an [Keep a Changelog](https://keepachangelog.com/de/1.1.0/), die Versionen
folgen [Semantic Versioning](https://semver.org/lang/de/).

## [1.1.0] – 2026-08-21

### Neu

Nachgezogen, was im Lernheft der 2. Klasse eine tragende Rolle spielt und
bisher fehlte:

- **Rechentricks (Analogieaufgaben)** als eigenes Thema: von der Hilfsaufgabe
  zum Ergebnis (3 + 4 = 7 → 30 + 40), Zehner davor (3 + 2 → 13 + 2), plus und
  minus 10, Hunderteraufgaben, Lücken mit glatten Zehnern und Zeilen aus den
  Additions-/Subtraktionstabellen. Die Hilfsaufgabe steht immer in der Frage.
- **Aufgabenfamilien** („3 Zahlen, 4 Aufgaben“): Umkehraufgaben zu Plus und
  Minus, Tauschaufgaben als Auswahl, die vierte Aufgabe eines Zahlentrios und
  Lückenaufgaben in allen vier Formen.
- **Mauern & Räder**: Zahlenmauern mit genau einem fehlenden Stein – die Lücke
  kann oben, in der Mitte oder unten sitzen, das Rückwärtsrechnen ist damit
  Teil der Übung. Dazu Rechenräder, bei denen außen und innen zusammen immer
  die Zahl in der Mitte ergeben.
- **Rechenmeister**: 20 Aufgaben gegen die Uhr mit laufender Stoppuhr, ohne
  Tipps. Bestleistung wird gespeichert – erst nach Treffern, dann nach Zeit
  bewertet. Dazu das Abzeichen „Blitzrechner“ für 20 von 20.
- Neue Erklärbilder `zahlenmauer()` und `rechenrad()` in `figures.ts`.

### Geändert

- Das gemischte Training lässt sich jetzt auf eine Themenauswahl einschränken;
  der Rechenmeister nutzt das für seine fünf Bereiche.
- Das Abzeichen „Rundum neugierig“ verlangt zehn Aufgaben je Thema statt einer
  einzigen – eine gemischte Runde allein schaltet es nicht mehr frei.
- Der Fortschritt speichert die Bestwerte des Rechenmeisters (`meister`).
  Ältere Spielstände ohne dieses Feld werden beim Laden ergänzt.

## [1.0.0] – 2026-08-20

### Neu

- Erste Fassung der Lernplattform für Mathematik in der 2. Klasse.
- Zehn Themen mit je drei Stufen: Zahlen bis 100, Plus & Minus, Einmaleins,
  Geteilt, Geld, Uhrzeit, Längen, Formen, Sachaufgaben und Knobeln.
- Übungsrunden aus zehn Aufgaben mit sofortiger Rückmeldung, Tipps und
  ausgeschriebenem Rechenweg nach einem Fehler.
- Gemischtes Training über alle Themen hinweg. Es verändert bewusst keine
  Stufen, weil sich aus ein bis zwei Aufgaben je Thema kein Können ableiten
  lässt.
- Selbstanpassende Schwierigkeit: ab 90 % richtig eine Stufe hoch, unter 40 %
  eine Stufe zurück.
- Gamification: Punkte, acht Levelstufen mit Titeln, Sterne je Thema,
  Tagesserie und zwölf Abzeichen.
- Fortschrittsseite mit Kennzahlen, Aktivität der letzten zwei Wochen,
  Trefferquote je Thema und Abzeichenübersicht.
- Elternbereich mit Lernstandstabelle, den häufigsten Fehlerarten, manueller
  Stufenwahl, Namensfeld und vollständigem Zurücksetzen.
- Erklärbilder als SVG: analoge Uhr, Münzen und Scheine, ebene Figuren mit
  Spiegelachse, Zahlenstrahl und Punktefelder. Sie färben ausschließlich über
  CSS-Klassen, damit der Dunkelmodus greift.
- Zahlentastatur mit Unterstützung für Zifferntasten, Rücktaste und Enter.
- Offlinebetrieb über einen Service Worker (Network-First) und
  Web-App-Manifest zur Installation.
- 28 Tests mit `node:test` gegen das kompilierte `js/`: Wohlgeformtheit aller
  Aufgaben über 300 Durchläufe je Thema und Stufe, rechnerische Richtigkeit,
  Einhaltung des Zahlenraums, Prüfung manipulierter Spielstände sowie
  Punkte-, Level- und Stufenlogik.
