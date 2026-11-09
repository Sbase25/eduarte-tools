// Eduarte Tools - calendar-feed.js
// Houdt je persoonlijke agenda-link bij: stuurt het rooster naar de agenda-server,
// waarna Outlook, Google of Apple Agenda de link zelf blijft verversen.
// Wordt geladen in de achtergrond (service worker in Chrome, achtergrondpagina in Firefox).

(function (root, factory) {
  const api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  else root.EduarteCalendar = api;
})(globalThis, function () {
  const SERVER = "https://eduarte-agenda.sbaselmans1.workers.dev";
  const FEED_KEY = "eduarteCalendarFeed";

  function storageGet(keys) {
    return new Promise((resolve) => chrome.storage.local.get(keys, resolve));
  }

  function storageSet(values) {
    return new Promise((resolve) => chrome.storage.local.set(values, resolve));
  }

  function feedUrl(id) {
    return `${SERVER}/cal/${id}.ics`;
  }

  async function request(path, options = {}) {
    const res = await fetch(`${SERVER}${path}`, {
      ...options,
      headers: { "Content-Type": "application/json", ...options.headers },
    });
    const data = await res.json().catch(() => null);
    if (!res.ok) throw new Error(data?.error || `Agenda-server gaf fout ${res.status}`);
    return data;
  }

  async function create() {
    const { id, token } = await request("/api/feeds", { method: "POST" });
    await storageSet({ [FEED_KEY]: { id, token }, eduarteCalendarLastSync: 0, eduarteCalendarLastError: "" });
    return { success: true, url: feedUrl(id) };
  }

  async function remove() {
    const { [FEED_KEY]: feed } = await storageGet([FEED_KEY]);
    if (feed) {
      await request(`/api/feeds/${feed.id}`, { method: "DELETE", headers: { Authorization: `Bearer ${feed.token}` } })
        .catch(() => { /* bestaat al niet meer */ });
    }
    await storageSet({ [FEED_KEY]: null, eduarteCalendarLastSync: 0, eduarteCalendarLastError: "" });
    return { success: true };
  }

  // Zelfde week niet steeds opnieuw versturen
  const sent = new Map();
  let queue = Promise.resolve();

  function syncWeek(week) {
    const run = async () => {
      const { [FEED_KEY]: feed } = await storageGet([FEED_KEY]);
      if (!feed) return { success: false, error: "Maak eerst een agenda-link via Eduarte Tools → Startpagina." };
      const body = JSON.stringify(week);
      if (sent.get(week.from) === body) return { success: true, unchanged: true, lessons: week.lessons.length };
      await request(`/api/feeds/${feed.id}`, { method: "PUT", headers: { Authorization: `Bearer ${feed.token}` }, body });
      sent.set(week.from, body);
      await storageSet({ eduarteCalendarLastSync: Date.now(), eduarteCalendarLastError: "" });
      return { success: true, lessons: week.lessons.length };
    };
    queue = queue.then(run, run).catch(async (error) => {
      await storageSet({ eduarteCalendarLastError: error.message });
      return { success: false, error: error.message };
    });
    return queue;
  }

  return { SERVER, feedUrl, create, remove, syncWeek };
});
