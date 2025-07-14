<template>
  <div
    ref="containerRef"
    class="container no-select"
    :style="{ backgroundColor: colorValue }"
  >
    <div
      v-if="isMonarch"
      class="monarch-indicator"
      :style="{ transform: isReversed ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.3s ease' }"
    >
      <i class="fa-solid fa-crown"></i>
    </div>
    <div class="controls-container">
      <input
        type="color"
        class="color-input"
        :value="colorValue"
        @input="updateColorFromInput"
      />
      <Button
        class="button monarch-button"
        :class="{ active: isMonarch }"
        @click="$emit('set-monarch', playerId)"
      >
        <i class="fa-solid fa-crown"></i>
      </Button>
      <Button
        class="button reverse-orientation"
        @click="isReversed = !isReversed"
      >
        <i class="fa-solid fa-rotate"></i>

      </Button>
    </div>

    <div
      v-if="isDead"
      class="skull"
    >
      <i class="fa-solid fa-skull"></i>
    </div>

    <template v-else>
      <div
        class="counter no-select"
        :style="{ transform: isReversed ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.3s ease' }"
      >
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
              {{ lifeDelta > 0 ? `+${lifeDelta}` : lifeDelta }}
            </span>
          </transition>
        </div>
        <Button
          class="button increase"
          @click="changeLife(1)"
          icon="pi pi-plus"
        />
      </div>

      <div
        class="marker-buttons no-select"
        :style="{
          transform: isReversed ? 'rotate(180deg)' : 'rotate(0deg)',
          transition: 'transform 0.3s ease'
        }"
      >
        <Button
          v-for="(config, name) in markerLabels"
          :key="name"
          class="marker-toggle"
          @click="markerDialogs[name] = true"
        >
          <i
            v-if="config.icon"
            :class="config.icon"
            class="fa-fw"
          ></i>
          <span v-else>{{ config.label }}</span>

          <span
            v-if="markers[name] > 0"
            class="marker-count"
          >({{ markers[name] }})</span>
        </Button>

        <Button
          v-for="opponent in opponents"
          :key="'commander-' + opponent.id"
          class="marker-toggle cmd-button"
          :style="{ backgroundColor: opponent.color }"
          @click="markerDialogs['commander_' + opponent.id] = true"
        >
          <!-- <i class="fa-solid fa-shield-halved"></i> -->
          <img
            src="https://cdn-cardmavin.mavin.io/wp-content/uploads/2019/04/magic-card-symbol-commander-277x300.png"
            alt="Comandante"
            style="width: 20px; height: 20px;"
          >
          <span v-if="markers['commander_' + opponent.id] > 0">
            ({{ markers['commander_' + opponent.id] }})
          </span>
        </Button>
      </div>

      <Dialog
        v-for="(config, name) in markerLabels"
        :key="name + '-dialog'"
        v-model:visible="markerDialogs[name]"
        modal
        :header="config.label"
        :style="{
          width: '350px',
          transform: isReversed ? 'rotate(180deg)' : 'rotate(0deg)',
          transition: 'transform 0.3s ease'
        }"
        :pt="{
          root: { class: 'custom-dialog' },
          header: { class: 'dialog-header' },
          content: { class: 'dialog-content' }
        }"
      >
        <div class="marker">
          <Button
            class="button decrease"
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
            class="button increase"
            @click="changeMarker(name, 1)"
            icon="pi pi-plus"
          />
        </div>
      </Dialog>
      <Dialog
        v-for="opponent in opponents"
        :key="`commander_${opponent.id}-dialog`"
        v-model:visible="markerDialogs[`commander_${opponent.id}`]"
        modal
        header="Dano de Comandante"
        :style="{ width: '350px', transform: isReversed ? 'rotate(180deg)' : 'rotate(0deg)' }"
        :pt="{ root: { class: 'custom-dialog' }, header: { class: 'dialog-header' }, content: { class: 'dialog-content' } }"
      >
        <div class="marker">
          <Button
            class="button decrease"
            @click="changeMarkerAndLife(`commander_${opponent.id}`, -1)"
            icon="pi pi-minus"
          />
          <div class="marker-value-wrapper">
            <span class="marker-value">{{ markers[`commander_${opponent.id}`] }}</span>
            <transition name="fade-up">
              <span
                v-if="markerDeltas[`commander_${opponent.id}`] !== 0"
                class="life-delta"
                :class="{ positive: markerDeltas[`commander_${opponent.id}`] > 0, negative: markerDeltas[`commander_${opponent.id}`] < 0 }"
              >
                {{ markerDeltas[`commander_${opponent.id}`] > 0 ? `+${markerDeltas[`commander_${opponent.id}`]}` :
                  markerDeltas[`commander_${opponent.id}`] }}
              </span>
            </transition>
          </div>
          <Button
            class="button increase"
            @click="changeMarkerAndLife(`commander_${opponent.id}`, 1)"
            icon="pi pi-plus"
          />
        </div>
      </Dialog>
    </template>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted, inject, onBeforeUnmount } from 'vue'
import Button from 'primevue/button'
import Dialog from 'primevue/dialog'
import { useMarkers } from '../composables/useMarkers'

const props = defineProps({
  counters: Number,
  playerId: Number,
  isMonarch: Boolean
})
const emit = defineEmits(['update:color', 'set-monarch'])

const standardMarkersConfig = [
  { name: 'poison', label: 'Veneno', icon: 'fa-solid fa-skull-crossbones' },
  { name: 'energy', label: 'Energia', icon: 'fa-solid fa-bolt' },
  { name: 'experience', label: 'Experiência', icon: 'fa-solid fa-star' },
]

const lifeTotal = ref(40)
const lifeDelta = ref(0)
let lifeDeltaTimeout = null
const isReversed = ref(false)
const colorValue = ref('#111111')
const containerRef = ref(null)
const playerColors = inject('playerColors')

const opponents = computed(() => {
  const result = []
  for (let i = 1; i <= props.counters; i++) {
    if (i !== props.playerId) {
      result.push({
        id: i,
        color: playerColors.value[i] || '#111111',
      })
    }
  }
  return result
})

const { markers, markerDeltas, markerDialogs, markerLabels, changeMarker, resetMarkers } = useMarkers(standardMarkersConfig, opponents)

function changeLife(amount) {
  if (amount < 0 && lifeTotal.value <= 0) return
  lifeTotal.value += amount
  lifeDelta.value += amount
  clearTimeout(lifeDeltaTimeout)
  lifeDeltaTimeout = setTimeout(() => (lifeDelta.value = 0), 1000)
}

function changeMarkerAndLife(name, amount) {
  changeMarker(name, amount)
  if (name.startsWith('commander_')) {
    changeLife(-amount)
  }
}

const isDead = computed(() => {
  const commanderDamageTaken = Object.keys(markers.value)
    .filter(key => key.startsWith('commander_'))
    .some(key => markers.value[key] >= 21)

  return lifeTotal.value <= 0 || markers.value.poison >= 10 || commanderDamageTaken
})

function updateColorFromInput(event) {
  const newColor = event.target.value
  colorValue.value = newColor
  playerColors.value[props.playerId] = newColor
  if (containerRef.value) {
    containerRef.value.style.backgroundColor = newColor
  }
  emit('update:color', newColor, props.playerId)
}

function resetCounter() {
  lifeTotal.value = 40
  lifeDelta.value = 0
  resetMarkers()
}

onMounted(() => {
  if (playerColors.value[props.playerId]) {
    colorValue.value = playerColors.value[props.playerId]
  } else {
    const colors = ['#FF5656', '#6A7EFC', '#FFC107', '#7F55B1']
    const randomColor = colors[props.playerId % colors.length] || `#${Math.floor(Math.random() * 16777215).toString(16)}`
    colorValue.value = randomColor
    playerColors.value[props.playerId] = randomColor
  }
  window.addEventListener('reset-game', resetCounter)
})

onBeforeUnmount(() => {
  window.removeEventListener('reset-game', resetCounter)
})

watch(playerColors, () => {
  const myColor = playerColors.value[props.playerId]
  if (myColor && myColor !== colorValue.value) {
    colorValue.value = myColor
  }
}, { deep: true })
</script>

<style scoped>
/* 1. Container Principal & Controles Superiores */
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
  position: relative;
  overflow: hidden;
}

.controls-container {
  position: absolute;
  align-items: center;
  top: 10px;
  right: 10px;
  display: flex;
  gap: 10px;
  background-color: rgba(0, 0, 0, 0.5);
  padding: 5px;
  border-radius: 5px;
  z-index: 50;
}

.color-input {
  width: 35px;
  height: 35px;
  border: none;
  border-radius: 50%;
  overflow: hidden;
  cursor: pointer;
  transition: all 0.3s ease;
  padding: 0;
  background: rgba(0, 0, 0, 0.5);
  box-shadow: 0 0 5px rgba(0, 0, 0, 0.5);
}

.color-input:hover {
  transform: scale(1.1);
  box-shadow: 0 0 10px rgba(0, 0, 0, 0.5);
}

.color-input::-webkit-color-swatch-wrapper {
  padding: 0;
}

.color-input::-webkit-color-swatch {
  border: none;
}

.reverse-orientation {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  background-color: rgba(0, 0, 0, 0.5) !important;
  border: 2px solid white;
  transition: all 0.3s ease;
  font-size: 20px;
}

.reverse-orientation:hover {
  transform: scale(1.1);
  background-color: rgba(0, 0, 0, 0.7) !important;
}


/* 2. Contador de Vida Principal                 */
.counter {
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 35px 0 25px 0;
  background-color: rgba(0, 0, 0, 0.5);
  padding: 15px 20px;
  border-radius: 30px;
  position: relative;
}

.button {
  border: none;
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  justify-content: center;
  align-items: center;
  color: #ffffff;
  background-color: rgba(0, 0, 0, 0.5) !important;
  border-radius: 50%;
  width: 40px;
  height: 40px;
  flex-shrink: 0;
}

.button:hover {
  border: none !important;
  transform: scale(1.1);
  background-color: rgba(0, 0, 0, 0.7) !important;
  color: #ffffff !important;
}

.p-button:not(:disabled):hover {
  border: none;
}

.life-wrapper {
  position: relative;
  display: flex;
  justify-content: center;
  align-items: center;
  height: 40px;
  margin-bottom: 0;
}

.counter .life-total {
  font-size: 42px;
  line-height: 1;
  margin: 0 20px;
}

.life-total,
.marker-value {
  font-weight: bold;
  color: #ffffff;
  text-shadow: 1px 1px 3px rgba(0, 0, 0, 0.5);
  line-height: 1;
}

/* 3. Marcadores (Botões e Diálogos)  */
.marker-buttons {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  margin-top: 15px;
  justify-content: center;
  transition: transform 0.3s ease;
  background-color: rgba(0, 0, 0, 0.5);
  padding: 10px;
  border-radius: 15px;
  max-width: 80%;
  margin-left: auto;
  margin-right: auto;
}

.marker-toggle:not(.cmd-button) {
  background-color: rgba(0, 0, 0, 0.5) !important;
  color: #fff;
  border: none;
  font-size: 14px;
  padding: 8px 12px;
  border-radius: 15px;
}

.marker-toggle:not(.cmd-button):hover {
  background-color: rgba(0, 0, 0, 0.7) !important;
  color: #fff;
  transform: scale(1.05);
}

.cmd-button {
  border: none !important;
  font-weight: bold;
  color: black !important;
  box-shadow: 0 0 5px rgba(0, 0, 0, 0.5);
  font-size: 16px !important;
}

.cmd-button:hover {
  opacity: 0.8;
  transform: scale(1.05);
}

.monarch-indicator {
  color: #FFD700;
  background-color: rgba(0, 0, 0, 0.5);
  border-radius: 50%;
  padding: 10px;
  position: absolute;
  top: 10px;
  font-size: 32px;
  z-index: 50;
}

.monarch-button {
  font-size: 20px;
}

/* Diálogo dos marcadores */
.marker {
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 10px 0 30px 0;
  background-color: rgba(0, 0, 0, 0.5);
  padding: 15px;
  border-radius: 20px;
  min-height: 60px;
  position: relative;
}

.marker-value-wrapper {
  position: relative;
  display: flex;
  justify-content: center;
  align-items: center;
  height: 45px;
  margin-bottom: 0;
}

.marker .marker-value {
  font-size: 38px;
  margin: 0 20px;
}

.marker-value {
  font-size: 32px;
  margin: 0 15px;
}

.marker .button {
  width: 42px;
  height: 42px;
  margin: 0 10px;
}

/* 4. Elementos de Feedback (Delta e Caveira)    */
.life-delta {
  position: absolute;
  top: -54px;
  left: 0;
  right: 0;
  font-size: 22px;
  font-weight: bold;
  opacity: 1;
  transition: opacity 0.5s ease;
  color: white;
  text-shadow: 1px 1px 3px rgba(0, 0, 0, 0.5);
  z-index: 9999;
  width: 100%;
  text-align: center;
  background-color: rgba(0, 0, 0, 0.5);
  padding: 5px 0;
  border-radius: 10px;
}

.life-delta.positive {
  color: #4caf50;
}

.life-delta.negative {
  color: #f44336;
}

.marker .life-delta {
  top: -25px;
}

.skull {
  font-size: 80px;
  color: #fff;
  margin-top: 20px;
  background-color: rgba(0, 0, 0, 0.5);
  padding: 20px;
  border-radius: 50%;
  width: 120px;
  height: 120px;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 0 15px rgba(0, 0, 0, 0.7);
}

/* 5. Estilos de Diálogos (PrimeVue)             */
:deep(.p-dialog-content) {
  background-color: rgba(30, 30, 30, 0.9);
  color: white;
  padding: 20px;
  border-radius: 10px;
}

:deep(.p-dialog-header) {
  background-color: rgba(20, 20, 20, 0.95);
  color: white;
  padding: 15px 20px;
  border-top-left-radius: 10px;
  border-top-right-radius: 10px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

:deep(.custom-dialog) {
  border-radius: 15px;
  overflow: hidden;
  box-shadow: 0 0 25px rgba(0, 0, 0, 0.7);
  border: 1px solid rgba(255, 255, 255, 0.2);
}

:deep(.dialog-header) {
  background-color: rgba(20, 20, 20, 0.95);
  color: white;
  padding: 15px 20px;
  font-size: 20px;
  font-weight: bold;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  text-align: center;
}

:deep(.dialog-content) {
  background-color: rgba(30, 30, 30, 0.95);
  color: white;
  padding: 20px;
}

/* 6. Animações e Classes Utilitárias            */
.fade-up-enter-active,
.fade-up-leave-active {
  transition: all 0.5s ease;
}

.fade-up-enter-from,
.fade-up-leave-to {
  opacity: 0;
  transform: translateY(10px);
}

/* Classes ocultas (mantidas do original) */
.color-button,
.custom-color-picker,
.color-picker-container {
  display: none;
}

/* 7. Responsividade (Media Queries)             */
@media (max-width: 768px) {

  .container {
    justify-content: center;
    padding-top: 10px;
    padding-bottom: 10px;
  }

  .counter {
    order: 1;
  }

  .marker-buttons {
    order: 2;
  }

  .skull {
    order: 2;
  }

  .controls-container {
    order: 3;
  }

  .controls-container {
    position: relative;
    top: auto;
    right: auto;
    margin-top: 15px;
    margin-bottom: 10px;
    width: 90%;
    max-width: 200px;
    justify-content: center;
    background-color: rgba(0, 0, 0, 0.6);
    padding: 8px;
    border-radius: 20px;
    box-shadow: 0 0 10px rgba(0, 0, 0, 0.3);
  }

  .counter {
    padding: 10px 15px;
    margin: 15px 0;
  }

  .counter .life-total {
    font-size: 36px;
    margin: 0 10px;
  }

  .button {
    width: 35px;
    height: 35px;
    margin: 0 5px;
  }

  .reverse-orientation {
    width: 35px;
    height: 35px;
  }

  .life-delta {
    top: -24px;
    font-size: 18px;
  }

  .marker-buttons {
    padding: 8px;
    max-width: 90%;
    gap: 8px;
  }

  .marker-toggle:not(.cmd-button) {
    font-size: 13px;
    padding: 6px 10px;
  }

  .marker {
    margin: 5px 0 25px 0;
    padding: 10px;
  }

  .marker .marker-value {
    font-size: 30px;
    margin: 0 10px;
  }

  .marker .button {
    width: 38px;
    height: 38px;
  }

  :deep(.p-dialog-content) {
    padding: 15px;
  }
}

@media (max-width: 480px) {
  .counter {
    padding: 8px 12px;
    margin: 10px 0;
  }

  .counter .life-total {
    font-size: 32px;
    margin: 0 8px;
  }

  .button {
    width: 32px;
    height: 32px;
    margin: 0 3px;
  }

  .life-delta {
    top: -20px;
    font-size: 16px;
  }

  .marker-buttons {
    padding: 6px;
    max-width: 95%;
    gap: 6px;
  }

  .marker-toggle:not(.cmd-button) {
    font-size: 12px;
    padding: 4px 8px;
  }

  .skull {
    font-size: 60px;
    width: 100px;
    height: 100px;
    padding: 15px;
  }

  .controls-container {
    margin-top: 10px;
    padding: 6px;
    gap: 8px;
    width: 95%;
    max-width: 180px;
  }

  .color-input,
  .reverse-orientation {
    width: 30px;
    height: 30px;
  }

  .reverse-orientation {
    font-size: 16px;
  }
}
</style>
