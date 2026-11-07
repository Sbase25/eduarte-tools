<script setup>
import SwitchInput from "../components/SwitchInput.vue";
import MaterialTextField from "../components/MaterialTextField.vue";

const props = defineProps(["state"]);
const s = props.state;
</script>

<template>
  <SwitchInput v-model="s.eduarteEnabled" title="Automatisch inloggen" subtitle="Werkt op alle ingestelde Eduarte- en Microsoft-loginpagina's." />
  <div class="setting">
    <MaterialTextField v-model="s.eduarteUsername" label="Gebruikersnaam" placeholder="naam@school.nl" autocomplete="off" />
    <span class="setting-subtitle">Je gebruikersnaam wordt automatisch ingevuld.</span>
  </div>
  <div class="setting">
    <MaterialTextField v-model="s.eduartePassword" label="Wachtwoord" type="password" placeholder="Wachtwoord" autocomplete="off" />
  </div>
  <SwitchInput v-model="s.eduarteAutosubmit" title="Automatisch verzenden" subtitle="Klik na het invullen automatisch op inloggen." />
</template>
