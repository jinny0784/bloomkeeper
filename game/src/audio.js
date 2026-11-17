// Bloomkeeper — all sound is synthesised live with WebAudio.
// No audio files, nothing to load: little oscillator blips for shots and
// pickups, soft noise for hits, and a slow two-note garden pad underneath.

export class GardenAudio {
  constructor() {
    this.ctx = null;
    this.master = null;
    this.muted = false;
    this.padTimer = 0;
    this.padStep = 0;
  }

  unlock() {
    if (this.ctx) {
      if (this.ctx.state === 'suspended') this.ctx.resume();
      return;
    }
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return;
    this.ctx = new AC();
    this.master = this.ctx.createGain();
    this.master.gain.value = 0.5;
    this.master.connect(this.ctx.destination);
  }

  setMuted(muted) {
    this.muted = muted;
    if (this.master) this.master.gain.value = muted ? 0 : 0.5;
  }

  tone(freqFrom, freqTo, seconds, type, volume, when = 0) {
    if (!this.ctx || this.muted) return;
    const t0 = this.ctx.currentTime + when;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freqFrom, t0);
    osc.frequency.exponentialRampToValueAtTime(Math.max(30, freqTo), t0 + seconds);
    gain.gain.setValueAtTime(volume, t0);
    gain.gain.exponentialRampToValueAtTime(0.001, t0 + seconds);
    osc.connect(gain).connect(this.master);
    osc.start(t0);
    osc.stop(t0 + seconds + 0.02);
  }

  noise(seconds, volume, when = 0) {
    if (!this.ctx || this.muted) return;
    const t0 = this.ctx.currentTime + when;
    const length = Math.max(1, Math.floor(this.ctx.sampleRate * seconds));
    const buffer = this.ctx.createBuffer(1, length, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < length; i += 1) data[i] = (Math.random() * 2 - 1) * (1 - i / length);
    const source = this.ctx.createBufferSource();
    source.buffer = buffer;
    const gain = this.ctx.createGain();
    gain.gain.value = volume;
    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = 900;
    source.connect(filter).connect(gain).connect(this.master);
    source.start(t0);
  }

  shoot() { this.tone(720, 320, 0.09, 'triangle', 0.16); }
  hit() { this.noise(0.07, 0.12); }
  enemyDown() { this.tone(300, 70, 0.22, 'sawtooth', 0.14); this.noise(0.12, 0.1); }
  pickup() { this.tone(880, 1320, 0.12, 'sine', 0.2); this.tone(1320, 1760, 0.1, 'sine', 0.12, 0.05); }
  playerHurt() { this.tone(220, 90, 0.25, 'square', 0.16); }
  heartHurt() { this.tone(160, 60, 0.3, 'square', 0.18); }
  dash() { this.noise(0.14, 0.08); this.tone(400, 900, 0.12, 'sine', 0.06); }
  waveStart() { this.tone(523, 523, 0.12, 'triangle', 0.16); this.tone(659, 659, 0.12, 'triangle', 0.16, 0.1); this.tone(784, 784, 0.2, 'triangle', 0.18, 0.2); }
  upgrade() { this.tone(659, 659, 0.1, 'sine', 0.16); this.tone(880, 880, 0.16, 'sine', 0.16, 0.08); }
  gameOver() { this.tone(392, 392, 0.25, 'triangle', 0.18); this.tone(330, 330, 0.25, 'triangle', 0.18, 0.22); this.tone(262, 196, 0.5, 'triangle', 0.18, 0.44); }
  win() { this.tone(523, 523, 0.14, 'triangle', 0.18); this.tone(659, 659, 0.14, 'triangle', 0.18, 0.12); this.tone(784, 784, 0.14, 'triangle', 0.18, 0.24); this.tone(1046, 1046, 0.4, 'triangle', 0.2, 0.36); }

  // A gentle pad that breathes under the action: two slow notes at a time.
  update(dt) {
    if (!this.ctx || this.muted) return;
    this.padTimer -= dt;
    if (this.padTimer > 0) return;
    this.padTimer = 2.4;
    const roots = [196, 220, 174, 196];
    const root = roots[this.padStep % roots.length];
    this.padStep += 1;
    this.tone(root, root, 2.3, 'sine', 0.05);
    this.tone(root * 1.5, root * 1.5, 2.3, 'sine', 0.035);
  }
}
