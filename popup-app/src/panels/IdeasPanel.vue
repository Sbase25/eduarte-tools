<template>
  <p class="note">Ideeën voor toekomstige, optionele functies. Zo blijft Eduarte Tools nuttig zonder je portaal onnodig te veranderen.</p>
  <div class="ideas-grid">
    <article class="idea-card">
      <span class="idea-icon">📅</span><h3>Weekplanner</h3>
      <p>Een rustig overzicht van lessen, deadlines en toetsmomenten voor de komende zeven dagen.</p>
    </article>
    <article class="idea-card">
      <span class="idea-icon">🔔</span><h3>Deadline-herinneringen</h3>
      <p>Lokale browsermeldingen voor opdrachten die bijna ingeleverd moeten worden.</p>
    </article>
    <article class="idea-card">
      <span class="idea-icon">📈</span><h3>Cijfertrend</h3>
      <p>Een duidelijke grafiek per vak, met voortgang naar je eigen streefgemiddelde.</p>
    </article>
    <article class="idea-card">
      <span class="idea-icon">🧭</span><h3>Studie-route</h3>
      <p>Snelle links die zich aanpassen aan de Eduarte-pagina die je het vaakst gebruikt.</p>
    </article>
    <article class="idea-card">
      <span class="idea-icon">🌱</span><h3>Focus-modus</h3>
      <p>Een minimalistische weergave die afleiding vermindert tijdens een studiesessie.</p>
    </article>
    <article class="idea-card">
      <span class="idea-icon">♿</span><h3>Toegankelijkheid</h3>
      <p>Extra contrast, tekstgrootte en dyslexievriendelijke lettertypeopties per portaal.</p>
    </article>
  </div>
</template>

<style scoped>
.ideas-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 10px; }
.idea-card { padding: 14px; border: 1px solid var(--color-surface-container-high); border-radius: 18px; background: var(--color-surface-container-low); }
.idea-icon { font-size: 22px; }
h3 { margin: 7px 0 4px; color: var(--color-on-surface); font: var(--typescale-title-small); }
p { margin: 0; color: var(--color-on-surface-variant); font: var(--typescale-body-small); line-height: 1.4; }
</style>
