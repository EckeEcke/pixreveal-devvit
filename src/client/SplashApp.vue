<script setup lang="ts">
import { requestExpandedMode } from '@devvit/web/client';
import StartScreen from './components/StartScreen.vue';

const start = (e: MouseEvent) => requestExpandedMode(e, 'game');
</script>

<template>
  <StartScreen @start="start" />
</template>