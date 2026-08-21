# Changelog

Alle nennenswerten Änderungen an der Mathe-Schule. Das Format orientiert sich
an [Keep a Changelog](https://keepachangelog.com/de/1.1.0/), die Versionen
folgen [Semantic Versioning](https://semver.org/lang/de/).

## [1.6.0] – 2026-08-21

### Neu

**Gezielte Fehlerwiederholung.** Aufgabenarten, bei denen es zuletzt hakte,
kommen von selbst häufiger dran:

- Ab zwei Fehlern gilt eine Aufgabenart als Schwerpunkt (`schwerpunkte()`).
  Beim Bauen einer Runde wird für jeden zweiten Platz gezielt eine solche
  Aufgabe gesucht – so wiederholt die Runde die Schwachstellen, besteht aber
  nie nur aus ihnen. Gemessen liegt der Anteil bei 40–75 %.
- Findet sich im Thema keine passende Aufgabe, läuft alles wie bisher weiter.
- Die Fehlerbilanz **baut sich wieder ab**: Jede richtige Antwort derselben
  Art zieht den Zähler um eins herunter, bei null verschwindet der Eintrag.
  Der Elternbereich zeigt damit den aktuellen Stand statt aller Fehler seit
  Beginn – die Karte heißt jetzt „Wo es gerade hakt“.

**Mehr Aufgabenvielfalt in den Heft-Themen:**

- Plus & Minus: Aufgaben mit **drei oder vier Summanden** (`4 + 3 + 2 + 1 =`,
  wie in den Sprechblasen des Hefts) und **Ergänzen zum vollen Zehner**
  (`55 + ? = 60`).
- Rechentricks: **Analogie über den Zehner hinweg** – `7 + 5 = 12`, also
  `67 + 5 = 72`. Zweischrittig mit Herz wie die übrigen Analogieaufgaben.
- Aufgabenfamilien: die **fehlende dritte Zahl** einer Familie bestimmen.
- Geld: **Preisunterschied** ausrechnen („Wie viel Cent kostet das Heft
  mehr?“).

## [1.5.0] – 2026-08-21

### Geändert

Die Plattform stellt jetzt klar die Themen des Übungshefts in den Mittelpunkt;
die selbst ergänzten Bereiche treten dahinter zurück.

- Jedes Thema trägt ein Kennzeichen `ausHeft`. Sechs Bereiche gehören dazu:
  Plus & Minus, Rechentricks, Aufgabenfamilien, Zahlen bis 100, Mauern & Räder
  und Geld.
- Die **Startseite** ist in zwei Abschnitte geteilt: „Aus dem Übungsheft“ steht
  oben, „Weitere Themen“ darunter mit dem Hinweis, dass sie im Heft nicht
  vorkommen.
- Die **Empfehlung** („Weiter mit …“) wählt nur noch aus den Heft-Themen. Ein
  schwaches Zusatzthema verdrängt sie nicht mehr.
- Das **gemischte Training** zieht Heft-Themen doppelt so oft: Sie stecken
  zweimal im Ziehungstopf (`MIX_TOPF`).
- Im **Elternbereich** tragen die betroffenen Zeilen die Marke „Heft“, dazu
  ein Satz, was das bedeutet.
- Die Reihenfolge folgt jetzt dem Aufbau des Hefts (Plus & Minus zuerst) statt
  der ursprünglichen, frei gewählten Sortierung.

## [1.4.0] – 2026-08-21

### Neu

- **Rechenkästen**: Vier Zahlen in einem 2×2-Kasten, auf dem Fähnchen ihre
  Summe. Mal fehlt das Fähnchen (dann wird addiert), mal ein Feld (dann muss
  rückwärts gerechnet werden). In allen drei Stufen von „Mauern & Räder“.
- **Zahlenfolgen mit Pfeilschritten**: Über den Kästchen stehen die Schritte,
  die sich abwechseln (`0 →+3→ 3 →+0→ 3 →+3→ 6 …`, auch mit Minus). Genau ein
  Kästchen ist leer. In „Zahlen bis 100“, Stufe 2 und 3.
- **Puzzleteile** in den Formen: Ein Rechteck ist mit einer Treppenlinie
  zerschnitten; gesucht ist unter vier Teilen das passende Gegenstück.
- **Beträge passend legen** beim Geld: „… hat schon 5 € hingelegt, wie viele
  1-€-Münzen fehlen noch?“ sowie die Auswahl der richtigen Kombination aus
  Scheinen und Münzen. Münzen (1 €, 2 €) und Scheine (ab 5 €) werden dabei
  auseinandergehalten.

### Geändert

- Neue Antwortart **Bildauswahl**: Antwortkarten können jetzt Bilder statt
  Text enthalten. Sie tragen die Buchstaben A bis D, damit die Rückmeldung
  („Richtig ist: D“) verständlich bleibt.
- Bilder können sich als `breit` markieren und dann die volle Kartenbreite
  nutzen – nötig für die Pfeilfolgen, die sonst zu klein gerieten.

## [1.3.0] – 2026-08-21

### Neu

Weitere Aufgabenformen aus dem Lernheft:

- **Rätselwort** (`#/raetsel`), die große Rätselseite: Zu jedem Buchstaben des
  Lösungsworts gehört eine Zahl, die Legende steht als Tabelle über der
  Aufgabe. Jede gerechnete Aufgabe deckt einen Buchstaben auf – richtig in
  Farbe, falsch in Grau, sodass die Runde nie abbricht. Am Ende erscheinen das
  Wort und ein Satz dazu. Zwölf Lösungswörter, alle Aufgaben im Zahlenraum bis
  20. Ein fehlerfreies Rätsel bringt das Abzeichen „Wortfinder“.
- **Nachbaraufgaben** bei den Rechentricks: `7 + 7 = 14`, also ist `7 + 8` eins
  mehr – und beim Minusrechnen `18 − 9 = 9`, also ist `18 − 8` eins mehr. Sie
  laufen wie die Analogieaufgaben zweischrittig und bringen ein Herz.
- **Rechentabellen** in Plus & Minus (Stufe 3): Zeilen- und Spaltenkopf ergeben
  den Wert einer Zelle, genau ein Feld ist markiert. Die Rechnung steht
  bewusst NICHT daneben – das Ablesen ist die Übung. Bei Minus kommt auch der
  Fall vor, dass eine Aufgabe nicht aufgeht; dann ist „Das geht nicht“ die
  richtige Antwort.
- **Zweite Radform**: Bisher ergänzten außen und innen zusammen die Mitte. Neu
  ist die Gegenrichtung aus dem Heft – zur Mitte kommt der innere Ring dazu,
  außen steht das Ergebnis (`8 + ? = 11`).

### Geändert

- Der Fortschritt speichert die Zahl fehlerfrei gelöster Rätsel
  (`raetselGeloest`). Ältere Spielstände werden beim Laden ergänzt.
- „Nochmal üben“ heißt im Rätsel „Neues Rätselwort“ und startet auch wirklich
  ein neues – bisher wäre daraus ein gemischtes Training geworden.

## [1.2.0] – 2026-08-21

### Neu

- **Hilfsaufgaben werden jetzt selbst gerechnet.** Aufgaben mit einer
  `vorstufe` laufen in zwei Schritten: Erst löst das Kind die Hilfsaufgabe
  (`3 + 4 = ?`), danach die große Aufgabe (`30 + 40 = ?`). Bisher stand das
  Ergebnis der Hilfsaufgabe einfach in der Frage.
- **Herzen** als eigene Belohnung: Jede selbst gelöste Hilfsaufgabe bringt ein
  animiertes Herz und fünf Extrapunkte. Der Zähler läuft in der Kopfzeile der
  Runde mit, die Gesamtzahl steht auf der Fortschrittsseite, und ab 25 Herzen
  gibt es das Abzeichen „Herzensache“.
- Nach dem ersten Schritt steht die Hilfsaufgabe als Hinweiszeile über der
  eigentlichen Aufgabe – auch dann, wenn sie falsch beantwortet wurde.

### Geändert

- Betroffen sind die Rechentricks (Einer→Zehner, Zehner davor, Hunderter) und
  die Umkehraufgaben der Aufgabenfamilien.
- Im **Rechenmeister** entfällt der Schritt: Dort läuft die Uhr, die
  Hilfsaufgabe steht wie bisher gleich als Hinweis da.
- Der Fortschritt speichert die gesammelten Herzen (`herzen`). Ältere
  Spielstände ohne dieses Feld werden beim Laden ergänzt.

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
