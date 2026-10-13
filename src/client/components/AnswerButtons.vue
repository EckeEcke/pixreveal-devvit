<template>
  <div class="answer-buttons">
    <div
      class="button-wrapper"
      :class="{ 'is-intro': intro }"
      :style="{ '--pop-delay': `${index * 100}ms` }"
      v-for="(answer, index) in answers"
      :key="answer.title || answer.name"
    >
      <button
        class="answer-btn"
        :disabled="hasAnswered || inputDisabled"
        :style="{
          '--btn-color': buttonColors[index % buttonColors.length].color,
          '--btn-glow': buttonColors[index % buttonColors.length].glow,
        }"
        :class="{
          'is-wrong': hasAnswered && selectedAnswer === answer && !answer.isCorrect,
          'is-correct': hasAnswered && answer.isCorrect,
        }"
        @mouseenter="!hasAnswered && !intro && emit('hover')"
        @click="checkAnswer(answer, $event)"
      >
        {{ answer.title || answer.name }}
      </button>

      <span
        v-if="showKeyHints && !hasAnswered && !inputDisabled"
        class="key-hint"
        :style="{
          '--btn-color': buttonColors[index % buttonColors.length].color,
          '--btn-glow': buttonColors[index % buttonColors.length].glow,
        }"
      >
        {{ index + 1 }}
      </span>
    </div>
  </div>
</template>

<script setup>
import { ref, watch, onMounted, onUnmounted } from "vue"

const props = defineProps({
  answers: Array,
  hasAnswered: Boolean,
  inputDisabled: Boolean,
  // Intro phase: buttons pop in but can't be clicked yet
  intro: {
    type: Boolean,
    default: false,
  },
  showKeyHints: {
    type: Boolean,
    default: true,
  },
})

const emit = defineEmits(["answered", "hover"])

const buttonColors = [
  { color: "var(--neon-pink)", glow: "var(--pink-glow)" },
  { color: "var(--neon-mint)", glow: "var(--mint-glow)" },
  { color: "var(--neon-yellow)", glow: "var(--yellow-glow)" },
  { color: "var(--neon-cyan)", glow: "var(--cyan-glow)" },
]

const selectedAnswer = ref(undefined)

// New round: forget the previous selection
watch(
  () => props.hasAnswered,
  (answered) => {
    if (!answered) selectedAnswer.value = undefined
  }
)

const checkAnswer = (answer, event) => {
  if (props.hasAnswered || props.inputDisabled || props.intro) return
  if (event && event.currentTarget) event.currentTarget.blur()

  selectedAnswer.value = answer
  emit("answered", answer)
}

const handleKeydown = (event) => {
  if (props.hasAnswered || props.inputDisabled || props.intro) return

  if (["1", "2", "3", "4"].includes(event.key)) {
    const index = parseInt(event.key, 10) - 1
    if (props.answers[index]) checkAnswer(props.answers[index], null)
  }
}

onMounted(() => window.addEventListener("keydown", handleKeydown))
onUnmounted(() => window.removeEventListener("keydown", handleKeydown))
</script>

<style scoped>
.answer-buttons {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
  width: 100%;
}

.button-wrapper {
  position: relative;
  width: 100%;
  display: flex;
  /* staggered pop-in; "backwards" keeps the button hidden during its delay
     without freezing the end state (hover transforms stay possible) */
  animation: btn-pop-in 0.35s cubic-bezier(0.34, 1.56, 0.64, 1) var(--pop-delay, 0ms) backwards;
}

/* not clickable / hoverable while the intro runs */
.button-wrapper.is-intro {
  pointer-events: none;
}

@keyframes btn-pop-in {
  from {
    opacity: 0;
    transform: scale(0.5);
  }
  to {
    opacity: 1;
    transform: scale(1);
  }
}

@media (prefers-reduced-motion: reduce) {
  .button-wrapper {
    animation: none;
  }
}

.key-hint {
  position: absolute;
  top: -8px;
  left: -8px;
  min-width: 22px;
  height: 22px;
  padding: 0 4px;
  border-radius: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #0d0c1d;
  border: 2px solid var(--btn-color);
  color: var(--btn-color);
  font-size: 11px;
  font-weight: 900;
  line-height: 1;
  pointer-events: none;
  z-index: 10;
  box-shadow: 0 0 8px var(--btn-glow);
}

@media (pointer: coarse) {
  .key-hint {
    display: none;
  }
}

.answer-btn {
  display: flex;
  justify-content: center;
  align-items: center;
  background: rgba(20, 16, 38, 0.85);
  backdrop-filter: blur(12px);
  font-size: 11px;
  padding: 11px;
  height: 100%;
  text-transform: uppercase;
  font-family: inherit;
  letter-spacing: 2px;
  font-weight: 900;
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.15s ease-in-out;
  position: relative;
  overflow: hidden;
  width: 100%;
  border: 4px solid var(--btn-color);
  color: var(--btn-color);
  box-shadow:
    0 0 12px var(--btn-glow),
    inset 0 0 8px rgba(0, 0, 0, 0.7);
  text-shadow: 0 0 8px var(--btn-glow);
  z-index: 1;
}

@media (hover: hover) {
  .answer-btn:not(:disabled):hover {
    background: var(--btn-color);
    color: #0d0c1d;
    text-shadow: none;
    box-shadow:
      0 0 20px var(--btn-color),
      0 0 35px var(--btn-glow);
    transform: translateY(-2px);
  }

  .answer-btn:not(:disabled):hover ~ .key-hint {
    background: var(--btn-color);
    color: #0d0c1d;
    border-color: #0d0c1d;
  }
}

.answer-btn::after {
  content: "";
  position: absolute;
  top: 0;
  left: -150%;
  width: 100%;
  height: 100%;
  background: linear-gradient(
    90deg,
    transparent,
    rgba(255, 255, 255, 0) 10%,
    rgba(255, 255, 255, 0.6) 50%,
    rgba(255, 255, 255, 0) 90%
  );
  transform: skewX(-45deg);
  pointer-events: none;
  z-index: 2;
  opacity: 0;
}

.answer-btn.is-correct::after {
  animation: shine-sweep 0.5s steps(8) forwards;
}

.answer-btn.is-correct {
  background-color: var(--neon-success);
  color: white;
  box-shadow: 0 0 30px var(--neon-success);
  border-color: var(--neon-success);
  animation: success-shake 1.5s cubic-bezier(0.36, 0.07, 0.19, 0.97) both;
}

.answer-btn.is-wrong {
  background-color: var(--neon-error);
  color: white;
  animation: shake-fail 0.5s cubic-bezier(0.36, 0.07, 0.19, 0.97) both;
  box-shadow: 0 0 30px var(--neon-error);
  border-color: var(--neon-error);
}

.answer-btn:disabled:not(.is-correct):not(.is-wrong) {
  opacity: 0.2;
  filter: grayscale(0.7);
}
</style>