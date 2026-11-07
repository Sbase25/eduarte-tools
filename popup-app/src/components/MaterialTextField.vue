<script setup>
defineProps({
  modelValue: { type: [String, Number], default: "" },
  label: { type: String, required: true },
  type: { type: String, default: "text" },
  placeholder: { type: String, default: "" },
  autocomplete: { type: String, default: undefined },
});

const emit = defineEmits(["update:modelValue"]);
</script>

<template>
  <md-outlined-text-field
    class="material-text-field"
    :label="label"
    :type="type"
    :value="modelValue"
    :placeholder="placeholder"
    :autocomplete="autocomplete"
    @input="emit('update:modelValue', $event.target.value)"
  />
</template>
