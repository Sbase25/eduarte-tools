<script setup>
defineProps({ title: String, subtitle: String });
</script>

<template>
  <header id="top-app-bar">
    <div>
      <h1 id="app-heading">{{ title }}</h1>
      <span id="app-subheading">{{ subtitle }}</span>
    </div>
  </header>
</template>

<style scoped>
#top-app-bar {
  position: sticky;
  top: 0;
  z-index: 5;
  display: flex;
  align-items: center;
  min-height: 68px;
  padding: 8px 20px;
  border-bottom: 1px solid var(--color-outline-variant);
  border-radius: 0 0 20px 20px;
  background: var(--color-surface);
}
#app-heading {
  margin: 0;
  font: var(--typescale-title-large);
  color: var(--color-on-surface);
}
#app-heading:after { content: '.'; color: var(--color-tertiary); }
#app-subheading { display: none; }
</style>
