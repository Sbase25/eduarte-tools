// Eduarte Tools - agenda.js
// Leest lessen uit de Eduarte-agenda, kort lesnamen in en maakt het weekrooster compacter.

(function (root, factory) {
  const api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  else root.EduarteAgenda = api;
})(globalThis, function () {
  // Eduarte tekent het rooster met 108px per uur (54px per half uur)
  const SOURCE_HOUR_PX = 108;
  const COMPACT_HOUR_PX = 64;
  const CLASS_CODE = /^[A-Z]\d[A-Z0-9]{3,}$/i;
  const COURSE_COLORS = ["#7aa2ff", "#b18cff", "#3ddc97", "#ffc75f", "#ff8fab", "#5ad1e6", "#ff7a59"];

  // Vaste kleur per vak, zodat hetzelfde vak overal dezelfde kleur heeft
  function courseColor(title) {
    const hash = Array.from(title || "").reduce((h, ch) => (h * 31 + ch.charCodeAt(0)) >>> 0, 7);
    return COURSE_COLORS[hash % COURSE_COLORS.length];
  }

  function splitTokens(text) {
    return (text || "").split(/[\s,]+/).map((t) => t.trim().toLowerCase()).filter(Boolean);
  }

  // "ka202c,ka202b-PJ-H1ONICT1C,H1ONICT1B-sadri,rolaa" -> "PJ"
  function shortenSubject(subject, location, participants) {
    const full = (subject || "").trim();
    if (!full.includes("-")) return full;
    const known = new Set([...splitTokens(location), ...splitTokens(participants)]);
    const parts = full.split("-").filter((part) => {
      const tokens = part.split(",").map((t) => t.trim()).filter(Boolean);
      if (!tokens.length) return false;
      if (tokens.every((t) => known.has(t.toLowerCase()))) return false;
      if (tokens.every((t) => CLASS_CODE.test(t))) return false;
      return true;
    });
    return parts[0] || full;
  }

  function formatTime(hours) {
    const total = Math.round(hours * 60);
    return `${String(Math.floor(total / 60)).padStart(2, "0")}:${String(total % 60).padStart(2, "0")}`;
  }

  function parseHour(text) {
    const m = /(\d{1,2}):(\d{2})/.exec(text || "");
    return m ? Number(m[1]) + Number(m[2]) / 60 : 8;
  }

  function readPx(styleText, id, prop) {
    const block = new RegExp(`#${id}\\s*\\{([^}]*)\\}`).exec(styleText);
    if (!block) return null;
    const m = new RegExp(`(?:^|;|\\s)${prop}\\s*:\\s*(-?[\\d.]+)px`).exec(block[1]);
    return m ? Number(m[1]) : null;
  }

  function lessonFromElement(li, startHour, styleText) {
    const text = (sel) => li.querySelector(sel)?.textContent.trim() || "";
    // Na het inkorten staat de volledige lesnaam in het title-attribuut
    const subject = li.querySelector(".is-subject")?.title || text(".is-subject");
    const location = text(".is-location");
    const participants = text(".is-participant");
    const top = Number(li.dataset.etTop) || readPx(styleText, li.id, "top");
    const height = Number(li.dataset.etHeight) || readPx(styleText, li.id, "height");
    const start = top == null ? null : startHour + top / SOURCE_HOUR_PX;
    const end = start == null || height == null ? null : start + height / SOURCE_HOUR_PX;
    return {
      subject,
      title: shortenSubject(subject, location, participants),
      location,
      participants,
      start,
      end,
    };
  }

  // Lessen van vandaag uit een (opgehaalde) agendapagina
  function getTodayLessons(doc) {
    const day = doc.querySelector(".agenda--day.is-today");
    if (!day) return [];
    const startHour = parseHour(doc.querySelector(".agenda--time li")?.textContent);
    const styleText = Array.from(doc.querySelectorAll("style")).map((s) => s.textContent).join("\n");
    return Array.from(day.querySelectorAll("li.agenda--course, li.agenda--appointment, li.agenda--bpv"))
      .map((li) => lessonFromElement(li, startHour, styleText))
      .filter((l) => l.start != null)
      .sort((a, b) => a.start - b.start);
  }

  function fetchAgendaDocument() {
    return fetch("/agenda", { credentials: "same-origin" })
      .then((res) => (res.ok ? res.text() : Promise.reject(new Error(`HTTP ${res.status}`))))
      .then((html) => new DOMParser().parseFromString(html, "text/html"));
  }

  function fetchTodayLessons() {
    return fetchAgendaDocument().then(getTodayLessons);
  }

  const MONTHS = { jan: 0, feb: 1, mrt: 2, maa: 2, apr: 3, mei: 4, jun: 5, jul: 6, aug: 7, sep: 8, okt: 9, nov: 10, dec: 11 };

  function pad(n) {
    return String(n).padStart(2, "0");
  }

  // "ma 9 nov" -> "2026-11-09"; het jaar is het jaar dat het dichtst bij vandaag ligt
  function parseDayLabel(label, today = new Date()) {
    const m = /(\d{1,2})\s+([a-z]{3})/i.exec(label || "");
    if (!m || MONTHS[m[2].toLowerCase()] == null) return null;
    const day = Number(m[1]);
    const month = MONTHS[m[2].toLowerCase()];
    const year = [today.getFullYear() - 1, today.getFullYear(), today.getFullYear() + 1]
      .map((y) => new Date(y, month, day))
      .sort((a, b) => Math.abs(a - today) - Math.abs(b - today))[0]
      .getFullYear();
    return `${year}-${pad(month + 1)}-${pad(day)}`;
  }

  // Alle lessen van de week die in de agenda staat, met datum
  function getWeekLessons(doc, today = new Date()) {
    const startHour = parseHour(doc.querySelector(".agenda--time li")?.textContent);
    const styleText = Array.from(doc.querySelectorAll("style")).map((s) => s.textContent).join("\n");
    const days = [];
    const lessons = [];
    doc.querySelectorAll(".agenda--day").forEach((day) => {
      const date = parseDayLabel(day.querySelector(".lead")?.textContent, today);
      if (!date) return;
      days.push(date);
      day.querySelectorAll("li.agenda--course, li.agenda--appointment, li.agenda--bpv").forEach((li) => {
        const lesson = lessonFromElement(li, startHour, styleText);
        if (lesson.start != null && lesson.end != null) lessons.push({ ...lesson, date });
      });
    });
    days.sort();
    return { from: days[0] || null, to: days[days.length - 1] || null, lessons };
  }

  function lessonDate(date, hours) {
    const [y, m, d] = date.split("-").map(Number);
    const minutes = Math.round(hours * 60);
    return new Date(y, m - 1, d, Math.floor(minutes / 60), minutes % 60);
  }

  function lessonKey(lesson) {
    return `${lesson.date}|${formatTime(lesson.start)}|${formatTime(lesson.end)}|${lesson.subject}`;
  }

  function icsDate(date) {
    return date.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
  }

  function icsText(value) {
    return String(value || "").replace(/\\/g, "\\\\").replace(/[;,]/g, (c) => `\\${c}`).replace(/\r?\n/g, "\\n");
  }

  // iCalendar-bestand dat Outlook, Google Agenda en Apple Agenda kunnen importeren
  function toIcs(lessons, now = new Date()) {
    const lines = [
      "BEGIN:VCALENDAR",
      "VERSION:2.0",
      "PRODID:-//Eduarte Tools//Rooster//NL",
      "CALSCALE:GREGORIAN",
      "METHOD:PUBLISH",
      "X-WR-CALNAME:Eduarte rooster",
    ];
    lessons.forEach((lesson) => {
      const hash = Array.from(lessonKey(lesson)).reduce((h, ch) => (h * 31 + ch.charCodeAt(0)) >>> 0, 7);
      lines.push(
        "BEGIN:VEVENT",
        `UID:${lesson.date}-${hash.toString(36)}@eduarte-tools`,
        `DTSTAMP:${icsDate(now)}`,
        `DTSTART:${icsDate(lessonDate(lesson.date, lesson.start))}`,
        `DTEND:${icsDate(lessonDate(lesson.date, lesson.end))}`,
        `SUMMARY:${icsText(lesson.title)}`,
        `LOCATION:${icsText(lesson.location)}`,
        `DESCRIPTION:${icsText([lesson.subject, lesson.participants && `Docent: ${lesson.participants}`].filter(Boolean).join("\n"))}`,
        "CATEGORIES:Eduarte rooster",
        "END:VEVENT",
      );
    });
    lines.push("END:VCALENDAR");
    return lines.join("\r\n") + "\r\n";
  }

  function downloadIcs(doc, week) {
    const blob = new Blob([toIcs(week.lessons)], { type: "text/calendar;charset=utf-8" });
    const link = doc.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `rooster-${week.from || "week"}.ics`;
    doc.body.appendChild(link);
    link.click();
    link.remove();
    setTimeout(() => URL.revokeObjectURL(link.href), 1000);
  }

  // Stuurt een week naar de achtergrond, die hem in je persoonlijke agenda-link zet
  function sendWeekToCalendar(week) {
    if (!week.from || typeof chrome === "undefined" || !chrome.runtime?.sendMessage) return Promise.resolve(null);
    const payload = {
      from: lessonDate(week.from, 0).toISOString(),
      to: lessonDate(week.to, 24).toISOString(),
      lessons: week.lessons.map((l) => ({
        title: l.title,
        subject: l.subject,
        location: l.location,
        participants: l.participants,
        start: lessonDate(l.date, l.start).toISOString(),
        end: lessonDate(l.date, l.end).toISOString(),
      })),
    };
    return new Promise((resolve) => {
      chrome.runtime.sendMessage({ type: "CALENDAR_SYNC_WEEK", week: payload }, (res) => {
        if (chrome.runtime.lastError) resolve({ success: false, error: chrome.runtime.lastError.message });
        else resolve(res);
      });
    });
  }

  // Knoppen "Download .ics" en "Sync agenda" in de filterbalk van de agenda
  function addCalendarButtons(doc) {
    const bar = doc.querySelector(".agenda-filter .filter--inner");
    if (!bar || bar.querySelector(".et-cal-actions")) return;
    const wrap = doc.createElement("div");
    wrap.className = "et-cal-actions";
    wrap.innerHTML = `
      <style>
        .et-cal-actions { display: flex; align-items: center; gap: 8px; margin-left: auto; }
        .et-cal-actions button {
          display: inline-flex; align-items: center; gap: 7px; height: 36px; padding: 0 14px;
          border: 1px solid color-mix(in srgb, var(--color-text-primary, #fff) 12%, transparent); border-radius: 10px;
          background: var(--color-bg-surface, #14171f); color: var(--color-text-primary, #fff);
          font: 600 13px/1 inherit; white-space: nowrap; cursor: pointer;
        }
        .et-cal-actions button:hover { border-color: var(--color-bg-fill-action, #ff7a59); }
        .et-cal-actions button.is-primary { border-color: transparent; background: var(--color-bg-fill-action, #ff7a59); color: #fff; }
        .et-cal-actions svg { width: 16px; height: 16px; fill: none; stroke: currentColor; stroke-width: 2; stroke-linecap: round; stroke-linejoin: round; }
        .et-cal-status { color: color-mix(in srgb, var(--color-text-primary, #fff) 60%, transparent); font-size: 12px; white-space: nowrap; }
      </style>
      <span class="et-cal-status" role="status"></span>
      <button type="button" class="et-cal-ics" title="Download deze week als .ics voor Outlook, Google of Apple Agenda">
        <svg viewBox="0 0 24 24"><path d="M12 3v12M7 10l5 5 5-5M5 21h14"/></svg>.ics
      </button>
      <button type="button" class="et-cal-sync is-primary" title="Zet deze week in je agenda-link (Outlook, Google, Apple)">
        <svg viewBox="0 0 24 24"><rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/></svg>Sync agenda
      </button>`;
    bar.appendChild(wrap);
    const status = wrap.querySelector(".et-cal-status");
    wrap.querySelector(".et-cal-ics").addEventListener("click", () => downloadIcs(doc, getWeekLessons(doc)));
    wrap.querySelector(".et-cal-sync").addEventListener("click", async () => {
      status.textContent = "Synchroniseren…";
      const res = await sendWeekToCalendar(getWeekLessons(doc));
      status.textContent = res?.success
        ? `${res.lessons} lessen in je agenda gezet`
        : (res?.error || "Sync mislukt");
    });
  }

  // Automatisch bijwerken: elke keer dat je Eduarte opent (hooguit eens per uur) en bij elke week die je in de agenda bekijkt
  function autoSync(doc) {
    chrome.storage.local.get(["eduarteCalendarFeed", "eduarteCalendarLastSync"], (s) => {
      if (!s.eduarteCalendarFeed) return;
      if (/^\/agenda/i.test(location.pathname)) {
        let lastSignature = "";
        const syncVisibleWeek = () => {
          const week = getWeekLessons(doc);
          const signature = JSON.stringify(week);
          if (!week.from || signature === lastSignature) return;
          lastSignature = signature;
          sendWeekToCalendar(week);
        };
        syncVisibleWeek();
        new doc.defaultView.MutationObserver(() => setTimeout(syncVisibleWeek, 500))
          .observe(doc.querySelector(".agenda") || doc.body, { childList: true, subtree: true });
      } else if (Date.now() - (s.eduarteCalendarLastSync || 0) > 60 * 60 * 1000) {
        fetchAgendaDocument().then((agendaDoc) => sendWeekToCalendar(getWeekLessons(agendaDoc))).catch(() => {});
      }
    });
  }

  // Net een agenda-link gemaakt terwijl Eduarte al open stond: meteen de week versturen
  function syncWhenLinkCreated(doc) {
    chrome.storage.onChanged.addListener((changes, area) => {
      const change = changes.eduarteCalendarFeed;
      if (area !== "local" || !change?.newValue || change.oldValue?.id === change.newValue.id) return;
      const week = /^\/agenda/i.test(location.pathname) ? Promise.resolve(getWeekLessons(doc)) : fetchAgendaDocument().then(getWeekLessons);
      week.then(sendWeekToCalendar).catch(() => {});
    });
  }

  // Maakt het weekrooster compacter (64px per uur) en zet korte lesnamen + tijden in de blokken
  function enhanceAgenda(doc) {
    const agenda = doc.querySelector(".agenda");
    if (!agenda) return;
    const view = doc.defaultView;
    const scale = COMPACT_HOUR_PX / SOURCE_HOUR_PX;
    const startHour = parseHour(agenda.querySelector(".agenda--time li")?.textContent);

    agenda.querySelectorAll(".agenda--day li.agenda--course, .agenda--day li.agenda--appointment, .agenda--day li.agenda--bpv").forEach((el) => {
      if (!el.dataset.etTop) {
        const cs = view.getComputedStyle(el);
        const top = parseFloat(cs.top);
        if (!Number.isFinite(top)) return;
        el.dataset.etTop = String(top);
        el.dataset.etHeight = String(parseFloat(cs.height) || 0);
      }
      el.style.setProperty("top", `${Number(el.dataset.etTop) * scale}px`, "important");
      el.style.setProperty("height", `${Number(el.dataset.etHeight) * scale}px`, "important");
      el.classList.toggle("et-short-lesson", Number(el.dataset.etHeight) * scale < 56);

      if (!el.dataset.etShort) {
        const subjectEl = el.querySelector(".is-subject");
        if (!subjectEl) return;
        const lesson = lessonFromElement(el, startHour, "");
        el.dataset.etShort = "1";
        subjectEl.title = lesson.subject;
        subjectEl.textContent = lesson.title;
        el.style.setProperty("--et-course", courseColor(lesson.title));

        // Twee regels: "BUCO 08:45 – 10:15" en "ka210 · cschm", zodat ook korte lessen leesbaar blijven
        const head = doc.createElement("span");
        head.className = "et-lesson-head";
        subjectEl.before(head);
        head.appendChild(subjectEl);
        if (lesson.start != null && lesson.end != null) {
          const time = doc.createElement("span");
          time.className = "et-agenda-time";
          time.textContent = `${formatTime(lesson.start)} – ${formatTime(lesson.end)}`;
          head.appendChild(time);
        }
        const meta = doc.createElement("span");
        meta.className = "et-lesson-meta";
        meta.textContent = [lesson.location, lesson.participants].filter(Boolean).join(" · ");
        meta.title = meta.textContent;
        head.after(meta);
        el.title = [lesson.subject, `${formatTime(lesson.start)} – ${formatTime(lesson.end)}`, meta.textContent].join("\n");
      }
    });

    agenda.querySelectorAll(".agenda--day > ul").forEach((ul) => {
      if (!ul.dataset.etHeight) ul.dataset.etHeight = String(ul.getBoundingClientRect().height || parseFloat(view.getComputedStyle(ul).height) || 0);
      ul.style.setProperty("height", `${Number(ul.dataset.etHeight) * scale}px`, "important");
    });

    placeNowLine(doc, startHour);
  }

  // De rode "nu"-lijn zelf neerzetten: Eduarte rekent met 108px per uur en zijn eigen kopruimte
  function placeNowLine(doc, startHour) {
    const hr = doc.querySelector(".agenda--present-time");
    const ul = doc.querySelector(".agenda--day.is-today > ul") || doc.querySelector(".agenda--day > ul");
    if (!hr || !ul) return;
    const parent = hr.offsetParent || hr.parentElement;
    const now = new Date();
    const hours = now.getHours() + now.getMinutes() / 60 - startHour;
    const maxHours = (parseFloat(ul.style.height) || ul.getBoundingClientRect().height) / COMPACT_HOUR_PX;
    if (hours < 0 || hours > maxHours) {
      hr.style.setProperty("display", "none", "important");
      return;
    }
    const offset = ul.getBoundingClientRect().top - parent.getBoundingClientRect().top - parent.clientTop;
    hr.style.removeProperty("display");
    hr.style.setProperty("top", `${offset + hours * COMPACT_HOUR_PX}px`, "important");
  }

  function watchAgenda(doc) {
    let queued = false;
    const run = () => {
      queued = false;
      observer.disconnect();
      enhanceAgenda(doc);
      observer.observe(doc.body, { childList: true, subtree: true });
    };
    const observer = new doc.defaultView.MutationObserver(() => {
      if (queued) return;
      queued = true;
      doc.defaultView.requestAnimationFrame(run);
    });
    run();
    doc.defaultView.setInterval(() => {
      const agenda = doc.querySelector(".agenda");
      if (agenda) placeNowLine(doc, parseHour(agenda.querySelector(".agenda--time li")?.textContent));
    }, 60 * 1000);
  }

  if (typeof document !== "undefined" && typeof chrome !== "undefined" && chrome.storage?.local) {
    chrome.storage.local.get(["eduarteCompactAgenda"], (s) => {
      if (!/^\/agenda/i.test(location.pathname)) return;
      if (s.eduarteCompactAgenda !== false) {
        document.documentElement.classList.add("et-compact-agenda");
        watchAgenda(document);
      }
      addCalendarButtons(document);
      new MutationObserver(() => addCalendarButtons(document)).observe(document.body, { childList: true, subtree: true });
    });
    autoSync(document);
    syncWhenLinkCreated(document);
  }

  return {
    COMPACT_HOUR_PX,
    shortenSubject,
    courseColor,
    formatTime,
    parseDayLabel,
    getTodayLessons,
    getWeekLessons,
    fetchAgendaDocument,
    fetchTodayLessons,
    lessonDate,
    lessonKey,
    toIcs,
    enhanceAgenda,
  };
});
