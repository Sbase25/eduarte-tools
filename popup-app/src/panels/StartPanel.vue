<script setup>
import SwitchInput from "../components/SwitchInput.vue";

const props = defineProps(["state"]);
const s = props.state;
</script>

<template>
  <p class="note">Kies welke widgets je op je Eduarte startpagina / dashboard wilt zien.</p>
  <SwitchInput v-model="s.eduarteStartEnabled" title="Startpagina Verbeteringen" subtitle="Schakel de aangepaste widget-laag en animaties in." />
  <SwitchInput v-model="s.eduarteWeatherEnabled" title="Weerbericht-widget" subtitle="Toont het actuele weerbericht, temperatuur en neerslagkans." />
  <div class="setting">
    <h3 class="setting-title">Locatie / Plaatsnaam voor weer</h3>
    <span class="setting-subtitle">Voer je woonplaats of schoolstad in (bijv. Utrecht, Amsterdam, Rotterdam).</span>
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
