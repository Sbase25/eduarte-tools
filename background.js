const EDUARTE_PAGES = [
  "https://*.educus.nl/*",
  "https://*.eduarte.nl/*",
];

const MENU_OPEN = "eduarte-tools-open";
const LOCATION_TRACKER_DOCUMENT = "location-tracker.html";

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
chrome.runtime.onStartup.addListener(() => {
  createContextMenus();
  startLocationTrackingIfConfigured();
});

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

async function ensureLocationTracker() {
  const hasDocument = await chrome.offscreen.hasDocument();
  if (!hasDocument) {
    await chrome.offscreen.createDocument({
      url: LOCATION_TRACKER_DOCUMENT,
      reasons: ["GEOLOCATION"],
      justification: "Update the dashboard weather when the user changes location.",
    });
  }
}

function startLocationTrackingIfConfigured() {
  chrome.storage.local.get(["eduarteWeatherUseLocation", "eduarteWeatherCoordinates"], (settings) => {
    if (settings.eduarteWeatherUseLocation !== false && settings.eduarteWeatherCoordinates) {
      ensureLocationTracker().catch((error) => console.error("Location tracking could not start.", error));
    }
  });
}

// Weer-data ophalen via Open-Meteo (zonder API-sleutel). Coördinaten hebben
// voorrang wanneer de gebruiker locatiegebruik heeft toegestaan.
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.type === "START_LOCATION_TRACKING") {
    ensureLocationTracker()
      .then(() => sendResponse({ success: true }))
      .catch((error) => sendResponse({ success: false, error: error.message }));
    return true;
  }

  if (request.type === "LOCATION_UPDATED") {
    const { latitude, longitude } = request.coordinates || {};
    if (Number.isFinite(latitude) && Number.isFinite(longitude)) {
      chrome.storage.local.set({
        eduarteWeatherCoordinates: { latitude, longitude },
        eduarteWeatherLocationLabel: "Huidige locatie",
      });
    }
    return;
  }

  if (request.type === "FETCH_WEATHER") {
    const coordinates = request.coordinates;
    const city = request.city || "Utrecht";
    const location = coordinates && Number.isFinite(coordinates.latitude) && Number.isFinite(coordinates.longitude)
      ? Promise.resolve({
        latitude: coordinates.latitude,
        longitude: coordinates.longitude,
        name: request.locationLabel || "Huidige locatie",
      })
      : fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(city)}&count=1&language=nl&format=json`)
        .then((res) => res.json())
        .then((geo) => {
          if (!geo.results || !geo.results.length) {
            throw new Error("Plaats niet gevonden");
          }
          const { latitude, longitude, name, admin1 } = geo.results[0];
          return { latitude, longitude, name: name + (admin1 ? ` (${admin1})` : "") };
        });

    location
      .then(({ latitude, longitude, name }) => fetch(
        `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current_weather=true&hourly=precipitation_probability&timezone=auto`
      ).then((res) => res.json()).then((weather) => {
        const hour = new Date().getHours();
        sendResponse({
          success: true,
          city: name,
          temp: weather.current_weather.temperature,
          weathercode: weather.current_weather.weathercode,
          windspeed: weather.current_weather.windspeed,
          is_day: weather.current_weather.is_day,
          precipitation: weather.hourly?.precipitation_probability?.[hour] ?? 0,
        });
      }))
      .catch((err) => {
        sendResponse({ success: false, error: err.message });
      });
    return true; // Asynchrone respons behouden
  }
});
