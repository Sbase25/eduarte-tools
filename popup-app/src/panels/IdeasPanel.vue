<template>
  <p class="note">Ideeën voor toekomstige, optionele functies. Zo blijft Eduarte Tools nuttig zonder je portaal onnodig te veranderen.</p>
  <div class="ideas-grid">
    <article class="idea-card">
      <span class="idea-icon"><Icon>calendar_month</Icon></span><h3>Weekplanner</h3>
      <p>Een rustig overzicht van lessen, deadlines en toetsmomenten voor de komende zeven dagen.</p>
    </article>
    <article class="idea-card">
      <span class="idea-icon"><Icon>notifications_active</Icon></span><h3>Deadline-herinneringen</h3>
      <p>Lokale browsermeldingen voor opdrachten die bijna ingeleverd moeten worden.</p>
    </article>
    <article class="idea-card">
      <span class="idea-icon"><Icon>trending_up</Icon></span><h3>Cijfertrend</h3>
      <p>Een duidelijke grafiek per vak, met voortgang naar je eigen streefgemiddelde.</p>
    </article>
    <article class="idea-card">
      <span class="idea-icon"><Icon>explore</Icon></span><h3>Studie-route</h3>
      <p>Snelle links die zich aanpassen aan de Eduarte-pagina die je het vaakst gebruikt.</p>
    </article>
    <article class="idea-card">
      <span class="idea-icon"><Icon>center_focus_strong</Icon></span><h3>Focus-modus</h3>
      <p>Een minimalistische weergave die afleiding vermindert tijdens een studiesessie.</p>
    </article>
    <article class="idea-card">
      <span class="idea-icon"><Icon>accessibility_new</Icon></span><h3>Toegankelijkheid</h3>
      <p>Extra contrast, tekstgrootte en dyslexievriendelijke lettertypeopties per portaal.</p>
    </article>
  </div>
</template>

<script setup>
import Icon from "../components/Icon.vue";
</script>

<style scoped>
.ideas-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 12px; }
.idea-card { min-height: 138px; padding: 16px; border: 1px solid var(--color-outline-variant); border-radius: 22px 22px 8px 22px; background: var(--color-surface-container-low); transition: transform 180ms cubic-bezier(.2,.8,.2,1), background-color 180ms ease; }
.idea-card:hover { transform: translateY(-2px); background: var(--color-surface-container); }
.idea-icon { display: grid; width: 40px; height: 40px; place-items: center; border-radius: 15px 15px 5px 15px; color: var(--color-on-tertiary-container); background: var(--color-tertiary-container); }
.idea-icon :deep(.icon) { font-size: 21px; }
h3 { margin: 12px 0 5px; color: var(--color-on-surface); font: var(--typescale-title-small); }
p { margin: 0; color: var(--color-on-surface-variant); font: var(--typescale-body-small); line-height: 1.45; }
</style>
