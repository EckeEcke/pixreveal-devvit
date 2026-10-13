import { defineStore } from 'pinia';
import { ref } from 'vue';

const sources = {
  correct: '/assets/audio/correct.mp3',
  incorrect: '/assets/audio/incorrect.mp3',
  reveal: '/assets/audio/reveal2.mp3',
  hover: '/assets/audio/hover.mp3',
  complete: '/assets/audio/complete.mp3',
} as const;

export type SoundName = keyof typeof sources;

export const useSoundStore = defineStore('sound', () => {
  const isAudioEnabled = ref(true);
  const cache: Partial<Record<SoundName, HTMLAudioElement>> = {};

  const getAudio = (name: SoundName): HTMLAudioElement => {
    const existing = cache[name];
    if (existing) return existing;
    const audio = new Audio(sources[name]);
    audio.preload = 'auto';
    cache[name] = audio;
    return audio;
  };

  const playSound = (name: SoundName): void => {
    if (!isAudioEnabled.value) return;
    const audio = getAudio(name);
    audio.currentTime = 0;
    audio.play().catch((err) => console.warn('Audio could not be played:', err));
  };

  const handleHoverSound = (): void => {
    if (window.matchMedia('(hover: hover)').matches) playSound('hover');
  };

  return { isAudioEnabled, playSound, handleHoverSound };
});