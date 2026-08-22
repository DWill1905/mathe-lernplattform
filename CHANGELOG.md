# Changelog

Alle nennenswerten Änderungen an der Mathe-Schule. Das Format orientiert sich
an [Keep a Changelog](https://keepachangelog.com/de/1.1.0/), die Versionen
folgen [Semantic Versioning](https://semver.org/lang/de/).

## [1.15.0] – 2026-08-22

### Geändert

**Die App heißt jetzt „Zahleneule“.**
Der Name greift die Eule auf, die als Maskottchen ohnehin in Kopfzeile und
App-Symbol sitzt, und passt zum ganzen Umfang – nicht nur zum Rechnen, sondern
auch zu Formen, Uhrzeit und Längen.

Umbenannt an allen elf Stellen: Kopfzeile, Seitentitel, Offline-Hinweis,
Elternbereich, `manifest.webmanifest` (Name und Kurzname für den
Startbildschirm), der iOS-Titel `apple-mobile-web-app-title`, der
noscript-Hinweis, README und CLAUDE.md.

Der Cache des Service Workers heißt jetzt `zahleneule-v1` statt
`mathe-schule-v2`. Bestehende Installationen behalten den alten Cache nicht:
Der `activate`-Haken löscht alles, was nicht der aktuelle Name ist.
Nachgestellt und geprüft – nach dem Update ist nur noch `zahleneule-v1` da, und
die Seite läuft danach weiterhin offline.

Der Repository-Name bleibt `mathe-lernplattform`, die Adresse der Seite ändert
sich also nicht.

## [1.14.0] – 2026-08-22

### Geändert

**Die Hilfsaufgabe wird jetzt ganz eingetippt, nicht nur ihr Ergebnis.**
Bisher stand im Bonus die fertige Rechnung da („4 − 1 =“) und es war nur noch
die 3 zu tippen. Das ist keine eigene Leistung. Jetzt steht dort nur die große
Aufgabe („Dafür: 40 − 10 =“) – die passende Hilfsaufgabe muss das Kind selbst
finden UND vollständig aufschreiben: `4 − 1 = 3`.

- Neue Antwortart `"rechnung"`: Das Tastenfeld bekommt zusätzlich **+, − und =**
  (eine Reihe mehr), die Eingabe darf 14 Zeichen lang sein. Auch über die
  Tastatur, wo der Bindestrich als Minus zählt.
- Eine Beispielzeile („zum Beispiel so: 3 − 2 = 1“) zeigt, dass
  Gleichheitszeichen und Ergebnis dazugehören.
- Der Vergleich ist **großzügig in der Schreibweise, streng in der Sache**:
  Leerzeichen egal, Bindestrich und Gedankenstrich zählen als Minus, und beim
  Plus ist die Reihenfolge vertauschbar (`3 + 4 = 7` gilt für `4 + 3 = 7`).
  Falsche Zahlen, falsches Ergebnis, vertauschtes Minus oder nur das Ergebnis
  gelten nicht.
- Die Fragetexte heißen jetzt „Schreibe die kleine Hilfsaufgabe ganz auf“ bzw.
  „Schreibe die passende Umkehraufgabe ganz auf“.

Der Vergleich ist dabei aus der Ansicht in ein eigenes Modul `src/antwort.ts`
gewandert – vorher war er eine private Funktion in `views/uebung.ts` und ließ
sich gar nicht prüfen. Elf neue Tests decken ihn ab.

Im Browser nachgespielt: ganze Rechnung richtig (Herz kommt), nur das Ergebnis
getippt (wird abgelehnt) und beim Minus vertauscht (wird abgelehnt).

### Behoben

Die zusätzliche Tastenreihe machte die Bonusansicht im Querformat auf dem
Telefon 6 px zu hoch. Gemessen und nachgebessert: Eingabefeld und Tastenabstände
sind dort kleiner, 40 px Tastenhöhe bleiben die Untergrenze. Alle sechs
geprüften Geräte kommen jetzt ohne Scrollen aus, und der Bonusknopf selbst ist
auf allen ohne Scrollen sichtbar (engste Luft 88 px auf dem iPhone SE).

## [1.13.0] – 2026-08-22

### Geändert

**Die Hilfsaufgabe kommt jetzt NACH der eigentlichen Aufgabe – und nur, wer
will.**
Bisher lief eine Aufgabe mit Hilfsaufgabe zwangsweise in zwei Schritten: erst
die Hilfsaufgabe, dann die große. Das half nicht, denn wer „7 + 3“ rechnen
soll, ohne „70 + 30“ gesehen zu haben, weiß gar nicht, wobei das helfen soll.

Neuer Ablauf:

1. Die **eigentliche Aufgabe** steht da, mit Tastenfeld – man kann sofort
   antworten und fertig.
2. Darunter, neben „Tipp anzeigen“, steht das Angebot **„Hilfsaufgabe selbst
   rechnen“** mit einem Herz.
3. Wer es antippt, sieht die kleine Hilfsaufgabe – und darüber weiterhin die
   große Aufgabe („Dafür: 70 + 30 =“), damit der Zusammenhang sichtbar bleibt.
4. Richtig gerechnet gibt es ein Herz und Extrapunkte; danach geht es zurück
   zur Hauptaufgabe, mit dem Ergebnis der Hilfsaufgabe als Zeile darüber.
5. Falsch gerechnet gibt es kein Herz, aber die richtige Hilfsaufgabe wird
   trotzdem angezeigt – sie hilft ja weiter.

Der Bonus zählt nie in die Trefferbilanz: Er ist freiwillig, also darf er die
Runde weder retten noch verderben. Eine angefangene Eingabe der Hauptaufgabe
wird geparkt und kommt zurück, wenn der Bonus vorbei ist.

Weil die große Aufgabe jetzt vorne steht, sind die Fragetexte angepasst:
„Und jetzt die große Aufgabe“, „Und jetzt die Nachbaraufgabe“ und „Und jetzt
die Umkehraufgabe“ setzten alle einen Schritt davor voraus. Sie heißen jetzt
schlicht „Wie lautet das Ergebnis?“.

Ein neuer Test hält die Regel fest, die daraus folgt: **Eine Aufgabe mit
Hilfsaufgabe muss auch ohne sie verständlich sein** – kein Rückbezug im Text,
und die Rechnung selbst muss sichtbar sein. Gegengeprüft gegen die alten
Texte, dort schlägt er an.

Im Browser nachgespielt: mit Bonus (Herz kommt, Hilfsaufgabe steht danach als
Zeile über der Aufgabe, Hauptaufgabe weiterhin normal wertbar), mit falschem
Bonus (kein Herz, richtige Hilfsaufgabe wird gezeigt) und ganz ohne Bonus
(direkt antworten, wird normal gewertet).

## [1.12.0] – 2026-08-22

### Geändert

**Die Rechengeschichten drehten sich fast nur ums Schenken.**
Auf Stufe 1 gab es genau zwei Geschichten: „… schenkt … dazu“ und
„… verschenkt …“. Das waren 100 % Schenken. Auch auf den höheren Stufen kam
derselbe Satzbau immer wieder, weil je Rechenart nur ein einziger Text
existierte und nur der Gegenstand wechselte.

Die Rechenart steckt jetzt weiterhin in der Funktion, die **Geschichte** kommt
aber aus einem Pool daneben – 60 Vorlagen insgesamt:

- **Dazu**: Gummienten in der Badewanne, Ameisen am Kuchenkrümel, Tauben auf
  dem Dach, Popcorn aus der Maschine, ein Drache mit Goldmünzen, der Bus an
  der Haltestelle …
- **Weg**: Socken, die in der Waschmaschine verschwinden, ein Hund, der seine
  Knochen nicht wiederfindet, platzende Luftballons, Frösche, die ins Wasser
  hüpfen, Goldtaler, die über Bord rollen …
- **Mehr als**: Oliven auf der Pizza, Runden auf der Bahn, Schrauben am
  Roboter, Nester in Eiche und Buche …
- **Verteilen**: Jonglierbälle auf Artisten, Küken in Grüppchen, Kaninchen aus
  Zauberhüten …
- **Malnehmen**: Punkte auf Marienkäfern, Augen an Monstern, Erdbeeren am
  Spieß, Wölfe im Rudel …
- **Zwei Schritte**, **Einkauf** und **Vergleich** ebenso mit je neun Vorlagen.

Gemessen über je 800 Aufgaben, Namen und Zahlen herausgerechnet:

| Stufe | verschiedene Geschichten | häufigste Geschichte | mit „schenken“ |
| --- | --- | --- | --- |
| 1 | 16 → **37** | 8,3 % → **5,8 %** | 100 % → **0 %** |
| 2 | 32 → **53** | 6,1 % → **3,4 %** | 40 % → **0 %** |
| 3 | 17 → **27** | 34,4 % → **5,0 %** | 36 % → **0 %** |

Die 16 Geschichten auf Stufe 1 waren dabei nur zwei Situationen – „schenkt
dazu“ und „verschenkt“ – mal acht Gegenstände. Auf Stufe 3 machte eine einzige
Geschichte über ein Drittel aller Aufgaben aus.

### Behoben

- **„Auf Jonass Pizza“** – Namen auf s, ß, x oder z bekommen im Wesfall nur
  einen Apostroph. Neue Hilfsfunktion `wesfall()`, richtig ist „Jonas’ Pizza“.
- **„Emma dreht 10 Runden, Lina schafft 70 Runden mehr.“** Bei „mehr als“ durfte
  der Unterschied größer sein als die Ausgangszahl – rechnerisch richtig, als
  Geschichte Unfug. Er bleibt jetzt kleiner oder gleich.

Vier neue Tests: Vielfalt der Geschichten (Namen und Zahlen herausgerechnet,
sonst zählten wechselnde Vornamen schon als neue Geschichte), der Schenk-Anteil,
die Größenordnung bei „mehr als“ und der Wesfall. Alle vier wurden gegen den
alten Stand gegengeprüft – sie schlagen dort an.

## [1.11.1] – 2026-08-21

### Behoben

**Rechenrad, Rechenkasten und Zahlenmauer waren komplett verschwunden.**
Der Flexspalten-Umbau aus 1.11.0 hatte dem Erklärbild `flex: 0 1 auto` gegeben
– damit kam seine Basisgröße aus dem Inhalt. Der Inhalt war ein SVG mit
`height: 100%`. Höhe des Kastens hängt am SVG, Höhe des SVG hängt am Kasten:
Diesen Ringschluss löst der Browser mit null auf. Alle Erklärbilder der Übung
waren 0 × 0 groß.

Derselbe Fehler steckte ein zweites Mal in der Seite: `width: auto` auf einem
Inline-SVG, das nur eine `viewBox` hat. Auch dort fehlt jede Bezugsgröße, auch
dort war das Ergebnis 0 × 0 – im Querformat.

Beides ist behoben: Die Höhe kommt jetzt über `flex-grow` aus dem übrigen
Platz (eindeutig, nicht aus dem Inhalt), das SVG hat immer eine feste Breite,
und ein `min-height` sorgt dafür, dass bei wenig Platz etwas Sichtbares übrig
bleibt.

**Warum das nicht aufgefallen ist.**
Meine Messung in 1.11.0 prüfte, ob der Antwortbereich ohne Scrollen ins
Fenster passt. Mit verschwundenem Erklärbild passte er natürlich immer – die
Messung bestätigte also genau den Fehler, den sie hätte finden sollen. Sie
prüft jetzt beides: dass das Bild sichtbar ist UND dass der Antwortbereich
passt.

Die ehrlichen Zahlen über sechs Geräte, je 30 zufällige Aufgaben aus
Mauern/Gemischt/Puzzle:

| Gerät | Bilder sichtbar | ohne Scrollen |
| --- | --- | --- |
| iPhone SE | 16 von 16 | 25 von 30 |
| iPhone 14 | 18 von 18 | 25 von 30 |
| iPhone 14 quer | 20 von 20 | 30 von 30 |
| iPad mini | 17 von 17 | 30 von 30 |
| iPad Pro 11 | 19 von 19 | 30 von 30 |
| iPad Pro quer | 14 von 14 | 26 von 30 |

Auf den kleinen Telefonen muss man bei den höchsten Bildaufgaben also weiter
ein Stück scrollen. Das war auch vor 1.11.0 so; ein sichtbares Bild ist
wichtiger als eine scrollfreie Seite.

Ein neuer Test hält die ganze Fehlerklasse fest: kein `width: auto` auf dem
Erklärbild, `height: 100%` nur bei einem Elternteil mit eigener Höhe, und immer
ein Mindestmaß. Gegengeprüft, indem beide Fehler noch einmal eingebaut wurden –
der Test schlägt bei jedem an.

## [1.11.0] – 2026-08-21

### Geändert

**Die Startseite führt jetzt über Bilder, nicht über Fließtext.**
Sie war 2558 px hoch auf einem 844-px-Schirm – dreimal scrollen –, und jede der
13 Themenkacheln trug drei Zeilen Beschreibung. Für ein Kind der 2. Klasse, das
gerade erst liest, ist das Lärm.

- Neues Modul `src/bilder.ts`: 16 farbige Illustrationen (ein Bild je Thema
  plus je eines für Gemischt, Puzzle und Auf Zeit), gezeichnet als SVG.
- Kacheln zeigen Bild, kurzen Titel und Sterne. Die Beschreibung lebt als
  `title` und in der Bildbeschreibung weiter, verschwindet also nicht.
- Begrüßung auf eine schmale Zeile eingedampft, „Weitere Themen" kleiner.
- Ergebnis: 1682 statt 2558 px – ein Drittel weniger.

**Statt Rätselwort jetzt Puzzle.**
Das Rätselwort verlangte Lesen und Buchstabenzuordnung – beim Rechnenüben eine
Nebenbaustelle. An seiner Stelle steht ein Bild aus zwölf Teilen: Jede richtig
gerechnete Aufgabe deckt ein Teil auf, falsch gerechnete bleiben blass. Am Ende
ist das ganze Bild zu sehen (zehn Motive: Rakete, Katze, Segelschiff, Blume,
Schmetterling, Regenbogen, Fuchs, Leuchtturm, Heißluftballon, Dino).

Anders als das Rätselwort braucht das Puzzle keine eigenen Aufgaben: Es ist
eine ganz normale gemischte Runde mit einem Bild darüber. Damit gelten Stufen,
Fehlerschwerpunkte und das Aufgabengedächtnis auch hier. Der Fortschrittsbalken
entfällt in diesem Modus – die aufgedeckten Teile ZEIGEN den Fortschritt.

`src/raetsel.ts`, `buchstabencode()` und das Abzeichen „Wortfinder" sind weg;
das Abzeichen heißt jetzt „Puzzlemeister", die Route `#/raetsel` heißt `#/puzzle`.

### Hinzugefügt

**Jubel: Wenn etwas richtig ist, passiert etwas.**
Neues Modul `src/jubel.ts` mit sieben Überraschungen, die reihum kommen (nie
zweimal dieselbe hintereinander):

| Art | Was passiert |
| --- | --- |
| Zauberhut | Ein Zauberstab schwingt, ein Kaninchen springt aus dem Hut, es funkelt |
| Schwein, Biene, Vogel | Ein Tier fliegt mit schlagenden Flügeln quer über den Schirm |
| Konfetti | 18 Schnipsel regnen herunter und trudeln |
| Rakete | Eine Rakete startet nach oben |
| Sternenregen | Zehn Sterne stieben nach außen |

Die Ebene liegt über allem, lässt aber **jeden Klick durch** – ein Kind, das
schnell weitertippt, wird nie ausgebremst. Wer `prefers-reduced-motion` gesetzt
hat, bekommt dieselbe Figur ruhig ein- und ausgeblendet statt fliegend.

### Behoben

**Bildaufgaben schoben das Tastenfeld aus dem Bild.**
Gemessen auf sechs Geräten: Auf dem iPhone SE fehlten im schlimmsten Fall 89 px,
auf dem iPad quer 33 px – also musste ein Kind bei Rechenrad-, Punktefeld- oder
Zahlenmauer-Aufgaben erst scrollen, um die Ziffern zu erreichen. Das galt schon
vor dieser Version.

Die Übungsseite ist jetzt eine Flexspalte über die volle Fensterhöhe, und das
Erklärbild bekommt nur den Platz, der übrig bleibt. Feste `vh`-Grenzen hatten
nicht gereicht, weil Frage und Antwortbereich je nach Aufgabenart verschieden
hoch sind.

> **Nachtrag zu 1.11.1:** Hier stand ursprünglich, alle sechs Geräte kämen in
> beiden Modi ohne Scrollen aus. Das war falsch – die Messung prüfte nur, ob
> der Antwortbereich ins Fenster passt, und genau das tat er immer, weil das
> Erklärbild verschwunden war. Die richtigen Zahlen stehen in 1.11.1.

Außerdem weichen Kopfzeile und Navigation während einer Übung jetzt auch im
Hochformat, sobald das Fenster schmal oder niedrig ist – bisher nur im
Querformat. Auf dem iPhone SE waren das 155 px, die der Aufgabe fehlten.

**Kleinere Funde beim Bauen:**

- `class="bild"` der neuen Illustrationen kollidierte mit dem vorhandenen
  Bildrahmen aus `dom.ts`. Die Illustrationen heißen jetzt `illu`.
- Die Tinte der Illustrationen wurde im Dunkelmodus mit umgestellt – dadurch
  lag heller Umriss auf hellem Zifferblatt und die Uhr verschwand ganz. Jetzt
  bleibt die Tinte dunkel, und jede Zeichnung bekommt einen hellen Grund.
- `icon()`-Symbole `wuerfel` und `buchstaben` werden nicht mehr gebraucht und
  sind entfernt.

Zwölf neue Tests (105 insgesamt) zu Illustrationen, Puzzle-Abdeckung,
Jubel-Reihenfolge, Farbfreiheit der SVGs und dem Verbot von Inline-Styles.

## [1.10.0] – 2026-08-21

### Behoben

**Aufgaben wiederholen sich nicht mehr von Runde zu Runde.**
Bisher achtete die Ziehung nur INNERHALB einer Runde darauf, keine Aufgabe
zweimal zu stellen. Wer mehrere Runden hintereinander übte, bekam deshalb
Bekanntes wieder vorgesetzt – gemessen über fünf Runden (50 Aufgaben) waren
das je nach Thema 3 bis 65 % Wiederholungen.

Der Fortschritt merkt sich jetzt die zuletzt gestellten Aufgaben (`letzteAufgaben`,
gedeckelt auf 60 Einträge ≈ sechs Runden) und die Ziehung geht ihnen aus dem Weg.
Gespeichert wird nicht die volle Kennung, sondern ein 32-Bit-Kurzschlüssel
(FNV-1a) – die volle Kennung enthält bei Bildaufgaben das komplette SVG und
würde den Speicher sprengen.

Wirkung, gemessen über fünf Runden je Thema und Stufe:

| Thema | vorher | nachher |
| --- | --- | --- |
| Plus & Minus, Aufgabenfamilien, Mauern, Geld, Zahlenraum, Analogie | 0–23 % | 0 % |
| Einmaleins, Knobeln, Geometrie, Sachaufgaben | 0–42 % | 0 % |
| Uhrzeit/Längen/Geteilt auf Stufe 1 | 48–65 % | 40–64 % |

Die letzte Zeile ist keine Schwäche der Ziehung, sondern die rechnerische
Untergrenze: „Volle Stunden“ kennt nur 24 verschiedene Aufgaben, Längen auf
Stufe 1 nur 18. Wer 50 Aufgaben zieht, MUSS dort wiederholen. Diese Themen
brauchen breitere Generatoren, keine bessere Auswahl.

Wichtig für die Ziehung: Der Verlauf ist ein **Wunsch**, keine Sperre. Wäre er
Pflicht, fände die Suche in genau diesen kleinen Themen irgendwann nichts mehr
und die Runde bräche ab. Die Frische innerhalb einer Runde bleibt Pflicht.

Gemerkt wird beim BAU der Runde, nicht am Ende: Bricht ein Kind mittendrin ab,
zeigt die nächste Runde trotzdem andere Aufgaben.

## [1.9.0] – 2026-08-21

### Geändert

**Neues Erscheinungsbild in Lila – und Schluss mit Emojis.**

- **Eigenes Symbolset** (`src/icons.ts`): 35 selbst gezeichnete SVG-Icons im
  24er-Raster, allesamt über `currentColor` einfärbbar. Emojis sahen auf jedem
  Gerät anders aus, ließen sich nicht an Thema oder Farbschema anpassen und
  wurden von Screenreadern eigenwillig vorgelesen. Ein Test verhindert, dass
  wieder welche in den Quellcode geraten, und prüft, dass jedes Thema und jedes
  Abzeichen ein vorhandenes Symbol nutzt.
- **Eule als Maskottchen** in der Kopfzeile und im App-Symbol.
- **Farbwelt auf Lila umgestellt**, inklusive Markenverlauf für den
  Hauptknopf, die Level-Marke, den Fortschrittsbalken und die OK-Taste.
- **Verspielter, aber lesbar**: getönte Themenkacheln mit dem Symbol in einem
  runden Farbfeld, weichere Schatten, rundere Karten, Sterne als gefüllte und
  offene SVG-Symbole statt Textzeichen.
- **Kontraste nachgemessen**: Für Text auf getönten Flächen gibt es jetzt das
  Token `--haupt-text`, und der Markenverlauf endet in einem dunkleren Rosa,
  damit weiße Schrift darauf bestehen bleibt. Im Dunkelmodus trägt der Verlauf
  dunkle statt weißer Schrift. Alle geprüften Textfarben erfüllen WCAG AA in
  beiden Farbschemata.
- App-Symbole, `theme-color` und die Manifest-Farben neu gezeichnet.

### Behoben

- `icon()` ersetzte die Basisklasse `symbol` statt sie zu ergänzen. Dadurch
  verloren die Symbole ihre Maße; die Sternebewertung fiel ganz zusammen und
  war weder auf den Kacheln noch in der Fortschrittsliste zu sehen.

## [1.8.0] – 2026-08-21

### Neu

**Für iPad und iPhone eingerichtet.** Gemessen wurde auf sechs Viewports
(iPhone SE, iPhone 14, beide quer, iPad mini, iPad Pro 11 quer und hoch):

- **Installation auf iOS**: `apple-touch-icon` (180 px) sowie die Metaangaben
  `apple-mobile-web-app-capable`, `-title` und `-status-bar-style`. iOS wertet
  das Manifest für den Startbildschirm nicht aus – ohne diese Angaben nahm
  Safari einen Bildschirmausschnitt als Symbol und startete mit Adresszeile.
- **Safe Areas**: Kopfzeile, Inhalt und Navigation sparen Notch und
  Home-Indikator aus – auch im Querformat, wo die Kerbe seitlich sitzt.
- **Touch-Verhalten**: kein graues Aufblitzen beim Antippen, kein
  Doppeltipp-Zoom (`touch-action: manipulation`), keine Textauswahl und kein
  Kontextmenü, wenn ein Finger auf einer Taste liegen bleibt, und kein
  Überziehen der Seite im installierten Zustand.
- **Kleine und flache Bildschirme**: Auf dem iPhone SE lag die OK-Taste bisher
  hinter der Navigation. Unter 720 px Höhe wird das Layout kompakter; im
  Querformat rücken Aufgabe und Zahlentastatur nebeneinander (die Kartenhöhe
  ist dann das Maximum beider Spalten statt ihrer Summe), und unter 430 px
  weichen App-Kopf und Navigation während einer Übung ganz – zurück führt dort
  „← Abbrechen“.
- **Tablets ab 820 px**: etwas breiterer Inhalt, größere Erklärbilder (360
  statt 280 px) und zwei Spalten für die Schnellstart-Knöpfe.

Nachgeprüft: Die OK-Taste ist auf allen sechs Geräten sichtbar, frei von
Kopfzeile und Navigation, anklickbar – und mindestens 40 px hoch.

## [1.7.0] – 2026-08-21

### Neu

**Die App ist jetzt wirklich vollständig offlinefähig.**

Bisher lud der Service Worker nur sechs Dateien vorab und verließ sich sonst
auf Laufzeit-Caching. Das genügt nicht: `index.html` und die statisch
importierten Module werden beim ersten Besuch geladen, BEVOR der Service Worker
die Kontrolle übernimmt – sie kamen also nie über sein `fetch` in den Cache.
Gemessen fehlten nach einem Erstbesuch acht Kernmodule (`dom`, `router`,
`shell`, `state`, `topics`, `gamification`, `views/start`, `types`); dass es
trotzdem funktionierte, lag allein am Browser-Cache.

- Der Service Worker lädt beim `install` jetzt **alle 34 ausgelieferten
  Dateien**. Er tut das einzeln statt mit `addAll`, damit nicht eine einzige
  fehlende Datei die ganze Installation scheitern lässt.
- Die Liste erzeugt `tools/sw-liste.mjs` bei jedem `npm run build` aus den
  tatsächlich vorhandenen Dateien; `npm run sw:check` erzwingt in der CI, dass
  sie aktuell ist. Eine neue Datei kann damit nicht mehr vergessen werden.
- Cache-Name auf `mathe-schule-v2` erhöht, damit alte Stände weichen.
- **Installierbar**: Das Manifest enthält jetzt PNG-Symbole in 192 und 512
  Pixeln sowie ein maskierbares 512er-Symbol. Ohne diese bot der Browser
  „Zum Startbildschirm hinzufügen“ gar nicht erst an.
- **Offline-Hinweis** in der Kopfzeile, sobald das Gerät kein Netz hat – die
  Bedienung bleibt unverändert. Der Elternbereich erklärt Offlinebetrieb und
  Installation in zwei Sätzen.
- Fünf neue Tests halten fest, dass die Precache-Liste jede ausgelieferte Datei
  enthält, dass der Cache versioniert und aufgeräumt wird und dass das Manifest
  installierbar bleibt.

Gegengeprüft mit abgeschaltetem Server: Nach einem Erstbesuch, bei dem nur die
Startseite geöffnet wurde, laufen alle sieben Ansichten und eine komplette
Übungsrunde ohne jede Netzverbindung.

## [1.6.3] – 2026-08-21

### Sicherheit

Ergebnisse eines Sicherheitsdurchgangs über den gesamten Stand:

- **Der Service Worker verglich die Herkunft per Präfix** (`url.startsWith(origin)`).
  Eine Domain wie `beispiel.de.angreifer.tld` beginnt mit `beispiel.de` und
  wurde dadurch mitbedient. Die Herkunft wird jetzt über `new URL().origin`
  ausgelesen; ein anderes Schema (`http:` statt `https:`) gilt ebenfalls als
  fremd.
- **Der CI-Workflow legt seine Rechte ausdrücklich fest** (`permissions:
  contents: read`). Bauen und Testen braucht keinerlei Schreibrechte am
  Repository.
- **14 neue Tests halten die Sicherheitsannahmen fest**: manipulierte
  Spielstände (Prototype Pollution, Riesenzahlen, falsche Typen, überlange
  Listen, kaputtes JSON) müssen die Prüfung überstehen, `innerHTML` darf nur in
  `dom.ts` vorkommen, die Herkunftsprüfung des Service Workers muss greifen,
  und die CSP darf nicht aufgeweicht werden.

Ohne Befund geprüft: keine Laufzeit-Abhängigkeiten und `npm audit` ohne
Treffer, keine externen Ressourcen, keine Netzwerkaufrufe außerhalb des
Service Workers, keine Geheimnisse im Repository, kein XSS über gespeicherte
Werte (im Browser mit Markup in Namen und Fehlerschlüsseln gegengeprüft), CSP
blockt eingeschleuste Inline- und Fremdskripte.

## [1.6.2] – 2026-08-21

### Behoben

Ergebnisse eines zweiten Code-Reviews über `src/`, `test/`, `sw.js` und
`index.html`:

- **Die Übung ließ Tastatur und Timer zurück** (schwerwiegend): `aufraeumen()`
  lief nur, wenn die Übungsansicht selbst neu aufgerufen wurde. Wer die Runde
  verließ, nahm den Tastatur-Listener mit – auf der Startseite holte eine
  Zifferntaste die alte Übung zurück, und im Elternbereich schluckte das
  Namensfeld Ziffern, Enter und Rücktaste. Ein noch laufender „Weiter“-Timer
  überschrieb außerdem die gerade geöffnete Seite. Jetzt räumt zusätzlich ein
  Haken am Routenwechsel auf.
- **Bildaufgaben wiederholten sich innerhalb einer Runde**: Das
  Erkennungsmerkmal einer Aufgabe bestand nur aus Frage und Rechnung. Weil bei
  Uhr, Form, Mauer und Tabelle alle Ausprägungen denselben Fragetext haben,
  hielt die Runde jede weitere für eine Dublette und ließ dafür echte
  Wiederholungen durch – gemessen 262 von 300 Uhrzeit-Runden mit einer exakt
  identischen Aufgabe. Lösung und Bild gehören jetzt zum Schlüssel; damit greift
  die Schwerpunkt-Wiederholung auch in diesen Themen.
- **„Mitte finden“ zeigte negative Zahlen** (z. B. „zwischen -16 und 24“) und
  Werte über 100. Der Abstand richtet sich jetzt nach dem verbleibenden
  Spielraum auf beiden Seiten.
- **Nachbarzehner beantwortete sich selbst**: „Welcher Zehner kommt vor der
  Zahl 70?“ erwartete 70. Volle Zehner sind jetzt ausgeschlossen.
- **Längenvergleich ohne richtige Antwort**: „100 cm oder 1 m“ – beides gleich
  lang, akzeptiert wurde nur „1 m“. Gleich lange Paare kommen nicht mehr vor.
- **Zahlenraum bis 100 verlassen**: die Sachaufgabe „beide zusammen“ (bis 119)
  und die Knobelaufgabe mit den Nachbarzahlen (bis 120) bleiben jetzt darunter.
- **Der Elternbereich** zeigte für falsch beantwortete Rätselaufgaben die rohe
  Kennung „raetsel/rechnung“ statt eines lesbaren Namens.
- **Die Abzeichenzahl** im Fortschritt zählte auch unbekannte Kennungen aus
  einem bearbeiteten Spielstand und konnte so über der Gesamtzahl liegen.
- **Spiegelachsen-Aufgabe**: Die „falsche“ Linie war senkrecht, die Erklärung
  sprach aber von einer schrägen Linie – und beim Quadrat lag sie komplett
  neben der Figur. Sie verläuft jetzt schräg, durch alle vier Formen und
  bewusst nicht durch den Mittelpunkt (beim Kreis wäre sie sonst eine echte
  Spiegelachse).
- **Tageswechsel in der Ortszeit**: Streak, Tagesbilanz und Aktivitätsbalken
  liefen über `toISOString()` und damit über UTC – in Mitteleuropa wechselte der
  Tag erst um 1 bzw. 2 Uhr nachts, und die Wochentagsbeschriftung passte nicht
  zum gespeicherten Schlüssel.
- **Der Service Worker** legte auch 404- und 500-Antworten im Cache ab, die
  offline dauerhaft statt der Seite ausgeliefert wurden; ein Fehler beim Öffnen
  des Caches blieb unbehandelt.
- **Inline-Style im `<noscript>`-Hinweis** verstieß gegen die eigene CSP der
  Seite und wurde vom Browser verworfen. Der Hinweis hat jetzt eine CSS-Klasse.

### Tests

- Neue Prüfungen: keine negativen Zahlen und kein Verlassen des Zahlenraums im
  Aufgabentext, Nachbarzehner nie als eigene Antwort, kein gleich langes
  Längenpaar, und keine Aufgabe zweimal in einer Runde – Bild inklusive.

## [1.6.1] – 2026-08-21

### Behoben

Ergebnisse eines Code-Reviews über den gesamten Quellcode:

- **Doppelte Aufgaben in einer Runde** (schwerwiegend, mit 1.6.0 eingeschleppt):
  Beim Suchen nach einem Fehlerschwerpunkt ging die Prüfung „war schon dran?“
  verloren. Kam die gesuchte Aufgabenart im Thema gar nicht vor, enthielten
  fast alle Runden Doppelungen – gemessen 99 % statt 14 %. Der Schwerpunkt ist
  jetzt nur noch ein Wunsch, die Frische bleibt Pflicht.
- **Ergänzungsaufgaben auf Stufe 1** ergänzten nicht zum *nächsten* Zehner:
  `1 + ? = 20` verlangte 19 und war damit schwerer als dieselbe Aufgabenart auf
  Stufe 2. Ziel und Startzahl liegen jetzt immer höchstens neun auseinander.
- **Der Elternbereich** behauptete für jede gelistete Fehlerart, sie käme
  „gezielt häufiger dran“ – auch bei einem einzelnen Fehler. Betroffene Zeilen
  sind jetzt als „wird wiederholt“ markiert, und die Schwelle kommt aus
  derselben Konstante wie die Logik (`SCHWERPUNKT_AB`).
- **Der Rechenmeister** wird nicht mehr auf Fehlerschwerpunkte gewichtet. Seine
  Bestzeit ist nur vergleichbar, wenn die Aufgaben nicht mit wachsender
  Fehlerhistorie immer schwerer werden.

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
