<script setup>
defineProps({ title: String, subtitle: String });
</script>

<template>
  <div class="setting">
    <div v-if="title || $slots.title" class="setting-text">
      <h3 class="setting-title"><slot name="title">{{ title }}</slot></h3>
      <span v-if="subtitle || $slots.subtitle" class="setting-subtitle"><slot name="subtitle">{{ subtitle }}</slot></span>
    </div>
    <slot />
  </div>
</template>
