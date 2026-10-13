<template>
  <div class="game-view">
    <CountdownScreen v-if="game.phase === 'countdown'" :label="game.countdownLabel" />

    <GameOverReddit
      v-else-if="game.phase === 'over'"
      :score="game.totalScore"
      :max-score="MAX_SCORE"
      @again="game.startGame()"
    />

    <div v-else-if="game.currentRound" class="game-column">
      <GameHeader
        :count="game.count"
        :max="ROUND_SECONDS"
        :is-correct="game.isCorrect"
        :is-incorrect="game.isIncorrect"
        :total-score="game.totalScore"
        :current-round="game.roundNumber"
        :max-rounds="ROUNDS"
      />

      <PixelCanvas
        ref="canvasRef"
        :key="`canvas-${game.roundIndex}`"
        :pixel-array="game.currentRound.drawing.data"
        :is-revealing="true"
        :pause-reveal="game.introActive"
        :timer-duration="ROUND_SECONDS"
        @reveal="sound.playSound('reveal')"
      />

      <AnswerButtons
        :key="`answers-${game.roundIndex}`"
        :answers="game.currentRound.answers"
        :has-answered="game.phase === 'answered'"
        :intro="game.introActive"
        @answered="game.answer"
        @hover="sound.handleHoverSound"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted, onUnmounted, ref, watch } from 'vue';
import GameHeader from './components/GameHeader.vue';
import PixelCanvas from './components/PixelCanvas.vue';
import AnswerButtons from './components/AnswerButtons.vue';
import GameOverReddit from './components/GameOverReddit.vue';
import CountdownScreen from './components/CountdownScreen.vue';
import { MAX_SCORE, ROUND_SECONDS, ROUNDS, useGameStore } from './stores/game';
import { useSoundStore } from './stores/sound';
import { vibrateError, vibrateSuccess } from './utils/vibration';

const game = useGameStore();
const sound = useSoundStore();
const canvasRef = ref<InstanceType<typeof PixelCanvas> | null>(null);

watch(
  () => game.result,
  (result) => {
    if (result === 'correct') {
      canvasRef.value?.triggerCorrectAnswer();
      sound.playSound('correct');
      vibrateSuccess();
    } else if (result === 'incorrect' || result === 'timeout') {
      canvasRef.value?.triggerIncorrectAnswer();
      sound.playSound('incorrect');
      vibrateError();
    }
  },
);

watch(
  () => game.phase,
  (phase) => {
    if (phase === 'over') sound.playSound('complete');
  },
);

onMounted(() => game.startGame());
onUnmounted(() => game.clearTimers());
</script>

<style scoped>
.game-view {
  min-height: 100%;
  display: flex;
  justify-content: center;
  padding-bottom: 16px;
  background: radial-gradient(ellipse at top, #1a0b33 0%, var(--bg-dark) 70%);
}

.game-column {
  width: 100%;
  max-width: 400px;
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding: 0 12px;
  box-sizing: border-box;
}
</style>