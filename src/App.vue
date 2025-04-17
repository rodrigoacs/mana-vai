<template>
  <div class="player-selector-container">
    <SpeedDial
      :model="items"
      direction="down"
      :pt="{
        menu: { class: 'custom-speeddial-menu' },
        action: { class: 'custom-speeddial-action' }
      }"
    >
      <template #button="{ toggleCallback }">
        <Button
          @click="toggleCallback"
          class="player-count-button"
        >
          <span class="player-icon">🔢</span>
        </Button>
      </template>
    </SpeedDial>
  </div>

  <div
    class="players-container"
    :class="{
      'grid-layout': counters > 2,
      'column-layout': counters <= 2,
      'one-player': counters === 1,
      'two-players': counters === 2,
      'three-players': counters === 3,
      'four-players': counters === 4,
      'five-players': counters === 5,
      'six-players': counters === 6
    }"
  >
    <LifeCounter
      v-for="n in counters"
      :key="'player-' + n"
      :playerId="n"
      :counters="counters"
      @update:color="updateColor"
      :class="{
        'full-width-player': (counters === 3 && n === 3) || (counters === 5 && n === 5)
      }"
    />
  </div>
</template>

<script setup>
import { ref, provide } from 'vue'
import LifeCounter from './components/LifeCounter.vue'
import SpeedDial from 'primevue/speeddial'
import Button from 'primevue/button'

const counters = ref(2)
const playerColors = ref({})

// Provide the reactive playerColors object to all components
provide('playerColors', playerColors)

// Função para atualizar a cor do jogador
function updateColor(color, playerId) {
  console.log("App.vue - Atualizando cor do jogador", playerId, "para", color)
  playerColors.value[playerId] = color
}

const items = ref([
  { icon: 'fa-solid fa-1', command: () => (counters.value = 1) },
  { icon: 'fa-solid fa-2', command: () => (counters.value = 2) },
  { icon: 'fa-solid fa-3', command: () => (counters.value = 3) },
  { icon: 'fa-solid fa-4', command: () => (counters.value = 4) },
  { icon: 'fa-solid fa-5', command: () => (counters.value = 5) },
  { icon: 'fa-solid fa-6', command: () => (counters.value = 6) },
])
</script>

<style scoped>
.players-container {
  display: flex;
  width: 100%;
  height: 100vh;
  overflow: hidden;
  flex-wrap: wrap;
}

.column-layout {
  flex-direction: column;
  flex-wrap: nowrap;
}

.grid-layout {
  align-content: stretch;
}

/* Layouts de grid básicos */
.grid-layout :deep(.container) {
  box-sizing: border-box;
}

/* Layout para 3 e 4 jogadores (2x2) */
.three-players :deep(.container),
.four-players :deep(.container) {
  width: 50% !important;
  height: 50vh !important;
  flex: 0 0 50%;
}

/* Layout para 5 e 6 jogadores (2x3) */
.five-players :deep(.container),
.six-players :deep(.container) {
  width: 50% !important;
  height: 33.333vh !important;
  flex: 0 0 50%;
}

/* Jogadores que ocupam toda a largura */
.three-players :deep(.full-width-player),
.five-players :deep(.full-width-player) {
  width: 100% !important;
  flex-basis: 100%;
}

/* Layout para 1 e 2 jogadores */
.column-layout :deep(.container) {
  width: 100% !important;
}

/* Quando há apenas 1 jogador */
.one-player :deep(.container) {
  height: 100vh !important;
}

/* Quando há 2 jogadores */
.two-players :deep(.container) {
  height: 50vh !important;
}

.player-selector-container {
  position: absolute;
  top: 10px;
  left: 10px;
  z-index: 100;
}

.player-count-button {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 45px;
  height: 45px;
  border-radius: 50%;
  border: none;
  background-color: rgba(0, 0, 0, 0.5);
  font-weight: bold;
  box-shadow: 0 0 10px rgba(0, 0, 0, 0.5);
  transition: all 0.3s ease;
  padding: 0;
}

.player-count-button:hover {
  transform: scale(1.1);
  background-color: rgba(0, 0, 0, 0.7) !important;
  border: none !important;
  box-shadow: 0 0 15px rgba(0, 0, 0, 0.7);
}

.player-icon {
  font-size: 22px;
  display: flex;
  align-items: center;
  justify-content: center;
}

:deep(.custom-speeddial-menu) {
  background-color: rgba(0, 0, 0, 0.5);
  border-radius: 10px;
  padding: 8px;
  border: 2px solid white;
  margin-top: 5px;
  box-shadow: 0 0 15px rgba(0, 0, 0, 0.7);
}

:deep(.custom-speeddial-action) {
  width: 40px;
  height: 40px;
  margin: 5px;
  background-color: rgba(255, 255, 255, 0.2);
  border: 2px solid white;
  border-radius: 50%;
  color: white;
  font-weight: bold;
  font-size: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.3s ease;
  box-shadow: 0 0 5px rgba(0, 0, 0, 0.3);
}

:deep(.custom-speeddial-action:hover) {
  transform: scale(1.1);
  background-color: rgba(255, 255, 255, 0.3) !important;
  box-shadow: 0 0 10px rgba(0, 0, 0, 0.5);
}

:deep(.p-speeddial-item) {
  margin: 8px 0;
}
</style>
