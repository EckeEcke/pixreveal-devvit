<template>
  <div class="start-screen">
    <img src="/assets/asset-reddit.webp" />

    <h1 class="logo">Pix<span>Reveal</span></h1>

    <p class="tagline">Guess the pixel art before it's fully revealed.</p>

    <button class="start-btn" @click="emit('start', $event)">Play</button>

    <p class="meta">
      5 drawings · 10 seconds each
    </p>
  </div>
</template>

<script setup lang="ts">
const emit = defineEmits<{ (e: 'start', event: MouseEvent): void }>()

</script>

<style scoped>
.start-screen {
  height: 100%;
  min-height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 12px;
  padding: 16px;
  box-sizing: border-box;
  text-align: center;
  background: radial-gradient(ellipse at top, #1a0b33 0%, var(--bg-dark) 70%);
}

img {
    width: 250px;
    max-width: 100%;
    max-width: 100%;
    border-radius: 8px;
}

.cell {
  width: 14px;
  height: 14px;
  background: var(--c);
  box-shadow: 0 0 8px var(--c);
  opacity: 0;
  animation: pop 0.3s steps(4) forwards;
}

.logo {
  margin: 4px 0 0;
  font-size: 26px;
  letter-spacing: 4px;
  line-height: 1.1;
  color: #fff;
}

.logo :deep(span),
.logo span {
  color: var(--primary);
}

.tagline {
  margin: 0;
  max-width: 280px;
  font-size: 14px;
  color: var(--color-secondary);
}

.start-btn {
  width: auto;
  min-width: 160px;
  margin-top: 4px;
  padding: 12px 32px;
}

.meta {
  margin: 0;
  font-size: 12px;
  color: rgba(255, 255, 255, 0.5);
  letter-spacing: 1px;
  text-transform: uppercase;
}
</style>