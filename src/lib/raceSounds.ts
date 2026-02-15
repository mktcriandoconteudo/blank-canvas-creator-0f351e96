// Synthesized race sound effects using Web Audio API
// No external dependencies needed

let audioCtx: AudioContext | null = null;
let muted = false;

export function setMuted(val: boolean) { muted = val; }
export function isMuted() { return muted; }

function getCtx(): AudioContext {
  if (!audioCtx) {
    audioCtx = new AudioContext();
  }
  if (audioCtx.state === "suspended") {
    audioCtx.resume();
  }
  return audioCtx;
}

function shouldPlay(): boolean {
  return !muted;
}

// ─── Countdown beep ───
export function playCountdownBeep(isFinal = false) {
  if (!shouldPlay()) return;
  const ctx = getCtx();
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.connect(gain);
  gain.connect(ctx.destination);

  osc.type = "square";
  osc.frequency.value = isFinal ? 880 : 440;
  gain.gain.setValueAtTime(0.15, ctx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + (isFinal ? 0.5 : 0.2));

  osc.start(ctx.currentTime);
  osc.stop(ctx.currentTime + (isFinal ? 0.5 : 0.2));
}

// ─── Engine loop ───
let engineOsc: OscillatorNode | null = null;
let engineGain: GainNode | null = null;
let engineNoise: AudioBufferSourceNode | null = null;
let engineNoiseGain: GainNode | null = null;

export function startEngine() {
  if (!shouldPlay()) return;
  const ctx = getCtx();

  // Low rumble oscillator
  engineOsc = ctx.createOscillator();
  engineGain = ctx.createGain();
  engineOsc.type = "sawtooth";
  engineOsc.frequency.value = 80;
  engineGain.gain.value = 0.06;
  engineOsc.connect(engineGain);
  engineGain.connect(ctx.destination);
  engineOsc.start();

  // Noise layer for texture
  const bufferSize = ctx.sampleRate * 2;
  const noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
  const output = noiseBuffer.getChannelData(0);
  for (let i = 0; i < bufferSize; i++) {
    output[i] = Math.random() * 2 - 1;
  }
  engineNoise = ctx.createBufferSource();
  engineNoise.buffer = noiseBuffer;
  engineNoise.loop = true;

  engineNoiseGain = ctx.createGain();
  engineNoiseGain.gain.value = 0.02;

  // Low-pass filter for rumble
  const filter = ctx.createBiquadFilter();
  filter.type = "lowpass";
  filter.frequency.value = 200;

  engineNoise.connect(filter);
  filter.connect(engineNoiseGain);
  engineNoiseGain.connect(ctx.destination);
  engineNoise.start();
}

export function updateEngineRPM(speed: number, nitro: boolean) {
  if (!engineOsc || !engineGain) return;
  // Map speed 0-400 to frequency 60-300
  const freq = 60 + (speed / 400) * 240 + (nitro ? 80 : 0);
  const vol = 0.04 + (speed / 400) * 0.08 + (nitro ? 0.04 : 0);
  engineOsc.frequency.value = freq;
  engineGain.gain.value = Math.min(vol, 0.15);
  if (engineNoiseGain) {
    engineNoiseGain.gain.value = 0.01 + (speed / 400) * 0.03;
  }
}

export function stopEngine() {
  try {
    engineOsc?.stop();
    engineNoise?.stop();
  } catch {}
  engineOsc = null;
  engineGain = null;
  engineNoise = null;
  engineNoiseGain = null;
}

// ─── Nitro boost ───
export function playNitro() {
  if (!shouldPlay()) return;
  const ctx = getCtx();
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  const filter = ctx.createBiquadFilter();

  osc.type = "sawtooth";
  osc.frequency.setValueAtTime(200, ctx.currentTime);
  osc.frequency.exponentialRampToValueAtTime(800, ctx.currentTime + 0.3);
  osc.frequency.exponentialRampToValueAtTime(400, ctx.currentTime + 2.5);

  filter.type = "lowpass";
  filter.frequency.setValueAtTime(2000, ctx.currentTime);
  filter.frequency.exponentialRampToValueAtTime(500, ctx.currentTime + 2.5);

  gain.gain.setValueAtTime(0.1, ctx.currentTime);
  gain.gain.linearRampToValueAtTime(0.15, ctx.currentTime + 0.2);
  gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 2.5);

  osc.connect(filter);
  filter.connect(gain);
  gain.connect(ctx.destination);

  osc.start(ctx.currentTime);
  osc.stop(ctx.currentTime + 2.5);

  // Whoosh noise
  const bufferSize = ctx.sampleRate * 3;
  const noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
  const output = noiseBuffer.getChannelData(0);
  for (let i = 0; i < bufferSize; i++) {
    output[i] = Math.random() * 2 - 1;
  }
  const noise = ctx.createBufferSource();
  noise.buffer = noiseBuffer;
  const noiseGain = ctx.createGain();
  const noiseFilter = ctx.createBiquadFilter();
  noiseFilter.type = "bandpass";
  noiseFilter.frequency.value = 3000;
  noiseFilter.Q.value = 0.5;
  noiseGain.gain.setValueAtTime(0.08, ctx.currentTime);
  noiseGain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 2.5);

  noise.connect(noiseFilter);
  noiseFilter.connect(noiseGain);
  noiseGain.connect(ctx.destination);
  noise.start(ctx.currentTime);
  noise.stop(ctx.currentTime + 2.5);
}

// ─── Overtake whoosh ───
export function playOvertake() {
  if (!shouldPlay()) return;
  const ctx = getCtx();
  const bufferSize = ctx.sampleRate;
  const noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
  const output = noiseBuffer.getChannelData(0);
  for (let i = 0; i < bufferSize; i++) {
    output[i] = Math.random() * 2 - 1;
  }
  const noise = ctx.createBufferSource();
  noise.buffer = noiseBuffer;

  const filter = ctx.createBiquadFilter();
  filter.type = "bandpass";
  filter.frequency.setValueAtTime(500, ctx.currentTime);
  filter.frequency.exponentialRampToValueAtTime(4000, ctx.currentTime + 0.15);
  filter.frequency.exponentialRampToValueAtTime(800, ctx.currentTime + 0.5);

  const gain = ctx.createGain();
  gain.gain.setValueAtTime(0, ctx.currentTime);
  gain.gain.linearRampToValueAtTime(0.12, ctx.currentTime + 0.05);
  gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.5);

  noise.connect(filter);
  filter.connect(gain);
  gain.connect(ctx.destination);
  noise.start(ctx.currentTime);
  noise.stop(ctx.currentTime + 0.5);
}

// ─── Victory fanfare ───
export function playVictory() {
  if (!shouldPlay()) return;
  const ctx = getCtx();
  const notes = [523.25, 659.25, 783.99, 1046.5]; // C5, E5, G5, C6
  const delays = [0, 0.15, 0.3, 0.5];

  notes.forEach((freq, i) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "triangle";
    osc.frequency.value = freq;
    gain.gain.setValueAtTime(0.12, ctx.currentTime + delays[i]);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + delays[i] + 0.8);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(ctx.currentTime + delays[i]);
    osc.stop(ctx.currentTime + delays[i] + 0.8);
  });
}

// ─── Defeat sound ───
export function playDefeat() {
  if (!shouldPlay()) return;
  const ctx = getCtx();
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = "triangle";
  osc.frequency.setValueAtTime(400, ctx.currentTime);
  osc.frequency.exponentialRampToValueAtTime(150, ctx.currentTime + 1);
  gain.gain.setValueAtTime(0.1, ctx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 1.2);
  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.start(ctx.currentTime);
  osc.stop(ctx.currentTime + 1.2);
}
