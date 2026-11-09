<script setup>
import { ref } from "vue";
import SwitchInput from "../components/SwitchInput.vue";
import MaterialTextField from "../components/MaterialTextField.vue";
import MaterialSlider from "../components/MaterialSlider.vue";
import OutlookSync from "../components/OutlookSync.vue";

const props = defineProps(["state"]);
const s = props.state;
const locationStatus = ref("");
const requestingLocation = ref(false);

function useCurrentLocation() {
  if (typeof chrome === "undefined" || !chrome.runtime?.sendMessage) {
    locationStatus.value = "Locatie werkt alleen vanuit de geïnstalleerde extensie.";
    return;
  }

  if (requestingLocation.value) return;
  requestingLocation.value = true;
  locationStatus.value = "Locatie ophalen...";
  chrome.runtime.sendMessage({ type: "START_LOCATION_TRACKING" }, (response) => {
    requestingLocation.value = false;
    const runtimeError = chrome.runtime.lastError;
    if (runtimeError) {
      locationStatus.value = `Locatie kon niet worden opgehaald: ${runtimeError.message}`;
      return;
    }

    if (response?.success && response.coordinates) {
      s.eduarteWeatherCoordinates = response.coordinates;
      s.eduarteWeatherUseLocation = true;
      locationStatus.value = "Locatie ingesteld. Het weer wordt bijgewerkt.";
      return;
    }

    const messages = {
      1: "Locatietoegang is geweigerd. Controleer de locatie-instellingen van je browser.",
      2: "Je locatie is niet beschikbaar. Controleer of locatieservices zijn ingeschakeld.",
      3: "Het ophalen van je locatie duurde te lang. Controleer je verbinding en probeer het opnieuw.",
    };
    locationStatus.value = messages[response?.code] || response?.error || "Locatie kon niet worden opgehaald.";
  });
}
</script>

<template>
  <p class="note">Kies welke widgets je op je Eduarte startpagina / dashboard wilt zien.</p>
  <SwitchInput v-model="s.eduarteStartEnabled" title="Startpagina Verbeteringen" subtitle="Schakel de aangepaste widget-laag en animaties in." />
  <SwitchInput v-model="s.eduarteWeatherEnabled" title="Weerbericht-widget" subtitle="Toont het actuele weerbericht, temperatuur en neerslagkans." />
  <div class="setting">
    <h3 class="setting-title">Weer op basis van je locatie</h3>
    <span class="setting-subtitle">Gebruik je huidige locatie voor automatisch bijgewerkt weer. De extensie werkt de locatie bij wanneer je verplaatst.</span>
    <md-filled-tonal-button class="location-button" type="button" :disabled="requestingLocation" @click="useCurrentLocation">
      {{ requestingLocation ? "Locatie ophalen..." : "Gebruik huidige locatie" }}
    </md-filled-tonal-button>
    <span v-if="locationStatus" class="location-status" role="status">{{ locationStatus }}</span>
  </div>
  <div class="setting">
    <MaterialTextField v-model="s.eduarteWeatherCity" label="Plaatsnaam als alternatief" placeholder="Utrecht" autocomplete="off" />
    <span class="setting-subtitle">Gebruik dit alleen wanneer je geen locatietoegang wilt geven (bijv. Utrecht).</span>
  </div>
  <SwitchInput v-model="s.eduarteGreetingEnabled" title="Persoonlijke Begroeting & Datum" subtitle="Toon een groet (bijv. Goedemorgen) en de datum bovenaan." />
  <SwitchInput v-model="s.eduarteShortcutsEnabled" title="Snelkoppelingen (Quick Links)" subtitle="Knoppen naar Teams, Outlook Webmail, OneDrive, Office 365 en Cijfers." />
  <SwitchInput v-model="s.eduartePomodoroEnabled" title="Pomodoro Focus Timer" subtitle="Interactieve studie- en pauzetimer (25m focus, 5m pauze) op je dashboard." />
  <SwitchInput v-model="s.eduarteTodayEnabled" title="Vandaag & Nu bezig" subtitle="Je huidige les met voortgang en een tijdlijn van de lessen van vandaag." />
  <SwitchInput v-model="s.eduarteCompactAgenda" title="Compacte agenda" subtitle="Hele week op één scherm, korte lesnamen en een kleur per vak." />
  <SwitchInput v-model="s.eduarteQuickCalcEnabled" title="Snelle Cijfercalculator Widget" subtitle="Bereken direct op je dashboard welk cijfer je nodig hebt voor een streefgemiddelde." />
  <div class="setting">
    <h3 class="setting-title">Kaartanimatie Intensiteit</h3>
    <MaterialSlider v-model="s.eduarteAnimationSpeed" min="0" max="100" label="Animatie-snelheid" />
    <div class="range-value">Animatie-snelheid</div>
  </div>
  <OutlookSync :state="s" />
</template>

<style scoped>
.location-button { margin-top: 10px; }
.location-status { display: block; margin-top: 8px; color: var(--color-primary); font: var(--typescale-body-small); }
</style>
