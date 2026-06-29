import type { DictionaryResponse } from '../types/dictionary';

export const getPronunciationAudioUrl = (audio: string) => {
  const normalized = audio.toLowerCase();
  let directory = normalized.charAt(0);

  if (normalized.startsWith('bix')) directory = 'bix';
  else if (normalized.startsWith('gg')) directory = 'gg';
  else if (!/^[a-z]/.test(normalized)) directory = 'number';

  return `https://media.merriam-webster.com/audio/prons/en/us/mp3/${directory}/${encodeURIComponent(audio)}.mp3`;
};

export const findPronunciationAudio = (entries: DictionaryResponse[]) => {
  for (const entry of entries) {
    const audio = entry?.hwi?.prs?.find(pronunciation => pronunciation.sound?.audio)?.sound?.audio;
    if (audio) return audio;
  }
  return null;
};

export const parseSavedDictionaryEntry = (wordData: string): DictionaryResponse[] => {
  try {
    const parsed: unknown = JSON.parse(wordData);
    if (Array.isArray(parsed)) return parsed as DictionaryResponse[];
    if (parsed && typeof parsed === 'object') return [parsed as DictionaryResponse];
  } catch {
    // Older saved rows can be repaired by a live lookup at playback time.
  }
  return [];
};
