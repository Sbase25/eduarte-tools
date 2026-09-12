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
  padding: 16px 18px 10px;
  background: linear-gradient(var(--color-surface) 78%, transparent);
}
#app-heading {
  margin: 0;
  font: var(--typescale-title-large);
  color: var(--color-on-surface);
  letter-spacing: -.02em;
}
#app-heading:after { content: '.'; color: var(--mg-orange); }
#app-subheading {
  display: block;
  margin-top: 2px;
  color: var(--color-on-surface-variant);
  font: var(--typescale-body-small);
}
</style>
