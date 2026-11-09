// Agenda-sync: leest het rooster uit de lijstweergave van /agenda en zet het om
// naar een iCalendar-bestand (.ics). background.js uploadt dat naar een geheime
// GitHub Gist, zodat Outlook/Google Agenda zich op een vaste link kan abonneren.
(function (root, factory) {
  const api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  else root.EduarteRooster = api;
})(globalThis, function () {
  const MONTHS = {
    januari: 1, februari: 2, maart: 3, april: 4, mei: 5, juni: 6,
    juli: 7, augustus: 8, september: 9, oktober: 10, november: 11, december: 12,
  };
  const SUBJECT_NAMES = {
    OPSYS: "Operating Systems", NED: "Nederlands", ENG: "Engels", REK: "Rekenen", PJ: "Project",
  };
  const WEEKS_BACK = 2;
  const WEEKS_FORWARD = 16;
  const DAY_MS = 86400000;

  function text(element, selector) {
    const found = element.querySelector(selector);
    return found ? found.textContent.replace(/\s+/g, " ").trim() : "";
  }

  // "09-11-2026" -> Date (UTC-middernacht, alleen gebruikt als datum)
  function parseReferenceDate(value) {
    const match = /^(\d{1,2})-(\d{1,2})-(\d{4})$/.exec(String(value || "").trim());
    return match ? new Date(Date.UTC(+match[3], +match[2] - 1, +match[1])) : null;
  }

  // "maandag 9 november" + referentiedatum -> { year, month, day }
  // Het jaar staat niet in de titel; kies het jaar dat het dichtst bij de
  // referentiedatum ligt (werkt ook rond de jaarwisseling).
  function resolveDay(title, reference) {
    const match = /(\d{1,2})\s+([a-z]+)/i.exec(String(title || ""));
    if (!match) return null;
    const day = +match[1];
    const month = MONTHS[match[2].toLowerCase()];
    if (!month) return null;
    const refYear = reference ? reference.getUTCFullYear() : new Date().getFullYear();
    let best = null;
    for (const year of [refYear - 1, refYear, refYear + 1]) {
      const candidate = Date.UTC(year, month - 1, day);
      const distance = reference ? Math.abs(candidate - reference.getTime()) : Math.abs(year - refYear);
      if (!best || distance < best.distance) best = { year, distance };
    }
    return { year: best.year, month, day };
  }

  function parseTime(value) {
    const match = /^(\d{1,2})[:.](\d{2})$/.exec(String(value || "").trim());
    return match ? { hour: +match[1], minute: +match[2] } : null;
  }

  function describeClass(code) {
    if (code.startsWith("_")) {
      // Toetsen/examens: "_Rekenen LIE 4 variant 1 TR20261125 09.00 uur"
      return code.replace(/^_+/, "").replace(/\s+TR\d{8}.*$/, "").trim() + " (toets)";
    }
    const parts = code.split("-");
    const subject = parts.length >= 3 ? parts[1] : code;
    return SUBJECT_NAMES[subject] ? `${SUBJECT_NAMES[subject]} (${subject})` : subject;
  }

  function parseAgendaDocument(document) {
    const reference = parseReferenceDate(document.querySelector(".datepicker input")?.value);
    const list = document.querySelector(".agenda-list");
    const events = [];
    if (list) {
      let day = null;
      for (const child of list.children) {
        if (child.classList.contains("agenda-title")) {
          day = resolveDay(child.textContent, reference);
          continue;
        }
        if (child.tagName !== "TABLE" || !day) continue;
        for (const row of child.querySelectorAll("tr")) {
          const start = parseTime(text(row, ".agenda-time.top"));
          const end = parseTime(text(row, ".agenda-time.bottom"));
          const code = text(row, ".agenda-class");
          if (!start || !end || !code) continue;
          events.push({
            ...day,
            start,
            end,
            code,
            title: describeClass(code),
            teacher: text(row, ".agenda-teacher"),
            location: text(row, ".agenda-location"),
            hours: text(row, ".agenda-item"),
            homework: text(row, ".agenda-homework"),
          });
        }
      }
    }
    return {
      isAgenda: Boolean(list),
      reference,
      events,
      next: document.querySelector('a[href*="filter-vooruit"]')?.getAttribute("href") || null,
      previous: document.querySelector('a[href*="filter-terug"]')?.getAttribute("href") || null,
    };
  }

  // Haalt een vers agendapagina-exemplaar op (zodat de agenda die de gebruiker
  // open heeft niet verspringt), loopt een paar weken terug en daarna vooruit.
  async function collectRooster({ fetchDocument, baseUrl, weeksBack = WEEKS_BACK, weeksForward = WEEKS_FORWARD }) {
    let page = await fetchDocument(new URL("/agenda", baseUrl).href);
    if (!page.document) throw new Error("Agenda kon niet worden geladen.");
    let parsed = parseAgendaDocument(page.document);
    if (!parsed.isAgenda) throw new Error("Niet ingelogd op Eduarte (agenda niet gevonden).");

    for (let i = 0; i < weeksBack && parsed.previous; i += 1) {
      page = await fetchDocument(new URL(parsed.previous, page.url).href);
      parsed = parseAgendaDocument(page.document);
    }

    const byKey = new Map();
    const add = (events) => events.forEach((event) => byKey.set(eventKey(event), event));
    add(parsed.events);
    for (let i = 0; i < weeksBack + weeksForward && parsed.next; i += 1) {
      page = await fetchDocument(new URL(parsed.next, page.url).href);
      parsed = parseAgendaDocument(page.document);
      if (!parsed.isAgenda) break;
      add(parsed.events);
    }
    return [...byKey.values()].sort((a, b) => sortValue(a) - sortValue(b));
  }

  function pad(value) {
    return String(value).padStart(2, "0");
  }

  function localStamp(event, time) {
    return `${event.year}${pad(event.month)}${pad(event.day)}T${pad(time.hour)}${pad(time.minute)}00`;
  }

  function sortValue(event) {
    return Date.UTC(event.year, event.month - 1, event.day, event.start.hour, event.start.minute);
  }

  function eventKey(event) {
    return `${localStamp(event, event.start)}|${localStamp(event, event.end)}|${event.code}`;
  }

  function escapeText(value) {
    return String(value)
      .replace(/\\/g, "\\\\")
      .replace(/;/g, "\\;")
      .replace(/,/g, "\\,")
      .replace(/\r?\n/g, "\\n");
  }

  // RFC 5545: regels langer dan 75 octets vouwen.
  function foldLine(line) {
    const bytes = new TextEncoder().encode(line);
    if (bytes.length <= 75) return line;
    const parts = [];
    let current = "";
    let size = 0;
    for (const char of line) {
      const charSize = new TextEncoder().encode(char).length;
      const limit = parts.length ? 74 : 75;
      if (size + charSize > limit) {
        parts.push(current);
        current = "";
        size = 0;
      }
      current += char;
      size += charSize;
    }
    parts.push(current);
    return parts.join("\r\n ");
  }

  function hashString(value) {
    let hash = 2166136261;
    for (let i = 0; i < value.length; i += 1) {
      hash ^= value.charCodeAt(i);
      hash = Math.imul(hash, 16777619);
    }
    return (hash >>> 0).toString(16).padStart(8, "0");
  }

  function utcStamp(date) {
    return date.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
  }

  function buildIcs(events, { now = new Date(), calendarName = "Eduarte rooster" } = {}) {
    const lines = [
      "BEGIN:VCALENDAR",
      "VERSION:2.0",
      "PRODID:-//Eduarte Tools//Agenda-sync//NL",
      "CALSCALE:GREGORIAN",
      "METHOD:PUBLISH",
      `X-WR-CALNAME:${escapeText(calendarName)}`,
      "X-WR-TIMEZONE:Europe/Amsterdam",
      "REFRESH-INTERVAL;VALUE=DURATION:PT4H",
      "X-PUBLISHED-TTL:PT4H",
      "BEGIN:VTIMEZONE",
      "TZID:Europe/Amsterdam",
      "BEGIN:DAYLIGHT",
      "TZOFFSETFROM:+0100",
      "TZOFFSETTO:+0200",
      "TZNAME:CEST",
      "DTSTART:19700329T020000",
      "RRULE:FREQ=YEARLY;BYMONTH=3;BYDAY=-1SU",
      "END:DAYLIGHT",
      "BEGIN:STANDARD",
      "TZOFFSETFROM:+0200",
      "TZOFFSETTO:+0100",
      "TZNAME:CET",
      "DTSTART:19701025T030000",
      "RRULE:FREQ=YEARLY;BYMONTH=10;BYDAY=-1SU",
      "END:STANDARD",
      "END:VTIMEZONE",
    ];
    const stamp = utcStamp(now);
    for (const event of events) {
      const description = [
        `Docent: ${event.teacher || "-"}`,
        `Lesuren: ${event.hours || "-"}`,
        `Eduarte: ${event.code}`,
        event.homework ? `Huiswerk: ${event.homework}` : "",
      ].filter(Boolean).join("\n");
      lines.push(
        "BEGIN:VEVENT",
        `UID:${hashString(eventKey(event))}-${localStamp(event, event.start)}@eduarte-tools`,
        `DTSTAMP:${stamp}`,
        `DTSTART;TZID=Europe/Amsterdam:${localStamp(event, event.start)}`,
        `DTEND;TZID=Europe/Amsterdam:${localStamp(event, event.end)}`,
        `SUMMARY:${escapeText(event.title)}`,
        `LOCATION:${escapeText(event.location)}`,
        `DESCRIPTION:${escapeText(description)}`,
        "END:VEVENT",
      );
    }
    lines.push("END:VCALENDAR");
    return lines.map(foldLine).join("\r\n") + "\r\n";
  }

  function hashEvents(events) {
    return hashString(JSON.stringify(events.map((event) => [eventKey(event), event.title, event.location, event.teacher, event.homework])));
  }

  return {
    MONTHS, WEEKS_BACK, WEEKS_FORWARD, DAY_MS,
    parseReferenceDate, resolveDay, parseTime, describeClass, parseAgendaDocument,
    collectRooster, buildIcs, hashEvents, eventKey, foldLine,
  };
});

// ---- Content-script gedeelte (alleen in de browser op Eduarte-pagina's) ----
(function () {
  if (typeof chrome === "undefined" || !chrome.runtime?.id || typeof document === "undefined") return;
  if (typeof location === "undefined" || !/(^|\.)(educus|eduarte)\.nl$/.test(location.hostname)) return;

  const api = globalThis.EduarteRooster;
  const MIN_INTERVAL_MS = 60 * 60 * 1000; // hooguit één keer per uur automatisch
  let running = null;

  async function fetchDocument(url) {
    // Firefox: content.fetch draait in de context van de pagina (met de sessie).
    const pageFetch = typeof content !== "undefined" && content?.fetch ? content.fetch.bind(content) : fetch;
    const response = await pageFetch(url, { credentials: "include", redirect: "follow" });
    const html = await response.text();
    return { url: response.url, document: new DOMParser().parseFromString(html, "text/html") };
  }

  function sync({ force = false } = {}) {
    if (running) return running;
    running = (async () => {
      const settings = await chrome.storage.local.get(["eduarteRoosterSyncEnabled", "eduarteRoosterLastRun"]);
      if (!force && !settings.eduarteRoosterSyncEnabled) return { success: false, skipped: true };
      if (!force && Date.now() - (settings.eduarteRoosterLastRun || 0) < MIN_INTERVAL_MS) {
        return { success: true, skipped: true };
      }
      // Alleen draaien als de gebruiker ingelogd is (portaalmenu met Agenda aanwezig).
      if (!force && !document.querySelector('a[href="./agenda"], a[href$="/agenda"]')) {
        return { success: false, skipped: true };
      }
      if (!force) await chrome.storage.local.set({ eduarteRoosterLastRun: Date.now() });
      const events = await api.collectRooster({ fetchDocument, baseUrl: location.origin });
      if (!events.length) throw new Error("Geen lessen gevonden in de agenda.");
      const ics = api.buildIcs(events);
      return chrome.runtime.sendMessage({
        type: "ROOSTER_SYNC_UPLOAD",
        ics,
        hash: api.hashEvents(events),
        count: events.length,
        force,
      });
    })().catch(async (error) => {
      await chrome.storage.local.set({ eduarteRoosterLastError: error.message || String(error) });
      return { success: false, error: error.message || String(error) };
    }).finally(() => {
      running = null;
    });
    return running;
  }

  chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request?.type !== "ROOSTER_SYNC_RUN") return;
    sync({ force: true }).then(sendResponse);
    return true;
  });

  // Niet blokkeren bij het laden van de pagina.
  setTimeout(() => sync(), 4000);
})();
