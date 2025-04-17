<template>
  <div
    ref="containerRef"
    class="container"
    :style="{ width: counters > 2 ? '50%' : '100%' }"
  >
    <ColorPicker v-model="backgroundColor" />

    <div
      v-if="isDead"
      class="skull"
    >☠️</div>

    <template v-else>
      <div
        class="counter"
        :style="{
          transform: isReversed ? 'rotate(180deg)' : 'rotate(0deg)',
          transition: 'transform 0.3s ease'
        }"
      >
        ❤️
        <Button
          class="button decrease"
          @click="changeLife(-1)"
          icon="pi pi-minus"
        />
        <div class="life-wrapper">
          <span class="life-total">{{ lifeTotal }}</span>
          <transition name="fade-up">
            <span
              v-if="lifeDelta !== 0"
              class="life-delta"
              :class="{ positive: lifeDelta > 0, negative: lifeDelta < 0 }"
            >
              {{ lifeDelta > 0 ? '+' + lifeDelta : lifeDelta }}
            </span>
          </transition>
        </div>
        <Button
          class="button increase"
          @click="changeLife(1)"
          icon="pi pi-plus"
        />
        <Button
          class="button reverse-orientation"
          @click="isReversed = !isReversed"
        >
          🔄️
        </Button>
      </div>

      <div
        class="marker-buttons"
        :style="{
          transform: isReversed ? 'rotate(180deg)' : 'rotate(0deg)',
          transition: 'transform 0.3s ease'
        }"
      >
        <Button
          v-for="(label, name) in markerLabels"
          :key="name"
          class="marker-toggle"
          @click="markerDialogs[name] = true"
        >
          {{ label }}
          <span v-if="markers[name] > 0">({{ markers[name] }})</span>
        </Button>

        <Button
          v-for="(opponent, index) in opponentMarkers"
          :key="'commander-' + index"
          class="marker-toggle"
          :style="{ backgroundColor: opponent.color }"
          @click="markerDialogs['commander_' + index] = true"
        >
          🗡️
          <span v-if="markers['commander_' + index] > 0">
            ({{ markers['commander_' + index] }})
          </span>
        </Button>
      </div>

      <Dialog
        v-for="(label, name) in markerLabels"
        :key="name + '-dialog'"
        v-model:visible="markerDialogs[name]"
        modal
        :header="label"
        :style="{
          width: '300px',
          transform: isReversed ? 'rotate(180deg)' : 'rotate(0deg)',
          transition: 'transform 0.3s ease'
        }"
      >
        <div class="marker">
          <Button
            class="button"
            @click="changeMarker(name, -1)"
            icon="pi pi-minus"
          />
          <div class="marker-value-wrapper">
            <span class="marker-value">{{ markers[name] }}</span>
            <transition name="fade-up">
              <span
                v-if="markerDeltas[name] !== 0"
                class="life-delta"
                :class="{
                  positive: markerDeltas[name] > 0,
                  negative: markerDeltas[name] < 0
                }"
              >
                {{ markerDeltas[name] > 0 ? '+' + markerDeltas[name] : markerDeltas[name] }}
              </span>
            </transition>
          </div>
          <Button
            class="button"
            @click="changeMarker(name, 1)"
            icon="pi pi-plus"
          />
        </div>
      </Dialog>
    </template>
  </div>
</template>

<script setup>
import { ref, computed, watch, defineProps, defineEmits } from 'vue'
import Button from 'primevue/button'
import ColorPicker from 'primevue/colorpicker'
import Dialog from 'primevue/dialog'


const props = defineProps({
  counters: Number,
  playerId: Number,
})

const lifeTotal = ref(40)
const lifeDelta = ref(0)
let lifeDeltaTimeout = null

const emit = defineEmits(['update:backgroundColor'])
const backgroundColor = ref('#111111')
const backgroundColors = {}
const containerRef = ref(null)

watch(backgroundColor, (newColor) => {
  if (containerRef.value) {
    containerRef.value.style.backgroundColor = '#' + newColor.replace('#', '')

    backgroundColors[props.playerId] = newColor

    emit('update:backgroundColor', backgroundColors[props.playerId])

    console.log('Background color for ' + props.playerId + ' players:', newColor)
  }
})

function changeLife(amount) {
  lifeTotal.value += amount
  lifeDelta.value += amount
  clearTimeout(lifeDeltaTimeout)
  lifeDeltaTimeout = setTimeout(() => (lifeDelta.value = 0), 1000)
}

const markers = ref({
  poison: 0,
  energy: 0,
  experience: 0,
  commander: 0,
})

const markerDeltas = ref({
  poison: 0,
  energy: 0,
  experience: 0,
  commander: 0,
})

const markerLabels = {
  poison: '☠️',
  energy: '⚡',
  experience: '⭐',
  commander: '👑',
}

const markerDialogs = ref({
  poison: false,
  energy: false,
  experience: false,
  commander: false,
})

const markerTimers = {}

const opponentMarkers = computed(() => {
  const opponentCount = props.counters - 1
  return Array.from({ length: opponentCount }, (_, index) => ({
    index,
    color: `${backgroundColors[props.playerId] || '#111111'}`,
  }))
})

function changeMarker(name, amount) {
  markers.value[name] += amount
  markerDeltas.value[name] += amount

  if (name === 'commander') {
    changeLife(-amount)
  }

  clearTimeout(markerTimers[name])
  markerTimers[name] = setTimeout(() => {
    markerDeltas.value[name] = 0
  }, 1000)
}

const isDead = computed(() => {
  return (
    lifeTotal.value <= 0 ||
    markers.value.poison >= 10 ||
    markers.value.commander >= 21
  )
})

const isReversed = ref(false)
</script>

<style scoped>
.container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  background-color: #1d1d1d;
  width: 100%;
  margin: 0;
  padding: 0;
  flex: 1;
}

.counter,
.marker {
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 10px 0;
}

.button {
  border: none;
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  justify-content: center;
  align-items: center;
  color: #ffffff;
  background-color: transparent;
}

.button:hover {
  transform: scale(1.1);
  background-color: transparent !important;
  color: #ffffff !important;
  border: none !important;
}

.life-wrapper,
.marker-value-wrapper {
  position: relative;
  display: flex;
  justify-content: center;
  align-items: center;
}

.life-total,
.marker-value {
  font-size: 32px;
  font-weight: bold;
  margin: 0 15px;
  color: #ffffff;
  text-shadow: 1px 1px 3px rgba(0, 0, 0, 0.5);
}

.life-delta {
  position: absolute;
  top: -30px;
  font-size: 20px;
  font-weight: bold;
  opacity: 1;
  transition: opacity 0.5s ease;
  color: white;
  text-shadow: 1px 1px 3px rgba(0, 0, 0, 0.5);
  z-index: 9999;
}

.life-delta.positive {
  color: #4caf50;
}

.life-delta.negative {
  color: #f44336;
}

.fade-up-enter-active,
.fade-up-leave-active {
  transition: all 0.5s ease;
}

.fade-up-enter-from {
  opacity: 0;
  transform: translateY(10px);
}

.fade-up-leave-to {
  opacity: 0;
  transform: translateY(-10px);
}

.marker-buttons {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  margin-top: 15px;
  justify-content: center;
  transition: transform 0.3s ease;
}

.marker-toggle {
  background-color: #00000000;
  color: #fff;
  border: none;
  font-size: 14px;
}

.marker-toggle:hover {
  background-color: #444 !important;
  color: #fff;
  border: none !important;
}

.marker-toggle:hover {
  background-color: #666;
}

.skull {
  font-size: 80px;
  color: #fff;
  margin-top: 20px;
}

.reverse-orientation {
  background-color: #00000000;
  color: #fff;
}

.reverse-orientation:hover {
  background-color: #444 !important;
  color: #fff;
  border: none !important;
}
</style>
