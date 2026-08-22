import "./setup.js";
import test from "node:test";
import assert from "node:assert/strict";

import {
  abgleichMit,
  eingerichtet,
  familienCode,
  gleicheAb,
  holeStand,
  neuerFamilienCode,
  normalisiereCode,
  sendeStand,
  setzeFamilienCode,
  verschmelze,
} from "../js/sync.js";
import { ladeFortschritt, speichereFortschritt, standardFortschritt } from "../js/state.js";
import { THEMEN } from "../js/topics.js";

/** Ein Spielstand mit gesetzten Werten, damit Unterschiede sichtbar werden. */
function stand(werte = {}) {
  const f = standardFortschritt();
  Object.assign(f, werte);
  return f;
}

/* ------------------------------------------------------------ Familiencode */

test("ein Familiencode hat acht Zeichen ohne verwechselbare Zeichen", () => {
  // Vorhersagbarer Zufall, damit der Test nicht flackert.
  let zaehler = 0;
  const code = neuerFamilienCode((n) => Uint8Array.from({ length: n }, () => zaehler++));
  assert.equal(code.length, 8);
  for (const zeichen of code) assert.ok(!"IO01".includes(zeichen), `${zeichen} ist verwechselbar`);

  // Echter Zufall streut über den ganzen Vorrat.
  const gesehen = new Set();
  for (let i = 0; i < 300; i++) for (const z of neuerFamilienCode()) gesehen.add(z);
  assert.ok(gesehen.size > 25, `nur ${gesehen.size} verschiedene Zeichen`);
  // Und zwei Codes sind praktisch nie gleich.
  const codes = new Set(Array.from({ length: 500 }, () => neuerFamilienCode()));
  assert.equal(codes.size, 500, "ein Code kam doppelt vor");
});

test("beim Abtippen ist Groß- und Kleinschreibung egal", () => {
  assert.equal(normalisiereCode("abcd2345"), "ABCD2345");
  assert.equal(normalisiereCode("  ABCD-2345 "), "ABCD2345");
  // Zu kurz, zu lang, verbotene Zeichen.
  assert.equal(normalisiereCode("ABCD234"), null);
  assert.equal(normalisiereCode("ABCD23456"), null);
  assert.equal(normalisiereCode("ABCD234O"), null);
  assert.equal(normalisiereCode("ABCD2340"), null);
  assert.equal(normalisiereCode(""), null);
});

/* -------------------------------------------------------- Zusammenführung */

test("Gesammeltes geht bei der Zusammenführung nie verloren", () => {
  const a = stand({ punkte: 500, herzen: 12, puzzleGeloest: 2, erfolge: ["blitz", "herz"], letzterTag: "2026-08-20" });
  const b = stand({ punkte: 300, herzen: 40, puzzleGeloest: 5, erfolge: ["herz", "wort"], letzterTag: "2026-08-21" });
  a.themen.plusminus = { stufe: 3, richtig: 90, gesamt: 100, sterne: 3, besteSerie: 9 };
  b.themen.plusminus = { stufe: 1, richtig: 40, gesamt: 60, sterne: 2, besteSerie: 12 };

  const z = verschmelze(a, b);
  assert.equal(z.punkte, 500);
  assert.equal(z.herzen, 40);
  assert.equal(z.puzzleGeloest, 5);
  assert.deepEqual([...z.erfolge].sort(), ["blitz", "herz", "wort"]);
  assert.equal(z.themen.plusminus.richtig, 90);
  assert.equal(z.themen.plusminus.gesamt, 100);
  assert.equal(z.themen.plusminus.sterne, 3);
  assert.equal(z.themen.plusminus.besteSerie, 12);
});

/*
 * Die Stufe darf NICHT das Maximum sein: Sie sinkt absichtlich nach einer
 * schwachen Runde, damit ein alter Höchststand ein Kind nicht dauerhaft
 * überfordert (siehe gamification.ts). Sie muss vom zuletzt benutzten Gerät
 * kommen.
 */
test("die Stufe kommt vom zuletzt benutzten Gerät, nicht als Höchststand", () => {
  const alt = stand({ letzterTag: "2026-08-01" });
  const neu = stand({ letzterTag: "2026-08-21" });
  alt.themen.geld = { stufe: 3, richtig: 10, gesamt: 10, sterne: 3, besteSerie: 5 };
  neu.themen.geld = { stufe: 1, richtig: 4, gesamt: 10, sterne: 1, besteSerie: 2 };

  assert.equal(verschmelze(alt, neu).themen.geld.stufe, 1, "die gesunkene Stufe muss gewinnen");
  assert.equal(verschmelze(neu, alt).themen.geld.stufe, 1, "auch andersherum");
  // Die gesammelten Werte bleiben trotzdem erhalten.
  assert.equal(verschmelze(alt, neu).themen.geld.sterne, 3);
});

test("der aktuelle Stand kommt vom zuletzt benutzten Gerät", () => {
  const alt = stand({ letzterTag: "2026-08-01", name: "Alt", streakTage: 9, fehler: { "a/b": 5 } });
  const neu = stand({ letzterTag: "2026-08-21", name: "Emma", streakTage: 2, fehler: { "c/d": 1 } });
  alt.letzteAufgaben = ["x1", "x2"];
  neu.letzteAufgaben = ["y1"];

  const z = verschmelze(alt, neu);
  assert.equal(z.name, "Emma");
  assert.equal(z.streakTage, 2, "ein abgerissener Streak darf nicht wiederauferstehen");
  assert.deepEqual(z.fehler, { "c/d": 1 }, "die Fehlerbilanz steigt und fällt – kein Maximum");
  assert.deepEqual(z.letzteAufgaben, ["y1"]);
  assert.equal(z.letzterTag, "2026-08-21");
});

test("ein leerer Name überschreibt keinen gesetzten", () => {
  const ohne = stand({ letzterTag: "2026-08-21", name: "" });
  const mit = stand({ letzterTag: "2026-08-01", name: "Emma" });
  assert.equal(verschmelze(ohne, mit).name, "Emma");
});

test("bei der Bestzeit gewinnt die kleinere – aber 0 heißt „noch keine“", () => {
  const a = stand({ meister: { besteZeit: 0, besteTreffer: 0 } });
  const b = stand({ meister: { besteZeit: 95, besteTreffer: 18 } });
  assert.equal(verschmelze(a, b).meister.besteZeit, 95);
  assert.equal(verschmelze(a, b).meister.besteTreffer, 18);

  const schnell = stand({ meister: { besteZeit: 70, besteTreffer: 20 } });
  assert.equal(verschmelze(b, schnell).meister.besteZeit, 70);
  assert.equal(verschmelze(b, schnell).meister.besteTreffer, 20);
});

test("der Aktivitätsverlauf wird je Tag zusammengeführt und gedeckelt", () => {
  const a = stand({ verlauf: [{ tag: "2026-08-01", richtig: 5, gesamt: 10 }, { tag: "2026-08-02", richtig: 9, gesamt: 10 }] });
  const b = stand({ verlauf: [{ tag: "2026-08-02", richtig: 3, gesamt: 20 }, { tag: "2026-08-03", richtig: 7, gesamt: 8 }] });
  const z = verschmelze(a, b);
  assert.equal(z.verlauf.length, 3, "jeder Tag genau einmal");
  const zweiter = z.verlauf.find((e) => e.tag === "2026-08-02");
  assert.deepEqual(zweiter, { tag: "2026-08-02", richtig: 9, gesamt: 20 });

  // Mehr als 90 Tage werden auf die neuesten gekürzt.
  const viel = stand({ verlauf: Array.from({ length: 120 }, (_, i) => ({ tag: `2026-01-${String(i).padStart(3, "0")}`, richtig: 1, gesamt: 1 })) });
  assert.equal(verschmelze(viel, stand()).verlauf.length, 90);
});

test("die Zusammenführung ist von der Reihenfolge unabhängig", () => {
  const a = stand({ punkte: 120, herzen: 3, letzterTag: "2026-08-20", erfolge: ["x"] });
  const b = stand({ punkte: 80, herzen: 11, letzterTag: "2026-08-21", erfolge: ["y"] });
  a.themen.mauern = { stufe: 2, richtig: 30, gesamt: 40, sterne: 2, besteSerie: 6 };
  b.themen.mauern = { stufe: 3, richtig: 10, gesamt: 12, sterne: 1, besteSerie: 8 };
  const eins = verschmelze(a, b);
  const zwei = verschmelze(b, a);
  eins.erfolge.sort();
  zwei.erfolge.sort();
  assert.deepEqual(eins, zwei);
});

test("mit sich selbst verschmolzen ändert sich nichts", () => {
  const a = stand({ punkte: 640, herzen: 9, letzterTag: "2026-08-21", erfolge: ["x", "y"] });
  a.themen.geld = { stufe: 2, richtig: 30, gesamt: 44, sterne: 2, besteSerie: 7 };
  a.verlauf = [{ tag: "2026-08-21", richtig: 8, gesamt: 10 }];
  assert.deepEqual(verschmelze(a, a), a);
});

/* -------------------------------------------------------------- Netzwerk */

/** Eine Gegenstelle im Speicher – kein echtes Netz nötig. */
function gefaelschterServer() {
  const zeilen = new Map();
  const aufrufe = [];
  const hole = async (adresse, optionen) => {
    aufrufe.push(adresse);
    const rumpf = JSON.parse(optionen.body);
    if (adresse.endsWith("/hole")) {
      const zeile = zeilen.get(rumpf.code);
      return new Response(JSON.stringify(zeile ?? null), { status: 200 });
    }
    if (adresse.endsWith("/speichere")) {
      const geaendert = new Date().toISOString();
      zeilen.set(rumpf.code, { daten: rumpf.daten, geaendert });
      return new Response(JSON.stringify({ geaendert }), { status: 200 });
    }
    return new Response("nicht gefunden", { status: 404 });
  };
  return { hole, zeilen, aufrufe };
}

test("holen und senden sprechen die richtigen Endpunkte an", async () => {
  const server = gefaelschterServer();
  assert.equal(await holeStand("ABCD2345", server.hole), null, "unbekannter Code liefert nichts");

  const meiner = stand({ punkte: 210, name: "Emma", letzterTag: "2026-08-21" });
  await sendeStand("ABCD2345", meiner, server.hole);
  const zurueck = await holeStand("ABCD2345", server.hole);
  assert.equal(zurueck.punkte, 210);
  assert.equal(zurueck.name, "Emma");
  // Ein anderer Code sieht davon nichts.
  assert.equal(await holeStand("WXYZ9876", server.hole), null);

  // Und es werden wirklich die beiden Worker-Endpunkte angesprochen.
  assert.ok(server.aufrufe.some((a) => a.endsWith("/hole")), "kein Aufruf von /hole");
  assert.ok(server.aufrufe.some((a) => a.endsWith("/speichere")), "kein Aufruf von /speichere");
  // Kein Zugangsschlüssel im Spiel – der Code ist das einzige Geheimnis.
  assert.ok(!server.aufrufe.join(" ").includes("apikey"));
});

test("kaputte Antworten der Gegenstelle werden geprüft, nicht übernommen", async () => {
  const hole = async (adresse) =>
    adresse.endsWith("/hole")
      ? new Response(JSON.stringify({ daten: { punkte: "ganz viel", themen: 42, erfolge: "nein" }, geaendert: "x" }), { status: 200 })
      : new Response("null", { status: 200 });
  const geprueft = await holeStand("ABCD2345", hole);
  assert.equal(geprueft.punkte, 0, "eine Zeichenkette ist keine Punktzahl");
  assert.deepEqual(geprueft.erfolge, []);
  for (const t of THEMEN) assert.equal(geprueft.themen[t.id].stufe, 1);
});

test("ein Serverfehler wird gemeldet und wirft nicht", async () => {
  const hole = async () => new Response("kaputt", { status: 500 });
  const ergebnis = await abgleichMit("ABCD2345", hole);
  assert.equal(ergebnis.art, "fehler");
  assert.match(ergebnis.meldung, /500/);
});

/*
 * Der Fall beim Einrichten: Der Worker läuft, aber die KV-Bindung fehlt. Er
 * schickt dann die Anleitung im Rumpf mit. Reichte die App sie nicht durch,
 * bliebe auf dem Bildschirm nur „500" stehen – und wer kein Terminal zur Hand
 * hat, wüsste nicht, was zu tun ist.
 */
test("die Erklärung der Gegenstelle kommt beim Benutzer an", async () => {
  const hole = async () =>
    new Response(JSON.stringify({ fehler: "Die KV-Bindung fehlt. Im Worker unter Settings …" }), {
      status: 500,
      headers: { "content-type": "application/json" },
    });
  const ergebnis = await abgleichMit("ABCD2345", hole);
  assert.equal(ergebnis.art, "fehler");
  assert.match(ergebnis.meldung, /KV-Bindung fehlt/, "die Erklärung wurde unterwegs verworfen");
});

test("ohne verwertbaren Rumpf bleibt es bei der nackten Nummer", async () => {
  const hole = async () => new Response("<html>Bad Gateway</html>", { status: 502 });
  const ergebnis = await abgleichMit("ABCD2345", hole);
  assert.match(ergebnis.meldung, /502/);
});

test("eine geschwätzige Gegenstelle sprengt die Meldung nicht", async () => {
  const hole = async () =>
    new Response(JSON.stringify({ fehler: "x".repeat(5000) }), {
      status: 500,
      headers: { "content-type": "application/json" },
    });
  const ergebnis = await abgleichMit("ABCD2345", hole);
  assert.ok(ergebnis.meldung.length < 400, `Meldung zu lang: ${ergebnis.meldung.length} Zeichen`);
});

/*
 * Die Gegenstelle IST eingetragen – seit der Worker läuft. Fiele die Adresse
 * je auf den Platzhalter zurück, schaltete sich der Abgleich wortlos ab: kein
 * Fehler, keine Meldung, nur nichts. Deshalb wird beides festgehalten.
 */
test("die Gegenstelle ist eingetragen, mit Code läuft der Abgleich", async () => {
  assert.equal(eingerichtet(), true, "die Worker-Adresse steht wieder auf dem Platzhalter");

  setzeFamilienCode("ABCD2345");
  let gerufen = false;
  const ergebnis = await gleicheAb(async () => {
    gerufen = true;
    return new Response("null", { status: 200 });
  });
  assert.equal(gerufen, true, "mit Adresse und Code muss der Abgleich die Gegenstelle ansprechen");
  assert.equal(ergebnis.art, "gesendet");
  setzeFamilienCode(null);
});

/*
 * Der Fall, um den es eigentlich geht: Zwei Geräte üben, jedes schickt seinen
 * Stand, und am Ende haben beide dasselbe – ohne dass etwas verloren geht.
 */
test("zwei Geräte finden über denselben Code zusammen", async () => {
  const server = gefaelschterServer();
  const code = "ABCD2345";

  // Gerät A übt und gleicht ab.
  const a = stand({ punkte: 300, herzen: 5, letzterTag: "2026-08-20", erfolge: ["blitz"] });
  a.themen.plusminus = { stufe: 3, richtig: 60, gesamt: 70, sterne: 3, besteSerie: 9 };
  speichereFortschritt(a);
  assert.equal((await abgleichMit(code, server.hole)).art, "gesendet");

  // Gerät B: eigener Stand, gleicht ab und bekommt A dazu.
  const b = stand({ punkte: 120, herzen: 40, letzterTag: "2026-08-21", erfolge: ["herz"] });
  b.themen.plusminus = { stufe: 1, richtig: 20, gesamt: 30, sterne: 1, besteSerie: 3 };
  speichereFortschritt(b);
  assert.equal((await abgleichMit(code, server.hole)).art, "verschmolzen");

  const aufB = ladeFortschritt();
  assert.equal(aufB.punkte, 300, "die Punkte von A fehlen");
  assert.equal(aufB.herzen, 40, "die Herzen von B fehlen");
  assert.deepEqual([...aufB.erfolge].sort(), ["blitz", "herz"]);
  assert.equal(aufB.themen.plusminus.sterne, 3, "die Sterne von A fehlen");
  assert.equal(aufB.themen.plusminus.stufe, 1, "die Stufe kommt vom zuletzt benutzten Gerät");

  // Gerät A gleicht erneut ab und ist danach auf demselben Stand.
  speichereFortschritt(a);
  await abgleichMit(code, server.hole);
  const aufA = ladeFortschritt();
  assert.equal(aufA.punkte, 300);
  assert.equal(aufA.herzen, 40);
  assert.deepEqual([...aufA.erfolge].sort(), ["blitz", "herz"]);

  // Ein weiterer Abgleich ändert nichts mehr.
  const vorher = JSON.stringify(ladeFortschritt());
  await abgleichMit(code, server.hole);
  assert.equal(JSON.stringify(ladeFortschritt()), vorher, "der Abgleich ist nicht stabil");
});

test("ohne Familiencode passiert gar nichts", async () => {
  setzeFamilienCode(null);
  let gerufen = false;
  const ergebnis = await gleicheAb(async () => {
    gerufen = true;
    return new Response("[]", { status: 200 });
  });
  assert.equal(ergebnis.art, "aus");
  assert.equal(gerufen, false, "ohne Code darf kein Netzaufruf passieren");
});

test("der Familiencode wird geprüft gespeichert", () => {
  setzeFamilienCode("ABCD2345");
  assert.equal(familienCode(), "ABCD2345");
  // Von Hand verbogener Speicher liefert keinen Code.
  localStorage.setItem("sync:familiencode", "kaputt!");
  assert.equal(familienCode(), null);
  setzeFamilienCode(null);
  assert.equal(familienCode(), null);
});

test("der Code liegt nicht im Spielstand-Bereich", () => {
  setzeFamilienCode("ABCD2345");
  const spielstand = localStorage.getItem("mathe2:fortschritt") ?? "";
  assert.ok(!spielstand.includes("ABCD2345"), "der Code gehört nicht in den Spielstand");
  setzeFamilienCode(null);
});

/* ------------------------------------------------- Meldung im Elternbereich */

/**
 * Der häufigste Einrichtungsfehler (fehlende KV-Bindung) beantwortet der
 * Worker mit einer kompletten Anleitung im Rumpf. Verschluckt der
 * Elternbereich sie, sieht ein misslungener Abgleich aus wie ein geglückter –
 * und niemand erfährt, woran es liegt.
 */
test("ein Fehlschlag beim Abgleich wird im Elternbereich benannt", async () => {
  const { abgleichMeldung } = await import("../js/views/eltern.js");

  assert.equal(abgleichMeldung({ art: "geholt" }), null);
  assert.equal(abgleichMeldung({ art: "gesendet" }), null);
  assert.equal(abgleichMeldung({ art: "verschmolzen" }), null);

  const aus = abgleichMeldung({ art: "aus" });
  assert.ok(aus && aus.length > 0, "„nicht verbunden“ darf nicht stillschweigend durchgehen");

  const meldung = abgleichMeldung({ art: "fehler", meldung: "500 – KV-Bindung fehlt" });
  assert.ok(meldung, "ein Fehler braucht eine Meldung");
  assert.ok(
    meldung.includes("KV-Bindung fehlt"),
    `der Grund der Gegenstelle muss durchgereicht werden, stattdessen: ${meldung}`
  );
});
