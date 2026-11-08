<template>
  <p class="note">Eduarte Tools is een moderne hulpmodule voor Eduarte-omgevingen, met een Study Tools-geïnspireerde bediening.</p>
  <div class="setting">
    <h3 class="setting-title">Ondersteunde omgevingen</h3>
    <span class="setting-subtitle">Eduarte- en Educus-portalen met de standaard Eduarte- of Microsoft-login.</span>
  </div>
  <div class="setting">
    <h3 class="setting-title">Volg Eduarte Tools</h3>
    <span class="setting-subtitle">
      Nieuws, tips en updates op Instagram:
      <a :href="instagramUrl" target="_blank" rel="noopener noreferrer">@{{ instagramHandle }}</a>
    </span>
  </div>
  <div class="setting">
    <h3 class="setting-title">Privacy</h3>
    <span class="setting-subtitle">Logininstellingen en voorkeuren worden alleen opgeslagen in chrome.storage.local.</span>
  </div>
</template>

<script setup>
const instagramHandle = 'eduartetools'
const instagramUrl = `https://www.instagram.com/${instagramHandle}/`
</script>
