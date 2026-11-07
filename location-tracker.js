function sendLocation(position) {
  chrome.runtime.sendMessage({
    type: "LOCATION_UPDATED",
    coordinates: {
      latitude: position.coords.latitude,
      longitude: position.coords.longitude,
    },
  });
}

chrome.runtime.onMessage.addListener((request, _sender, sendResponse) => {
  if (request?.type !== "REQUEST_CURRENT_LOCATION") return;
  if (!navigator.geolocation) {
    sendResponse({ success: false, code: 2, error: "Locatiebepaling wordt niet ondersteund." });
    return;
  }

  navigator.geolocation.getCurrentPosition(
    (position) => {
      sendLocation(position);
      sendResponse({
        success: true,
        coordinates: {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        },
      });
    },
    (error) => sendResponse({ success: false, code: error.code, error: error.message }),
    { enableHighAccuracy: false, maximumAge: 300000, timeout: 30000 }
  );
  return true;
});

navigator.geolocation.watchPosition(
  sendLocation,
  (error) => console.warn("Location tracking failed.", error.message),
  { enableHighAccuracy: false, maximumAge: 300000, timeout: 30000 }
);
