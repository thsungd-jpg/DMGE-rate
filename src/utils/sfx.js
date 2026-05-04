// Chiptune SFX synthesized via Web Audio API. No assets.
// Lazy AudioContext (browsers block autoplay until user gesture).

let ctx = null;
const MUTE_KEY = "rateapp_sfx_muted";

function getCtx() {
  if (typeof window === "undefined") return null;
  if (!ctx) {
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return null;
    ctx = new AC();
  }
  if (ctx.state === "suspended") ctx.resume().catch(() => {});
  return ctx;
}

export function isMuted() {
  try { return localStorage.getItem(MUTE_KEY) === "1"; } catch { return false; }
}

export function setMuted(v) {
  try { localStorage.setItem(MUTE_KEY, v ? "1" : "0"); } catch {}
}

export function toggleMuted() {
  const next = !isMuted();
  setMuted(next);
  return next;
}

function tone({ freq, duration = 0.12, type = "square", volume = 0.18, start = 0 }) {
  const ac = getCtx();
  if (!ac || isMuted()) return;
  const t0 = ac.currentTime + start;
  const osc = ac.createOscillator();
  const gain = ac.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, t0);
  gain.gain.setValueAtTime(0.0001, t0);
  gain.gain.exponentialRampToValueAtTime(volume, t0 + 0.005);
  gain.gain.exponentialRampToValueAtTime(0.0001, t0 + duration);
  osc.connect(gain).connect(ac.destination);
  osc.start(t0);
  osc.stop(t0 + duration + 0.02);
}

function sweep({ from, to, duration = 0.18, type = "square", volume = 0.16, start = 0 }) {
  const ac = getCtx();
  if (!ac || isMuted()) return;
  const t0 = ac.currentTime + start;
  const osc = ac.createOscillator();
  const gain = ac.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(from, t0);
  osc.frequency.exponentialRampToValueAtTime(to, t0 + duration);
  gain.gain.setValueAtTime(0.0001, t0);
  gain.gain.exponentialRampToValueAtTime(volume, t0 + 0.01);
  gain.gain.exponentialRampToValueAtTime(0.0001, t0 + duration);
  osc.connect(gain).connect(ac.destination);
  osc.start(t0);
  osc.stop(t0 + duration + 0.02);
}

export function playCalculate() {
  // Ascending arpeggio C5-E5-G5-C6
  tone({ freq: 523.25, duration: 0.09, start: 0.00, volume: 0.18 });
  tone({ freq: 659.25, duration: 0.09, start: 0.07, volume: 0.18 });
  tone({ freq: 783.99, duration: 0.09, start: 0.14, volume: 0.18 });
  tone({ freq: 1046.5, duration: 0.18, start: 0.21, volume: 0.20 });
}

export function playSave() {
  // Coin pickup (Mario-ish): B5 -> E6
  tone({ freq: 987.77, duration: 0.08, start: 0.00, volume: 0.18 });
  tone({ freq: 1318.51, duration: 0.20, start: 0.06, volume: 0.20 });
}

export function playEmail() {
  // Whoosh: descending sweep with triangle for softness
  sweep({ from: 1200, to: 300, duration: 0.22, type: "triangle", volume: 0.18 });
  tone({ freq: 880, duration: 0.10, start: 0.20, type: "sine", volume: 0.14 });
}

export function playGlow() {
  // Subtle UI tick when glow advances
  tone({ freq: 660, duration: 0.05, type: "square", volume: 0.06 });
}

export function playClick() {
  tone({ freq: 440, duration: 0.04, type: "square", volume: 0.08 });
}

export function playError() {
  tone({ freq: 196, duration: 0.18, type: "sawtooth", volume: 0.16 });
}
