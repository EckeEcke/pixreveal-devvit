<template>
  <div class="countdown">
    <span :key="label" class="label" :class="{ go: label.endsWith('!') }">{{ label }}</span>
  </div>
</template>

<script setup lang="ts">
defineProps<{ label: string }>();
</script>

<style scoped>
.countdown {
  width: 100%;
  min-height: 360px;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0 12px;
  box-sizing: border-box;
}

.label {
  font-family: '8bit';
  font-size: clamp(26px, 9vw, 44px);
  text-align: center;
  text-transform: uppercase;
  color: #fff;
  text-shadow: 4px 4px 0 rgba(0, 0, 0, 0.6);
  animation: pop 0.25s ease-out both;
}

.label.go {
  color: var(--neon-mint);
  text-shadow:
    0 0 14px var(--mint-glow),
    4px 4px 0 rgba(0, 0, 0, 0.6);
}
</style>