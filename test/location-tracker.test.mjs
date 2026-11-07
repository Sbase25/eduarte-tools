import { readFileSync } from "node:fs";
import { runInNewContext } from "node:vm";
import { describe, expect, it } from "vitest";

const trackerSource = readFileSync(new URL("../location-tracker.js", import.meta.url), "utf8");

function createTracker(geolocation) {
  let messageListener;
  const sentMessages = [];
  runInNewContext(trackerSource, {
    chrome: {
      runtime: {
        onMessage: {
          addListener(listener) {
            messageListener = listener;
          },
        },
        sendMessage(message) {
          sentMessages.push(message);
        },
      },
    },
    navigator: { geolocation },
    console,
  });
  return { messageListener, sentMessages };
}

describe("location tracker", () => {
  it("responds with the coordinates and stores a successful location fix", () => {
    const position = { coords: { latitude: 51.5, longitude: -0.12 } };
    const { messageListener, sentMessages } = createTracker({
      getCurrentPosition(success) { success(position); },
      watchPosition() {},
    });
    let response;

    const keepChannelOpen = messageListener(
      { type: "REQUEST_CURRENT_LOCATION" },
      {},
      (value) => { response = value; }
    );

    expect(keepChannelOpen).toBe(true);
    expect(response).toEqual({ success: true, coordinates: position.coords });
    expect(sentMessages).toEqual([{
      type: "LOCATION_UPDATED",
      coordinates: position.coords,
    }]);
  });

  it("returns geolocation errors to the requesting popup", () => {
    const { messageListener } = createTracker({
      getCurrentPosition(_success, failure) {
        failure({ code: 3, message: "timeout" });
      },
      watchPosition() {},
    });
    let response;

    messageListener(
      { type: "REQUEST_CURRENT_LOCATION" },
      {},
      (value) => { response = value; }
    );

    expect(response).toEqual({ success: false, code: 3, error: "timeout" });
  });
});
