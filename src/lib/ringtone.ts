let audioCtx: AudioContext | null = null;
let ringInterval: ReturnType<typeof setInterval> | null = null;

function getCtx(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  if (!audioCtx) {
    const Ctor = window.AudioContext ?? (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!Ctor) return null;
    audioCtx = new Ctor();
  }
  return audioCtx;
}

export interface RingOptions {
  sound: boolean;
  vibrate: boolean;
}

/**
 * Play a standard North American phone ringtone: 440Hz + 480Hz
 * for 2 seconds on, then 4 seconds off, looped.
 */
export function playRingtone(options: RingOptions): void {
  const ctx = getCtx();
  if (!ctx) return;
  stopRingtone();

  const ringOnce = () => {
    if (!audioCtx) return;
    const now = audioCtx.currentTime;

    // Two oscillators at 440 and 480 Hz, played together
    const osc1 = audioCtx.createOscillator();
    osc1.frequency.value = 440;
    osc1.type = 'sine';
    const gain1 = audioCtx.createGain();
    gain1.gain.setValueAtTime(0.15, now);
    gain1.gain.setValueAtTime(0.15, now + 1.8);
    gain1.gain.linearRampToValueAtTime(0, now + 2.0);
    osc1.connect(gain1).connect(audioCtx.destination);
    osc1.start(now);
    osc1.stop(now + 2.0);

    const osc2 = audioCtx.createOscillator();
    osc2.frequency.value = 480;
    osc2.type = 'sine';
    const gain2 = audioCtx.createGain();
    gain2.gain.setValueAtTime(0.15, now);
    gain2.gain.setValueAtTime(0.15, now + 1.8);
    gain2.gain.linearRampToValueAtTime(0, now + 2.0);
    osc2.connect(gain2).connect(audioCtx.destination);
    osc2.start(now);
    osc2.stop(now + 2.0);
  };

  if (options.sound) {
    ringOnce();
    // Ring every 6 seconds (2s on, 4s off) — standard phone cadence
    ringInterval = setInterval(ringOnce, 6000);
  }

  if (options.vibrate && typeof navigator !== 'undefined' && navigator.vibrate) {
    navigator.vibrate([500, 200, 500]);
  }
}

export function stopRingtone(): void {
  if (ringInterval) {
    clearInterval(ringInterval);
    ringInterval = null;
  }
  if (audioCtx) {
    // Cancel any scheduled oscillators by closing and recreating
    try {
      audioCtx.close();
    } catch {
      // already closed
    }
    audioCtx = null;
  }
}

/**
 * Play a short busy/error beep — used when call goes unanswered.
 */
export function playBusyBeep(): void {
  const ctx = getCtx();
  if (!ctx) return;
  const now = ctx.currentTime;

  const osc = ctx.createOscillator();
  osc.frequency.value = 480;
  osc.type = 'square';
  const gain = ctx.createGain();
  gain.gain.setValueAtTime(0.12, now);
  gain.gain.setValueAtTime(0.12, now + 0.25);
  gain.gain.linearRampToValueAtTime(0, now + 0.3);
  osc.connect(gain).connect(ctx.destination);
  osc.start(now);
  osc.stop(now + 0.3);

  // Second beep after a gap
  const osc2 = ctx.createOscillator();
  osc2.frequency.value = 480;
  osc2.type = 'square';
  const gain2 = ctx.createGain();
  gain2.gain.setValueAtTime(0.12, now + 0.5);
  gain2.gain.setValueAtTime(0.12, now + 0.75);
  gain2.gain.linearRampToValueAtTime(0, now + 0.8);
  osc2.connect(gain2).connect(ctx.destination);
  osc2.start(now + 0.5);
  osc2.stop(now + 0.8);
}
