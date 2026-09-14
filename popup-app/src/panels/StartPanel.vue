<script setup>
import { ref } from "vue";
import SwitchInput from "../components/SwitchInput.vue";

const props = defineProps(["state"]);
const s = props.state;
const locationStatus = ref("");

function useCurrentLocation() {
  if (!navigator.geolocation) {
    locationStatus.value = "Je browser ondersteunt geen locatiebepaling.";
    return;
  }

  locationStatus.value = "Locatie ophalen...";
  navigator.geolocation.getCurrentPosition(
    ({ coords }) => {
      s.eduarteWeatherCoordinates = {
        latitude: coords.latitude,
        longitude: coords.longitude,
      };
      s.eduarteWeatherUseLocation = true;
      chrome.runtime.sendMessage({ type: "START_LOCATION_TRACKING" });
      locationStatus.value = "Live locatie ingesteld. De gedetecteerde plaatsnaam verschijnt zo meteen op je dashboard.";
    },
    (error) => {
      const messages = {
        1: "Locatietoegang is geweigerd. Kies een plaatsnaam als alternatief.",
        2: "Je locatie is niet beschikbaar. Probeer het opnieuw.",
        3: "Het ophalen van je locatie duurde te lang. Probeer het opnieuw.",
      };
      locationStatus.value = messages[error.code] || "Locatie kon niet worden opgehaald.";
    },
    { enableHighAccuracy: false, timeout: 10000, maximumAge: 300000 }
  );
}
</script>

<template>
  <p class="note">Kies welke widgets je op je Eduarte startpagina / dashboard wilt zien.</p>
  <SwitchInput v-model="s.eduarteStartEnabled" title="Startpagina Verbeteringen" subtitle="Schakel de aangepaste widget-laag en animaties in." />
  <SwitchInput v-model="s.eduarteWeatherEnabled" title="Weerbericht-widget" subtitle="Toont het actuele weerbericht, temperatuur en neerslagkans." />
  <div class="setting">
    <h3 class="setting-title">Weer op basis van je locatie</h3>
    <span class="setting-subtitle">Gebruik je huidige locatie voor automatisch bijgewerkt weer. De extensie werkt de locatie bij wanneer je verplaatst.</span>
    <button class="btn tonal location-button" type="button" @click="useCurrentLocation">📍 Gebruik huidige locatie</button>
    <span v-if="locationStatus" class="location-status" role="status">{{ locationStatus }}</span>
  </div>
  <div class="setting">
    <h3 class="setting-title">Plaatsnaam als alternatief</h3>
    <span class="setting-subtitle">Gebruik dit alleen wanneer je geen locatietoegang wilt geven (bijv. Utrecht).</span>
    <input type="text" v-model="s.eduarteWeatherCity" placeholder="Utrecht" autocomplete="off">
  </div>
  <SwitchInput v-model="s.eduarteGreetingEnabled" title="Persoonlijke Begroeting & Datum" subtitle="Toon een groet (bijv. Goedemorgen) en de datum bovenaan." />
  <SwitchInput v-model="s.eduarteShortcutsEnabled" title="Snelkoppelingen (Quick Links)" subtitle="Knoppen naar Teams, Outlook Webmail, OneDrive, Office 365 en Cijfers." />
  <SwitchInput v-model="s.eduartePomodoroEnabled" title="Pomodoro Focus Timer" subtitle="Interactieve studie- en pauzetimer (25m focus, 5m pauze) op je dashboard." />
  <SwitchInput v-model="s.eduarteQuickCalcEnabled" title="Snelle Cijfercalculator Widget" subtitle="Bereken direct op je dashboard welk cijfer je nodig hebt voor een streefgemiddelde." />
  <SwitchInput v-model="s.eduarteQuoteEnabled" title="Dagelijkse Studie Quote & Tips" subtitle="Inspirerende quotes en handige studietips die dagelijks wisselen." />
  <div class="setting">
    <h3 class="setting-title">Kaartanimatie Intensiteit</h3>
    <input class="range" type="range" min="0" max="100" v-model.number="s.eduarteAnimationSpeed">
    <div class="range-value">Animatie-snelheid</div>
  </div>
</template>

<style scoped>
.location-button { margin-top: 10px; }
.location-status { display: block; margin-top: 8px; color: var(--color-primary); font: var(--typescale-body-small); }
</style>
