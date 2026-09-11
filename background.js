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

  if (request.type === "TEAMS_CONNECT") {
    connectMicrosoftAccount()
      .then((result) => sendResponse(result))
      .catch((err) => sendResponse({ success: false, error: err.message }));
    return true;
  }

  if (request.type === "TEAMS_DISCONNECT") {
    chrome.storage.local.remove(["msTeamsToken", "msTeamsTokenExpiry"], () => {
      sendResponse({ success: true });
    });
    return true;
  }

  if (request.type === "TEAMS_GET_ASSIGNMENTS") {
    getTeamsAssignments()
      .then((result) => sendResponse(result))
      .catch((err) => sendResponse({ success: false, error: err.message }));
    return true;
  }
});

// --- Microsoft Teams / Graph API integratie voor opdrachten-widget ---

function getRedirectUrl() {
  return chrome.identity.getRedirectURL("teams-auth");
}

function launchMicrosoftAuth(clientId, interactive) {
  const redirectUri = getRedirectUrl();
  const scope = encodeURIComponent(
    "openid profile offline_access EduAssignments.ReadBasic User.Read"
  );
  const authUrl =
    `https://login.microsoftonline.com/common/oauth2/v2.0/authorize` +
    `?client_id=${encodeURIComponent(clientId)}` +
    `&response_type=token` +
    `&redirect_uri=${encodeURIComponent(redirectUri)}` +
    `&scope=${scope}` +
    `&response_mode=fragment` +
    `&prompt=${interactive ? "select_account" : "none"}`;

  return new Promise((resolve, reject) => {
    chrome.identity.launchWebAuthFlow(
      { url: authUrl, interactive: !!interactive },
      (redirectedUrl) => {
        if (chrome.runtime.lastError || !redirectedUrl) {
          reject(new Error(chrome.runtime.lastError?.message || "Inloggen geannuleerd of mislukt"));
          return;
        }
        try {
          const hash = redirectedUrl.split("#")[1] || "";
          const params = new URLSearchParams(hash);
          const token = params.get("access_token");
          const expiresIn = Number(params.get("expires_in") || 3600);
          if (!token) {
            const errorDesc = params.get("error_description") || "Geen toegangstoken ontvangen";
            reject(new Error(errorDesc));
            return;
          }
          resolve({ token, expiresAt: Date.now() + expiresIn * 1000 });
        } catch (e) {
          reject(e);
        }
      }
    );
  });
}

async function connectMicrosoftAccount() {
  const stored = await chrome.storage.local.get(["msClientId"]);
  const clientId = stored.msClientId;
  if (!clientId) {
    return { success: false, error: "Vul eerst een Azure App (Client ID) in bij instellingen." };
  }
  const { token, expiresAt } = await launchMicrosoftAuth(clientId, true);
  await chrome.storage.local.set({ msTeamsToken: token, msTeamsTokenExpiry: expiresAt });
  return { success: true };
}

async function ensureValidToken() {
  const stored = await chrome.storage.local.get(["msClientId", "msTeamsToken", "msTeamsTokenExpiry"]);
  if (!stored.msClientId) {
    throw new Error("Geen Client ID ingesteld. Verbind eerst met Microsoft in de instellingen.");
  }
  if (stored.msTeamsToken && stored.msTeamsTokenExpiry && Date.now() < stored.msTeamsTokenExpiry - 60000) {
    return stored.msTeamsToken;
  }
  // Stilzwijgend proberen te vernieuwen zonder popup
  const { token, expiresAt } = await launchMicrosoftAuth(stored.msClientId, false);
  await chrome.storage.local.set({ msTeamsToken: token, msTeamsTokenExpiry: expiresAt });
  return token;
}

async function getTeamsAssignments() {
  const token = await ensureValidToken();
  const headers = { Authorization: `Bearer ${token}` };

  const classesRes = await fetch("https://graph.microsoft.com/v1.0/education/me/classes?$select=id,displayName", { headers });
  if (!classesRes.ok) {
    throw new Error(`Kon klassen niet ophalen (${classesRes.status})`);
  }
  const classesData = await classesRes.json();
  const classes = classesData.value || [];

  const assignments = [];
  await Promise.all(
    classes.map(async (klas) => {
      try {
        const res = await fetch(
          `https://graph.microsoft.com/v1.0/education/classes/${klas.id}/assignments?$filter=status eq 'assigned'&$select=id,displayName,dueDateTime,webUrl`,
          { headers }
        );
        if (!res.ok) return;
        const data = await res.json();
        (data.value || []).forEach((a) => {
          assignments.push({
            id: a.id,
            title: a.displayName,
            className: klas.displayName,
            dueDateTime: a.dueDateTime,
            webUrl: a.webUrl,
          });
        });
      } catch (e) {
        // Klas overslaan bij fout, andere klassen blijven werken
      }
    })
  );

  assignments.sort((a, b) => {
    if (!a.dueDateTime) return 1;
    if (!b.dueDateTime) return -1;
    return new Date(a.dueDateTime) - new Date(b.dueDateTime);
  });

  return { success: true, assignments };
}


