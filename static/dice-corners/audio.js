// Dice Corners — procedural sound (Web Audio, no files).
//
// No AudioContext exists until unlock() is called from a user gesture, so the
// page never autoplays. Every cue is synthesised: wooden clacks, a pentatonic
// step counter, guild motifs, a relic arpeggio and a victory fanfare.

const SCALE = [220, 261.63, 293.66, 329.63, 392, 440, 523.25];

/** @param {{ muted: boolean }} options */
export function createAudio({ muted }) {
  /** @type {AudioContext | null} */
  let ctx = null;
  /** @type {GainNode | null} */
  let master = null;
  /** @type {GainNode | null} */
  let wet = null;
  let isMuted = muted;
  let lastHover = 0;
  const LEVEL = 0.7;

  function build() {
    const Ctor = window.AudioContext || /** @type {any} */ (window).webkitAudioContext;
    if (!Ctor) return null;
    const context = /** @type {AudioContext} */ (new Ctor());
    master = context.createGain();
    master.gain.value = isMuted ? 0 : LEVEL;
    const compressor = context.createDynamicsCompressor();
    compressor.threshold.value = -14;
    master.connect(compressor).connect(context.destination);
    // a short dark hall: exponentially decaying noise as the impulse response
    const reverb = context.createConvolver();
    const length = Math.floor(context.sampleRate * 1.6);
    const impulse = context.createBuffer(2, length, context.sampleRate);
    for (let ch = 0; ch < 2; ch++) {
      const data = impulse.getChannelData(ch);
      for (let i = 0; i < length; i++)
        data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / length, 3);
    }
    reverb.buffer = impulse;
    wet = context.createGain();
    wet.gain.value = 0.28;
    wet.connect(reverb).connect(master);
    return context;
  }

  /** @returns {AudioContext | null} */
  const live = () => (ctx && !isMuted && ctx.state === 'running' ? ctx : null);

  /**
   * @param {number} freq
   * @param {number} duration
   * @param {{ type?: OscillatorType, gain?: number, when?: number, glide?: number, reverb?: number }} [o]
   */
  function tone(
    freq,
    duration,
    { type = 'sine', gain = 0.12, when = 0, glide = 0, reverb = 0.3 } = {}
  ) {
    const c = live();
    if (!c || !master || !wet) return;
    const t = c.currentTime + when;
    const osc = c.createOscillator();
    const env = c.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, t);
    if (glide) osc.frequency.exponentialRampToValueAtTime(Math.max(20, freq * glide), t + duration);
    env.gain.setValueAtTime(0.0001, t);
    env.gain.exponentialRampToValueAtTime(gain, t + 0.006);
    env.gain.exponentialRampToValueAtTime(0.0001, t + duration);
    osc.connect(env);
    env.connect(master);
    if (reverb) {
      const send = c.createGain();
      send.gain.value = reverb;
      env.connect(send).connect(wet);
    }
    osc.start(t);
    osc.stop(t + duration + 0.02);
  }

  /**
   * @param {number} duration
   * @param {{ gain?: number, when?: number, freq?: number, q?: number, type?: BiquadFilterType, sweep?: number }} [o]
   */
  function noise(
    duration,
    { gain = 0.1, when = 0, freq = 1800, q = 1.2, type = 'bandpass', sweep = 0 } = {}
  ) {
    const c = live();
    if (!c || !master) return;
    const t = c.currentTime + when;
    const buffer = c.createBuffer(
      1,
      Math.max(1, Math.floor(c.sampleRate * duration)),
      c.sampleRate
    );
    const data = buffer.getChannelData(0);
    for (let i = 0; i < data.length; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / data.length);
    const src = c.createBufferSource();
    src.buffer = buffer;
    const filter = c.createBiquadFilter();
    filter.type = type;
    filter.Q.value = q;
    filter.frequency.setValueAtTime(freq, t);
    if (sweep) filter.frequency.exponentialRampToValueAtTime(sweep, t + duration);
    const env = c.createGain();
    env.gain.value = gain;
    src.connect(filter).connect(env).connect(master);
    src.start(t);
  }

  const jitter = () => 0.94 + Math.random() * 0.12;

  function clack(weight = 1) {
    noise(0.05, { gain: 0.16 * weight, freq: 1900 * jitter(), q: 1.4 });
    tone(150 * jitter(), 0.1, { type: 'sine', gain: 0.2 * weight, glide: 0.5, reverb: 0.1 });
    tone(2600, 0.012, { type: 'square', gain: 0.02 * weight, reverb: 0 });
  }

  return {
    /** Must run inside a user gesture handler. */
    unlock() {
      try {
        if (!ctx) ctx = build();
        if (ctx && ctx.state === 'suspended') ctx.resume().catch(() => {});
      } catch {
        ctx = null;
      }
    },
    get muted() {
      return isMuted;
    },
    get state() {
      return ctx ? ctx.state : 'locked';
    },
    /** @param {boolean} value */
    setMuted(value) {
      isMuted = value;
      if (ctx && master) master.gain.setTargetAtTime(value ? 0 : LEVEL, ctx.currentTime, 0.02);
    },
    ui() {
      tone(1320, 0.05, { type: 'square', gain: 0.025, reverb: 0 });
    },
    hover() {
      const now = performance.now();
      if (now - lastHover < 70) return;
      lastHover = now;
      tone(1900, 0.025, { gain: 0.02, reverb: 0 });
    },
    /** @param {1 | 2} player */
    select(player) {
      clack(0.6);
      const [a, b] = player === 1 ? [659.25, 987.77] : [440, 659.25];
      tone(a, 0.35, { type: 'triangle', gain: 0.07, when: 0.02 });
      tone(b, 0.45, { type: 'sine', gain: 0.05, when: 0.07 });
    },
    deselect() {
      tone(520, 0.12, { type: 'triangle', gain: 0.05, glide: 0.6 });
    },
    /** @param {number} index roll number this turn (0-based) @param {boolean} last */
    step(index, last) {
      clack(last ? 1.2 : 0.9);
      const note = SCALE[Math.min(index, SCALE.length - 1)];
      tone(note * 2, last ? 0.5 : 0.22, { type: 'triangle', gain: last ? 0.08 : 0.05 });
      if (last) tone(note * 3, 0.6, { type: 'sine', gain: 0.04, when: 0.05 });
    },
    undo() {
      clack(0.7);
      tone(480, 0.18, { type: 'triangle', gain: 0.05, glide: 0.7 });
    },
    denied() {
      tone(110, 0.14, { type: 'square', gain: 0.05, reverb: 0 });
      tone(104, 0.14, { type: 'square', gain: 0.04, when: 0.07, reverb: 0 });
    },
    /** @param {1 | 2} player */
    turn(player) {
      noise(0.6, { gain: 0.06, freq: 320, sweep: 2400, q: 0.8 });
      const [a, b] = player === 1 ? [329.63, 493.88] : [220, 329.63];
      tone(a, 0.6, {
        type: player === 1 ? 'sine' : 'triangle',
        gain: 0.08,
        when: 0.25,
        reverb: 0.6
      });
      tone(b, 0.9, {
        type: player === 1 ? 'sine' : 'triangle',
        gain: 0.07,
        when: 0.45,
        reverb: 0.6
      });
    },
    forfeit() {
      tone(98, 1.4, { type: 'sine', gain: 0.12, reverb: 0.7 });
      tone(147, 1.1, { type: 'triangle', gain: 0.04, when: 0.05, reverb: 0.7 });
    },
    arrive() {
      [1046.5, 1318.5].forEach((f, i) => tone(f, 0.4, { gain: 0.04, when: i * 0.06, reverb: 0.5 }));
    },
    bonus() {
      [523.25, 659.25, 783.99, 1046.5, 1318.5].forEach((f, i) =>
        tone(f, 0.55, {
          type: i % 2 ? 'sine' : 'triangle',
          gain: 0.08,
          when: i * 0.07,
          reverb: 0.7
        })
      );
      noise(0.9, { gain: 0.04, freq: 5000, type: 'highpass', q: 0.5 });
    },
    rattle() {
      for (let i = 0; i < 6; i++) {
        const when = i * 0.11 + Math.random() * 0.04;
        noise(0.04, { gain: 0.1, freq: 2000 * jitter(), when });
        tone(170 * jitter(), 0.06, { gain: 0.08, when, glide: 0.6, reverb: 0 });
      }
    },
    /** @param {1 | 2} player */
    win(player) {
      const root = player === 1 ? 392 : 329.63;
      const chords = [
        [1, 1.25, 1.5],
        [1.333, 1.667, 2],
        [1.5, 1.875, 2.25],
        [2, 2.5, 3]
      ];
      chords.forEach((chord, i) =>
        chord.forEach((m) =>
          tone(root * m, i === 3 ? 1.4 : 0.36, {
            type: 'triangle',
            gain: 0.06,
            when: i * 0.26,
            reverb: 0.6
          })
        )
      );
      [0, 0.26, 0.52, 0.78].forEach((when) =>
        noise(0.12, { gain: 0.1, freq: 180, type: 'lowpass', when })
      );
    },
    close() {
      if (ctx) ctx.close().catch(() => {});
      ctx = null;
    }
  };
}
