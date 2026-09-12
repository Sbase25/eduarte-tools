<script setup>
import SwitchInput from "../components/SwitchInput.vue";

const props = defineProps(["state"]);
const s = props.state;
</script>

<template>
  <SwitchInput v-model="s.eduarteEnabled" title="Automatisch inloggen" subtitle="Werkt op alle ingestelde Eduarte- en Microsoft-loginpagina's." />
  <div class="setting">
    <h3 class="setting-title">Gebruikersnaam</h3>
    <span class="setting-subtitle">Je gebruikersnaam wordt automatisch ingevuld.</span>
    <input type="text" v-model="s.eduarteUsername" placeholder="naam@school.nl" autocomplete="off">
  </div>
  <div class="setting">
    <h3 class="setting-title">Wachtwoord</h3>
    <input type="password" v-model="s.eduartePassword" placeholder="Wachtwoord" autocomplete="off">
  </div>
  <SwitchInput v-model="s.eduarteAutosubmit" title="Automatisch verzenden" subtitle="Klik na het invullen automatisch op inloggen." />
</template>
