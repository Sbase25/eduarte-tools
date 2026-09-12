<script setup>
import SwitchInput from "../components/SwitchInput.vue";

const props = defineProps(["state"]);
const s = props.state;

function fmt(n) {
  return Number(n).toLocaleString("nl-NL", { minimumFractionDigits: 1, maximumFractionDigits: 1 });
}
</script>

<template>
  <SwitchInput v-model="s.eduarteGradesEnabled" title="Cijferoverzicht verbeteren" subtitle="Toon de Study Tools-achtige calculator als overlay op /resultaten." />
  <div class="setting">
    <h3 class="setting-title">Ondergrens cijfers</h3>
    <input class="range" type="range" min="0" max="10" step=".1" v-model.number="s.eduarteGradeMinimum">
    <div class="range-value">{{ fmt(s.eduarteGradeMinimum) }}</div>
  </div>
  <div class="setting">
    <h3 class="setting-title">Bovengrens cijfers</h3>
    <input class="range" type="range" min="1" max="10" step=".1" v-model.number="s.eduarteGradeMaximum">
    <div class="range-value">{{ fmt(s.eduarteGradeMaximum) }}</div>
  </div>
  <div class="setting">
    <h3 class="setting-title">Voldoendegrens</h3>
    <input class="range" type="range" min="1" max="10" step=".1" v-model.number="s.eduartePassThreshold">
    <div class="range-value">{{ fmt(s.eduartePassThreshold) }}</div>
  </div>
</template>
