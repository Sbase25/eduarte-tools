// Eduarte Tools - outlook-sync.js
// Zet het Eduarte-rooster in je Outlook-agenda via Microsoft Graph en houdt het bij.
// Wordt geladen in de achtergrond (service worker in Chrome, achtergrondpagina in Firefox).

(function (root, factory) {
  const api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  else root.EduarteOutlook = api;
})(globalThis, function () {
  const AUTHORITY = "https://login.microsoftonline.com/common/oauth2/v2.0";
  const SCOPE = "offline_access openid profile Calendars.ReadWrite";
  const CATEGORY = "Eduarte rooster";
  const AUTH_KEY = "eduarteOutlookAuth";

  function storageGet(keys) {
    return new Promise((resolve) => chrome.storage.local.get(keys, resolve));
  }

  function storageSet(values) {
    return new Promise((resolve) => chrome.storage.local.set(values, resolve));
  }

  function base64Url(bytes) {
    return btoa(String.fromCharCode(...new Uint8Array(bytes))).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
  }

  async function pkcePair() {
    const verifier = base64Url(crypto.getRandomValues(new Uint8Array(48)));
    const challenge = base64Url(await crypto.subtle.digest("SHA-256", new TextEncoder().encode(verifier)));
    return { verifier, challenge };
  }

  function redirectUrl() {
    return chrome.identity.getRedirectURL();
  }

  function launchWebAuthFlow(url, interactive) {
    return new Promise((resolve, reject) => {
      chrome.identity.launchWebAuthFlow({ url, interactive }, (responseUrl) => {
        const error = chrome.runtime.lastError;
        if (error || !responseUrl) reject(new Error(error?.message || "Inloggen bij Microsoft is afgebroken."));
        else resolve(responseUrl);
      });
    });
  }

  async function requestToken(clientId, params) {
    const res = await fetch(`${AUTHORITY}/token`, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({ client_id: clientId, scope: SCOPE, ...params }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error_description?.split("\r\n")[0] || data.error || `Token-fout ${res.status}`);
    let account = "";
    try {
      const claims = JSON.parse(atob(data.id_token.split(".")[1].replace(/-/g, "+").replace(/_/g, "/")));
      account = claims.preferred_username || claims.email || claims.name || "";
    } catch { /* geen id_token bij verversen */ }
    const auth = {
      accessToken: data.access_token,
      refreshToken: data.refresh_token,
      expiresAt: Date.now() + (data.expires_in - 120) * 1000,
    };
    const stored = await storageGet([AUTH_KEY, "eduarteOutlookAccount"]);
    await storageSet({
      [AUTH_KEY]: { ...stored[AUTH_KEY], ...auth },
      eduarteOutlookAccount: account || stored.eduarteOutlookAccount || "",
    });
    return auth.accessToken;
  }

  async function authorize(clientId, interactive) {
    const { verifier, challenge } = await pkcePair();
    const state = base64Url(crypto.getRandomValues(new Uint8Array(16)));
    const url = `${AUTHORITY}/authorize?${new URLSearchParams({
      client_id: clientId,
      response_type: "code",
      redirect_uri: redirectUrl(),
      response_mode: "query",
      scope: SCOPE,
      state,
      code_challenge: challenge,
      code_challenge_method: "S256",
      ...(interactive ? { prompt: "select_account" } : { prompt: "none" }),
    })}`;
    const response = new URL(await launchWebAuthFlow(url, interactive));
    if (response.searchParams.get("state") !== state) throw new Error("Ongeldig antwoord van Microsoft.");
    const error = response.searchParams.get("error_description") || response.searchParams.get("error");
    if (error) throw new Error(error.split("\r\n")[0]);
    return requestToken(clientId, {
      grant_type: "authorization_code",
      code: response.searchParams.get("code"),
      redirect_uri: redirectUrl(),
      code_verifier: verifier,
    });
  }

  async function getAccessToken() {
    const s = await storageGet(["eduarteOutlookClientId", AUTH_KEY]);
    const clientId = (s.eduarteOutlookClientId || "").trim();
    if (!clientId) throw new Error("Vul eerst je Client ID in bij Eduarte Tools → Startpagina.");
    const auth = s[AUTH_KEY];
    if (auth?.accessToken && auth.expiresAt > Date.now()) return auth.accessToken;
    if (auth?.refreshToken) {
      try {
        return await requestToken(clientId, { grant_type: "refresh_token", refresh_token: auth.refreshToken });
      } catch { /* verlopen: hieronder stil opnieuw inloggen */ }
    }
    try {
      return await authorize(clientId, false);
    } catch {
      throw new Error("Outlook-koppeling verlopen. Koppel opnieuw via Eduarte Tools → Startpagina.");
    }
  }

  async function graph(path, options = {}) {
    const token = await getAccessToken();
    const res = await fetch(path.startsWith("https://") ? path : `https://graph.microsoft.com/v1.0${path}`, {
      ...options,
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
        Prefer: 'outlook.timezone="UTC"',
        ...options.headers,
      },
    });
    if (res.status === 204) return null;
    const data = await res.json().catch(() => null);
    if (!res.ok) throw new Error(data?.error?.message || `Outlook-fout ${res.status}`);
    return data;
  }

  function eventKey(start, end, title) {
    return `${Date.parse(start)}|${Date.parse(end)}|${title}`;
  }

  function graphDate(value) {
    // Graph geeft UTC terug zonder "Z"
    return /[zZ]|[+-]\d\d:\d\d$/.test(value) ? value : `${value}Z`;
  }

  // Bepaalt welke afspraken weg moeten en welke erbij moeten (los te testen)
  function planSync(existingEvents, lessons) {
    const wanted = new Map(lessons.map((l) => [eventKey(l.start, l.end, l.title), l]));
    const ours = existingEvents.filter((e) => (e.categories || []).includes(CATEGORY));
    const keep = new Set();
    const remove = [];
    ours.forEach((e) => {
      const key = eventKey(graphDate(e.start.dateTime), graphDate(e.end.dateTime), e.subject);
      if (wanted.has(key) && !keep.has(key)) keep.add(key);
      else remove.push(e.id);
    });
    const create = [...wanted].filter(([key]) => !keep.has(key)).map(([, lesson]) => lesson);
    return { remove, create };
  }

  function toEvent(lesson) {
    return {
      subject: lesson.title,
      start: { dateTime: lesson.start.replace(/Z$/, ""), timeZone: "UTC" },
      end: { dateTime: lesson.end.replace(/Z$/, ""), timeZone: "UTC" },
      location: { displayName: lesson.location || "" },
      body: {
        contentType: "text",
        content: [lesson.subject, lesson.participants && `Docent: ${lesson.participants}`, "Toegevoegd door Eduarte Tools"].filter(Boolean).join("\n"),
      },
      categories: [CATEGORY],
      showAs: "busy",
      isReminderOn: false,
    };
  }

  let queue = Promise.resolve();

  function syncWeek(week) {
    const run = async () => {
      const params = new URLSearchParams({
        startDateTime: week.from,
        endDateTime: week.to,
        $select: "id,subject,start,end,categories",
        $top: "500",
      });
      let events = [];
      let next = `/me/calendarView?${params}`;
      while (next) {
        const page = await graph(next);
        events = events.concat(page.value || []);
        next = page["@odata.nextLink"] || null;
      }
      const { remove, create } = planSync(events, week.lessons);
      for (const id of remove) await graph(`/me/events/${encodeURIComponent(id)}`, { method: "DELETE" });
      for (const lesson of create) await graph("/me/events", { method: "POST", body: JSON.stringify(toEvent(lesson)) });
      await storageSet({ eduarteOutlookLastSync: Date.now(), eduarteOutlookLastError: "" });
      return { success: true, created: create.length, removed: remove.length };
    };
    queue = queue.then(run, run).catch(async (error) => {
      await storageSet({ eduarteOutlookLastError: error.message });
      return { success: false, error: error.message };
    });
    return queue;
  }

  async function connect() {
    const s = await storageGet(["eduarteOutlookClientId"]);
    const clientId = (s.eduarteOutlookClientId || "").trim();
    if (!/^[0-9a-f-]{36}$/i.test(clientId)) throw new Error("Vul een geldige Client ID in (een code als 1234abcd-…).");
    await storageSet({ [AUTH_KEY]: null });
    await authorize(clientId, true);
    await storageSet({ eduarteOutlookSync: true, eduarteOutlookLastSync: 0 });
    const { eduarteOutlookAccount } = await storageGet(["eduarteOutlookAccount"]);
    return { success: true, account: eduarteOutlookAccount };
  }

  async function disconnect() {
    await storageSet({ [AUTH_KEY]: null, eduarteOutlookSync: false, eduarteOutlookAccount: "" });
    return { success: true };
  }

  return { CATEGORY, redirectUrl, planSync, toEvent, syncWeek, connect, disconnect };
});
