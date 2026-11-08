<script setup>
import { onBeforeUnmount, onMounted, ref } from "vue";
import Icon from "../components/Icon.vue";
import { drawGradeCards } from "../pack-cards.js";
import { loadCollection, mergeCollection, saveCollection } from "../collection.js";
import { playSound, setSoundEnabled } from "../sound.js";

const isOpening = ref(false);
const isOpen = ref(false);
const gradePool = ref([]);
const revealedCards = ref([]);
const sceneTransform = ref("");
const gradesReady = ref(false);
const gradeLoadError = ref("");
let revealTimer;

async function loadGradeTransfer() {
  const transferKey = new URLSearchParams(window.location.search).get("transfer");
  if (!transferKey) {
    gradesReady.value = true;
    return;
  }

  window.history.replaceState(null, "", window.location.pathname);
  if (typeof chrome === "undefined" || !chrome.storage?.session) {
    gradeLoadError.value = "De Eduarte-cijfers konden niet veilig worden opgehaald.";
    gradesReady.value = true;
    return;
  }

  const stored = await chrome.storage.session.get(transferKey);
  await chrome.storage.session.remove(transferKey);
  gradePool.value = Array.isArray(stored[transferKey]) ? stored[transferKey] : [];
  gradesReady.value = true;
}

const newCardCount = ref(0);

async function revealCards() {
  const drawn = drawGradeCards(gradePool.value);
  revealedCards.value = drawn;
  newCardCount.value = 0;
  if (drawn.length) {
    playSound("reveal");
    try {
      const { collection, added } = mergeCollection(await loadCollection(), drawn);
      newCardCount.value = added.length;
      if (added.length) await saveCollection(collection);
    } catch (error) {
      console.error("Eduarte Tools kon de kaarten niet lokaal bewaren.", error);
    }
  }
}

function openTeam() {
  if (typeof chrome !== "undefined" && chrome.runtime?.sendMessage) {
    chrome.runtime.sendMessage({ type: "OPEN_EDUARTE_TOOLS_PAGE", page: "team" });
  } else {
    window.open(new URL("/team.html", window.location.href).href, "_blank", "noopener");
  }
}

function openPack() {
  if (isOpening.value || !gradesReady.value) return;
  clearTimeout(revealTimer);
  isOpening.value = true;
  isOpen.value = false;
  revealedCards.value = [];
  revealTimer = setTimeout(() => {
    revealCards();
    isOpening.value = false;
    isOpen.value = true;
    sceneTransform.value = "";
  }, 800);
}

function skipOpening() {
  clearTimeout(revealTimer);
  revealCards();
  isOpening.value = false;
  isOpen.value = true;
  sceneTransform.value = "";
}

function formatGrade(value) {
  return value.toLocaleString("nl-NL", { maximumFractionDigits: 2 });
}

function tiltPack(event) {
  if (isOpening.value || isOpen.value || !window.matchMedia("(pointer:fine)").matches) return;
  const bounds = event.currentTarget.getBoundingClientRect();
  const x = (event.clientX - bounds.left) / bounds.width - 0.5;
  const y = (event.clientY - bounds.top) / bounds.height - 0.5;
  sceneTransform.value = `rotateY(${x * 18}deg) rotateX(${-y * 14}deg)`;
}

function resetPackTilt() {
  sceneTransform.value = "";
}

function openSettings() {
  if (typeof chrome !== "undefined" && chrome.runtime?.getURL && chrome.tabs?.create) {
    chrome.tabs.create({ url: chrome.runtime.getURL("popup-dist/index.html") });
  } else {
    window.open(new URL("/index.html", window.location.href).href, "_blank", "noopener");
  }
}

onMounted(() => {
  if (typeof chrome !== "undefined" && chrome.storage?.local) {
    chrome.storage.local.get("eduarteTeamSound").then((settings) => setSoundEnabled(settings.eduarteTeamSound !== false));
  }
  loadGradeTransfer().catch((error) => {
    console.error("Eduarte Tools could not load the local grade transfer.", error);
    gradeLoadError.value = "De Eduarte-cijfers konden niet worden opgehaald. Open Packs opnieuw vanaf Eduarte.";
    gradesReady.value = true;
  });
});

onBeforeUnmount(() => clearTimeout(revealTimer));
</script>

<template>
  <main class="page">
    <header class="topbar">
      <div class="brand" aria-label="Eduarte Tools">
        <span class="brand-icon"><Icon>school</Icon></span>
        <span>Eduarte <b>Tools</b></span>
      </div>
      <div class="top-actions">
        <span class="source-label"><i></i> LOKALE EDUARTE-CIJFERS</span>
        <md-text-button type="button" @click="openTeam">Mijn team</md-text-button>
        <md-icon-button class="settings-button" aria-label="Extensie-instellingen" title="Extensie-instellingen" @click="openSettings">
          <svg slot="icon" viewBox="0 0 24 24" aria-hidden="true"><path d="M19.14 12.94a7.5 7.5 0 0 0 .05-1.88l2.03-1.58-2-3.46-2.42.98a7.3 7.3 0 0 0-1.63-.94L14.8 3h-4l-.37 3.06a7.3 7.3 0 0 0-1.63.94l-2.42-.98-2 3.46 2.03 1.58a7.5 7.5 0 0 0 0 1.88l-2.03 1.58 2 3.46 2.42-.98c.5.4 1.05.72 1.63.94L10.8 21h4l.37-3.06c.58-.22 1.13-.54 1.63-.94l2.42.98 2-3.46-2.08-1.58ZM12.8 15.5a3.5 3.5 0 1 1 0-7 3.5 3.5 0 0 1 0 7Z" /></svg>
        </md-icon-button>
      </div>
    </header>

    <div class="content">
      <section class="intro">
        <p class="eyebrow">EDUARTE TOOLS <span>·</span> PACK OPENING</p>
        <h1>{{ isOpen ? "Jouw cijfers." : "Open het pack." }}</h1>
        <p>{{ isOpen ? `${revealedCards.length} Eduarte-cijfers uit jouw pack${newCardCount ? `, ${newCardCount} nieuw in je verzameling` : ""}.` : "Klik op het pack om je Eduarte-cijfers te onthullen." }}</p>
      </section>

      <section class="pack-area" :class="{ 'is-opening': isOpening, 'is-open': isOpen }">
        <div v-if="!isOpen" class="pack3d-stage">
          <div class="spotlight-beam"></div>
          <div class="pack3d-scene" :style="{ transform: sceneTransform }" @pointermove="tiltPack" @pointerleave="resetPackTilt">
            <button
              class="pack3d-box"
              :class="{ ripping: isOpening }"
              type="button"
              :disabled="isOpening || !gradesReady"
              :aria-busy="isOpening"
              aria-label="Open het Eduarte School Pack"
              @click="openPack"
            >
              <span class="pack3d-top-cap" aria-hidden="true">
                <span class="cap-crimp"></span>
                <span class="cap-front"></span>
              </span>
              <span class="pack3d-body" aria-hidden="true">
                <span class="pface3d pfront">
                  <span class="foil-texture"></span>
                  <span class="foil-specular"></span>
                  <span class="foil-rainbow-holo"></span>
                  <span class="pack3d-brand">EDUARTE TOOLS</span>
                  <span class="pack3d-badge">SCHOOL PACK</span>
                  <span class="pack3d-icon"><Icon>school</Icon></span>
                  <span class="pack3d-vak">VAK<br>STARS</span>
                  <span class="pack3d-seal">STUDENT EDITION</span>
                  <span class="pack3d-bottom-crimp"></span>
                </span>
                <span class="pface3d pback">
                  <span class="pack3d-back-logo">EDUARTE</span>
                  <span class="pack3d-barcode">|||||||||||||||||||||||||</span>
                </span>
                <span class="pface3d pleft"></span>
                <span class="pface3d pright"></span>
                <span class="pface3d pbottom"></span>
              </span>
              <span class="pack3d-burst" aria-hidden="true"></span>
            </button>
          </div>
          <div class="pack3d-prompt" aria-live="polite">
            <span class="prompt-glow">{{ !gradesReady ? "EDUARTE-CIJFERS LADEN..." : isOpening ? "PACK WORDT GEOPEND..." : "KLIK OP HET PACK OM TE OPENEN" }}</span>
          </div>
          <md-text-button v-if="isOpening" class="skip-button" type="button" @click="skipOpening">Overslaan</md-text-button>
        </div>

        <div v-else-if="revealedCards.length" class="reveal" aria-live="polite">
          <article
            v-for="(card, index) in revealedCards"
            :key="card.id"
            class="player-card"
            :style="{ '--delay': `${index * 140}ms` }"
          >
            <div class="card-frame"><span></span></div>
            <div class="card-top"><strong>{{ formatGrade(card.result) }}</strong><span>CIJFER</span></div>
            <div class="card-art"><span class="art-glow"></span><Icon>school</Icon></div>
            <div class="card-info">
              <span>EDUARTE-RESULTAAT</span>
              <h2>{{ card.subject }}</h2>
              <div class="card-rating"><span>WEGING</span><strong>{{ card.weight ? `${formatGrade(card.weight)}×` : "—" }}</strong></div>
            </div>
          </article>
        </div>
        <div v-else-if="isOpen" class="empty-state" aria-live="polite">
          <Icon>school</Icon>
          <h2>{{ gradeLoadError ? "Cijfers niet geladen." : "Geen cijfers gevonden." }}</h2>
          <p>{{ gradeLoadError || "Open Packs vanaf een Eduarte-resultatenpagina om je cijfers lokaal mee te nemen." }}</p>
        </div>
      </section>

      <div class="controls">
        <md-filled-button v-if="isOpen" class="open-button" type="button" @click="isOpen = false; revealedCards = []">
          Nog een pack openen
        </md-filled-button>
        <p class="disclaimer"><Icon>info</Icon> Cijfers worden alleen lokaal uit de geopende Eduarte-pagina gelezen. Onthulde kaarten (vak, cijfer, rating) worden alleen op dit apparaat bewaard voor Mijn team en nooit verstuurd.</p>
      </div>
    </div>
  </main>
</template>

<style scoped>
.page { --bg: #111318; --panel: #181a21; --line: #ffffff18; --color-primary: #d7c3ff; --color-on-primary: #311d57; --color-primary-container: #49356d; --color-on-primary-container: #f1e7ff; --color-secondary-container: #4a4458; --color-on-secondary-container: #e8def8; --color-surface: #111318; --color-surface-container: #1d1b22; --color-surface-container-low: #18171d; --color-outline-variant: #ffffff20; --color-on-surface: #f3f0f7; --color-on-surface-variant: #c8c2d0; --md-sys-color-primary: var(--color-primary); --md-sys-color-on-primary: var(--color-on-primary); --md-sys-color-primary-container: var(--color-primary-container); --md-sys-color-on-primary-container: var(--color-on-primary-container); --md-sys-color-surface: var(--color-surface); --md-sys-color-surface-container: var(--color-surface-container); --md-sys-color-on-surface: var(--color-on-surface); --md-sys-color-on-surface-variant: var(--color-on-surface-variant); --md-ref-typeface-brand: system-ui, sans-serif; --md-ref-typeface-plain: system-ui, sans-serif; --md-filled-button-container-shape: 18px 18px 6px 18px; min-height: 100vh; color: #f3f3f5; background: var(--bg); font-family: var(--md-ref-typeface-plain); }
.topbar { height: 68px; display: flex; align-items: center; justify-content: space-between; padding-inline: clamp(20px, 5vw, 72px); border-bottom: 1px solid var(--line); background: #111318cc; }
.brand { display: flex; align-items: center; gap: 9px; color: #f4f3f7; text-decoration: none; font: 650 14px/1 system-ui, sans-serif; letter-spacing: -.02em; }
.brand b { color: #aaa5b7; font-weight: 500; }
.brand-icon { display: grid; width: 31px; height: 31px; place-items: center; border: 1px solid #ffffff20; border-radius: 9px; color: #d7c3ff; background: #8d5be91b; }
.brand-icon :deep(.icon) { font-size: 18px; }
.top-actions { display: flex; align-items: center; gap: 15px; }
.source-label { display: flex; align-items: center; gap: 6px; color: #b7b6c1; font: 700 9px system-ui, sans-serif; letter-spacing: .13em; }
.source-label i { width: 6px; height: 6px; border-radius: 50%; background: #76cfa5; }
.settings-button { --md-icon-button-icon-color: #d9d2e3; --md-icon-button-icon-size: 20px; --md-icon-button-state-layer-shape: 16px 16px 6px 16px; }
.settings-button svg { width: 20px; height: 20px; fill: currentColor; }
.content { width: min(1050px, calc(100% - 40px)); margin: 0 auto; padding: 46px 0 32px; }
.intro { margin-bottom: 25px; }
.eyebrow { margin: 0 0 12px; color: #a9a4b4; font: 700 9px system-ui, sans-serif; letter-spacing: .14em; }
.eyebrow span { padding-inline: 5px; color: #777682; }
.intro h1 { margin: 0; font: 700 clamp(27px, 4vw, 38px)/1.15 system-ui, sans-serif; letter-spacing: -.045em; }
.intro > p:last-child { margin: 8px 0 0; color: #a5a5af; font: 400 13px/1.6 system-ui, sans-serif; }
.pack-area { position: relative; display: grid; min-height: min(500px, 61vh); place-items: center; overflow: hidden; border: 1px solid #ffffff20; border-radius: 28px 28px 10px 28px; background: radial-gradient(circle at 50% 40%, #282331, #14151b 74%); isolation: isolate; perspective: 1200px; }
.pack3d-stage { position: relative; display: flex; width: 100%; min-height: inherit; flex-direction: column; align-items: center; justify-content: center; overflow: hidden; }
.spotlight-beam { position: absolute; top: -110px; width: 350px; height: 650px; background: radial-gradient(ellipse at 50% 0%, #e8c97938, #9774d51a 40%, transparent 70%); filter: blur(32px); pointer-events: none; animation: spotlightPulse 4s ease-in-out infinite; }
.pack3d-scene { position: relative; z-index: 1; perspective: 1200px; transform-style: preserve-3d; transition: transform 120ms ease-out; }
.pack3d-box { --pack-w: clamp(168px, 22vw, 224px); --pack-h: calc(var(--pack-w) * 1.42); --pack-depth: 28px; position: relative; display: block; width: var(--pack-w); height: var(--pack-h); padding: 0; border: 0; background: transparent; transform-style: preserve-3d; animation: packFloat3D 3.6s ease-in-out infinite; transition: transform 500ms cubic-bezier(.1,.9,.2,1); cursor: pointer; }
.pack3d-box:focus-visible { outline: 2px solid #d5bd79; outline-offset: 10px; border-radius: 14px; }
.pack3d-box:disabled { cursor: default; }
.pack3d-body { position: absolute; inset: 0; transform-style: preserve-3d; }
.pface3d { position: absolute; box-sizing: border-box; backface-visibility: hidden; }
.pface3d.pfront { display: flex; width: var(--pack-w); height: var(--pack-h); flex-direction: column; align-items: center; justify-content: space-between; padding: 22px 15px; overflow: hidden; transform: translateZ(calc(var(--pack-depth) / 2)); border: 1px solid #e5cb8b91; border-radius: 11px; background: linear-gradient(135deg, #19160e, #443617 30%, #201c13 72%, #12120f); box-shadow: 0 25px 60px #000c, inset 0 0 30px #e4c15c22; }
.pface3d.pfront::before { position: absolute; inset: 0; background: radial-gradient(ellipse at 50% 43%, #f3d78b2b, transparent 55%), repeating-linear-gradient(135deg, transparent 0 21px, #fff1c309 22px 23px); content: ""; }
.pface3d.pback { display: flex; width: var(--pack-w); height: var(--pack-h); flex-direction: column; align-items: center; justify-content: center; gap: 20px; transform: rotateY(180deg) translateZ(calc(var(--pack-depth) / 2)); border: 1px solid #c1a86755; border-radius: 11px; background: linear-gradient(135deg, #13120f, #252116); }
.pack3d-back-logo { color: #d7c27f99; font-size: 1.5rem; font-weight: 900; letter-spacing: .1em; }
.pack3d-barcode { color: #ffffff66; font: 12px monospace; letter-spacing: 2px; }
.pface3d.pleft, .pface3d.pright { top: 0; left: calc((var(--pack-w) - var(--pack-depth)) / 2); width: var(--pack-depth); height: var(--pack-h); border-block: 1px solid #dac27666; background: linear-gradient(#584820, #a68b4b 30%, #302816 72%, #17150f); }
.pface3d.pleft { transform: rotateY(-90deg) translateZ(calc(var(--pack-w) / 2)); }
.pface3d.pright { transform: rotateY(90deg) translateZ(calc(var(--pack-w) / 2)); }
.pface3d.pbottom { top: calc((var(--pack-h) - var(--pack-depth)) / 2); left: 0; width: var(--pack-w); height: var(--pack-depth); transform: rotateX(-90deg) translateZ(calc(var(--pack-h) / 2)); background: #292317; }
.foil-texture { position: absolute; inset: 0; background: repeating-linear-gradient(0deg, #ffffff0f 0, transparent 2px, #0000001a 4px); pointer-events: none; }
.foil-specular { position: absolute; inset: -100%; background: linear-gradient(115deg, transparent 40%, #ffffff50 48%, #fff0a066 52%, transparent 60%); transform: translateX(-60%); animation: foilShine 4.2s ease-in-out infinite; pointer-events: none; }
.foil-rainbow-holo { position: absolute; inset: 0; background: linear-gradient(130deg, #ff008014, #00ffc814, #ffd70019); mix-blend-mode: color-dodge; pointer-events: none; }
.pack3d-brand, .pack3d-badge, .pack3d-icon, .pack3d-vak, .pack3d-seal { z-index: 2; }
.pack3d-brand { color: #e8d69f; font-size: 8px; font-weight: 900; letter-spacing: .2em; text-shadow: 0 0 10px #d7b74a66; }
.pack3d-badge { padding: 4px 11px; border: 1px solid #e6ce8c88; border-radius: 99px; color: #f1e4be; background: #b5994b2e; font-size: 8px; font-weight: 850; letter-spacing: .1em; }
.pack3d-icon { color: #e7d18f; filter: drop-shadow(0 0 15px #e5c76f7a); }
.pack3d-icon :deep(.icon) { font-size: clamp(38px, 5vw, 54px); }
.pack3d-vak { color: #f6edda; font-size: clamp(22px, 3vw, 30px); font-weight: 950; line-height: .9; letter-spacing: .07em; text-align: center; text-shadow: 0 2px 10px #000; }
.pack3d-seal { color: #ffffff99; font-size: 7px; letter-spacing: .16em; }
.pack3d-bottom-crimp { position: absolute; right: 0; bottom: 0; left: 0; height: 16px; border-top: 1px solid #e0c57266; background: repeating-linear-gradient(90deg, #0005 0 2px, #fff2 2px 4px); }
.pack3d-top-cap { position: absolute; z-index: 10; top: -18px; left: 0; width: var(--pack-w); height: 38px; transform: translateZ(calc(var(--pack-depth) / 2)); transform-style: preserve-3d; transition: transform 650ms cubic-bezier(.15,.85,.35,1.2), opacity 500ms ease; }
.cap-front { position: absolute; inset: 0; border: 1px solid #e5ca83b3; border-bottom: 2px dashed #ffffffbb; border-radius: 10px 10px 0 0; background: linear-gradient(135deg, #242016, #786539, #201b11); }
.cap-crimp { position: absolute; z-index: 1; top: 0; right: 0; left: 0; height: 11px; border-radius: 10px 10px 0 0; background: repeating-linear-gradient(90deg, #0006 0 2px, #fff4 2px 4px); }
.pack3d-burst { position: absolute; z-index: 12; top: 16%; left: 50%; width: 28px; height: 28px; border-radius: 50%; background: radial-gradient(circle, #fff 0%, #e5c56a 38%, #ab83ec 68%, transparent); opacity: 0; filter: blur(5px); pointer-events: none; transform: translate(-50%, -50%) scale(.1); transition: opacity 150ms ease, transform 500ms cubic-bezier(.2,.8,.2,1); }
.pack3d-box.ripping { animation: none; transform: scale(1.16) translateZ(90px) !important; transition: transform 750ms cubic-bezier(.2,.9,.2,1); }
.pack3d-box.ripping .pack3d-body { opacity: 0; transform: scale(.88) rotateY(22deg); transition: transform 620ms ease-in, opacity 500ms ease-in; }
.pack3d-box.ripping .pack3d-top-cap { opacity: 0; transform: translateZ(14px) translateY(-130px) rotateZ(28deg) rotateY(35deg) scale(.9); }
.pack3d-box.ripping .pack3d-burst { opacity: 1; transform: translate(-50%, -50%) scale(18); }
.pack3d-prompt { z-index: 2; margin-top: 28px; }
.prompt-glow { color: #e8d18c; font-size: 10px; font-weight: 850; letter-spacing: .16em; text-shadow: 0 0 16px #e8cd7470; animation: promptPulse 1.8s ease-in-out infinite; }
.skip-button { position: absolute; z-index: 4; right: 18px; bottom: 17px; --md-text-button-label-text-color: var(--color-on-surface); --md-text-button-label-text-font: var(--md-ref-typeface-plain); }
.reveal { display: grid; width: min(690px, calc(100% - 32px)); grid-template-columns: repeat(3, minmax(0, 1fr)); gap: clamp(10px, 2.5vw, 24px); }
.empty-state { width: min(460px, calc(100% - 40px)); padding: 28px; border: 1px solid #ffffff20; border-radius: 24px 24px 8px 24px; color: #c8c2d0; background: #ffffff08; text-align: center; }
.empty-state :deep(.icon) { color: #d7c3ff; font-size: 34px; }
.empty-state h2 { margin: 12px 0 6px; color: #f3f0f7; font: 700 18px system-ui, sans-serif; }
.empty-state p { margin: 0; font: 400 13px/1.6 system-ui, sans-serif; }
.player-card { --accent: #c5a867; position: relative; display: flex; min-width: 0; min-height: 290px; flex-direction: column; padding: 13px 12px 12px; overflow: hidden; border: 1px solid color-mix(in srgb, var(--accent) 45%, #ffffff50); border-radius: 24px 24px 8px 24px; color: #f7f5ef; background: radial-gradient(ellipse at 50% 38%, color-mix(in srgb, var(--accent) 22%, transparent), transparent 54%), linear-gradient(150deg, color-mix(in srgb, var(--accent) 16%, #272832), #1b1c23 75%); box-shadow: 0 12px 27px #0006, inset 0 1px #ffffff27; opacity: 0; animation: revealCard .58s cubic-bezier(.2,.8,.2,1) forwards; animation-delay: var(--delay); }
.card-frame { position: absolute; inset: 5px; border: 1px solid #ffffff18; border-radius: 10px; pointer-events: none; }
.card-top { z-index: 1; display: flex; align-items: flex-start; justify-content: space-between; gap: 4px; }
.card-top strong { color: var(--accent); font: 850 27px/.9 system-ui, sans-serif; }
.card-top span { max-width: 95px; padding-top: 3px; color: #c5c2cb; font: 750 7px system-ui, sans-serif; letter-spacing: .06em; text-align: right; }
.card-art { position: relative; display: grid; min-height: 138px; flex: 1; place-items: center; color: var(--accent); }
.card-art :deep(.icon) { z-index: 1; font-size: clamp(48px, 7vw, 68px); }
.art-glow { position: absolute; width: 90px; height: 90px; border-radius: 50%; background: var(--accent); filter: blur(42px); opacity: .18; }
.card-info { z-index: 1; }
.card-info > span { color: var(--accent); font: 750 7px system-ui, sans-serif; letter-spacing: .11em; }
.card-info h2 { margin: 4px 0 9px; font: 750 15px system-ui, sans-serif; }
.card-rating { display: flex; justify-content: space-between; padding-top: 7px; border-top: 1px solid #ffffff20; color: #b5b3bc; font: 650 8px system-ui, sans-serif; }
.card-rating strong { color: #f0edf5; }
.controls { display: flex; align-items: center; justify-content: center; gap: 19px; padding: 17px 0 0; }
.open-button { min-width: 196px; --md-filled-button-container-color: var(--color-primary); --md-filled-button-label-text-color: var(--color-on-primary); --md-filled-button-label-text-font: var(--md-ref-typeface-plain); --md-filled-button-container-shape: 18px 18px 6px 18px; }
.disclaimer { display: flex; align-items: center; gap: 6px; margin: 0; color: #9999a4; font: 400 10px/1.5 system-ui, sans-serif; }
.disclaimer :deep(.icon) { flex: 0 0 auto; font-size: 15px; }
@keyframes packFloat3D { 0%,100% { transform: translateY(0) rotateY(-8deg) rotateX(4deg); } 50% { transform: translateY(-13px) rotateY(10deg) rotateX(-5deg); } }
@keyframes spotlightPulse { 0%,100% { opacity: .7; transform: scaleX(1); } 50% { opacity: 1; transform: scaleX(1.15); } }
@keyframes foilShine { 0%,20% { transform: translateX(-60%) rotate(15deg); } 60%,100% { transform: translateX(80%) rotate(15deg); } }
@keyframes promptPulse { 0%,100% { opacity: .72; transform: scale(1); } 50% { opacity: 1; transform: scale(1.04); } }
@keyframes sparkle { to { opacity: 1; transform: scale(1.8); } }
@keyframes revealCard { from { opacity: 0; transform: translateY(23px) rotateY(25deg) scale(.93); } to { opacity: 1; transform: translateY(0) rotateY(0) scale(1); } }
@media (min-height: 800px) { .content { padding-top: clamp(48px, 8vh, 95px); }.pack-area { min-height: clamp(400px, 52vh, 560px); }.player-card { min-height: clamp(300px, 38vh, 390px); } }
@media (max-width: 700px) { .content { width: min(100% - 28px, 540px); padding-top: 38px; }.pack-area { min-height: 360px; }.pack3d-box { --pack-w: clamp(168px, 42vw, 210px); }.controls { align-items: stretch; flex-direction: column; gap: 10px; }.open-button { width: 100%; }.disclaimer { align-items: flex-start; } }
@media (max-width: 440px) { .topbar { height: 58px; padding-inline: 14px; }.content { padding-top: 30px; }.intro h1 { font-size: 27px; }.pack-area { min-height: 340px; }.pack3d-box { --pack-w: 168px; }.reveal { width: calc(100% - 20px); gap: 7px; }.player-card { min-height: 235px; padding: 10px 8px 9px; }.card-top strong { font-size: 22px; }.card-top span { font-size: 6px; }.card-art { min-height: 100px; }.card-info h2 { font-size: 12px; }.card-info > span { font-size: 6px; }.card-rating { font-size: 7px; } }
@media (prefers-reduced-motion: reduce) { *, *::before, *::after { animation-duration: 1ms !important; animation-iteration-count: 1 !important; transition-duration: 1ms !important; } }
</style>
