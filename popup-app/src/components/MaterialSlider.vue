<script setup>
defineProps({
  modelValue: { type: Number, required: true },
  min: { type: [Number, String], default: 0 },
  max: { type: [Number, String], default: 100 },
  step: { type: [Number, String], default: 1 },
  label: { type: String, required: true },
});

const emit = defineEmits(["update:modelValue"]);
</script>

<template>
  <md-slider
    class="material-slider"
    :value="modelValue"
    :min="min"
    :max="max"
    :step="step"
    :aria-label="label"
    labeled
    @input="emit('update:modelValue', Number($event.target.value))"
  />
</template>
