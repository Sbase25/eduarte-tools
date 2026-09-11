// Eduarte Auto Login - content script
// Fills Eduarte/ADFS login forms (and the Microsoft
// login.microsoftonline.com flow they can redirect through) with saved
// credentials, and optionally submits them.

(function () {
  const ONE_SUBMIT_KEY = "eduarteAutoLoginSubmitted";

  // Candidate selectors, in priority order, for ADFS's default forms-auth
  // template and Microsoft's login page.
  const USERNAME_SELECTORS = [
    "#userNameInput",
    'input[name="UserName"]',
    "#i0116",
    'input[name="loginfmt"]',
    'input[type="email"]',
  ];
  const PASSWORD_SELECTORS = [
    "#passwordInput",
    'input[name="Password"]',
    "#i0118",
    'input[name="passwd"]',
    'input[type="password"]',
  ];
  const SUBMIT_SELECTORS = [
    "#submitButton",
    "#idSIButton9",
    'input[type="submit"]',
    'button[type="submit"]',
  ];

  function firstVisible(selectors) {
    for (const sel of selectors) {
      const el = document.querySelector(sel);
      if (el && el.offsetParent !== null) return el;
    }
    return null;
  }

  function setValue(el, value) {
    const proto = Object.getPrototypeOf(el);
    const setter = Object.getOwnPropertyDescriptor(proto, "value")?.set;
    if (setter) {
      setter.call(el, value);
    } else {
      el.value = value;
    }
    el.dispatchEvent(new Event("input", { bubbles: true }));
    el.dispatchEvent(new Event("change", { bubbles: true }));
  }

  function alreadySubmittedThisPage() {
    // Reset the guard once per navigation using the URL as key, so a fresh
    // login attempt after a redirect isn't blocked, but we don't loop-submit
    // the same failed page repeatedly.
    const key = ONE_SUBMIT_KEY + ":" + location.href;
    if (sessionStorage.getItem(key)) return true;
    sessionStorage.setItem(key, "1");
    return false;
  }

  chrome.storage.local.get(
    ["eduarteUsername", "eduartePassword", "eduarteEnabled", "eduarteAutosubmit"],
    (data) => {
      if (!data.eduarteEnabled) return;
      if (!data.eduarteUsername) return;

      const run = () => {
        const usernameEl = firstVisible(USERNAME_SELECTORS);
        const passwordEl = firstVisible(PASSWORD_SELECTORS);

        // Two-step Microsoft flow: only a username/email field on this
        // screen (password comes on the next page).
        if (usernameEl && !passwordEl) {
          if (usernameEl.value) return;
          setValue(usernameEl, data.eduarteUsername);
          if (data.eduarteAutosubmit && !alreadySubmittedThisPage()) {
            const submitEl = firstVisible(SUBMIT_SELECTORS);
            if (submitEl) setTimeout(() => submitEl.click(), 150);
          }
          return;
        }

        // Standard ADFS page: username + password together.
        if (usernameEl && passwordEl) {
          if (!usernameEl.value) setValue(usernameEl, data.eduarteUsername);
          if (!passwordEl.value && data.eduartePassword) {
            setValue(passwordEl, data.eduartePassword);
          }
          if (data.eduarteAutosubmit && !alreadySubmittedThisPage()) {
            const submitEl = firstVisible(SUBMIT_SELECTORS);
            if (submitEl) setTimeout(() => submitEl.click(), 150);
          }
          return;
        }

        // Password-only screen (Microsoft flow, second step).
        if (!usernameEl && passwordEl && data.eduartePassword) {
          if (passwordEl.value) return;
          setValue(passwordEl, data.eduartePassword);
          if (data.eduarteAutosubmit && !alreadySubmittedThisPage()) {
            const submitEl = firstVisible(SUBMIT_SELECTORS);
            if (submitEl) setTimeout(() => submitEl.click(), 150);
          }
        }
      };

      // The ADFS/MS pages render fast, but give the DOM a brief moment,
      // then also retry via a short observer in case fields render late.
      if (document.readyState === "complete" || document.readyState === "interactive") {
        run();
      } else {
        document.addEventListener("DOMContentLoaded", run, { once: true });
      }

      const observer = new MutationObserver(() => run());
      observer.observe(document.documentElement, { childList: true, subtree: true });
      setTimeout(() => observer.disconnect(), 8000);
    }
  );
})();
