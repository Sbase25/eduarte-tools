// Eduarte Tools - notifications.js
// Meldingen van Eduarte Tools zelf: nieuwe presentie-registraties (aanwezig,
// afwezig, ziek gemeld, te laat) en nieuwe cijfers. De extensie vergelijkt wat Eduarte nu
// toont met wat ze de vorige keer zag; wat erbij is gekomen wordt een melding.
// Pure logica (testbaar met Vitest); overlay.js regelt het ophalen en de weergave.

(function (root, factory) {
  const api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  else root.EduarteNotifications = api;
})(globalThis, function () {
  const MAX_NOTIFICATIONS = 30;
  const MAX_SEEN_KEYS = 600;
  const LESSON_SELECTOR = "li.agenda--course, li.agenda--appointment, li.agenda--bpv";
  const PRESENCE_SELECTOR = ".agenda-presentie-icon, .is-presence, .agenda-presence-icon";

  const clean = (value) => String(value ?? "").replace(/\s+/g, " ").trim();

  // Leest de status uit alles wat Eduarte bij het presentie-icoon meegeeft (title, aria-label,
  // class, tekst). Onbekend blijft "geregistreerd": dan weten we alleen dát er iets staat.
  function presenceStatus(text) {
    const value = clean(text).toLowerCase();
    if (/te\s*laat|telaat|\blate\b|verlaat/.test(value)) return "te laat";
    if (/ongeoorloofd/.test(value)) return "ongeoorloofd afwezig";
    if (/geoorloofd/.test(value)) return "geoorloofd afwezig";
    if (/ziek|\bill\b|sick/.test(value)) return "ziek gemeld";
    if (/afwezig|absent|absence|verzuim/.test(value)) return "afwezig";
    if (/aanwezig|present\b|presence-present|is-present/.test(value)) return "aanwezig";
    return "geregistreerd";
  }

  function describeElement(el) {
    const parts = [];
    [el, ...el.querySelectorAll("*")].forEach((node) => {
      parts.push(node.getAttribute("title"), node.getAttribute("aria-label"), node.getAttribute("data-original-title"), node.getAttribute("class"));
    });
    parts.push(el.textContent);
    return clean(parts.filter(Boolean).join(" "));
  }

  // Presentie per les uit het weekrooster: elke les met een presentie-icoon.
  function presenceFromAgenda(doc, Agenda, today = new Date()) {
    if (!doc || !Agenda) return [];
    const startHour = Agenda.parseHour(doc.querySelector(".agenda--time li")?.textContent);
    const styleText = Array.from(doc.querySelectorAll("style")).map((style) => style.textContent).join("\n");
    const items = [];
    doc.querySelectorAll(".agenda--day").forEach((day) => {
      const date = Agenda.parseDayLabel(day.querySelector(".lead")?.textContent, today);
      if (!date) return;
      day.querySelectorAll(LESSON_SELECTOR).forEach((li) => {
        const icon = li.querySelector(PRESENCE_SELECTOR);
        if (!icon) return;
        const lesson = Agenda.lessonFromElement(li, startHour, styleText);
        if (lesson.start == null) return;
        const status = presenceStatus(describeElement(icon));
        const time = Agenda.formatTime(lesson.start);
        items.push({
          key: `presence|${date}|${time}|${lesson.title}|${status}`,
          kind: "presence",
          status,
          title: lesson.title,
          date,
          time,
        });
      });
    });
    return items;
  }

  // Presentie per les van de pagina Presentie (overzicht van de week). Opbouw op het portaal:
  //   .student-absence--day > .student-absence--day-title ("ma")
  //     .student-absence--hour > .student-absence--course
  //       small.student-absence--reported  ("Gemeld op … door student / Geoorloofd, afgehandeld")
  //       p > strong                       ("Aanwezig", "Niet geregistreerd", "Ziekmelding door deelnemer (8:45 - 9:15)")
  //       small                            ("8:45 - 10:15 ka210-BUCO-H1ONICT1A-cschm - mevr. …")
  // Elk lesuur staat er apart in; uren van dezelfde les met dezelfde status worden één item.
  // "Niet geregistreerd" telt niet mee: zodra de docent iets invult, verschijnt er een nieuw item.
  const DAY_INDEX = { ma: 0, di: 1, wo: 2, do: 3, vr: 4, za: 5, zo: 6 };

  function presenceFromPresencePage(doc) {
    if (!doc) return [];
    const header = clean(doc.querySelector(".abstract-absentie-page .week-header, .week-header")?.textContent);
    const start = /(\d{2})-(\d{2})-(\d{4})/.exec(header);
    const monday = start ? new Date(Number(start[3]), Number(start[2]) - 1, Number(start[1])) : null;
    const seen = new Set();
    const items = [];
    doc.querySelectorAll(".student-absence--day").forEach((day) => {
      const dayTitle = clean(day.querySelector(".student-absence--day-title")?.textContent).toLowerCase();
      const offset = DAY_INDEX[dayTitle.slice(0, 2)];
      let date = dayTitle;
      if (monday && offset != null) {
        const value = new Date(monday.getFullYear(), monday.getMonth(), monday.getDate() + offset);
        date = `${value.getFullYear()}-${String(value.getMonth() + 1).padStart(2, "0")}-${String(value.getDate()).padStart(2, "0")}`;
      }
      day.querySelectorAll(".student-absence--course").forEach((course) => {
        const raw = clean(course.querySelector("strong")?.textContent) || clean(course.querySelector("p")?.textContent);
        // "(8:45 - 9:15)" achter de status is het tijdvak van dat ene lesuur
        const label = raw.replace(/\s*\(\d{1,2}:\d{2}\s*-\s*\d{1,2}:\d{2}\)\s*$/, "");
        if (!label || /niet\s+geregistreerd/i.test(label)) return;
        const detail = clean([...course.querySelectorAll("small")].filter((small) => !small.classList.contains("student-absence--reported")).pop()?.textContent);
        const lesson = /^(\d{1,2}:\d{2})\s*-\s*(\d{1,2}:\d{2})\s+(.*)$/.exec(detail);
        const time = lesson ? `${lesson[1]}–${lesson[2]}` : "";
        const code = (lesson ? lesson[3] : detail).split(" - ")[0];
        const parts = code.split("-");
        const subject = clean(parts.length > 1 ? parts[1] : code) || "les";
        const known = presenceStatus(label);
        const status = known === "geregistreerd" ? label.toLowerCase() : known;
        const key = `presence|${date}|${time}|${subject}|${status}`;
        if (seen.has(key)) return;
        seen.add(key);
        const reported = clean(course.querySelector(".student-absence--reported")?.textContent);
        items.push({ key, kind: "presence", status, label, title: subject, date, time, details: /ongeoorloofd/i.test(reported) ? "ongeoorloofd" : (/geoorloofd/i.test(reported) ? "geoorloofd" : "") });
      });
    });
    return items;
  }

  function gradesFromDocument(doc, EduarteApi) {
    if (!doc || !EduarteApi) return [];
    return EduarteApi.getGrades(doc).map((grade) => ({
      key: `grade|${grade.title}|${grade.result}`,
      kind: "grade",
      title: grade.title,
      result: grade.result,
    }));
  }

  const number = (value) => Number(value).toLocaleString("nl-NL", { minimumFractionDigits: 1, maximumFractionDigits: 2 });

  function dayText(date) {
    const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(date || "");
    if (!match) return clean(date);
    const value = new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]));
    return new Intl.DateTimeFormat("nl-NL", { weekday: "short", day: "numeric", month: "short" }).format(value);
  }

  // Maakt van een gevonden item de melding zoals die in de lijst komt te staan.
  function toNotification(item, now = Date.now()) {
    const when = [dayText(item.date), item.time].filter(Boolean).join(" ");
    if (item.kind === "grade") {
      return { id: item.key, kind: "grade", title: `Nieuw cijfer: ${number(item.result)}`, text: item.title, href: "/resultaten", at: now, read: false };
    }
    const bad = /afwezig|laat|ziek|verzuim/.test(item.status);
    const title = item.status === "aanwezig" ? `Je staat op aanwezig: ${item.title}`
      : item.status === "ziek gemeld" ? `Ziek gemeld: ${item.title}`
      : item.status === "geregistreerd" ? `Presentie geregistreerd: ${item.title}`
      : `Je staat op ${item.status}: ${item.title}`;
    return {
      id: item.key, kind: "presence", title,
      text: [when, item.details].filter(Boolean).join(" · "), href: "/presentie", at: now, read: false, tone: bad ? "warn" : "ok",
    };
  }

  // Vergelijkt de gevonden items met wat al gezien is.
  // De eerste keer per soort wordt alles alleen onthouden (geen stortvloed aan meldingen).
  function diff(state, kind, items) {
    const previous = state?.[kind];
    const keys = items.map((item) => item.key);
    const seen = new Set(Array.isArray(previous) ? previous : []);
    const created = Array.isArray(previous) ? items.filter((item) => !seen.has(item.key)) : [];
    keys.forEach((key) => seen.add(key));
    return { state: { ...(state || {}), [kind]: [...seen].slice(-MAX_SEEN_KEYS) }, created };
  }

  function addNotifications(list, created) {
    const existing = Array.isArray(list) ? list : [];
    const ids = new Set(existing.map((item) => item.id));
    const fresh = created.filter((item) => !ids.has(item.id));
    return [...fresh, ...existing].slice(0, MAX_NOTIFICATIONS);
  }

  const unreadCount = (list) => (Array.isArray(list) ? list.filter((item) => item && !item.read).length : 0);
  const markAllRead = (list) => (Array.isArray(list) ? list.map((item) => ({ ...item, read: true })) : []);

  function timeAgo(at, now = Date.now()) {
    const minutes = Math.max(0, Math.round((now - at) / 60000));
    if (minutes < 1) return "zojuist";
    if (minutes < 60) return `${minutes} min geleden`;
    const hours = Math.round(minutes / 60);
    if (hours < 24) return `${hours} uur geleden`;
    const days = Math.round(hours / 24);
    return days === 1 ? "gisteren" : `${days} dagen geleden`;
  }

  return {
    MAX_NOTIFICATIONS,
    presenceStatus,
    presenceFromAgenda,
    presenceFromPresencePage,
    gradesFromDocument,
    toNotification,
    diff,
    addNotifications,
    unreadCount,
    markAllRead,
    timeAgo,
  };
});
