# Changelog

Alle nennenswerten Änderungen an der Mathe-Schule. Das Format orientiert sich
an [Keep a Changelog](https://keepachangelog.com/de/1.1.0/), die Versionen
folgen [Semantic Versioning](https://semver.org/lang/de/).

## [1.26.1] – 2026-08-22

### Behoben

**„Womit bezahlst du genau 27 €?“ ließ sich an der Zeilenlänge erraten.** Die
Ablenker waren die Zerlegungen von `ziel ± 1` und `ziel + 5`. Ein Euro mehr
oder weniger braucht aber fast immer zusätzliche Münzen — in 371 gemessenen
Ziehungen war die richtige Zeile deshalb kein einziges Mal die längste. „Nimm
nie die längste“ schließt damit sicher eine von vier Möglichkeiten aus, ganz
ohne zu rechnen.

Ein Ablenker entsteht jetzt, indem in der richtigen Zerlegung genau EIN Stück
gegen ein anderes getauscht wird — bevorzugt in derselben Stellenklasse (1/2/5
unter sich, 10/20 unter sich). Alle vier Möglichkeiten haben damit gleich viele
Scheine und Münzen, und in 90 % der Aufgaben sind sogar die Zeilen exakt gleich
lang. Es hilft nur noch Zusammenzählen.

### Hinzugefügt

Zwei Tests gegen diese Fehlerklasse — die Darstellung darf die Antwort nie
verraten:

- Beim Geldlegen haben alle Möglichkeiten gleich viele Stücke, und genau eine
  ergibt den gesuchten Betrag.
- Über alle Themen: Die richtige Antwort steht gleichmäßig auf alle Plätze
  verteilt (nachgemessen, Abweichung unter 6 Prozentpunkten).

## [1.26.0] – 2026-08-22

### Behoben

**Die Rechentabelle verriet ihre Antwort über die Eingabeart.** Ein Feld, das
nicht aufgeht („3 − 20“), wurde IMMER über Auswahlknöpfe beantwortet, ein
lösbares IMMER über die Zahlentastatur. Wer Knöpfe sah, wusste ohne zu rechnen,
dass „Das geht nicht“ die richtige Antwort ist.

Sobald „Das geht nicht“ überhaupt möglich ist, wird jetzt immer ausgewählt —
und die Möglichkeit steht jedes Mal mit zur Wahl, egal ob die Aufgabe aufgeht.

**Und der Kniff kam praktisch nie dran.** Die Zeilen- und Spaltenköpfe werden
gemischt gezogen; dass dabei die kleinere Zahl links landet, ergab sich
gemessen in etwa einer von 150 Aufgaben. Die Heftseite, um die es hier geht,
wurde damit nie geübt. Ist „geht nicht“ erlaubt, wird ein solches Feld jetzt
gezielt in etwa der Hälfte der Fälle ausgewählt.

Ein Test hält beides fest: dass unter den Auswahl-Tabellen beide Antwortarten
vorkommen und keine über 90 % hinaus dominiert.

## [1.25.3] – 2026-08-22

### Entfernt

**Fünf Exporte ohne einen einzigen Benutzer.** `tsc` merkt eine ungenutzte
lokale Variable an, einen ungenutzten EXPORT aber nie — er könnte ja von außen
gebraucht werden. Dieses „außen“ gibt es hier nicht, und so hatte sich stiller
Ballast angesammelt:

- `Muenze` (`figures.ts`) — eine Schnittstelle, die nirgends vorkam und
  obendrein falsch beschrieb, was `geldbild()` entgegennimmt (nämlich eine
  Liste von Cent-Beträgen).
- `geheZu()` (`router.ts`), `themaFortschritt()` (`state.ts`),
  `themaTitel()` (`gamification.ts`) — alle drei nie aufgerufen.
- `anhaengen()` (`dom.ts`) ist jetzt modulintern statt exportiert.

Ballast ist nicht nur Gewicht: Er wird mitgepflegt, mitgelesen und mitgeprüft,
und beim Lesen sieht er aus wie eine benutzte Schnittstelle.
`test/totercode.test.js` hält das ab jetzt fest.

## [1.25.2] – 2026-08-22

### Behoben

**Der Fokusrahmen fehlte auf der halben Seite.** Die Markenfarbe umrandete
bisher nur Knöpfe, Tasten, Eingabefelder und Bildkarten. Themenkacheln,
Navigation, die Themenzeilen im Fortschritt und die Steine einer Zahlenmauer
bekamen den dünnen Browser-Standard — auf dem dunklen Hintergrund kaum zu
erkennen. Wer die App mit der Tastatur bedient, wusste dort nicht mehr, wo er
steht. Jetzt gilt eine Regel für alles Fokussierbare.

Zwei Tests halten das fest: dass es die allgemeine Regel gibt und dass nirgends
ein `outline: none` ohne Ersatz steht — das klassische Loch.

## [1.25.1] – 2026-08-22

### Behoben

**Die Steine einer Zahlenmauer waren im Querformat zu klein.** Sie fielen dort
auf 36 px Höhe — unter die Grenze von 40 px, die für jedes Touch-Ziel gilt. Und
diese Steine sind keine Deko: Ein Kind tippt sie an, um auszuwählen, welche
Lücke es gerade füllt. Wer daneben tippt, füllt den falschen Stein. Gespart
wird im Querformat an der Kopfzeile, nicht am Touch-Ziel.

Der Lautsprecherknopf steht jetzt fest neben „Abbrechen“ statt in der Mitte der
Kopfzeile: Als drittes gleichrangiges Kind einer `space-between`-Zeile landete
er sonst zwischen Abbrechen und Stufenmarke.

### Hinzugefügt

**Ein Test für die 40-px-Regel.** Sie stand bisher nur in `CLAUDE.md`.
`test/touchziele.test.js` prüft jetzt jede `min-height` von Tasten,
Auswahlknöpfen, kleinen Knöpfen und Mauersteinen — auch in den Media-Queries,
wo die Versuchung am größten ist, „nur ein paar Pixel“ zu opfern.

## [1.25.0] – 2026-08-22

### Hinzugefügt

**Vorlesefunktion** — der oberste Punkt der Roadmap. Zweitklässler lesen noch
langsam. Wer an „Auf dem Dach sitzen 14 Tauben“ scheitert, scheitert an der
SPRACHE und nicht an der Mathematik — und übt dann genau das Falsche.

- In der Übung steht neben „Abbrechen“ ein **Lautsprecherknopf**, der die
  Aufgabe vorliest.
- Im Elternbereich lässt sich **automatisches Vorlesen** einschalten. Standard
  ist aus: Ein Gerät, das im Klassenzimmer plötzlich losredet, überrascht
  unangenehm.

Benutzt wird `speechSynthesis`, die eingebaute Sprachausgabe des Geräts: keine
neue Abhängigkeit, kein Netzaufruf, keine Daten, die das Gerät verlassen. Fehlt
sie, fällt der Knopf ersatzlos weg.

Der Kern ist die Übersetzung in einen sprechbaren Text (`src/vorlesen.ts`,
ohne DOM und deshalb direkt geprüft):

- Rechenzeichen werden Wörter: `37 + 48 =` → „37 plus 48“, `? · 5 = 30` →
  „wie viel mal 5 ist gleich 30“. Das echte Minus (U+2212) und den Malpunkt
  kennt sonst fast keine Stimme.
- Auch im Fragetext und in den **Auswahlmöglichkeiten** — bei den
  Tauschaufgaben stehen dort ganze Rechnungen. Dabei bleiben `7:30` eine
  Uhrzeit (kein „geteilt durch“) und `10-€-Scheine` ein Bindestrich (kein
  „minus“).
- Einheiten werden ausgeschrieben: `3 m` → „3 Meter“, `20 ct` → „20 Cent“.
- Die **Bildbeschreibung wird bewusst NICHT vorgelesen**: Sie ist für
  jemanden gedacht, der das Bild nicht sieht — „Uhr, die 7:30 Uhr zeigt“
  verriete einem Kind, das nur langsam liest, die Lösung.

Ein Test liest 5850 erzeugte Aufgaben durch und lässt kein ungesprochenes
Rechenzeichen durch.

## [1.24.0] – 2026-08-22

### Hinzugefügt

**Teilen wird jetzt auf drei Arten gefragt.** Auf Stufe 1 („:2, :5 und :10“)
stand vorher dreißigmal derselbe Satz — „Wie lautet das Ergebnis?“ über einer
Rechnung. Der ZAHLENvorrat der Stufe ist mit dreißig Aufgaben fest und soll es
auch sein: Diese dreißig Fakten soll ein Kind wiederholt sehen. Was fehlte, war
eine zweite Art zu fragen.

- **Enthaltensein**: „Wie oft passt die 5 in die 30?“ Für ein Kind ist das ein
  anderer Gedanke als „gerecht aufteilen“ — und genau der, den es beim Rechnen
  mit Rest später braucht.
- **Umkehraufgabe mit Lücke** (Stufe 2 und 3): `30 : ? = 6` bzw. `? : 5 = 6`.
  `30 : 5 =` rechnet ein Kind einfach aus; erst die Lücke erzwingt den Kniff —
  dieselbe Regel, die beim Einmaleins seit jeher gilt.

Der Test „jede Umkehraufgabe hat eine Lücke“ deckt die neue Art mit ab.
Der Vorrat wächst von 30 / 50 / 666 auf 60 / 190 / 828 Aufgaben.

## [1.23.0] – 2026-08-22

### Hinzugefügt

**Mehr Vielfalt in den kleinsten Stufen.** Ein Nachmessen des Aufgabenvorrats
brachte zwei Stufen ans Licht, die kleiner waren als das Gedächtnis der App:
Längen Stufe 1 hatte ganze **18** verschiedene Aufgaben (1–9 m in beide
Richtungen), Uhrzeit Stufe 1 genau **24** (zwölf Stunden × voll/halb). Die App
merkt sich aber die letzten 60 gestellten Aufgaben und geht ihnen aus dem Weg —
bei so kleinen Vorräten stand dort bald alles auf der Merkliste, und ein Kind
bekam dauerhaft dieselben Aufgaben.

Beide Stufen haben jetzt eine zweite Aufgabenform, die im Rahmen der Stufe
bleibt:

- **Längen: zum Meter ergänzen.** „Das Band ist 60 cm lang. Wie viele
  Zentimeter fehlen bis zu 1 m?“ — 18 → 94 Aufgaben.
- **Uhrzeit: die Gegenrichtung.** „Welche Uhr zeigt 7:30 Uhr?“ mit vier
  Zifferblättern zur Auswahl, wie im Heft. — 24 → 120 Aufgaben.

Ein neuer Test misst den Vorrat jeder Stufe mit demselben Schlüssel, mit dem
auch die App entscheidet, und verlangt mindestens drei volle Runden.

## [1.22.6] – 2026-08-22

### Behoben

**„Wie spät ist es in 20 Minuten?“ bot meist nur drei Antworten statt vier.**
Einer der Ablenker bildete den klassischen Fehler ab, die Stunde beim Übertrag
zu vergessen. Läuft die Zeit aber gar nicht über die volle Stunde, IST das die
richtige Antwort — der Ablenker fiel dann still weg. Gemessen betraf das gut
drei Viertel aller Ziehungen; ein Kind riet dort gegen drei statt gegen vier
Möglichkeiten.

Ein vierter Ablenker steht jetzt bereit, und was mit der Lösung zusammenfällt,
fliegt ausdrücklich vorher heraus. Ein neuer Test hält die ganze Fehlerklasse
fest: Die Zahl der Auswahlmöglichkeiten darf innerhalb eines Aufgabentyps auf
einer Stufe nicht schwanken — sie tut es nur, wenn ein Ablenker mit der Lösung
kollidiert.

## [1.22.5] – 2026-08-22

### Behoben

**Bei hängender Verbindung blieb die Seite weiß.** Der Service Worker arbeitete
strikt „Netz zuerst“ und wartete auf jede Antwort, so lange es dauerte. Ohne
Netz ist das harmlos — `fetch()` scheitert dann sofort. Der schlimme Fall ist
die HALB vorhandene Verbindung (Zug, schwaches WLAN, Anmeldeseite im Hotel):
Da hängt die Anfrage, bis der Browser nach einer halben Minute aufgibt, und ein
Kind sitzt vor einer weißen Seite, obwohl die ganze App längst auf dem Gerät
liegt.

Das Netz bekommt jetzt 2,5 Sekunden; danach springt der Vorrat ein und die
frische Fassung wird im Hintergrund nachgelegt. Ein Serverfehler verdrängt den
Vorrat ebenfalls nicht mehr.

### Hinzugefügt

**Der Service Worker wird jetzt wirklich ausgeführt.** Bisher prüfte
`test/offline.test.js` nur seinen Quelltext. `test/sw-lauf.js` lädt ihn mit
Attrappen für `self`, `caches` und `fetch` in Node; `test/serviceworker.test.js`
spielt damit sechs Fälle durch — hängendes Netz, kein Netz, Serverfehler,
tiefer Link ohne Vorrat, fremde Herkunft und Schreibzugriffe.

## [1.22.4] – 2026-08-22

### Behoben

**Schmuckbilder meldeten sich als namenloses Bild.** Die Motive auf der
Startseite, die Themenkacheln und der Jubel wurden mit `role="img"` und einem
LEEREN `aria-label` eingesetzt. Ein Screenreader kündigt damit ein Bild an, das
er nicht benennen kann — auf der Startseite dreizehnmal hintereinander, obwohl
der Titel jedes Mal direkt daneben steht.

Eine leere Beschriftung heißt jetzt ausdrücklich „nur Schmuck“: Das Bild
bekommt `aria-hidden="true"` und gar keine Rolle. Die Entscheidung steht in
`bildAttribute()` in `dom.ts` und ist ohne DOM prüfbar.

## [1.22.3] – 2026-08-22

### Behoben

**Die Sprungmarke warf Tastaturnutzer auf die Fehlerseite.** „Zum Inhalt
springen“ stand als `<a href="#inhalt">` im Dokument. Diese Seite wird aber
vollständig über den Hash geroutet: Der Router bekam `#inhalt` als Route
vorgesetzt, fand dazu keine Ansicht und zeigte „Diese Seite gibt es nicht“ —
ausgerechnet dem, der die Sprungmarke überhaupt benutzt.

Sie ist jetzt ein Knopf, der den Fokus selbst auf das `<main>` setzt
(verdrahtet in `shell.ts`, weil die CSP kein Inline-Skript erlaubt). Ein neuer
Test `test/navigation.test.js` hält fest, dass in `index.html` kein Hash-Link
am Router vorbeiführt.

## [1.22.2] – 2026-08-22

### Behoben

**Der Abgleich scheiterte im Elternbereich still.** Beim „Code für dieses Gerät
erzeugen“ und beim „Verbinden“ lief `gleicheAb()` ganz ohne Auswertung — ein
Fehler der Gegenstelle wurde weggeworfen, und die Karte sah danach genauso aus
wie nach einem geglückten Abgleich. Ausgerechnet der häufigste
Einrichtungsfehler (fehlende KV-Bindung) blieb damit unsichtbar, obwohl der
Worker die komplette Anleitung mitschickt.

Alle drei Wege gehen jetzt durch dieselbe Stelle, und ihr Ergebnis überlebt das
Neuzeichnen der Karte. Die Entscheidung, was zu melden ist, steckt in
`abgleichMeldung()` — ohne DOM-Zugriff und deshalb direkt geprüft.

## [1.22.1] – 2026-08-22

### Behoben

**Das Puzzleteil deckte sich beim Bonus zu früh auf.** In der Puzzlerunde gibt
es zu vielen Aufgaben die freiwillige Hilfsaufgabe. Wer sie antippte und
beantwortete, sah sofort das Puzzleteil der LAUFENDEN Aufgabe — und zwar blass,
so als wäre die Aufgabe falsch gerechnet worden. Grund: Die Anzeige fragte nur
`beantwortet` ab, und das steht während des Bonus ebenfalls auf `true`.

Die Entscheidung steckt jetzt in `puzzleStaende()` in `bilder.ts` — ohne
DOM-Zugriff und deshalb direkt prüfbar. Zwei Tests halten fest, dass nie mehr
Teile offen liegen, als Aufgaben wirklich beantwortet sind.

## [1.22.0] – 2026-08-22

### Hinzugefügt

**Beziehungsketten beim Geld** — die zweite Aufgabenart von Heftseite 14:

> Emma hat 17 €.
> Jonas hat 9 € mehr als Lina.
> Lina hat 10 € weniger als Ben.
> Ben hat 3 € mehr als Emma.
> Wie viel Geld hat Jonas?

Der Witz ist nicht das Rechnen, sondern die **Reihenfolge**: Die Sätze stehen
absichtlich durcheinander, und nur einer lässt sich sofort ausrechnen. Wer stur
von oben nach unten rechnet, kommt nicht weiter. Die Kette ist echt — jeder
Satz bezieht sich auf den Vorgänger, also ist keiner überflüssig; gemischt wird
nur für die Anzeige.

Auf Stufe 1 (drei Kinder) bleibt die Reihenfolge stehen, damit der Einstieg
nicht zusätzlich am Sortieren scheitert. Ab Stufe 2 sind es vier Kinder und die
Sätze werden gemischt.

Kein Kind bekommt Schulden: Jeder Betrag bleibt zwischen 1 € und 100 €. Ein
Schritt, der den vorigen exakt zurücknimmt (erst 15 € dazu, dann 15 € weg),
wird umgangen — er sieht wie ein Druckfehler aus.

### Geändert

**Mehrzeilige Fragen stehen jetzt untereinander.** Bisher hätte der Text zu
einem Block zusammengeschoben ausgesehen. Fragen mit Zeilenumbrüchen bekommen
linksbündige, leichtere Schrift in Lesegröße — so wie im Heft; die einzeiligen
Fragen aller anderen Aufgaben sehen unverändert aus.

### Prüfung

Der Test **liest die Aufgabe und löst sie selbst**, so wie ein Kind es täte:
beim einzigen genannten Betrag anfangen und sich weiterhangeln. Damit prüft er
die Aufgabe, nicht die Buchführung des Generators. Zusätzlich: Die Kette darf
nicht abreißen, kein Name doppelt vorkommen, jeder Betrag muss zwischen 1 € und
100 € liegen, und die Sätze dürfen nicht immer schon in Rechenreihenfolge
stehen — sonst hätte die Aufgabe gar keine Hürde.

Gegen vier absichtlich kaputte Fassungen gegengeprüft (Richtung vertauscht,
Bezug falsch, Untergrenze entfernt, nie gemischt) — jede fällt durch.

## [1.21.0] – 2026-08-22

### Hinzugefügt

**Rechendreiecke** — aus dem Arbeitsheft („Rund um die Mathematik"). Drei
Zahlen stehen innen, an jeder Seite steht außen die Summe der beiden
Innenzahlen, die dort liegen. Es fehlt immer genau ein Feld, und die
Schwierigkeit hängt daran, welches:

- **Stufe 1** — außen fehlt: reines Zusammenzählen.
- **Stufe 2** — innen fehlt: man muss von einer Außenzahl die bekannte
  Innenzahl abziehen, also umkehren.
- **Stufe 3** — innen fehlt, und die Außenzahl gegenüber der Lücke ist
  weggelassen. Die hilft ohnehin nicht; ohne sie muss man aber erst überlegen,
  welche Seite überhaupt weiterführt.

Die Figur unterscheidet **leer** von **gesucht**: Nur das gefragte Feld trägt
ein Fragezeichen. Ohne diese Trennung stünden auf Stufe 3 zwei Fragezeichen im
Bild, und ein Kind wüsste nicht, welches gemeint ist.

Der Test rechnet das Dreieck aus dem **Bild** nach, nicht aus den
Zwischenwerten des Generators — sonst prüfte er nur, ob der Generator mit sich
selbst einig ist. Er verlangt außerdem, dass mindestens eine vollständige Seite
die Lücke berührt; sonst ginge eine unlösbare Aufgabe durch. Gegen drei
absichtlich kaputte Fassungen gegengeprüft (vertauschte Seiten, Lösung um eins
daneben, unlösbar gemacht) — jede fällt durch.

### Geändert

Die Zahlenmauer ist jetzt eine von vier Varianten des Bereichs statt einer von
drei. Zwei Mauer-Tests hatten Stichprobenschranken, die von der alten
Aufteilung stammten; sie sind nachgezogen, ohne dass sich ändert, was sie
prüfen.

Die anderen vier Heftseiten deckt die App bereits ab: Analogieaufgaben
(Einer/Zehner und im Zwanzigerraum), Rechentabellen, Zahlenmauern,
Pfeilketten und Zahlenfolgen mit wechselnden Schritten.

## [1.20.2] – 2026-08-22

### Behoben

**Umkehraufgaben haben jetzt eine Lücke — sonst sind es keine.** Bei Plus und
Minus stand bisher eine glatte Rechnung da, etwa `13 − 5 =`. Die rechnet ein
Kind einfach aus; vom Umkehren merkt es nichts. Erst die Lücke macht den Kniff
nötig: Bei `5 + ? = 13` kommt man nur weiter, indem man die Aufgabe umdreht und
`13 − 5` rechnet.

- **Umkehr zu Plus**: Lücke in einer Plusaufgabe (`5 + ? = 13`, `? + 11 = 16`),
  auflösbar nur durch Minus.
- **Umkehr zu Minus**: Lücke am Anfang einer Minusaufgabe (`? − 4 = 8`),
  auflösbar nur durch Plus.

Die Hilfsaufgabe für das Bonusherz ist jetzt die Umkehrung selbst und rechnet
genau die Lücke aus — vorher zeigte sie eine Rechnung, die mit der gesuchten
Zahl nichts zu tun hatte.

Beim Einmaleins war es von Anfang an richtig gebaut (`? · 5 = 30`); dort ändert
sich nichts. Zwei neue Tests halten die Regel für alle drei Umkehr-Arten
zusammen fest: Es muss eine Lücke geben, die eingesetzte Lösung muss die
Rechnung wahr machen, und die Hilfsaufgabe muss die Gegenrechenart benutzen und
dieselbe Zahl liefern. Gegen die alte Fassung gegengeprüft: Sie fällt durch.

## [1.20.1] – 2026-08-22

### Behoben

**Die Erklärung der Gegenstelle kommt jetzt beim Benutzer an.** Der Worker legt
seinen Grund in den Antwortrumpf — bei fehlender KV-Bindung steht dort die
komplette Anleitung, was zu tun ist. Die App warf ihn weg und zeigte nur
„Server meldet 500". Wer beim Einrichten kein Terminal zur Hand hat (iPhone,
iPad), stand damit ohne jeden Hinweis da — ausgerechnet an der Stelle, an der
sich der häufigste Einrichtungsfehler versteckt.

Die Meldung wird auf 300 Zeichen gekürzt, damit eine kaputte Gegenstelle die
Karte nicht sprengt; ohne verwertbaren Rumpf bleibt es wie bisher bei der
nackten Statusnummer. Gegen die alte Fassung gegengeprüft: Sie fällt durch.

## [1.20.0] – 2026-08-22

### Hinzugefügt

**Die Synchronisierung ist scharf.** Der Cloudflare Worker läuft, seine Adresse
steht in `src/sync.ts`. Wer im Elternbereich einen Familien-Code anlegt und ihn
auf einem zweiten Gerät eingibt, hat auf beiden denselben Stand.

Der Worker-Code im Konto wurde gegen `cloudflare/worker.js` geprüft — gleicher
SHA-256, kein Zeichen Unterschied.

Ohne Familien-Code ändert sich weiterhin nichts: Es wird nichts gesendet, nichts
geholt, kein Netzaufruf gemacht.

### Geändert

**Zwei neue Wächter gegen stilles Scheitern.** Beim Bauen war schon einmal die
CSP im Weg — der Abgleich lief fehlerfrei durch, der Browser verwarf jede
Anfrage wortlos. Deshalb prüfen die Tests jetzt, dass die eingetragene Adresse
`https://` benutzt, **keinen Schrägstrich am Ende** hat (sonst entstünde
`…dev//hole`, und der Worker antwortete mit 404) und vom `connect-src` der CSP
tatsächlich gedeckt ist. Alle drei Fälle wurden gegen absichtlich kaputte
Adressen gegengeprüft.

Der Test, der bisher festhielt, dass ohne eingetragene Adresse nichts passiert,
prüft jetzt das Gegenstück: dass die Adresse eingetragen IST. Fiele sie je auf
den Platzhalter zurück, schaltete sich der Abgleich lautlos ab.

Die Adresse des Workers steht offen im Repository, und das ist richtig so: Die
Seite ist statisch, es gibt keinen Bauschritt, der sie nachträglich einsetzen
könnte. Ein Geheimnis ist sie auch nicht — ohne Familien-Code gibt der Worker
nichts heraus.

## [1.19.2] – 2026-08-22

### Hinzugefügt

**`cloudflare/wrangler.jsonc` für die Veröffentlichung vom eigenen Rechner.**
Wer den Worker nicht ins Dashboard einfügen, sondern mit `npx wrangler deploy`
hochladen möchte, braucht eine Konfigurationsdatei. Sie liegt jetzt fertig
daneben; einzutragen sind nur `name` und die `id` des KV-Namespace. Die Bindung
steht als `KV` drin, weil Cloudflare sie so voreinstellt — der Worker nimmt
beide Namen.

Über das Dashboard ändert sich nichts: Dort wird die Datei nicht gebraucht.
Die Namespace-Kennung ist kein Geheimnis, deshalb steht der Platzhalter im
Repository und nicht der echte Wert.

## [1.19.1] – 2026-08-22

### Behoben

**Der Worker akzeptiert jetzt beide Namen der KV-Bindung.**
Cloudflares eigenes Beispiel nennt sie `KV`, die Anleitung hier verlangte
`STAND` — wer das Beispiel einfach ersetzte, ohne die Bindung umzubenennen,
bekam eine Fehlermeldung. Der Worker nimmt jetzt `STAND` oder `KV`, damit beim
Einrichten nichts umzubenennen ist.

Gegen den echten Worker geprüft, alle drei Fälle: Bindung heißt `STAND` →
funktioniert, heißt `KV` → funktioniert, fehlt ganz → verständliche Meldung
statt eines nichtssagenden 500ers.

Die README sagt außerdem jetzt ausdrücklich, dass Cloudflares Beispielcode
**ersetzt** und nicht ergänzt wird.

## [1.19.0] – 2026-08-22

### Geändert

**Die Synchronisierung läuft jetzt über einen Cloudflare Worker statt über
Supabase.**
Der Grund ist vor allem einer: Bei Supabase hätte der öffentliche Schlüssel im
Repository stehen müssen. Beim Worker gibt es **gar keinen Schlüssel** — der
Familien-Code ist das einzige Geheimnis, und die Adresse des Workers allein
nützt niemandem. Ein Test wacht darüber, dass sich später keiner einschleicht.

Neu: `cloudflare/worker.js`, 80 Zeilen, kein Build und keine Abhängigkeiten.
Zwei Endpunkte (`hole`, `speichere`), dazu Prüfung des Code-Formats, eine
Größengrenze von 64 KB gegen Vollschreiben, CORS nur für die eigene Adresse —
und eine verständliche Meldung, falls die KV-Bindung fehlt. Das ist der Fehler,
den man beim Einrichten am ehesten macht; ohne die Prüfung käme nur ein
nichtssagender 500er.

Die Zusammenführung — der schwierige Teil — ist unverändert geblieben; sie
hängt nicht an der Gegenstelle.

Geprüft gegen den **echten** Worker-Code, lokal ausgeführt mit einem
KV-Ersatz: unbekannter Code liefert `null`, ungültiger Code und verbotene
Zeichen werden abgewiesen, GET und unbekannte Pfade ebenso, fehlende Bindung
meldet sich verständlich. Danach zwei Browser-Kontexte gegeneinander: Beide
Geräte hatten am Ende denselben Stand.

### Behoben

**Der Worker wäre in den Offline-Vorrat der App gerutscht.** `cloudflare/`
landete in der Precache-Liste des Service Workers — aufgefallen an der
Zahl 40 statt 39. Er läuft bei Cloudflare, nicht im Browser, und ist jetzt in
`tools/sw-liste.mjs` und `test/offline.test.js` ausgenommen.

Die CSP erlaubt jetzt `https://*.workers.dev` statt `*.supabase.co`.

## [1.18.0] – 2026-08-22

### Hinzugefügt

**Geräteübergreifende Synchronisierung über einen Familien-Code.**
Acht Zeichen, auf dem ersten Gerät erzeugt, auf allen weiteren eingetippt –
kein Konto, kein Passwort. Für eine Kinder-App ist das die einzige Anmeldung,
die ein Kind ohne Hilfe schafft. Abgeglichen wird beim Start und nach jeder
Runde.

**Ohne Einrichtung ändert sich nichts.** Die Zugangsdaten stehen als
Platzhalter in `src/sync.ts`; solange sie nicht gesetzt sind, findet kein
einziger Netzaufruf statt und der Elternbereich sagt nur, dass es noch nicht
eingerichtet ist. Die Anleitung samt SQL steht in `README.md`.

Zur Gegenstelle: Supabase, angesprochen über reines `fetch()` – keine neue
Laufzeit-Abhängigkeit. Es gibt bewusst **keinen direkten Tabellenzugriff**,
sondern zwei Datenbankfunktionen. Damit kann der öffentliche Schlüssel allein
niemanden auflisten: Ohne Code gibt es keine Zeile. Der Code selbst benutzt
`crypto.getRandomValues` – die einzige Stelle im Projekt mit echtem Zufall,
denn `mulberry32` ist absichtlich vorhersagbar.

**Wie zusammengeführt wird.** Gesammeltes wächst nur und wird maximiert:
Punkte, Herzen, gelöste Puzzles, Erfolge, Sterne, beste Serien, gezählte
Aufgaben. Der aktuelle Stand kommt vom zuletzt benutzten Gerät: Name, Streak,
Fehlerbilanz – **und die Stufe**. Letzteres ist wichtig: Die Stufe sinkt nach
einer schwachen Runde absichtlich, damit ein alter Höchststand ein Kind nicht
dauerhaft überfordert. Mit dem Maximum zu verschmelzen hätte diese Entscheidung
still ausgehebelt.

Ehrlich zur Grenze des Verfahrens: Haben beide Geräte **offline** geübt, gehen
ein paar gezählte Aufgaben verloren – ohne gemeinsamen Ausgangspunkt lässt sich
nicht rekonstruieren, wie viel jedes beigesteuert hat. Level und Erfolge bleiben
immer erhalten.

### Behoben

**Die eigene CSP hätte den Abgleich still scheitern lassen.** `connect-src`
stand auf `'self'`; der Code lief fehlerfrei durch, der Browser verwarf die
Anfrage aber. Aufgefallen ist das erst beim Durchspielen mit zwei echten
Browser-Kontexten. `connect-src` erlaubt jetzt zusätzlich
`https://*.supabase.co`, und ein Test hält fest, dass diese Erlaubnis da ist –
und dass nicht versehentlich `*` oder eine unverschlüsselte Quelle
dazukommt.

### Geändert

`ladeFortschritt()` benutzt jetzt eine ausgelagerte Prüfung
`pruefeFortschritt()`. Daten von einem anderen Gerät laufen durch dieselbe
Prüfung wie der Browserspeicher – beides ist von Hand veränderbar.

18 neue Tests: Familiencode, alle Regeln der Zusammenführung einzeln, Reihenfolge-
unabhängigkeit, Stabilität bei mehrfachem Abgleich, geprüfte Fremddaten,
Serverfehler, und ein vollständiger Zwei-Geräte-Durchlauf gegen eine
Gegenstelle im Speicher. Zusätzlich im Browser mit zwei getrennten Kontexten
nachgespielt: Beide Geräte hatten danach denselben Stand.

## [1.17.0] – 2026-08-22

### Hinzugefügt

**Zahlenmauern zum Ausfüllen – mehrere Zahlen statt nur einer.**
Bei zehn Kästchen war eine einzige Lücke zu wenig zu tun. Jetzt gibt es die
Mauer in zwei Formen, etwa je zur Hälfte:

- **Eine Lücke** wie bisher: irgendwo im Bild fehlt ein Stein, das trainiert
  das Rückwärtsrechnen.
- **Ganz ausfüllen**: Die Grundreihe steht da, alles darüber ist leer – bei
  vier Grundsteinen sind das sechs Steine zum Ausrechnen. So steht es auch im
  Übungsheft.

Die ausfüllbare Mauer ist keine Zeichnung mehr, sondern besteht aus
antippbaren Steinen (neue Antwortart `"mauer"`). Der aktive Stein ist
hervorgehoben; die Zifferntasten tippen hinein, „Weiter“ springt zum nächsten
leeren Stein und wird zu „Fertig“, sobald alle gefüllt sind. Ein Stein lässt
sich auch direkt antippen. Am Ende stehen die richtigen Steine grün, die
falschen rot – und in den roten steht die richtige Zahl.

### Behoben

**Die Zahlen landeten in den falschen Steinen.** Gezeichnet wird von oben nach
unten, die Lösungsfolge läuft aber von unten nach oben. Weil Eingabe und
Vergleich dieselbe verdrehte Reihenfolge benutzten, galt die Aufgabe trotzdem
als richtig – aufgefallen ist es erst am Bildschirmfoto, wo an der Spitze 14
statt 42 stand. Die Prüfung vergleicht jetzt die POSITION jeder Zahl, nicht
nur richtig/falsch: fünf Mauern, alle Steine an der richtigen Stelle.

**Im Querformat rutschte die Mauer in die schmale Tastenfeldspalte** und war
73 px zu hoch. Sie steht dort jetzt neben dem Tastenfeld. Gemessen auf sechs
Geräten: überall ohne Scrollen, kleinster Stein 36 px.

Drei neue Tests: dass sich die ausfüllbare Mauer Reihe für Reihe ausrechnen
lässt und die Lösungsfolge stimmt, dass die Grundreihe vollständig und alles
darüber leer ist, und dass beide Mauerformen auf den größeren Stufen wirklich
vorkommen.

## [1.16.0] – 2026-08-22

### Geändert

**Zahlenmauern gibt es jetzt bis zu zehn Kästchen.**
Bisher hatte die Mauer auf Stufe 1 UND 2 nur zwei Grundsteine – also drei
Kästchen. Erst auf Stufe 3 kamen sechs. Jetzt:

| Stufe | Grundsteine | Kästchen |
| --- | --- | --- |
| 1 | 2 | 3 |
| 2 | 3, in 30 % der Fälle 4 | 6 oder **10** |
| 3 | 4 | **10** |

Die große Mauer taucht auf Stufe 2 also schon auf, dort aber mit kleinen
Zahlen – die Größe soll der Reiz sein, nicht die Rechnung.

Dafür bauen die Mauern jetzt generisch (`mauerAufgabe()`): Die Stufe legt nur
noch die Grundsteine fest, Bild, Tipp und Rechenweg entstehen daraus. Der
Rechenweg zeigt die ganze Mauer von unten nach oben, z. B. „4, 10, 8, 12 →
14, 18, 20 → 32, 38 → 70“.

Nachgerechnet über je 4000 Ziehungen: Die Größen verteilen sich wie oben, die
höchste vorkommende Zahl ist 81 – der Zahlenraum bis 100 bleibt also gewahrt.
Und in 3020 von 3020 Fällen lässt sich der fehlende Stein aus den sichtbaren
Nachbarn herleiten, egal wo die Lücke sitzt.

Bei vier Grundsteinen ist die Spitze `a + 3b + 3c + d` – die inneren Steine
zählen dreifach. Ihre Grenzen sind deshalb enger als die der äußeren, sonst
verließe die Mauer den Zahlenraum.

### Behoben

**Im Querformat war die zehnsteinige Mauer unlesbar.** Die Höhengrenze für
Erklärbilder lag dort bei 16vh; die Mauer schrumpfte damit auf 7 px
Ziffernhöhe. Quer ist die Aufgabenkarte aber zweispaltig – ihre Höhe bestimmt
das Tastenfeld rechts, nicht das Bild links. Die Grenze liegt jetzt bei 40vh,
gemessen 17 px Ziffernhöhe, und der Platz reicht unverändert (54 px Luft).

Zwei neue Tests: die Größenverteilung je Stufe und die Herleitbarkeit des
fehlenden Steins. Beide gegen den alten Stand gegengeprüft.

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
