/**
 * Gegenstelle der Zahleneule-Synchronisierung – ein Cloudflare Worker.
 *
 * Zwei Endpunkte, mehr braucht es nicht:
 *
 *   POST /hole       { code }         → { daten, geaendert } oder null
 *   POST /speichere  { code, daten }  → { geaendert }
 *
 * Der Familien-Code IST der Schlüssel. Deshalb liegt hier auch kein Geheimnis:
 * Die Adresse des Workers allein nützt niemandem, ohne Code gibt es keinen
 * Eintrag. Genau deshalb steht in der App auch kein Zugangsschlüssel im Code.
 *
 * Einrichtung im Cloudflare-Dashboard:
 *   1. KV-Namespace anlegen (Inhalt bleibt leer – den füllt der Worker).
 *   2. Diesen Code in einen Worker einfügen.
 *   3. Settings → Bindings → KV Namespace Binding: Name **STAND**.
 *   4. Unten HERKUNFT auf die eigene Adresse setzen.
 */

/** Nur diese Seite darf den Worker ansprechen. Bei einer eigenen Domain hier ändern. */
const HERKUNFT = "https://dwill1905.github.io";

/** Derselbe Zeichenvorrat wie in der App: acht Zeichen ohne I, O, 0 und 1. */
const CODE_MUSTER = /^[ABCDEFGHJKLMNPQRSTUVWXYZ23456789]{8}$/;

/** Ein Spielstand ist rund 6 KB. 64 KB Grenze verhindert, dass jemand den Speicher vollschreibt. */
const MAX_BYTES = 64 * 1024;

export default {
  async fetch(anfrage, umgebung) {
    if (anfrage.method === "OPTIONS") return new Response(null, { status: 204, headers: kopf() });
    if (anfrage.method !== "POST") return antwort({ fehler: "nur POST" }, 405);

    /*
     * Fehlt die Bindung, wäre `umgebung.STAND` schlicht `undefined` und der
     * Worker liefe in einen nichtssagenden 500er. Diese Prüfung sagt statt
     * dessen, was zu tun ist – das ist der Fehler, den man beim Einrichten
     * am ehesten macht.
     */
    if (!umgebung.STAND) {
      return antwort(
        { fehler: "Die KV-Bindung fehlt. Im Worker unter Settings → Bindings einen KV Namespace mit dem Namen STAND anlegen." },
        500
      );
    }

    const pfad = new URL(anfrage.url).pathname;
    if (pfad !== "/hole" && pfad !== "/speichere") return antwort({ fehler: "unbekannt" }, 404);

    // Zu große Rümpfe gar nicht erst lesen.
    const laenge = Number(anfrage.headers.get("content-length") ?? 0);
    if (laenge > MAX_BYTES) return antwort({ fehler: "zu groß" }, 413);

    let rumpf;
    try {
      rumpf = await anfrage.json();
    } catch {
      return antwort({ fehler: "kein JSON" }, 400);
    }

    const code = typeof rumpf?.code === "string" ? rumpf.code.toUpperCase() : "";
    if (!CODE_MUSTER.test(code)) return antwort({ fehler: "ungültiger Code" }, 400);

    if (pfad === "/hole") {
      const eintrag = await umgebung.STAND.get(code, { type: "json" });
      return antwort(eintrag ?? null, 200);
    }

    if (rumpf.daten === null || typeof rumpf.daten !== "object") {
      return antwort({ fehler: "keine Daten" }, 400);
    }
    const nutzlast = JSON.stringify(rumpf.daten);
    if (nutzlast.length > MAX_BYTES) return antwort({ fehler: "zu groß" }, 413);

    const geaendert = new Date().toISOString();
    await umgebung.STAND.put(code, JSON.stringify({ daten: rumpf.daten, geaendert }));
    return antwort({ geaendert }, 200);
  },
};

function kopf() {
  return {
    "access-control-allow-origin": HERKUNFT,
    "access-control-allow-headers": "content-type",
    "access-control-allow-methods": "POST, OPTIONS",
    "access-control-max-age": "86400",
    "content-type": "application/json; charset=utf-8",
  };
}

function antwort(rumpf, status) {
  return new Response(JSON.stringify(rumpf), { status, headers: kopf() });
}
