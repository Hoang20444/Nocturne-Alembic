// Procedural WebAudio Synthesizer & Cozy Rain Ambience Engine

const PENTATONIC_FREQS = [
  261.63, // C4
  293.66, // D4
  329.63, // E4
  392.00, // G4
  440.00, // A4
  523.25, // C5
  587.33, // D5
  659.25, // E5
  783.99, // G5
  880.00, // A5
  1046.50 // C6
];

class SoundEngine {
  private ctx: AudioContext | null = null;
  private soundEnabled = true;
  private rainEnabled = true;
  private rainGain: GainNode | null = null;
  private rainSource: AudioBufferSourceNode | null = null;
  private isRainPlaying = false;

  private ensureContext(): AudioContext | null {
    if (!this.soundEnabled) return null;
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
    return this.ctx;
  }

  public setSoundEnabled(enabled: boolean): void {
    this.soundEnabled = enabled;
    if (!enabled) {
      this.stopRain();
    } else if (this.rainEnabled) {
      this.startRain();
    }
  }

  public setRainEnabled(enabled: boolean): void {
    this.rainEnabled = enabled;
    if (enabled && this.soundEnabled) {
      this.startRain();
    } else {
      this.stopRain();
    }
  }

  public startRain(): void {
    if (!this.soundEnabled || !this.rainEnabled || this.isRainPlaying) return;
    const ctx = this.ensureContext();
    if (!ctx) return;

    try {
      const bufferSize = ctx.sampleRate * 3;
      const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      const output = buffer.getChannelData(0);

      // Pink-ish cozy rain noise
      let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0;
      for (let i = 0; i < bufferSize; i++) {
        const white = Math.random() * 2 - 1;
        b0 = 0.99886 * b0 + white * 0.0555179;
        b1 = 0.99332 * b1 + white * 0.0750759;
        b2 = 0.96900 * b2 + white * 0.1538520;
        b3 = 0.86650 * b3 + white * 0.3104856;
        b4 = 0.55000 * b4 + white * 0.5329522;
        b5 = -0.7616 * b5 - white * 0.0168980;
        output[i] = (b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362) * 0.025;
        b6 = white * 0.115926;
      }

      const noise = ctx.createBufferSource();
      noise.buffer = buffer;
      noise.loop = true;

      const filter = ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.value = 920;

      const gain = ctx.createGain();
      gain.gain.setValueAtTime(0.001, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.14, ctx.currentTime + 1.2);

      noise.connect(filter);
      filter.connect(gain);
      gain.connect(ctx.destination);

      noise.start();
      this.rainSource = noise;
      this.rainGain = gain;
      this.isRainPlaying = true;
    } catch {
      // Ignore autoplay errors until first user gesture
    }
  }

  public stopRain(): void {
    if (this.rainSource) {
      try {
        this.rainSource.stop();
        this.rainSource.disconnect();
      } catch {}
      this.rainSource = null;
    }
    this.isRainPlaying = false;
  }

  // Subtle UI hover/click chirp (800Hz -> 1200Hz 15ms sine blip)
  public playUiChirp(pitchMultiplier = 1): void {
    const ctx = this.ensureContext();
    if (!ctx) return;

    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(780 * pitchMultiplier, now);
    osc.frequency.exponentialRampToValueAtTime(1180 * pitchMultiplier, now + 0.022);

    gain.gain.setValueAtTime(0.05, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.025);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now);
    osc.stop(now + 0.028);
  }

  // Tactile pipette droplet plop
  public playDropPlop(): void {
    const ctx = this.ensureContext();
    if (!ctx) return;
    if (this.rainEnabled && !this.isRainPlaying) {
      this.startRain();
    }

    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(340, now);
    osc.frequency.exponentialRampToValueAtTime(680, now + 0.075);

    gain.gain.setValueAtTime(0.12, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.09);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now);
    osc.stop(now + 0.095);
  }

  // Crystal peg bounce (Pentatonic harp chime)
  public playPegBounce(comboIndex: number, isBumper = false): void {
    const ctx = this.ensureContext();
    if (!ctx) return;

    const now = ctx.currentTime;
    const idx = Math.min(comboIndex, PENTATONIC_FREQS.length - 1);
    const baseFreq = PENTATONIC_FREQS[idx] * (isBumper ? 1.25 : 1.0);

    const osc = ctx.createOscillator();
    const overtone = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = isBumper ? 'triangle' : 'sine';
    osc.frequency.setValueAtTime(baseFreq, now);

    overtone.type = 'sine';
    overtone.frequency.setValueAtTime(baseFreq * 2, now);

    gain.gain.setValueAtTime(isBumper ? 0.14 : 0.09, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + (isBumper ? 0.28 : 0.2));

    osc.connect(gain);
    overtone.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now);
    overtone.start(now);
    osc.stop(now + 0.3);
    overtone.stop(now + 0.3);
  }

  // Synthesis harmonic shimmer
  public playSynthesis(tier: 1 | 2 | 3): void {
    const ctx = this.ensureContext();
    if (!ctx) return;

    const now = ctx.currentTime;
    const notes = tier === 3
      ? [523.25, 659.25, 783.99, 1046.5, 1318.5] // Grand C Major 9th arpeggio
      : [440, 554.37, 659.25, 880];              // Warm A Major chord

    notes.forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      const start = now + i * 0.045;
      const dur = tier === 3 ? 0.55 : 0.32;

      osc.type = tier === 3 ? 'triangle' : 'sine';
      osc.frequency.setValueAtTime(freq, start);

      gain.gain.setValueAtTime(0.11, start);
      gain.gain.exponentialRampToValueAtTime(0.001, start + dur);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(start);
      osc.stop(start + dur + 0.02);
    });
  }

  // Bottling / Harvest clink
  public playBottleHarvest(): void {
    const ctx = this.ensureContext();
    if (!ctx) return;

    const now = ctx.currentTime;
    [880, 1174.66].forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      const start = now + idx * 0.05;

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, start);

      gain.gain.setValueAtTime(0.08, start);
      gain.gain.exponentialRampToValueAtTime(0.001, start + 0.16);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(start);
      osc.stop(start + 0.18);
    });
  }

  // Order delivered coin fanfare
  public playOrderComplete(): void {
    const ctx = this.ensureContext();
    if (!ctx) return;

    const now = ctx.currentTime;
    const chord = [587.33, 739.99, 880, 1174.66];
    chord.forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      const start = now + i * 0.06;

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, start);

      gain.gain.setValueAtTime(0.12, start);
      gain.gain.exponentialRampToValueAtTime(0.001, start + 0.38);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(start);
      osc.stop(start + 0.4);
    });
  }
}

export const sound = new SoundEngine();

