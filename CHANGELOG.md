# Changelog

Alle nennenswerten Änderungen an der Mathe-Schule. Das Format orientiert sich
an [Keep a Changelog](https://keepachangelog.com/de/1.1.0/), die Versionen
folgen [Semantic Versioning](https://semver.org/lang/de/).

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
