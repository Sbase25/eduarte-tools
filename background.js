const LOCATION_TRACKER_DOCUMENT = "location-tracker.html";
const PACK_GRADE_CACHE_KEY = "eduartePackGradeCache";

function isEduarteTab(tab) {
  try {
    const url = new URL(tab.url);
    return url.protocol === "https:"
      && (/(^|\.)eduarte\.nl$/.test(url.hostname) || /(^|\.)educus\.nl$/.test(url.hostname));
  } catch {
    return false;
  }
}

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request?.type === "CACHE_EDUARTE_GRADES") {
    if (!sender.tab || !isEduarteTab(sender.tab)) {
      sendResponse({ success: false, error: "Cijfers kunnen alleen vanaf een Eduarte-pagina worden opgeslagen." });
      return;
    }

    const grades = (Array.isArray(request.grades) ? request.grades : [])
      .filter((grade) => grade && Number.isFinite(grade.result) && grade.result >= 0 && grade.result <= 10)
      .map((grade, index) => ({
        id: String(grade.id ?? index).slice(0, 160),
        result: grade.result,
        weight: Number.isFinite(grade.weight) && grade.weight > 0 ? grade.weight : 1,
        hasWeight: grade.hasWeight === true,
        title: String(grade.title || `Cijfer ${index + 1}`).slice(0, 160),
      }));
    if (!grades.length) {
      sendResponse({ success: true });
      return;
    }

    chrome.storage.session.set({
      [PACK_GRADE_CACHE_KEY]: { grades, updatedAt: Date.now() },
    }).then(() => sendResponse({ success: true })).catch((error) => {
      console.error("Eduarte Tools could not cache the current Eduarte grades.", error);
      sendResponse({ success: false, error: "De cijfers konden niet tijdelijk worden opgeslagen." });
    });
    return true;
  }

  if (!request || request.type !== "OPEN_EDUARTE_TOOLS_PAGE") return;

  const extensionPage = request.page === "packs"
    ? "popup-dist/packs.html"
    : request.page === "team"
      ? "popup-dist/team.html"
      : request.page === "settings"
        ? "popup-dist/index.html"
        : null;
  if (!extensionPage) {
    sendResponse({ success: false, error: "Onbekende Eduarte Tools-pagina." });
    return;
  }

  const isExtensionPage = sender.url?.startsWith(chrome.runtime.getURL(""));
  if (!sender.tab && !isExtensionPage) {
    sendResponse({ success: false, error: "Deze actie is alleen beschikbaar vanuit Eduarte Tools." });
    return;
  }
  if (sender.tab && !isEduarteTab(sender.tab)) {
    sendResponse({ success: false, error: "Deze actie is alleen beschikbaar op Eduarte-pagina's." });
    return;
  }

  const openPage = async () => {
    let grades = [];
    if (request.page === "packs") {
      let sourceTab = sender.tab;
      if (!sourceTab) {
        const [activeTab] = await chrome.tabs.query({ active: true, currentWindow: true });
        if (isEduarteTab(activeTab)) sourceTab = activeTab;
      }

      if (sourceTab?.id != null) {
        grades = await new Promise((resolve) => {
          chrome.tabs.sendMessage(sourceTab.id, { type: "GET_EDUARTE_GRADES" }, (response) => {
            if (chrome.runtime.lastError) {
              resolve([]);
              return;
            }
            resolve(Array.isArray(response?.grades) ? response.grades : []);
          });
        });
      }
      if (!grades.length) {
        const cached = await chrome.storage.session.get(PACK_GRADE_CACHE_KEY);
        grades = Array.isArray(cached[PACK_GRADE_CACHE_KEY]?.grades)
          ? cached[PACK_GRADE_CACHE_KEY].grades
          : [];
      }
    }

    const url = new URL(chrome.runtime.getURL(extensionPage));
    if (request.page === "packs") {
      const transferKey = `eduartePackGrades:${crypto.randomUUID()}`;
      await chrome.storage.session.set({ [transferKey]: grades });
      url.searchParams.set("transfer", transferKey);
    }

    const tab = await chrome.tabs.create({ url: url.href, active: true });
    sendResponse({ success: true, tabId: tab.id });
  };

  openPage().catch((error) => {
    console.error("Eduarte Tools could not open the requested page.", error);
    sendResponse({ success: false, error: error.message || "De pagina kon niet worden geopend." });
  });
  return true;
});

chrome.runtime.onStartup.addListener(() => {
  startLocationTrackingIfConfigured();
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

// Chrome heeft een offscreen-document nodig voor geolocation vanuit de service
// worker. Firefox draait de achtergrond als pagina met DOM, dus daar gebruiken
// we navigator.geolocation rechtstreeks.
const HAS_OFFSCREEN = typeof chrome.offscreen !== "undefined";
let backgroundWatchStarted = false;

function readBackgroundPosition() {
  return new Promise((resolve) => {
    if (typeof navigator === "undefined" || !navigator.geolocation) {
      resolve({ success: false, code: 2, error: "Locatiebepaling wordt niet ondersteund." });
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const coordinates = { latitude: position.coords.latitude, longitude: position.coords.longitude };
        saveLocation(coordinates);
        resolve({ success: true, coordinates });
      },
      (error) => resolve({ success: false, code: error.code, error: error.message }),
      { enableHighAccuracy: false, maximumAge: 300000, timeout: 30000 }
    );
  });
}

async function ensureLocationTracker() {
  if (!HAS_OFFSCREEN) {
    if (!backgroundWatchStarted && typeof navigator !== "undefined" && navigator.geolocation) {
      backgroundWatchStarted = true;
      navigator.geolocation.watchPosition(
        (position) => saveLocation({ latitude: position.coords.latitude, longitude: position.coords.longitude }),
        (error) => console.warn("Location tracking failed.", error.message),
        { enableHighAccuracy: false, maximumAge: 300000, timeout: 30000 }
      );
    }
    return;
  }
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

function saveLocation({ latitude, longitude }) {
  if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) return;
  getLocationLabel(latitude, longitude)
    .catch((error) => {
      console.warn("Detected location could not be named.", error);
      return "Huidige locatie";
    })
    .then((locationLabel) => chrome.storage.local.set({
      eduarteWeatherCoordinates: { latitude, longitude },
      eduarteWeatherLocationLabel: locationLabel,
    }));
}

async function getLocationLabel(latitude, longitude) {
  const response = await fetch(
    `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${latitude}&lon=${longitude}`,
    { headers: { "Accept-Language": "nl" } }
  );
  if (!response.ok) {
    throw new Error("Plaatsnaam kon niet worden opgehaald");
  }
  const { address } = await response.json();
  return address.city || address.town || address.village || address.municipality || address.county || "Huidige locatie";
}

// Weer-data ophalen via Open-Meteo (zonder API-sleutel). Coördinaten hebben
// voorrang wanneer de gebruiker locatiegebruik heeft toegestaan.
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.type === "START_LOCATION_TRACKING") {
    if (!HAS_OFFSCREEN) {
      ensureLocationTracker()
        .then(() => readBackgroundPosition())
        .then(sendResponse)
        .catch((error) => sendResponse({ success: false, error: error.message }));
      return true;
    }
    ensureLocationTracker()
      .then(() => chrome.runtime.sendMessage({ type: "REQUEST_CURRENT_LOCATION" }))
      .then((result) => sendResponse(result || {
        success: false,
        error: "De locatie-service gaf geen antwoord. Probeer het opnieuw.",
      }))
      .catch((error) => sendResponse({ success: false, error: error.message }));
    return true;
  }

  if (request.type === "LOCATION_UPDATED") {
    saveLocation(request.coordinates || {});
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
