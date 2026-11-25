// Tiny WebAudio bleeps, synthesised in code — no sound files, no network.
// Everything is guarded: a browser without audio just stays silent.
export function createAudio() {
  let context = null;

  function ensure() {
    if (context) return context;
    try {
      const Ctor = window.AudioContext || window.webkitAudioContext;
      if (!Ctor) return null;
      context = new Ctor();
    } catch {
      return null;
    }
    return context;
  }

  function tone(freq, seconds, type, gainValue, when = 0) {
    const ctx = ensure();
    if (!ctx) return;
    try {
      if (ctx.state === 'suspended') void ctx.resume();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = type;
      osc.frequency.value = freq;
      gain.gain.setValueAtTime(gainValue, ctx.currentTime + when);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + when + seconds);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(ctx.currentTime + when);
      osc.stop(ctx.currentTime + when + seconds);
    } catch {
      // Sound is garnish; a failure here must never stop the game.
    }
  }

  return {
    pickup() { tone(520, 0.08, 'sine', 0.12); },
    place() { tone(340, 0.08, 'triangle', 0.12); },
    done() { tone(660, 0.1, 'sine', 0.12); tone(880, 0.12, 'sine', 0.1, 0.09); },
    served() { tone(523, 0.1, 'triangle', 0.14); tone(659, 0.1, 'triangle', 0.14, 0.09); tone(784, 0.18, 'triangle', 0.14, 0.18); },
    error() { tone(160, 0.16, 'sawtooth', 0.08); },
    expired() { tone(220, 0.2, 'sawtooth', 0.1); tone(175, 0.25, 'sawtooth', 0.1, 0.15); },
  };
}
