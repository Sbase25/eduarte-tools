<script setup>
import SwitchInput from "../components/SwitchInput.vue";

const props = defineProps(["state"]);
const s = props.state;
</script>

<template>
  <SwitchInput v-model="s.eduarteModernNav" title="Moderne menubalk" subtitle="Geef de Eduarte-zijbalk afgeronde knoppen en een accentindicator." />
  <SwitchInput v-model="s.eduarteAnimations" title="Animaties" subtitle="Zachte overgangen bij kaarten, knoppen en navigatie." />
  <SwitchInput v-model="s.eduarteFloatingCards" title="Kaarten laten zweven" subtitle="Voeg diepte en hover-effecten toe aan Eduarte-kaarten." />
  <SwitchInput v-model="s.eduarteBadgeEnabled" title="Meldingen-badge op extensie-icoon" subtitle="Toont het aantal ongelezen items uit Eduarte als cijfer op het extensie-icoon." />
</template>
