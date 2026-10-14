// Eduarte Tools - auto login content script (v2.1.4)
//
// Detects WHAT KIND of login page it is looking at from the page's HTML
// (ADFS, Microsoft account picker / email / password / "stay signed in",
// or a generic username+password form) instead of relying on the domain,
// then fills it in and optionally submits it. Microsoft's login is a
// single-page app that swaps screens without navigating, so everything is
// polled for a while and each *step* is only submitted a limited number of
// times (prevents loops on a wrong password).

(function () {
  const STORE = ["eduarteUsername", "eduartePassword", "eduarteEnabled", "eduarteAutosubmit"];
  const POLL_MS = 400;
  const MAX_WATCH_MS = 60000;
  const MAX_ATTEMPTS_PER_STEP = 2;

  const host = location.hostname;
  const onEduarte = /(^|\.)(educus|eduarte)\.nl$/.test(host);

  // ---------- helpers ----------
  const visible = (el) => !!el && !el.disabled && (el.offsetParent !== null || getComputedStyle(el).position === "fixed");
  const q = (sel) => document.querySelector(sel);
  const qv = (...sels) => {
    for (const s of sels) {
      for (const el of document.querySelectorAll(s)) if (visible(el)) return el;
    }
    return null;
  };

  function setValue(el, value) {
    const setter = Object.getOwnPropertyDescriptor(Object.getPrototypeOf(el), "value")?.set;
    if (setter) setter.call(el, value); else el.value = value;
    el.dispatchEvent(new Event("input", { bubbles: true }));
    el.dispatchEvent(new Event("change", { bubbles: true }));
  }

  function errorShown() {
    const el = q("#passwordError, #usernameError, #errorText, #error, .error-text");
    return !!(el && el.textContent.trim() && visible(el));
  }

  function attempt(step) {
    const key = "eduarteAL:" + step;
    const n = Number(sessionStorage.getItem(key) || 0);
    if (n >= MAX_ATTEMPTS_PER_STEP) return false;
    sessionStorage.setItem(key, String(n + 1));
    return true;
  }

  // Click the submit button of the same form as `field`; fall back only to
  // known login button IDs, never to a random submit button on the page.
  function submit(field, extraSelectors = []) {
    const ids = ["#idSIButton9", "#submitButton", "#username_submit", ...extraSelectors];
    let btn = null;
    const form = field && field.closest("form");
    if (form) {
      btn = [...form.querySelectorAll('input[type="submit"], button[type="submit"], button:not([type])')].find(visible) || null;
    }
    if (!btn) btn = qv(...ids);
    if (btn) setTimeout(() => btn.click(), 250);
    else if (form) setTimeout(() => (form.requestSubmit ? form.requestSubmit() : form.submit()), 250);
  }

  // ---------- page-type detection (from the HTML) ----------
  function detect() {
    const pw = qv("#passwordInput", "#i0118", 'input[name="passwd"]', 'input[name="Password"]', 'input[type="password"]');
    const user = qv("#userNameInput", "#i0116", 'input[name="loginfmt"]', 'input[name="UserName"]',
                    'input[type="email"]', 'input[autocomplete="username"]', 'input[name*="user" i]', 'input[name*="login" i]');

    // Microsoft "Pick an account" tiles
    const tiles = [...document.querySelectorAll("div.table[data-test-id], [data-test-id][role='button']")].filter(visible);
    if (tiles.length && !pw && !user) return { type: "picker", tiles };

    // Microsoft "Stay signed in?" prompt
    if (q("#KmsiDescription, #KmsiCheckboxField") && qv("#idSIButton9")) return { type: "kmsi" };

    if (pw && user && pw !== user) {
      return { type: (q("#userNameInput") ? "adfs" : "combined"), user, pw };
    }
    if (pw) return { type: "password", pw };
    if (user) return { type: "username", user };
    return null;
  }

  function run(data) {
    if (errorShown()) return;
    const found = detect();
    if (!found) return;

    // On Eduarte/Educus itself, only act on a real password login form.
    if (onEduarte && !found.pw) return;

    const auto = !!data.eduarteAutosubmit;

    switch (found.type) {
      case "picker": {
        const wanted = String(data.eduarteUsername).toLowerCase();
        const tile = found.tiles.find((t) => (t.getAttribute("data-test-id") || "").toLowerCase() === wanted);
        if (tile && auto && attempt("picker")) setTimeout(() => tile.click(), 250);
        break;
      }
      case "kmsi": {
        if (auto && attempt("kmsi")) setTimeout(() => q("#idSIButton9")?.click(), 250);
        break;
      }
      case "username": {
        if (!found.user.value) setValue(found.user, data.eduarteUsername);
        if (auto && found.user.value && attempt("username")) submit(found.user);
        break;
      }
      case "password": {
        if (!data.eduartePassword) break;
        if (!found.pw.value) setValue(found.pw, data.eduartePassword);
        if (auto && found.pw.value && attempt("password")) submit(found.pw);
        break;
      }
      case "adfs":
      case "combined": {
        if (!found.user.value) setValue(found.user, data.eduarteUsername);
        if (data.eduartePassword && !found.pw.value) setValue(found.pw, data.eduartePassword);
        if (auto && found.user.value && found.pw.value && attempt("combined")) submit(found.pw);
        break;
      }
    }
  }

  // ---------- main ----------
  chrome.storage.local.get(STORE, (data) => {
    if (!data || !data.eduarteEnabled || !data.eduarteUsername) return;

    const started = Date.now();
    const tick = () => {
      if (Date.now() - started > MAX_WATCH_MS) return clearInterval(timer);
      try { run(data); } catch (e) { /* page mid-render; try again next tick */ }
    };
    const timer = setInterval(tick, POLL_MS);
    tick();
  });
})();
