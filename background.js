const EDUARTE_PAGES = [
  "https://*.educus.nl/*",
  "https://*.eduarte.nl/*",
];

const MENU_OPEN = "eduarte-tools-open";

function createContextMenus() {
  chrome.contextMenus.removeAll(() => {
    chrome.contextMenus.create({
      id: MENU_OPEN,
      title: "Eduarte Tools openen",
      contexts: ["page"],
      documentUrlPatterns: EDUARTE_PAGES,
    });
  });
}

chrome.runtime.onInstalled.addListener(createContextMenus);
chrome.runtime.onStartup.addListener(createContextMenus);

chrome.contextMenus.onClicked.addListener((info) => {
  if (info.menuItemId === MENU_OPEN) {
    chrome.action.openPopup();
  }
});

// Meldingen-badge op het extensie-icoon: badge.js scant Eduarte's eigen
// ongelezen-tellers en stuurt het totaal hierheen door.
const badgeCountsByTab = new Map();

function updateBadgeForTab(tabId, count) {
  badgeCountsByTab.set(tabId, count);
  const text = count > 0 ? String(Math.min(count, 99)) : "";
  chrome.action.setBadgeText({ text, tabId });
  chrome.action.setBadgeBackgroundColor({ color: "#f97316", tabId });
}

chrome.runtime.onMessage.addListener((request, sender) => {
  if (request.type === "EDUARTE_BADGE_COUNT" && sender.tab && sender.tab.id != null) {
    updateBadgeForTab(sender.tab.id, request.count || 0);
  }
});

chrome.tabs.onRemoved.addListener((tabId) => {
  badgeCountsByTab.delete(tabId);
});

// Weer-data ophalen via Open-Meteo (zonder API-sleutel)
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.type === "FETCH_WEATHER") {
    const city = request.city || "Utrecht";
    fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(city)}&count=1&language=nl&format=json`)
      .then((res) => res.json())
      .then((geo) => {
        if (!geo.results || !geo.results.length) {
          throw new Error("Plaats niet gevonden");
        }
        const { latitude, longitude, name, admin1 } = geo.results[0];
        return fetch(`https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current_weather=true&hourly=precipitation_probability&timezone=auto`)
          .then((res) => res.json())
          .then((weather) => {
            const hour = new Date().getHours();
            sendResponse({
              success: true,
              city: name + (admin1 ? ` (${admin1})` : ""),
              temp: weather.current_weather.temperature,
              weathercode: weather.current_weather.weathercode,
              windspeed: weather.current_weather.windspeed,
              is_day: weather.current_weather.is_day,
              precipitation: weather.hourly?.precipitation_probability?.[hour] ?? 0,
            });
          });
      })
      .catch((err) => {
        sendResponse({ success: false, error: err.message });
      });
    return true; // Asynchrone respons behouden
  }
});
