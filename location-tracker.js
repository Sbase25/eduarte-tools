function sendLocation(position) {
  chrome.runtime.sendMessage({
    type: "LOCATION_UPDATED",
    coordinates: {
      latitude: position.coords.latitude,
      longitude: position.coords.longitude,
    },
  });
}

navigator.geolocation.watchPosition(
  sendLocation,
  (error) => console.warn("Location tracking failed.", error.message),
  { enableHighAccuracy: false, maximumAge: 300000, timeout: 30000 }
);
