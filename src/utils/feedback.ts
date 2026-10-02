/**
 * Tactical Audio & Haptic Feedback Engine for RallyPoint
 * Uses Web Audio API for zero-latency, realistic acoustic synthesis
 * (no external audio file dependencies) and navigator.vibrate for tactile haptics.
 */

let audioCtx: AudioContext | null = null;

function getAudioContext(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  try {
    const AudioContextClass =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AudioContextClass) return null;
    if (!audioCtx || audioCtx.state === 'closed') {
      audioCtx = new AudioContextClass();
    }
    if (audioCtx.state === 'suspended') {
      audioCtx.resume().catch(() => {});
    }
    return audioCtx;
  } catch {
    return null;
  }
}

export type FeedbackType = 'point' | 'game' | 'match-win' | 'deuce' | 'undo';

/**
 * Triggers mobile haptic vibration pattern
 */
export function triggerHaptic(type: FeedbackType = 'point') {
  if (typeof window === 'undefined' || !('vibrate' in navigator)) return;
  try {
    switch (type) {
      case 'point':
        // Crisp, ultra-light tactile tap (18ms)
        navigator.vibrate(18);
        break;
      case 'game':
        // Celebratory syncopated cheer burst
        navigator.vibrate([45, 35, 65, 35, 110]);
        break;
      case 'match-win':
        // Grand championship victory fanfare pattern
        navigator.vibrate([60, 40, 60, 40, 100, 50, 180]);
        break;
      case 'deuce':
        // Double alert pulse
        navigator.vibrate([30, 45, 30]);
        break;
      case 'undo':
        // Gentle single micro-bump
        navigator.vibrate(12);
        break;
    }
  } catch {
    // Haptics unsupported or disabled by browser permission
  }
}

/**
 * Plays high-fidelity synthesized sound effects:
 * - 'point': Light crisp racquet/shuttlecock contact click
 * - 'game': Exhilarating multi-harmonic chord fanfare + stadium crowd cheer swell
 * - 'match-win': Grand victory crescendo fanfare
 * - 'deuce': Subtle tension double-tone alert
 * - 'undo': Soft reversed acoustic click
 */
export function playScoreSound(type: FeedbackType = 'point') {
  const ctx = getAudioContext();
  if (!ctx) return;

  const now = ctx.currentTime;

  try {
    if (type === 'point') {
      // 🏸 AUTHENTIC SHUTTLECOCK / CRISP LIGHT CLICK
      // Layer 1: High percussive transient impulse
      const osc1 = ctx.createOscillator();
      const gain1 = ctx.createGain();
      osc1.type = 'triangle';
      osc1.frequency.setValueAtTime(1450, now);
      osc1.frequency.exponentialRampToValueAtTime(320, now + 0.028);

      gain1.gain.setValueAtTime(0.22, now);
      gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.032);

      osc1.connect(gain1);
      gain1.connect(ctx.destination);
      osc1.start(now);
      osc1.stop(now + 0.035);

      // Layer 2: Subtle warm wooden body click
      const osc2 = ctx.createOscillator();
      const gain2 = ctx.createGain();
      osc2.type = 'sine';
      osc2.frequency.setValueAtTime(560, now);
      osc2.frequency.exponentialRampToValueAtTime(180, now + 0.04);

      gain2.gain.setValueAtTime(0.12, now);
      gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.045);

      osc2.connect(gain2);
      gain2.connect(ctx.destination);
      osc2.start(now);
      osc2.stop(now + 0.048);
    } else if (type === 'game') {
      // 🎉 STADIUM CHEER & MAJOR TRIAD CHORD FANFARE
      // Part A: Harmonious Major Triad (C5 - 523.25, E5 - 659.25, G5 - 783.99, C6 - 1046.50)
      const chordFrequencies = [523.25, 659.25, 783.99, 1046.5];
      chordFrequencies.forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        // Slight arpeggiation delay for triumphant musicality
        const startTime = now + idx * 0.04;
        osc.frequency.setValueAtTime(freq, startTime);

        gain.gain.setValueAtTime(0.001, startTime);
        gain.gain.exponentialRampToValueAtTime(0.12 / chordFrequencies.length, startTime + 0.05);
        gain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.55);

        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(startTime);
        osc.stop(startTime + 0.6);
      });

      // Part B: Synthesized Crowd Cheer Swell (Bandpass-filtered noise)
      playNoiseCheerSwell(ctx, now, 0.7, 0.15);
    } else if (type === 'match-win') {
      // 🏆 CHAMPIONSHIP VICTORY FANFARE & DOUBLE CHEER
      const fanfareNotes = [523.25, 659.25, 783.99, 1046.5, 1318.5]; // C5, E5, G5, C6, E6
      fanfareNotes.forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'triangle';
        const startTime = now + idx * 0.06;
        osc.frequency.setValueAtTime(freq, startTime);

        gain.gain.setValueAtTime(0.001, startTime);
        gain.gain.exponentialRampToValueAtTime(0.16 / fanfareNotes.length, startTime + 0.06);
        gain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.85);

        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(startTime);
        osc.stop(startTime + 0.9);
      });

      // Part B: Sustained stadium cheer roar
      playNoiseCheerSwell(ctx, now, 1.2, 0.2);
    } else if (type === 'deuce') {
      // 🔔 TENSION ALERT: TWO-TONE CHIME
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(440, now); // A4
      osc.frequency.setValueAtTime(554.37, now + 0.09); // C#5

      gain.gain.setValueAtTime(0.12, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.22);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.25);
    } else if (type === 'undo') {
      // ↩️ SOFT ACOUSTIC UNDO CLICK
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(380, now);
      osc.frequency.exponentialRampToValueAtTime(190, now + 0.035);

      gain.gain.setValueAtTime(0.14, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.04);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.045);
    }
  } catch (err) {
    console.warn('Audio synthesis warning:', err);
  }
}

/**
 * Synthesizes an ambient crowd cheer / applause swell using filtered pink-noise
 */
function playNoiseCheerSwell(ctx: AudioContext, startTime: number, duration: number, peakVolume: number) {
  try {
    const bufferSize = Math.floor(ctx.sampleRate * duration);
    const noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const output = noiseBuffer.getChannelData(0);

    // Pink noise generator for natural acoustic warmth
    let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0;
    for (let i = 0; i < bufferSize; i++) {
      const white = Math.random() * 2 - 1;
      b0 = 0.99886 * b0 + white * 0.0555179;
      b1 = 0.99332 * b1 + white * 0.0750759;
      b2 = 0.96900 * b2 + white * 0.1538520;
      b3 = 0.86650 * b3 + white * 0.3104856;
      b4 = 0.55000 * b4 + white * 0.5329522;
      b5 = -0.7616 * b5 - white * 0.0168980;
      output[i] = (b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362) * 0.11;
      b6 = white * 0.115926;
    }

    const whiteNoise = ctx.createBufferSource();
    whiteNoise.buffer = noiseBuffer;

    // Bandpass filter to sculpt vocal frequency range (cheering crowd acoustic resonance 650Hz–1800Hz)
    const bandpass = ctx.createBiquadFilter();
    bandpass.type = 'bandpass';
    bandpass.frequency.setValueAtTime(950, startTime);
    bandpass.Q.setValueAtTime(1.4, startTime);

    const gainNode = ctx.createGain();
    // Swell envelope: fast rise, lingering stadium fade
    gainNode.gain.setValueAtTime(0.001, startTime);
    gainNode.gain.exponentialRampToValueAtTime(peakVolume, startTime + 0.12);
    gainNode.gain.exponentialRampToValueAtTime(0.001, startTime + duration);

    whiteNoise.connect(bandpass);
    bandpass.connect(gainNode);
    gainNode.connect(ctx.destination);

    whiteNoise.start(startTime);
    whiteNoise.stop(startTime + duration);
  } catch {
    // Noise buffer fallback
  }
}

/**
 * Unified feedback dispatcher (Plays sound + vibrates haptic)
 */
export function triggerFeedback(type: FeedbackType, soundEnabled = true) {
  // Always trigger haptic tactile feedback (if supported on device)
  triggerHaptic(type);

  // Play audio if sound toggle is enabled
  if (soundEnabled) {
    playScoreSound(type);
  }
}
