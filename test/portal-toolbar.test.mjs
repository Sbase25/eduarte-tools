import { readFileSync } from "node:fs";
import { describe, expect, it, vi } from "vitest";
import { JSDOM } from "jsdom";

const overlaySource = readFileSync(new URL("../overlay.js", import.meta.url), "utf8");
const badgeLogicSource = readFileSync(new URL("../badge-logic.js", import.meta.url), "utf8");
const eduarteApiSource = readFileSync(new URL("../eduarte-api.js", import.meta.url), "utf8");

describe("portal action toolbar", () => {
  it("adds working search, notifications, and profile actions without observing its own updates", () => {
    const dom = new JSDOM(`<!doctype html><html><head></head><body>
      <header class="header">
        <div class="header-toolbar">
          <a href="/profiel"><img src="https://example.test/avatar.png" alt="Ada Lovelace"></a>
          <a href="/berichten">Berichten</a>
          <span class="badge">4</span>
        </div>
      </header>
      <section class="result-overview--grades">
        <table><tbody><tr><th>Wiskunde</th><td id="grade-1">8,5</td></tr></tbody></table>
      </section>
      <main class="agenda"></main>
    </body></html>`, {
      runScripts: "outside-only",
      url: "https://tilburg-student.educus.nl/agenda",
    });
    const { window } = dom;
    const observers = [];
    window.MutationObserver = class {
      constructor(callback) {
        this.callback = callback;
        observers.push(this);
      }
      observe() {}
      disconnect() {}
    };
    window.requestAnimationFrame = vi.fn(() => 1);
    window.chrome = {
      runtime: {
        getURL: (path) => `chrome-extension://test/${path}`,
        onMessage: { addListener: vi.fn() },
        sendMessage: vi.fn((_message, callback) => callback?.({ success: true })),
        lastError: null,
      },
      storage: {
        local: {
          get(_keys, callback) {
            callback({
              eduarteGradesEnabled: false,
              eduarteStartEnabled: false,
              eduarteShortcutKeysEnabled: false,
            });
          },
        },
      },
    };
    window.find = vi.fn();

    window.eval(eduarteApiSource);
    window.eval(badgeLogicSource);
    window.eval(overlaySource);

    const toolbar = window.document.getElementById("eduarte-tools-portal-actions");
    const searchButton = toolbar.querySelector(".et-portal-search-button");
    const searchForm = toolbar.querySelector(".et-portal-search");
    const searchInput = searchForm.querySelector("input");
    const notificationButton = toolbar.querySelector(".et-portal-bell");
    const notificationPanel = toolbar.querySelector(".et-portal-popover");
    const count = toolbar.querySelector(".et-portal-count");

    expect(toolbar).not.toBeNull();
    expect(toolbar.querySelector(".et-portal-avatar").href).toBe("https://tilburg-student.educus.nl/profiel");
    expect(toolbar.querySelector(".et-portal-avatar img").src).toBe("https://example.test/avatar.png");
    expect(toolbar.querySelector(".et-portal-message-link").href).toBe("https://tilburg-student.educus.nl/berichten");
    expect(count.textContent).toBe("4");
    expect(window.chrome.runtime.sendMessage).toHaveBeenCalledWith(
      {
        type: "CACHE_EDUARTE_GRADES",
        grades: [{
          id: "grade-1",
          result: 8.5,
          weight: 1,
          hasWeight: false,
          title: "Wiskunde",
        }],
      },
      expect.any(Function)
    );

    searchButton.click();
    searchInput.value = "rooster";
    searchForm.dispatchEvent(new window.Event("submit", { bubbles: true, cancelable: true }));
    expect(window.find).toHaveBeenCalledWith("rooster", false, false, true, false, true, false);

    notificationButton.click();
    expect(notificationPanel.classList.contains("open")).toBe(true);
    expect(notificationPanel.textContent).toContain("4 ongelezen meldingen");

    const unreadObserver = observers.find((observer) => observer.callback.toString().includes("actions.contains"));
    unreadObserver.callback([{ target: count }]);
    expect(window.requestAnimationFrame).not.toHaveBeenCalled();

    window.close();
  });
});
