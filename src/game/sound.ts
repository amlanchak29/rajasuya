/** Sound: one generated ambient loop plus fully procedural WebAudio SFX —
 * no sample files, nothing to license, instant load. Everything routes
 * through a master gain so mute is one knob, persisted. The context can
 * only start after a user gesture (browser policy); init() is called from
 * the first click. */
import ambientUrl from "../assets/audio/ambient.mp3";

const MUTE_KEY = "rajasuya-muted";

let ctx: AudioContext | null = null;
let master: GainNode | null = null;
let ambientEl: HTMLAudioElement | null = null;
let muted = localStorage.getItem(MUTE_KEY) === "1";

export function isMuted(): boolean {
  return muted;
}

export function setMuted(m: boolean): void {
  muted = m;
  localStorage.setItem(MUTE_KEY, m ? "1" : "0");
  if (master) master.gain.value = m ? 0 : 1;
  if (ambientEl) ambientEl.volume = m ? 0 : 0.12;
}

/** Call from any user gesture; safe to call repeatedly. */
export function initSound(): void {
  if (ctx === null) {
    ctx = new AudioContext();
    master = ctx.createGain();
    master.gain.value = muted ? 0 : 1;
    master.connect(ctx.destination);
  }
  if (ctx.state === "suspended") void ctx.resume();
  if (ambientEl === null) {
    ambientEl = new Audio(ambientUrl);
    ambientEl.loop = true;
    ambientEl.volume = muted ? 0 : 0.12;
    void ambientEl.play().catch(() => {
      /* second gesture will retry via initSound */
    });
  } else if (ambientEl.paused) {
    void ambientEl.play().catch(() => {});
  }
}

function tone(
  freq: number,
  dur: number,
  opts: {
    type?: OscillatorType;
    gain?: number;
    attack?: number;
    detune?: number;
    when?: number;
  } = {},
): void {
  if (!ctx || !master) return;
  const t0 = ctx.currentTime + (opts.when ?? 0);
  const osc = ctx.createOscillator();
  osc.type = opts.type ?? "sine";
  osc.frequency.value = freq;
  if (opts.detune) osc.detune.value = opts.detune;
  const g = ctx.createGain();
  const peak = opts.gain ?? 0.08;
  g.gain.setValueAtTime(0, t0);
  g.gain.linearRampToValueAtTime(peak, t0 + (opts.attack ?? 0.005));
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
  osc.connect(g).connect(master);
  osc.start(t0);
  osc.stop(t0 + dur + 0.05);
}

function noise(
  dur: number,
  opts: { gain?: number; freq?: number; q?: number; when?: number } = {},
): void {
  if (!ctx || !master) return;
  const t0 = ctx.currentTime + (opts.when ?? 0);
  const buf = ctx.createBuffer(1, ctx.sampleRate * dur, ctx.sampleRate);
  const data = buf.getChannelData(0);
  for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
  const src = ctx.createBufferSource();
  src.buffer = buf;
  const filter = ctx.createBiquadFilter();
  filter.type = "bandpass";
  filter.frequency.value = opts.freq ?? 1200;
  filter.Q.value = opts.q ?? 1;
  const g = ctx.createGain();
  const peak = opts.gain ?? 0.05;
  g.gain.setValueAtTime(peak, t0);
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
  src.connect(filter).connect(g).connect(master);
  src.start(t0);
}

export type Sfx =
  | "tap" // an act lands
  | "chime" // open act — warm, public
  | "thud" // hidden act — low, muffled
  | "gong" // an oath sworn before the world
  | "seal" // an oath sworn in shadow
  | "courts" // the courts rise and sit
  | "victory";

export function playSfx(name: Sfx): void {
  if (!ctx || !master || muted) return;
  switch (name) {
    case "tap":
      noise(0.06, { gain: 0.06, freq: 2400, q: 2 });
      tone(660, 0.09, { type: "triangle", gain: 0.04 });
      break;
    case "chime":
      tone(880, 0.5, { gain: 0.05 });
      tone(1320, 0.4, { gain: 0.03, when: 0.02 });
      tone(1760, 0.3, { gain: 0.015, when: 0.04 });
      break;
    case "thud":
      tone(110, 0.25, { type: "sine", gain: 0.12 });
      noise(0.1, { gain: 0.03, freq: 300, q: 0.8 });
      break;
    case "gong": {
      // Slightly detuned partials with a long tail — a temple-free bell.
      tone(196, 2.2, { gain: 0.1, attack: 0.01 });
      tone(294, 2.0, { gain: 0.06, detune: 8, when: 0.01 });
      tone(392, 1.6, { gain: 0.04, detune: -6, when: 0.02 });
      tone(587, 1.2, { gain: 0.02, when: 0.03 });
      noise(0.4, { gain: 0.04, freq: 700, q: 0.6 });
      break;
    }
    case "seal":
      tone(147, 1.4, { gain: 0.09 });
      tone(220, 1.1, { gain: 0.04, detune: 6, when: 0.02 });
      noise(0.3, { gain: 0.02, freq: 400, q: 0.7 });
      break;
    case "courts":
      noise(0.5, { gain: 0.025, freq: 900, q: 0.5 });
      tone(523, 0.35, { type: "triangle", gain: 0.02, when: 0.05 });
      break;
    case "victory":
      tone(196, 2.5, { gain: 0.1 });
      tone(294, 2.2, { gain: 0.06, when: 0.05 });
      tone(392, 1.8, { gain: 0.05, when: 0.35 });
      tone(494, 1.6, { gain: 0.04, when: 0.65 });
      tone(587, 1.8, { gain: 0.04, when: 0.95 });
      break;
  }
}
