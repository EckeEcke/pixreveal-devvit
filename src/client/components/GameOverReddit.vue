<template>
  <div class="game-over">
    <h1>Game <span>Over</span></h1>

    <div class="score-card">
      <span class="label">Your score</span>
      <span class="score">{{ score }}<small> / {{ maxScore }}</small></span>
    </div>

    <div class="percentile-card">
      <template v-if="loading">
        <span class="label loading-text">Ranking you…</span>
      </template>
      <template v-else-if="result">
        <span class="label">You beat</span>
        <span class="percentile" :style="{ color: rankColor }">{{ shownPercentile }}%</span>
        <span class="label">of players</span>
        <span v-if="result.best > score" class="best">Your best: {{ result.best }}</span>
        <span v-else-if="score > 0" class="best new-best">New personal best!</span>
      </template>
      <template v-else>
        <span class="label">Ranking is unavailable right now.</span>
      </template>
    </div>

    <button class="start-btn" @click="emit('again')">Play again</button>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref } from 'vue';
import type { ScoreRequest, ScoreResponse } from '../../shared/api';

const props = defineProps<{ score: number; maxScore: number }>();
const emit = defineEmits<{ (e: 'again'): void }>();

const loading = ref(true);
const result = ref<ScoreResponse | null>(null);
const shownPercentile = ref(0);
let rafId: number | null = null;

const rankColor = computed(() => {
  const p = result.value?.percentile ?? 0;
  if (p >= 90) return 'var(--neon-mint)';
  if (p >= 60) return 'var(--neon-yellow)';
  if (p >= 30) return 'var(--neon-cyan)';
  return 'var(--neon-pink)';
});

const countUp = (target: number) => {
  const start = performance.now();
  const duration = 900;
  const tick = (now: number) => {
    const t = Math.min(1, (now - start) / duration);
    shownPercentile.value = Math.round(target * (1 - Math.pow(1 - t, 3)));
    rafId = t < 1 ? requestAnimationFrame(tick) : null;
  };
  rafId = requestAnimationFrame(tick);
};

onMounted(async () => {
  try {
    const body: ScoreRequest = { score: props.score };
    const res = await fetch('/api/score', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data: ScoreResponse = await res.json();
    result.value = data;
    countUp(data.percentile);
  } catch (err) {
    console.error('Failed to submit score', err);
  } finally {
    loading.value = false;
  }
});

onUnmounted(() => {
  if (rafId !== null) cancelAnimationFrame(rafId);
});
</script>

<style scoped>
.game-over {
  width: 100%;
  max-width: 400px;
  margin: 0 auto;
  padding: 24px 12px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
  text-align: center;
  box-sizing: border-box;
}

.game-over h1 span {
  color: var(--primary);
}

.score-card,
.percentile-card {
  width: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  padding: 16px;
  border-radius: 8px;
  background: rgba(0, 0, 0, 0.4);
  border: 1px solid rgba(255, 255, 255, 0.1);
  box-shadow: inset 2px 2px 6px rgba(10, 10, 10, 0.4);
  box-sizing: border-box;
  animation: card-pop 0.4s ease-out both;
}

.percentile-card {
  min-height: 120px;
  justify-content: center;
  animation-delay: 0.15s;
}

.label {
  font-size: 12px;
  letter-spacing: 2px;
  text-transform: uppercase;
  color: var(--color-secondary);
}

.score {
  font-size: 48px;
  font-weight: 900;
  color: var(--neon-yellow);
  text-shadow: 0 0 12px var(--yellow-glow);
}

.score small {
  font-size: 20px;
  opacity: 0.5;
}

.percentile {
  font-size: 56px;
  font-weight: 900;
  line-height: 1.1;
  text-shadow: 0 0 14px currentColor;
}

.best {
  margin-top: 6px;
  font-size: 13px;
  color: rgba(255, 255, 255, 0.6);
}

.new-best {
  color: var(--neon-mint);
}

.start-btn {
  width: auto;
  min-width: 180px;
  padding: 12px 32px;
}
</style>