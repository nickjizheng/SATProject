type WebkitAudioWindow = Window & typeof globalThis & {
  webkitAudioContext?: typeof AudioContext;
};

let feedbackContext: AudioContext | null = null;

const getFeedbackContext = () => {
  const AudioContextClass = window.AudioContext || (window as WebkitAudioWindow).webkitAudioContext;
  if (!AudioContextClass) return null;
  feedbackContext ??= new AudioContextClass();
  return feedbackContext;
};

export const prepareFeedbackAudio = () => {
  try {
    const context = getFeedbackContext();
    if (context?.state === 'suspended') void context.resume();
  } catch {
    // Sound remains optional if the browser does not expose Web Audio.
  }
};

export const playCorrectAnswerChime = () => {
  try {
    const context = getFeedbackContext();
    if (!context) return;
    if (context.state === 'suspended') void context.resume();

    const masterGain = context.createGain();
    const start = context.currentTime;

    masterGain.gain.setValueAtTime(0.0001, start);
    masterGain.gain.exponentialRampToValueAtTime(0.16, start + 0.025);
    masterGain.gain.exponentialRampToValueAtTime(0.0001, start + 0.75);
    masterGain.connect(context.destination);

    [523.25, 659.25, 783.99].forEach((frequency, index) => {
      const oscillator = context.createOscillator();
      const noteGain = context.createGain();
      const noteStart = start + index * 0.105;

      oscillator.type = 'sine';
      oscillator.frequency.setValueAtTime(frequency, noteStart);
      noteGain.gain.setValueAtTime(0.0001, noteStart);
      noteGain.gain.exponentialRampToValueAtTime(0.8, noteStart + 0.018);
      noteGain.gain.exponentialRampToValueAtTime(0.0001, noteStart + 0.32);
      oscillator.connect(noteGain);
      noteGain.connect(masterGain);
      oscillator.start(noteStart);
      oscillator.stop(noteStart + 0.34);
    });

  } catch {
    // Audio feedback is optional when a browser blocks sound playback.
  }
};
