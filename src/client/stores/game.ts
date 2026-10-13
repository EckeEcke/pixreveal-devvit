import { defineStore } from 'pinia';
import { computed, ref } from 'vue';
import drawingsJson from '../data/drawings.json';

export const ROUNDS = 5;
export const ROUND_SECONDS = 10;
export const MAX_SCORE = ROUNDS * ROUND_SECONDS;
const FEEDBACK_MS_CORRECT = 1800;
const FEEDBACK_MS_WRONG = 2600;
const COUNTDOWN_STEPS = ['GET READY', '2', '1', 'GUESS!'];
const COUNTDOWN_STEP_MS = 700;
// Intro per round: answer buttons pop in, reveal + timer + input start afterwards
const INTRO_MS = 1000;

export interface Drawing {
  name: string;
  category?: string;
  themes?: string[];
  primaryColor?: number;
  data: number[][];
}

export interface Answer {
  name: string;
  isCorrect: boolean;
}

export interface Round {
  drawing: Drawing;
  answers: Answer[];
}

type Phase = 'start' | 'countdown' | 'playing' | 'answered' | 'over';
type Result = 'correct' | 'incorrect' | 'timeout' | null;

const allDrawings = drawingsJson as unknown as Drawing[];

const pointsForCorrect = (secondsLeft: number): number => secondsLeft;

const shuffle = <T>(list: readonly T[]): T[] => {
  const copy = [...list];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j] as T, copy[i] as T];
  }
  return copy;
};

const uniqueByName = (list: readonly Drawing[]): Drawing[] => {
  const seen = new Set<string>();
  const result: Drawing[] = [];
  for (const drawing of list) {
    if (seen.has(drawing.name)) continue;
    seen.add(drawing.name);
    result.push(drawing);
  }
  return result;
};

const UNIQUE_COUNT = uniqueByName(allDrawings).length;

const buildRounds = (seen: ReadonlySet<string>): Round[] => {
  const pool = shuffle(uniqueByName(allDrawings));
  const unseen = pool.filter((d) => !seen.has(d.name));
  return unseen.slice(0, ROUNDS).map((drawing) => {
    const distractors = shuffle(pool.filter((d) => d.name !== drawing.name)).slice(0, 3);
    const answers = shuffle<Answer>([
      { name: drawing.name, isCorrect: true },
      ...distractors.map((d) => ({ name: d.name, isCorrect: false })),
    ]);
    return { drawing, answers };
  });
};

export const useGameStore = defineStore('game', () => {
  const phase = ref<Phase>('start');
  const rounds = ref<Round[]>([]);
  const roundIndex = ref(0);
  const totalScore = ref(0);
  const count = ref(ROUND_SECONDS);
  const result = ref<Result>(null);
  const lastPoints = ref(0);
  const countdownIndex = ref(0);
  const introActive = ref(false);
  const seenNames = new Set<string>();

  let tickId: ReturnType<typeof setInterval> | null = null;
  let advanceId: ReturnType<typeof setTimeout> | null = null;
  let countdownId: ReturnType<typeof setInterval> | null = null;
  let introId: ReturnType<typeof setTimeout> | null = null;

  const currentRound = computed<Round | null>(() => rounds.value[roundIndex.value] ?? null);
  const roundNumber = computed(() => roundIndex.value + 1);
  const isCorrect = computed(() => result.value === 'correct');
  const isIncorrect = computed(() => result.value === 'incorrect');
  const countdownLabel = computed(() => COUNTDOWN_STEPS[countdownIndex.value] ?? '');

  const clearTimers = () => {
    if (tickId) clearInterval(tickId);
    if (advanceId) clearTimeout(advanceId);
    if (countdownId) clearInterval(countdownId);
    if (introId) clearTimeout(introId);
    tickId = null;
    advanceId = null;
    countdownId = null;
    introId = null;
  };

  const advance = () => {
    advanceId = null;
    if (roundIndex.value + 1 >= rounds.value.length) {
      phase.value = 'over';
      return;
    }
    roundIndex.value += 1;
    startRound();
  };

  const finishRound = (outcome: Exclude<Result, null>, points: number) => {
    if (tickId) clearInterval(tickId);
    tickId = null;
    result.value = outcome;
    lastPoints.value = points;
    totalScore.value += points;
    phase.value = 'answered';
    advanceId = setTimeout(advance, outcome === 'correct' ? FEEDBACK_MS_CORRECT : FEEDBACK_MS_WRONG);
  };

  const startTimer = () => {
    tickId = setInterval(() => {
      count.value -= 1;
      if (count.value <= 0) {
        count.value = 0;
        finishRound('timeout', 0);
      }
    }, 1000);
  };

  const startRound = () => {
    result.value = null;
    lastPoints.value = 0;
    count.value = ROUND_SECONDS;
    // Intro first (buttons pop in, reveal paused, input locked), then timer starts
    introActive.value = true;
    phase.value = 'playing';
    introId = setTimeout(() => {
      introId = null;
      introActive.value = false;
      startTimer();
    }, INTRO_MS);
  };

  const startCountdown = () => {
    phase.value = 'countdown';
    countdownIndex.value = 0;
    countdownId = setInterval(() => {
      countdownIndex.value += 1;
      if (countdownIndex.value >= COUNTDOWN_STEPS.length) {
        if (countdownId) clearInterval(countdownId);
        countdownId = null;
        startRound();
      }
    }, COUNTDOWN_STEP_MS);
  };

  const answer = (picked: Answer) => {
    if (phase.value !== 'playing' || introActive.value) return;
    if (picked.isCorrect) finishRound('correct', pointsForCorrect(count.value));
    else finishRound('incorrect', 0);
  };

  const startGame = () => {
    clearTimers();
    introActive.value = false;
    if (UNIQUE_COUNT - seenNames.size < ROUNDS) seenNames.clear();
    const built = buildRounds(seenNames);
    if (built.length === 0) return;
    built.forEach((round) => seenNames.add(round.drawing.name));
    rounds.value = built;
    roundIndex.value = 0;
    totalScore.value = 0;
    result.value = null;
    startCountdown();
  };

  const backToStart = () => {
    clearTimers();
    introActive.value = false;
    phase.value = 'start';
  };

  return {
    phase,
    rounds,
    roundIndex,
    roundNumber,
    currentRound,
    totalScore,
    count,
    result,
    isCorrect,
    isIncorrect,
    lastPoints,
    countdownLabel,
    introActive,
    startGame,
    answer,
    backToStart,
    clearTimers,
  };
});