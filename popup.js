const usernameEl = document.getElementById("username");
const passwordEl = document.getElementById("password");
const enabledEl = document.getElementById("enabled");
const autosubmitEl = document.getElementById("autosubmit");
const darkmodeEl = document.getElementById("darkmode");
const accentEl = document.getElementById("accent");
const modernstyleEl = document.getElementById("modernstyle");
const humanthemeEl = document.getElementById("humantheme");
const customenabledEl = document.getElementById("customenabled");
const customBgEl = document.getElementById("customBg");
const customSurfaceEl = document.getElementById("customSurface");
const customTextEl = document.getElementById("customText");
const customBorderEl = document.getElementById("customBorder");
const saveBtn = document.getElementById("save");

// Tabs
document.querySelectorAll("nav.tabs button").forEach((btn) => {
  btn.addEventListener("click", () => {
    document.querySelectorAll("nav.tabs button").forEach((b) => b.classList.remove("is-active"));
    document.querySelectorAll(".panel").forEach((p) => p.classList.remove("is-active"));
    btn.classList.add("is-active");
    document.getElementById("panel-" + btn.dataset.tab).classList.add("is-active");
  });
});

function load() {
  chrome.storage.local.get(
    [
      "eduarteUsername",
      "eduartePassword",
      "eduarteEnabled",
      "eduarteAutosubmit",
      "eduarteDarkMode",
      "eduarteAccentColor",
      "eduarteModernStyle",
      "eduarteHumanTheme",
      "eduarteCustomTheme",
      "eduarteCustomColors",
    ],
    (data) => {
      usernameEl.value = data.eduarteUsername || "";
      passwordEl.value = data.eduartePassword || "";
      enabledEl.checked = data.eduarteEnabled !== false; // default true once saved
      autosubmitEl.checked = !!data.eduarteAutosubmit;
      darkmodeEl.checked = !!data.eduarteDarkMode;
      accentEl.value = data.eduarteAccentColor || "#2563eb";
      modernstyleEl.checked = !!data.eduarteModernStyle;
      humanthemeEl.checked = !!data.eduarteHumanTheme;
      customenabledEl.checked = !!data.eduarteCustomTheme;
      const c = data.eduarteCustomColors || {};
      customBgEl.value = c.bg || "#15171b";
      customSurfaceEl.value = c.surface || "#1f2328";
      customTextEl.value = c.text || "#f4f4f6";
      customBorderEl.value = c.border || "#545e6b";
    }
  );
}

saveBtn.addEventListener("click", () => {
  const payload = {
    eduarteUsername: usernameEl.value.trim(),
    eduartePassword: passwordEl.value,
    eduarteEnabled: enabledEl.checked,
    eduarteAutosubmit: autosubmitEl.checked,
    eduarteDarkMode: darkmodeEl.checked,
    eduarteAccentColor: accentEl.value,
    eduarteModernStyle: modernstyleEl.checked,
    eduarteHumanTheme: humanthemeEl.checked,
    eduarteCustomTheme: customenabledEl.checked,
    eduarteCustomColors: {
      bg: customBgEl.value,
      surface: customSurfaceEl.value,
      text: customTextEl.value,
      border: customBorderEl.value,
    },
  };
  chrome.storage.local.set(payload, () => {
    const original = saveBtn.textContent;
    saveBtn.textContent = "Opgeslagen \u2713";
    saveBtn.classList.add("is-saved");
    setTimeout(() => {
      saveBtn.textContent = original;
      saveBtn.classList.remove("is-saved");
    }, 1300);
  });
});

load();
