// Geluidseffecten met WebAudio: alles wordt ter plekke gesynthetiseerd,
// er worden geen geluidsbestanden of muziek geladen.
let context;
let enabled = true;

export function setSoundEnabled(value) { enabled = Boolean(value); }
export function isSoundEnabled() { return enabled; }

function audio() {
  if (!context) {
    const Ctor = typeof window !== "undefined" && (window.AudioContext || window.webkitAudioContext);
    if (!Ctor) return null;
    context = new Ctor();
  }
  if (context.state === "suspended") context.resume();
  return context;
}

function tone(ctx, { freq, start = 0, length = 0.15, type = "sine", volume = 0.12, slideTo }) {
  const oscillator = ctx.createOscillator();
  const gain = ctx.createGain();
  const t0 = ctx.currentTime + start;
  oscillator.type = type;
  oscillator.frequency.setValueAtTime(freq, t0);
  if (slideTo) oscillator.frequency.exponentialRampToValueAtTime(slideTo, t0 + length);
  gain.gain.setValueAtTime(0.0001, t0);
  gain.gain.exponentialRampToValueAtTime(volume, t0 + 0.01);
  gain.gain.exponentialRampToValueAtTime(0.0001, t0 + length);
  oscillator.connect(gain).connect(ctx.destination);
  oscillator.start(t0);
  oscillator.stop(t0 + length + 0.02);
}

const EFFECTS = {
  click: (ctx) => tone(ctx, { freq: 520, length: 0.06, type: "triangle", volume: 0.08 }),
  reveal: (ctx) => [523, 659, 784, 1047].forEach((freq, i) => tone(ctx, { freq, start: i * 0.09, length: 0.22, type: "triangle" })),
  // Walkout: aanzwellende roffel, dan een fanfare bij het omdraaien van de kaart
  drum: (ctx) => {
    tone(ctx, { freq: 70, length: 2.6, type: "sawtooth", volume: 0.05, slideTo: 190 });
    for (let i = 0; i < 14; i += 1) tone(ctx, { freq: 110 + i * 6, start: i * (0.2 - i * 0.008), length: 0.07, type: "square", volume: 0.035 });
  },
  hint: (ctx) => tone(ctx, { freq: 660, length: 0.12, type: "triangle", volume: 0.09, slideTo: 880 }),
  walkout: (ctx) => {
    [523, 659, 784, 1047, 1319].forEach((freq, i) => tone(ctx, { freq, start: i * 0.08, length: 0.5, type: "triangle", volume: 0.11 }));
    [262, 392].forEach((freq) => tone(ctx, { freq, start: 0.32, length: 0.9, type: "sawtooth", volume: 0.05 }));
  },
  goal: (ctx) => [392, 494, 587, 784].forEach((freq, i) => tone(ctx, { freq, start: i * 0.07, length: 0.3, type: "square", volume: 0.07 })),
  save: (ctx) => tone(ctx, { freq: 300, length: 0.25, type: "sawtooth", volume: 0.09, slideTo: 140 }),
  miss: (ctx) => tone(ctx, { freq: 220, length: 0.35, type: "sine", volume: 0.1, slideTo: 90 }),
};

export function playSound(name) {
  if (!enabled) return;
  try {
    const ctx = audio();
    if (ctx && EFFECTS[name]) EFFECTS[name](ctx);
  } catch { /* geluid is optioneel */ }
}
