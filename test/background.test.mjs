import { readFileSync } from "node:fs";
import vm from "node:vm";
import { describe, expect, it, vi } from "vitest";

const backgroundSource = readFileSync(new URL("../extension/background.js", import.meta.url), "utf8");

function createBackground(cachedGrades) {
  const messageListeners = [];
  const sessionWrites = [];
  const chrome = {
    runtime: {
      id: "extension-test",
      getURL: (path) => `chrome-extension://extension-test/${path}`,
      lastError: null,
      onMessage: { addListener: (listener) => messageListeners.push(listener) },
      onStartup: { addListener: vi.fn() },
    },
    tabs: {
      onRemoved: { addListener: vi.fn() },
      sendMessage: vi.fn((_tabId, _request, callback) => callback({ grades: [] })),
      create: vi.fn(async () => ({ id: 42 })),
      query: vi.fn(async () => []),
    },
    storage: {
      session: {
        get: vi.fn(async () => ({
          eduartePackGradeCache: { grades: cachedGrades, updatedAt: 123 },
        })),
        set: vi.fn(async (value) => sessionWrites.push(value)),
      },
      local: { get: vi.fn() },
    },
    action: {
      setBadgeText: vi.fn(),
      setBadgeBackgroundColor: vi.fn(),
    },
  };
  vm.runInNewContext(backgroundSource, {
    chrome,
    URL,
    Map,
    Promise,
    Date,
    crypto: { randomUUID: () => "transfer-test-id" },
    console,
    fetch: vi.fn(),
  });
  return { chrome, messageListeners, sessionWrites };
}

describe("background pack opening", () => {
  it("uses the current session's saved Eduarte grades when the current page has none", async () => {
    const grades = [{
      id: "math-1",
      result: 8.5,
      weight: 2,
      hasWeight: true,
      title: "Wiskunde",
    }];
    const { chrome, messageListeners, sessionWrites } = createBackground(grades);
    const response = new Promise((resolve) => {
      messageListeners[0](
        { type: "OPEN_EDUARTE_TOOLS_PAGE", page: "packs" },
        {
          tab: { id: 7, url: "https://tilburg-student.educus.nl/agenda" },
          url: "https://tilburg-student.educus.nl/agenda",
        },
        resolve
      );
    });

    await expect(response).resolves.toMatchObject({ success: true, tabId: 42 });
    expect(chrome.storage.session.get).toHaveBeenCalledWith("eduartePackGradeCache");
    const transfer = sessionWrites.find((write) => write["eduartePackGrades:transfer-test-id"]);
    expect(transfer["eduartePackGrades:transfer-test-id"]).toEqual(grades);
    expect(new URL(chrome.tabs.create.mock.calls[0][0].url).searchParams.get("transfer"))
      .toBe("eduartePackGrades:transfer-test-id");
  });

  it("caches only valid grade values from Eduarte pages", async () => {
    const { chrome, messageListeners, sessionWrites } = createBackground([]);
    const response = new Promise((resolve) => {
      messageListeners[0](
        {
          type: "CACHE_EDUARTE_GRADES",
          grades: [
            { id: "ok", result: 8, title: "Goed" },
            { id: "invalid", result: 12, title: "Ongeldig" },
          ],
        },
        { tab: { id: 7, url: "https://tilburg-student.educus.nl/resultaten" } },
        resolve
      );
    });

    await expect(response).resolves.toEqual({ success: true });
    expect(sessionWrites[0].eduartePackGradeCache.grades).toEqual([
      { id: "ok", result: 8, weight: 1, hasWeight: false, title: "Goed" },
    ]);
  });
});
