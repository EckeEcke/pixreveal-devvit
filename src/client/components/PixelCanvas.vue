<template>
  <div class="canvas-wrapper">
    <canvas ref="canvasRef" :width="internalSize" :height="internalSize"></canvas>
  </div>
</template>

<script setup>
import { ref, onMounted, watch, onUnmounted } from "vue"
import colorPalette from "../data/colorPalette"
import { useCanvasBase } from "../composables/useCanvasBase"

const props = defineProps({
  pixelArray: Array,
  resolution: Number,
  isRevealing: Boolean,
  timerDuration: Number,
  pauseReveal: Boolean,
})

const emit = defineEmits(["reveal"])

const internalSize = 600
const {
  canvasRef,
  getContext,
  calculateGrid,
  setAnimationFrameId,
  getAnimationFrameId,
  stopAnimation,
} = useCanvasBase(internalSize)

const timerDuration = props.timerDuration || 15

let intervalId = null
let dropTimeoutId = null

const flatPixelList = ref([])
const displayedPixels = ref([])

const SHINE_DURATION = 500
const shineState = ref(null)

const SHAKE_DURATION = 400
const SHAKE_MAGNITUDE = 6
const shakeState = ref(null)

const POP_DURATION = 350
const popState = ref(null)

const POP_IN_MS = 220
const POP_IN_START_SCALE = 0.6

const easeOutCubic = (t) => 1 - Math.pow(1 - t, 3)

const animatedPixels = ref([])

// Delta-time: keeps the physics drop effect identical on 60Hz and 120Hz displays
let lastFrameTime = null
const REFERENCE_FRAME_MS = 1000 / 60
const MAX_DT = 3

const getDeltaTime = () => {
  const now = performance.now()
  if (lastFrameTime === null) {
    lastFrameTime = now
    return 1
  }
  const elapsed = now - lastFrameTime
  lastFrameTime = now
  const dt = elapsed / REFERENCE_FRAME_MS
  return Math.min(Math.max(dt, 0), MAX_DT)
}

const updateFlatPixelList = () => {
  const list = []
  if (!props.pixelArray) return
  props.pixelArray.forEach((row, y) => {
    if (Array.isArray(row)) {
      row.forEach((val, x) => {
        if (val !== 0) list.push({ x, y, val })
      })
    }
  })
  flatPixelList.value = list
}

const clearTimers = () => {
  if (intervalId) clearInterval(intervalId)
  intervalId = null
  if (dropTimeoutId) clearTimeout(dropTimeoutId)
  dropTimeoutId = null
}

const startReveal = () => {
  clearTimers()
  animatedPixels.value = []
  shakeState.value = null
  shineState.value = null
  popState.value = null
  updateFlatPixelList()
  displayedPixels.value = []
  lastFrameTime = null

  if (!props.pixelArray || !props.pixelArray[0]) return

  const allVisible = [...flatPixelList.value]
  if (!props.isRevealing) {
    displayedPixels.value = allVisible
    if (!getAnimationFrameId()) render()
    return
  }

  const totalDurationMs = timerDuration * 1000 - 2000
  const dynamicSpeed = allVisible.length > 0 ? totalDurationMs / allVisible.length : 0
  allVisible.sort(() => Math.random() - 0.5)

  intervalId = setInterval(() => {
    if (props.pauseReveal) return
    if (allVisible.length > 0) {
      const next = allVisible.pop()
      displayedPixels.value.push({ ...next, createdAt: Date.now() })
      emit("reveal")
    } else {
      clearInterval(intervalId)
      intervalId = null
    }
  }, dynamicSpeed)

  if (!getAnimationFrameId()) render()
}

const preparePhysicsPixels = () => {
  const resolution = props.pixelArray?.length || 16
  const { cellSize, gap } = calculateGrid(resolution)

  animatedPixels.value = flatPixelList.value.map((p) => ({
    xPos: p.x * cellSize + gap,
    yPos: p.y * cellSize + gap,
    color: colorPalette[p.val] || "#fff",
    vx: (Math.random() - 0.5) * 6,
    vy: -1 - Math.random() * 3,
    gravity: 0.65,
    rot: 0,
    vRot: (Math.random() - 0.5) * 0.2,
  }))

  displayedPixels.value = []
}

const triggerCorrectAnswer = () => {
  clearTimers()
  displayedPixels.value = [...flatPixelList.value]
  playPop()
  playShine()
  if (!getAnimationFrameId()) render()
}

const triggerIncorrectAnswer = () => {
  clearTimers()
  displayedPixels.value = [...flatPixelList.value]
  playShake()

  dropTimeoutId = setTimeout(() => {
    dropTimeoutId = null
    preparePhysicsPixels()
  }, 1000)

  if (!getAnimationFrameId()) render()
}

const drawPixels = (ctx, pixels, baseSize, cellSize, gap, now) => {
  pixels.forEach((p) => {
    const color = colorPalette[p.val]
    let scaleAmt = 1
    let alpha = 1
    if (props.isRevealing && p.createdAt) {
      const t = Math.min(1, (now - p.createdAt) / POP_IN_MS)
      const e = easeOutCubic(t)
      scaleAmt = POP_IN_START_SCALE + (1 - POP_IN_START_SCALE) * e
      alpha = e
    }
    const currentSize = baseSize * scaleAmt
    const offsetPos = (baseSize - currentSize) / 2
    const x = p.x * cellSize + gap + offsetPos
    const y = p.y * cellSize + gap + offsetPos

    ctx.save()
    ctx.globalAlpha = alpha
    ctx.shadowColor = color
    ctx.shadowBlur = p.val === 1 ? 0 : 15
    ctx.fillStyle = color
    ctx.fillRect(x, y, currentSize, currentSize)

    if (p.val === 1) {
      ctx.strokeStyle = "rgba(175, 175, 175, 0.5)"
      ctx.lineWidth = 0.5
      ctx.strokeRect(x, y, currentSize, currentSize)
    }
    ctx.restore()
  })
}

const updateAndDrawPhysicsPixels = (ctx, baseSize, dt) => {
  for (let i = animatedPixels.value.length - 1; i >= 0; i--) {
    const p = animatedPixels.value[i]

    p.xPos += p.vx * dt
    p.yPos += p.vy * dt
    p.vy += p.gravity * dt
    p.rot += p.vRot * dt

    if (p.yPos > internalSize + 80 || p.yPos < -150) {
      animatedPixels.value.splice(i, 1)
      continue
    }

    ctx.save()
    ctx.translate(p.xPos + baseSize / 2, p.yPos + baseSize / 2)
    ctx.rotate(p.rot)
    ctx.fillStyle = p.color
    ctx.shadowColor = p.color
    ctx.shadowBlur = 8
    ctx.fillRect(-baseSize / 2, -baseSize / 2, baseSize, baseSize)
    ctx.restore()
  }
}

const drawShine = (ctx, size, progress) => {
  const bandWidth = size * 0.35
  const diagLen = size * Math.SQRT2
  const travel = diagLen + bandWidth * 2
  const pos = -bandWidth + progress * travel

  ctx.save()
  ctx.shadowBlur = 0
  ctx.shadowColor = "transparent"
  ctx.globalCompositeOperation = "source-atop"
  ctx.translate(size / 2, size / 2)
  ctx.rotate(-Math.PI / 4)
  ctx.translate(-diagLen / 2, -diagLen / 2)

  const gradient = ctx.createLinearGradient(pos, 0, pos + bandWidth, 0)
  gradient.addColorStop(0, "rgba(255,255,255,0)")
  gradient.addColorStop(0.5, "rgba(255,255,255,0.9)")
  gradient.addColorStop(1, "rgba(255,255,255,0)")
  ctx.fillStyle = gradient
  ctx.fillRect(pos, -diagLen, bandWidth, diagLen * 3)
  ctx.restore()
}

const render = () => {
  if (props.pauseReveal) {
    // Don't advance the timing baseline while paused
    lastFrameTime = null
    setAnimationFrameId(requestAnimationFrame(render))
    return
  }
  const ctx = getContext()
  if (!ctx) return

  const dt = getDeltaTime()

  const resolution = props.pixelArray?.length || 16
  const { cellSize, gap, baseSize } = calculateGrid(resolution)
  const now = Date.now()

  ctx.clearRect(0, 0, internalSize, internalSize)

  let shakeX = 0
  let shakeY = 0
  if (shakeState.value) {
    const progress = (now - shakeState.value.startTime) / SHAKE_DURATION
    if (progress >= 1) {
      shakeState.value = null
    } else {
      const magnitude = SHAKE_MAGNITUDE * (1 - progress)
      shakeX = Math.sin(progress * Math.PI * 10) * magnitude
      shakeY = Math.cos(progress * Math.PI * 7) * magnitude
    }
  }

  let scaleFactor = 1
  if (popState.value) {
    const progress = (now - popState.value.startTime) / POP_DURATION
    if (progress >= 1) {
      popState.value = null
    } else {
      scaleFactor = 1 + Math.sin(progress * Math.PI) * 0.07
    }
  }

  ctx.save()
  ctx.translate(internalSize / 2 + shakeX, internalSize / 2 + shakeY)
  ctx.scale(scaleFactor, scaleFactor)
  ctx.translate(-internalSize / 2, -internalSize / 2)

  drawPixels(ctx, displayedPixels.value, baseSize, cellSize, gap, now)

  if (animatedPixels.value.length > 0) {
    updateAndDrawPhysicsPixels(ctx, baseSize, dt)
  }

  if (shineState.value) {
    const progress = (now - shineState.value.startTime) / SHINE_DURATION
    if (progress >= 1) {
      shineState.value = null
    } else {
      drawShine(ctx, internalSize, progress)
    }
  }

  ctx.restore()

  setAnimationFrameId(requestAnimationFrame(render))
}

const playShine = () => {
  shineState.value = { startTime: Date.now() }
  if (!getAnimationFrameId()) render()
}

const playShake = () => {
  shakeState.value = { startTime: Date.now() }
  if (!getAnimationFrameId()) render()
}

const playPop = () => {
  popState.value = { startTime: Date.now() }
  if (!getAnimationFrameId()) render()
}

defineExpose({
  playShine,
  playShake,
  playPop,
  triggerCorrectAnswer,
  triggerIncorrectAnswer,
})

watch([() => props.pixelArray, () => props.isRevealing], () => startReveal(), { deep: true })

onMounted(() => startReveal())

onUnmounted(() => {
  clearTimers()
  stopAnimation()
})
</script>

<style scoped>
.canvas-wrapper {
  position: relative;
  border: 2px solid transparent;
  overflow: hidden;
  line-height: 0;
  background-color: #120f1f;
  background-image: radial-gradient(rgba(128, 0, 128, 0.2) 1px, transparent 1px);
  background-size: 8px 8px;
  box-shadow: rgba(0, 0, 0, 0.35) 0px 5px 15px;
}

.canvas-wrapper::after {
  content: "";
  position: absolute;
  inset: 0;
  pointer-events: none;
  background: radial-gradient(ellipse at center, transparent 40%, rgba(0, 0, 0, 0.05) 100%);
}

canvas {
  max-width: 100%;
  height: auto;
}
</style>