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
    const subject = text(".is-subject");
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

  function fetchTodayLessons() {
    return fetch("/agenda", { credentials: "same-origin" })
      .then((res) => (res.ok ? res.text() : Promise.reject(new Error(`HTTP ${res.status}`))))
      .then((html) => getTodayLessons(new DOMParser().parseFromString(html, "text/html")));
  }

  // Maakt het weekrooster compacter (64px per uur) en zet korte lesnamen + tijden in de blokken
  function enhanceAgenda(doc) {
    const agenda = doc.querySelector(".agenda");
    if (!agenda) return;
    const view = doc.defaultView;
    const scale = COMPACT_HOUR_PX / SOURCE_HOUR_PX;
    const startHour = parseHour(agenda.querySelector(".agenda--time li")?.textContent);

    agenda.querySelectorAll(".agenda--day li.agenda--course, .agenda--day li.agenda--appointment, .agenda--day li.agenda--bpv, .agenda--present-time").forEach((el) => {
      if (!el.dataset.etTop) {
        const cs = view.getComputedStyle(el);
        const top = parseFloat(cs.top);
        if (!Number.isFinite(top)) return;
        el.dataset.etTop = String(top);
        el.dataset.etHeight = String(parseFloat(cs.height) || 0);
      }
      el.style.setProperty("top", `${Number(el.dataset.etTop) * scale}px`, "important");
      if (!el.matches("hr")) {
        el.style.setProperty("height", `${Number(el.dataset.etHeight) * scale}px`, "important");
      }

      if (el.matches("li") && !el.dataset.etShort) {
        const subjectEl = el.querySelector(".is-subject");
        if (!subjectEl) return;
        const lesson = lessonFromElement(el, startHour, "");
        el.dataset.etShort = "1";
        subjectEl.title = lesson.subject;
        subjectEl.textContent = lesson.title;
        el.style.setProperty("--et-course", courseColor(lesson.title));
        if (lesson.start != null && lesson.end != null) {
          const time = doc.createElement("span");
          time.className = "et-agenda-time";
          time.textContent = `${formatTime(lesson.start)} – ${formatTime(lesson.end)}`;
          subjectEl.after(time);
        }
      }
    });

    agenda.querySelectorAll(".agenda--day > ul").forEach((ul) => {
      if (!ul.dataset.etHeight) ul.dataset.etHeight = String(ul.getBoundingClientRect().height || parseFloat(view.getComputedStyle(ul).height) || 0);
      ul.style.setProperty("height", `${Number(ul.dataset.etHeight) * scale}px`, "important");
    });
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
  }

  if (typeof document !== "undefined" && typeof chrome !== "undefined" && chrome.storage?.local) {
    chrome.storage.local.get(["eduarteCompactAgenda"], (s) => {
      if (s.eduarteCompactAgenda === false) return;
      if (/^\/agenda/i.test(location.pathname)) {
        document.documentElement.classList.add("et-compact-agenda");
        watchAgenda(document);
      }
    });
  }

  return {
    COMPACT_HOUR_PX,
    shortenSubject,
    courseColor,
    formatTime,
    getTodayLessons,
    fetchTodayLessons,
    enhanceAgenda,
  };
});
