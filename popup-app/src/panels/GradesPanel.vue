<script setup>
import SwitchInput from "../components/SwitchInput.vue";
import MaterialSlider from "../components/MaterialSlider.vue";

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
    <MaterialSlider v-model="s.eduarteGradeMinimum" min="0" max="10" step=".1" label="Ondergrens cijfers" />
    <div class="range-value">{{ fmt(s.eduarteGradeMinimum) }}</div>
  </div>
  <div class="setting">
    <h3 class="setting-title">Bovengrens cijfers</h3>
    <MaterialSlider v-model="s.eduarteGradeMaximum" min="1" max="10" step=".1" label="Bovengrens cijfers" />
    <div class="range-value">{{ fmt(s.eduarteGradeMaximum) }}</div>
  </div>
  <div class="setting">
    <h3 class="setting-title">Voldoendegrens</h3>
    <MaterialSlider v-model="s.eduartePassThreshold" min="1" max="10" step=".1" label="Voldoendegrens" />
    <div class="range-value">{{ fmt(s.eduartePassThreshold) }}</div>
  </div>
</template>
