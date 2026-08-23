# CLAUDE.md

Kontext für jede Session, die an der Zahleneule weiterarbeitet. Offene
Punkte stehen in `ROADMAP.md`, die Historie in `CHANGELOG.md`.

## Was ist das Projekt?

Interaktive Lernplattform für Mathematik in der 2. Klasse (Deutsch), statische
Seite für GitHub Pages: dreizehn Themen mit je drei Stufen (sechs davon aus
dem Übungsheft), Übungsrunden mit
sofortiger Rückmeldung, Gamification (Punkte, Level, Sterne, Streak,
Abzeichen) und ein Elternbereich. Feature-Liste: `README.md`.

## Schwerpunkt

**Maßgeblich ist das Übungsheft der 2. Klasse, mit dem das Kind arbeitet.**
Themen daraus tragen in `topics.ts` das Kennzeichen `ausHeft: true`, stehen in
der Themenliste vorn, werden von `empfehlung()` bevorzugt und stecken doppelt
im `MIX_TOPF` des gemischten Trainings. Neue Aufgabenformen gehören zuerst in
diese Bereiche; ergänzende Themen (Einmaleins, Uhrzeit, Längen, Formen,
Sachaufgaben, Knobeln) sind Zusatz und dürfen den Schwerpunkt nicht
verwässern.

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
  Die App läuft ohne Netz komplett. Die EINZIGE Ausnahme ist die optionale
  Synchronisierung (`src/sync.ts`, siehe unten); die CSP in `index.html`
  erlaubt deshalb `'self'` **plus** `https://*.workers.dev` – sonst nichts.
- **Deutsche Anführungszeichen**: Das schließende `"` beendet in einem doppelt
  gequoteten TypeScript-String die Zeichenkette. In Texten mit `„…"` deshalb
  Template-Literale (Backticks) verwenden.

## Architekturüberblick

- `src/types.ts` – Domänen-Typen (`Aufgabe`, `Fortschritt`, `ThemaId`, …).
- `src/topics.ts` – die dreizehn Themen samt Beschreibung ihrer drei Stufen.
- `src/state.ts` – **einziger** Ort, der `localStorage` liest und schreibt.
- `src/random.ts` – `mulberry32`. Niemals `Math.random()` verwenden, sonst
  sind die Aufgaben-Generatoren nicht mehr testbar.
- `src/tasks/*` – die Aufgaben-Generatoren, nach Themengruppen sortiert
  (`zahlen`, `rechnen`, `groessen`, `geometrie`, `sachaufgaben`, `analogie`,
  `familien`, `mauern`); `tasks/index.ts` hält die Registry und baut Runden.
- `src/figures.ts` – Erklärbilder als SVG-Zeichenketten, ohne DOM-Zugriff und
  deshalb direkt testbar.
- `src/gamification.ts` – Punkte, Level, Sterne, Herzen, Streak, Abzeichen,
  Stufenanpassung – und die Tempo-Bilanz (`bucheTempo`, `muehsameTypen`):
  geglättete Antwortzeiten RICHTIGER Antworten je Aufgabentyp.
- `cloudflare/worker.js` – die Gegenstelle, läuft bei Cloudflare. Die
  KV-Bindung darf `STAND` **oder** `KV` heißen (Cloudflares Beispiel nennt sie
  `KV`); fehlt sie ganz, antwortet der Worker mit einer Anleitung statt eines
  nichtssagenden 500ers. `cloudflare/wrangler.jsonc` liegt für
  `npx wrangler deploy` daneben und wird beim Weg über das Dashboard nicht
  gebraucht. Das Verzeichnis gehört NICHT in den Offline-Vorrat der App –
  `tools/sw-liste.mjs` und `test/offline.test.js` nehmen es deshalb aus.
- `src/sync.ts` – die EINZIGE Stelle, die mit dem Netz spricht: optionale
  Synchronisierung über einen Familien-Code, per reinem `fetch()` gegen den
  Worker in `cloudflare/worker.js`. Ohne Familien-Code passiert
  nichts – kein Senden, kein Holen, kein Netzaufruf.
  In der App steht **kein Zugangsschlüssel**: Der Code ist das einzige
  Geheimnis, und die Adresse des Workers darf offen im Repository stehen (die
  Seite ist statisch, es gibt keinen Bauschritt, der sie nachträglich einsetzen
  könnte). Tests wachen darüber, dass kein Schlüssel dazukommt und dass die
  eingetragene Adresse `https` benutzt, KEINEN Schrägstrich am Ende hat und von
  der CSP gedeckt ist – jeder dieser drei Fehler ließe den Abgleich STILL
  scheitern.
  Die reinen Teile (Code, `verschmelze`) sind ohne Netz testbar; alle Netzaufrufe
  nehmen ihr `fetch` als Parameter, damit Tests eine Gegenstelle im Speicher
  unterschieben können. Einrichtung Schritt für Schritt: `README.md`.
  **Fehler der Gegenstelle werden durchgereicht**, nicht verworfen: Der Worker
  legt seinen Grund in `{ fehler: … }`, `grund()` holt ihn heraus. Sonst stünde
  beim häufigsten Einrichtungsfehler nur `Server meldet 500` da – und wer kein
  Terminal zur Hand hat, käme nicht weiter.
- `src/antwort.ts` – Vergleich von Antwort und Lösung, auch für selbst getippte
  Rechnungen. Ohne DOM-Zugriff, deshalb direkt testbar.
- `src/bilder.ts` – farbige Illustrationen: ein Bild je Thema (die Navigation
  läuft über Bilder, nicht über Fließtext) und die Puzzlemotive. Ohne
  DOM-Zugriff, deshalb direkt testbar.
- `src/jubel.ts` – was nach einer richtigen Antwort passiert: Zauberhut,
  fliegende Tiere, Konfetti, Rakete, Sternenregen. Der SVG-Teil ist rein, die
  Anzeige hängt die Ebene an `document.body`.
- `src/views/*` – Start, Übung, Fortschritt, Elternbereich.
- `src/app.ts` / `src/router.ts` / `src/shell.ts` – Routentabelle,
  Hash-Router, App-Shell.
- `sw.js` (Repo-Root) – Service Worker, Network-First. Muss im Root liegen,
  weil ein Service Worker nur für seinen Auslieferungspfad gilt. Seine
  Precache-Liste steht zwischen den Marken `LISTE-ANFANG`/`LISTE-ENDE` und wird
  von `tools/sw-liste.mjs` erzeugt – **niemals von Hand pflegen**.
- `tools/sw-liste.mjs` – schreibt diese Liste aus den tatsächlich
  ausgelieferten Dateien; läuft als Teil von `npm run build`.

## Wichtigste Fallstricke

- **Wer eine fremde Adresse anspricht, muss die CSP mitziehen.** `connect-src`
  stand auf `'self'`; der Abgleich lief fehlerfrei durch, der Browser verwarf
  die Anfrage aber still. Ein Test in `sicherheit.test.js` hält das fest.
- **Beim Zusammenführen ist die Stufe KEIN Höchststand.** Sie sinkt absichtlich
  (siehe `gamification.ts`) und kommt deshalb vom zuletzt benutzten Gerät –
  genau wie Name, Streak und Fehlerbilanz. Nur Gesammeltes wird maximiert.
- **Fremde Daten sind ungeprüfte Eingabe.** Alles, was von einem anderen Gerät
  kommt, läuft durch `pruefeFortschritt()` – dieselbe Prüfung wie beim
  Browserspeicher.

- **Rechengeschichten: Rechenart in der Funktion, Geschichte im Pool daneben.**
  Eine neue Vorlage muss für JEDE Zahl aus dem Bereich ihrer Rechenart sinnvoll
  bleiben – „3 Kinder teilen sich 60 Bonbons“ geht, „60 Kinder auf einem Sofa“
  nicht. Ein Test hält fest, dass keine Geschichte den Topf beherrscht.
- **Namen im Wesfall über `wesfall()`**, nie über `${name}s`: Bei Jonas und
  Elias käme sonst „Jonass“ heraus.

- **Illustrationen tragen NIE eine Farbe im SVG**, nur `bild-*`-Klassen. Und
  die Tinte (`--bild-strich`, `--bild-dunkel`) ist in beiden Farbschemata
  dunkel; hell wird stattdessen der Grund UNTER der Zeichnung
  (`--bild-grund`). Der erste Versuch drehte die Tinte im Dunkelmodus mit –
  dann lag heller Umriss auf hellem Zifferblatt und die Uhr verschwand.
- **Kein `style="…"` in erzeugtem SVG.** Die CSP dieser Seite verbietet
  Inline-Styles; Varianten gehören in Klassen (siehe `jubel-stern-0` … `-9`).
  Ein Test in `test/jubel.test.js` hält das fest.
- **`aufraeumen()` in `views/uebung.ts` läuft bei JEDEM Neuzeichnen.** Was dort
  hineingehört, muss ein Neuzeichnen überleben dürfen. Der Jubel darf es NICHT:
  Er wird direkt vor einem Neuzeichnen gestartet und hätte sich selbst gelöscht.
  Deshalb steht `raeumeJubel()` nur im `hashchange`-Haken.
- **Ein Inline-SVG hat nur seine `viewBox`, sonst keine eigene Größe.** Sobald
  seine Höhe am Elternteil hängt UND die Höhe des Elternteils am Inhalt, löst
  der Browser das mit **null** auf – das Bild verschwindet spurlos. Genauso
  `width: auto` auf einem SVG ohne Breitenangabe. Beides ist schon passiert
  (Rechenrad, Rechenkasten, Zahlenmauer, siehe Changelog 1.11.1); ein Test in
  `test/bilder.test.js` hält die Fehlerklasse fest.
- **Wer Platzprobleme misst, muss auch messen, dass noch etwas da ist.** Die
  Prüfung „passt der Antwortbereich ins Fenster?" war grün, WEIL das Erklärbild
  fehlte. Immer beides prüfen: Inhalt sichtbar und Platz ausreichend.
- **Die Übungsseite ist eine Flexspalte über die volle Fensterhöhe**, und das
  Erklärbild bekommt den übrigen Platz über `flex-grow` (nie über die
  Basisgröße!), mit `min-height` als Untergrenze.
  Feste Höhengrenzen in `vh` reichten nicht: Je nach Aufgabenart sind Frage
  und Antwortbereich unterschiedlich hoch, mal blieb Luft, mal fehlten 90 px
  und das Tastenfeld rutschte aus dem Bild. Im schmalen Querformat gilt das
  nicht – dort ist die Karte zweispaltig. OHNE Erklärbild ankert der
  Antwortbereich per `margin-top: auto` am unteren Kartenrand (Daumenzone),
  und die Lücke sitzt VOR der Rechnung, damit sie beim Antwortfeld bleibt –
  sonst stand ein totes Drittel Karte unter den Tasten. Ein Test in
  `touchziele.test.js` hält beide Regeln fest.

- **Die `vorstufe` ist ein freiwilliger Bonus, kein Pflichtschritt.** Eine
  Aufgabe startet IMMER bei der eigentlichen Frage; erst wer „Hilfsaufgabe
  selbst rechnen“ antippt, wechselt `sitzung.phase` auf `"vorstufe"`. Vorher
  kam die Hilfsaufgabe zuerst – und half nicht, weil niemand wusste, wobei.
  Daraus folgt: **Die Hauptfrage muss für sich allein verständlich sein**,
  also kein „Und jetzt die große Aufgabe“ (Test in `generatoren.test.js`), und
  sie braucht eine sichtbare Rechnung oder ein Bild. Die Hilfsaufgabe zählt
  NICHT in die Trefferbilanz – sie bringt ein Herz. Ihr Ergebnis muss im
  Zahlenraum bleiben und darf nie negativ werden (`test/mauern.test.js`).
- **Im Bonus wird die GANZE Rechnung getippt** (`3 − 2 = 1`), nicht nur das
  Ergebnis – dafür gibt es die Antwortart `"rechnung"` mit +, − und = auf dem
  Tastenfeld. Die Hilfsaufgabe wird dabei bewusst NICHT angezeigt; sie selbst
  zu finden ist der Bonus. Der Vergleich steht in `src/antwort.ts`
  (`rechnungPasst`) und ist großzügig bei Leerzeichen und Minusschreibweise,
  aber streng bei Zahlen und Ergebnis; beim Plus zählt die vertauschte
  Reihenfolge mit.
- **Eine Umkehraufgabe braucht eine LÜCKE in der Rechnung.** `13 − 5 =`
  rechnet ein Kind einfach aus, ohne je ans Umkehren zu denken; erst
  `5 + ? = 13` erzwingt den Kniff. Beim Einmaleins war das von Anfang an so
  (`? · 5 = 30`), bei Plus und Minus nicht – siehe Changelog 1.20.2. Die
  Hilfsaufgabe ist dabei die Umkehrung SELBST und muss genau die Lücke
  ausrechnen, sonst führt der Bonus in die Irre. Ein Test hält beides fest.
- **Beim Rechendreieck ist „leer" nicht dasselbe wie „gesucht".** Drei Zahlen
  innen, außen an jeder Seite die Summe der beiden, die dort liegen. Wie im
  Heft dürfen MEHRERE Felder leer sein – aber nur das gefragte trägt ein
  Fragezeichen und ist hervorgehoben. Ohne diese Trennung standen zwei
  Fragezeichen im Bild und ein Kind wusste nicht, welches gemeint ist.
  Die Figur gibt für jedes der sechs Felder ein Textelement aus, auch ein
  leeres – nur dadurch lässt sich das Dreieck aus dem Bild eindeutig auslesen.
- **Mehrzeilige Fragen** (bisher nur die Geld-Beziehungsketten) tragen echte
  `\n` im `frage`-Text. `.aufgabe-frage` steht deshalb auf
  `white-space: pre-line`, und `views/uebung.ts` hängt bei Umbrüchen die Klasse
  `aufgabe-frage-mehrzeilig` an: linksbündig, leichter, Lesegröße statt
  Überschriftgröße. Vier fette Sätze am Stück sind für ein Kind eine Wand.
- **Bei Beziehungsketten ist die Reihenfolge die Aufgabe, nicht das Rechnen.**
  Die Kette ist echt – jeder Satz bezieht sich auf den Vorgänger, keiner ist
  überflüssig –, und nur die ANZEIGE wird gemischt. Auf Stufe 1 bleibt sie
  stehen, damit der Einstieg nicht zusätzlich am Sortieren scheitert. Kein Kind
  darf dabei unter 1 € rutschen.
- **In einer Zahlenmauer fehlt immer genau ein Stein.** Nur dann ist er
  eindeutig bestimmt: Entweder stehen die beiden Steine darunter da, oder der
  Stein darüber und der Nachbar in derselben Reihe. Das gilt für JEDE Mauergröße
  – `mauerAufgabe()` baut deshalb generisch, die Stufe legt nur die Anzahl der
  Grundsteine fest (2 → 3 Kästchen, 3 → 6, 4 → 10). Zwei Tests prüfen die
  Größenverteilung und dass sich der fehlende Stein wirklich herleiten lässt.
- **Zwei Sorten Zahlenmauer**: die gezeichnete mit EINER Lücke (SVG in `bild`,
  Rückwärtsrechnen) und die ausfüllbare (Antwortart `"mauer"`, Grundreihe steht
  da, alles darüber leer). Bei der ausfüllbaren sind die Steine echte
  DOM-Knöpfe, kein SVG – nur so lässt sich einer auswählen.
- **Gezeichnet wird von oben nach unten, GEZÄHLT von unten nach oben.** Die
  Lösungsfolge läuft unten → oben, links → rechts, und genau so füllt ein Kind
  eine Mauer. Beides zu vermischen war ein Fehler: Die Zahlen landeten in den
  falschen Steinen, und weil Eingabe und Vergleich dieselbe verdrehte
  Reihenfolge benutzten, galt die Aufgabe trotzdem als richtig. Wer das prüft,
  muss die POSITION der Zahlen vergleichen, nicht nur richtig/falsch.
- **Die Spitze einer Mauer wächst schnell**: Bei vier Grundsteinen ist sie
  `a + 3b + 3c + d`, die inneren Steine zählen also dreifach. Deren Grenzen
  müssen enger sein, sonst verlässt die Mauer den Zahlenraum bis 100.
- **Rechenmeister und Puzzle sind Betriebsarten der Übungsansicht**, keine
  eigenen Dateien – sie haben aber je einen Eintrag in `ANSICHTEN`, damit die Routen
  `#/rechenmeister` und `#/puzzle` auch offline vorgeladen werden.
- **Bei der Rechentabelle steht die Rechnung bewusst NICHT im Text.** Das
  Ablesen von Zeile und Spalte ist die eigentliche Übung; für Screenreader
  steckt die Aufgabe in der Bildbeschreibung. Ein Test hält das fest.
- **Neue ausgelieferte Dateien gehören in den Precache.** Beim ersten Besuch
  lädt der Browser `index.html` und die statisch importierten Module, bevor der
  Service Worker die Kontrolle übernimmt – Laufzeit-Caching allein reicht also
  nicht. `npm run build` zieht die Liste automatisch nach, `npm run sw:check`
  und `test/offline.test.js` schlagen an, wenn sie veraltet ist.
- **Touch-Ziele bleiben mindestens 40 px hoch** – auch wenn dafür lieber
  Kopfzeile oder Navigation weichen (siehe die Querformat-Regeln in
  `style.css`). Bei Kinderhänden ist das keine Stellschraube.
- **Die Klasse `uebung-laeuft` am `<body>`** sagt dem Stylesheet, dass gerade
  geübt wird; nur so lassen sich auf flachen Bildschirmen Kopf und Navigation
  gezielt ausblenden. Sie wird in `views/uebung.ts` gesetzt und beim
  Routenwechsel wieder entfernt.
- **Eine neue Route braucht einen Eintrag in `ANSICHTEN` (`src/app.ts`).**
  Die Liste wird im Leerlauf komplett vorgeladen; nur dadurch bleibt die App
  nach dem Code-Splitting offline vollständig.
- **Die Fehlerbilanz (`fortschritt.fehler`) ist ein SALDO, keine Gesamtzahl.**
  Falsche Antworten zählen hoch, richtige derselben Art wieder herunter. Wer
  eine neue Auswertung darauf baut, darf sie nicht als „Fehler seit Beginn“
  auslegen.
- **Die Tempo-Bilanz (`fortschritt.tempo`) zählt NUR richtige Antworten** –
  wie lange eine falsche dauert, sagt über die Sicherheit nichts. Sie ist ein
  geglätteter Mittelwert, kein Verlauf. Langsam ist ein Typ nie absolut,
  sondern nur im Vergleich zum Median SEINES Bereichs (Teil vor dem `/`):
  Eine Sachaufgabe braucht auch flüssig gelöst lange, weil gelesen werden
  muss – gegen das Einmaleins gehalten wäre jede davon „langsam“. Und die
  Zeiten sieht ausschließlich der Elternbereich: Dem Kind NIE eine Uhr oder
  Zeitangabe zeigen, das wäre Druck statt Hilfe. Tipp und Bonus halten die
  Messung bewusst nicht an – wer die Hilfsaufgabe braucht, löst die Aufgabe
  eben (noch) nicht flüssig. Beim Abgleich kommt `tempo` wie `fehler` vom
  zuletzt benutzten Gerät, nicht als Maximum.
- **Drei Antwortarten**: `zahl` (Zahlentastatur), `auswahl` (Textknöpfe) und
  `bildauswahl` (Bildkarten A–D; die Lösung ist die Kennung, nicht das Bild).
  Wer eine vierte ergänzt, muss `antwortbereich()` in `views/uebung.ts` und
  die Prüfungen in `test/generatoren.test.js` nachziehen.
- **`icon(name, klasse)` ERGÄNZT die Basisklasse `symbol`**, es ersetzt sie
  nicht. Ohne `symbol` verliert ein Icon seine Maße und fällt auf null zusammen.
- **Text auf getönten Flächen nutzt `--haupt-text`**, nicht `--haupt` oder
  `--haupt-dunkel`: Nur so stimmt der Kontrast in beiden Farbschemata. Der
  Markenverlauf (`--verlauf-a/-b/-text`) bringt seine Textfarbe selbst mit.
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

## Sicherheit

Es gibt kein Konto, keine fremden Skripte und keine fremden Schriften. Der
Angriffsweg führt fast vollständig über den **gespeicherten Zustand** – seit
der Synchronisierung zusätzlich über die Daten, die vom Worker zurückkommen.
Beides ist ungeprüfte Eingabe. Deshalb gilt:

- **Jeder `load…()` prüft, was er liest** – Typ, Wertebereich und Verweise.
  Vorbild ist `ladeFortschritt()` in `state.ts`; `test/sicherheit.test.js`
  sichert es mit bösartigen Spielständen ab.
- **DOM nur über `el()` aus `dom.ts`.** `innerHTML` ist ausschließlich für die
  SVG-Zeichenketten aus `figures.ts` erlaubt (`svgBild()`) und darf in keiner
  weiteren Datei auftauchen – ein Test erzwingt das.
- **Die CSP in `index.html` darf nicht aufgeweicht werden** (kein
  `unsafe-inline`, kein Inline-Skript, kein `style`-Attribut). Maße setzt
  `el()` über die `stil`-Eigenschaft per CSSOM.
- **Der Service Worker bedient nur die eigene Herkunft** und legt nur
  erfolgreiche Antworten in den Cache.
- **Keine Laufzeit-Abhängigkeiten.** Jede neue `dependency` vergrößert die
  Angriffsfläche einer Seite, die sonst komplett ohne Fremdcode auskommt.

## Tests

`test/setup.js` stellt ein In-Memory-`localStorage` bereit, damit die
kompilierten `js/`-Module direkt mit `node:test` importierbar sind. Neue
Aufgabentypen ohne Test gelten als unvollständig.

Zwei Regeln, die sich beide teuer eingekauft haben:

- **Ein Test muss gegen die kaputte Fassung geprüft werden.** Ein grüner Test
  beweist gar nichts, solange niemand gesehen hat, dass er auch anschlägt.
  Mehrfach war ein Test grün, WEIL das Geprüfte fehlte (verschwundene
  Erklärbilder, siehe 1.11.1) oder weil er die falsche Eigenschaft maß. Also:
  Änderung zurückbauen, Test laufen lassen, Fehlschlag sehen, wieder vorbauen.
- **Aus dem Ergebnis prüfen, nicht aus den Zwischenwerten des Generators.**
  Sonst prüft der Test nur, ob der Generator mit sich selbst einig ist. Das
  Rechendreieck wird aus dem BILD nachgerechnet, die Beziehungskette aus ihrem
  eigenen Aufgabentext gelöst – so, wie ein Kind es täte. Wo eine Position
  zählt (Zahlenmauer), muss der Test die POSITION vergleichen, nicht nur
  richtig/falsch.

## CI

`.github/workflows/ci.yml` läuft bei jedem Push/PR auf `main`: `npm ci` →
`npm run build` → **js/-Sync-Check** (`git diff --exit-code -- js/`) →
`npm run sw:check` → `npm test`.
