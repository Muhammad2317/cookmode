// Timer-finished alarm: a beep synthesised with Web Audio (no audio files)
// plus vibration where supported. Everything fails silently: an alarm must
// never throw into the UI.

let context: AudioContext | null = null;

/**
 * Browsers only allow audio after a user gesture, so call this from the tap
 * that starts a timer; the alarm can then sound minutes later.
 */
export function unlockAudio(): void {
  try {
    context ??= new AudioContext();
    if (context.state === "suspended") void context.resume();
  } catch {
    context = null;
  }
}

/** Three short rising beeps. */
function beepOnce(): void {
  if (!context) return;
  try {
    if (context.state === "suspended") void context.resume();
    const start = context.currentTime + 0.02;
    [880, 988, 1175].forEach((frequency, i) => {
      const at = start + i * 0.22;
      const osc = context!.createOscillator();
      const gain = context!.createGain();
      osc.type = "sine";
      osc.frequency.value = frequency;
      gain.gain.setValueAtTime(0, at);
      gain.gain.linearRampToValueAtTime(0.35, at + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, at + 0.18);
      osc.connect(gain).connect(context!.destination);
      osc.start(at);
      osc.stop(at + 0.2);
    });
  } catch {
    // Audio unavailable: the visual state and vibration still signal it.
  }
}

function vibrate(): void {
  try {
    navigator.vibrate?.([300, 120, 300, 120, 600]);
  } catch {
    // Unsupported (e.g. iOS): ignore.
  }
}

/** Ring until stopped, capped so a forgotten phone doesn't beep forever. */
export function startAlarm({
  repeatMs = 2500,
  maxRings = 12,
} = {}): () => void {
  let rings = 0;
  const ring = () => {
    rings++;
    beepOnce();
    vibrate();
  };
  ring();
  const id = setInterval(() => {
    if (rings >= maxRings) clearInterval(id);
    else ring();
  }, repeatMs);
  return () => {
    clearInterval(id);
    try {
      navigator.vibrate?.(0);
    } catch {
      // ignore
    }
  };
}
