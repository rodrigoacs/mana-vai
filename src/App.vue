<template>
  <div class="player-selector-container no-select">
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

    <!-- Botão de sorteio de jogadores -->
    <Button
      @click="rollDice"
      class="dice-button"
      :disabled="isRolling || counters < 2"
    >
      <span class="dice-icon">🎲</span>
    </Button>

    <!-- Botão para resetar a partida -->
    <Button
      @click="confirmReset"
      class="reset-button"
    >
      <span class="reset-icon">🔄</span>
    </Button>
  </div>

  <!-- Overlay para exibir o resultado do sorteio -->
  <Transition name="fade">
    <div
      v-if="showRollResult"
      class="dice-result-overlay no-select"
      @click="hideRollResult"
    >
      <div
        class="dice-result-container"
        :class="{ 'rolling': isRolling }"
      >
        <div
          v-if="isRolling"
          class="rolling-dice"
        >🎲</div>
        <div
          v-else
          class="dice-result"
        >
          <div
            class="result-player"
            :style="{ backgroundColor: rolledPlayerColor }"
          >
            {{ rolledPlayerNumber }}
          </div>
          <div class="result-instruction">(Clique para fechar)</div>
        </div>
      </div>
    </div>
  </Transition>

  <!-- Dialog de confirmação para reset -->
  <Dialog
    v-model:visible="showResetConfirm"
    modal
    header="Reiniciar partida?"
    :pt="{
      root: { class: 'custom-dialog no-select' },
      header: { class: 'dialog-header' },
      content: { class: 'dialog-content' }
    }"
  >
    <div class="confirm-buttons">
      <Button
        @click="resetGame"
        class="confirm-button confirm-yes"
      >Reiniciar</Button>
      <Button
        @click="showResetConfirm = false"
        class="confirm-button confirm-no"
      >Cancelar</Button>
    </div>
  </Dialog>

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
import { ref, provide, computed } from 'vue'
import LifeCounter from './components/LifeCounter.vue'
import SpeedDial from 'primevue/speeddial'
import Button from 'primevue/button'
import Dialog from 'primevue/dialog'

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
  // { icon: 'fa-solid fa-5', command: () => (counters.value = 5) },
  // { icon: 'fa-solid fa-6', command: () => (counters.value = 6) },
])

// Variáveis para o sorteio de jogadores
const isRolling = ref(false)
const showRollResult = ref(false)
const rolledPlayerNumber = ref(null)
const rolledPlayerColor = computed(() => {
  return rolledPlayerNumber.value ? playerColors.value[rolledPlayerNumber.value] || '#111111' : '#111111'
})

// Variáveis para o reset de jogo
const showResetConfirm = ref(false)

// Função para sortear um jogador
function rollDice() {
  if (counters.value < 2) return

  isRolling.value = true
  showRollResult.value = true

  // Simulação de animação de rolagem
  let rollCount = 0
  const maxRolls = 10
  const intervalId = setInterval(() => {
    rolledPlayerNumber.value = Math.floor(Math.random() * counters.value) + 1
    rollCount++

    if (rollCount >= maxRolls) {
      clearInterval(intervalId)
      isRolling.value = false
    }
  }, 100)
}

// Função para esconder o resultado
function hideRollResult() {
  showRollResult.value = false
}

// Função para mostrar diálogo de confirmação de reset
function confirmReset() {
  showResetConfirm.value = true
}

// Função para resetar o jogo
function resetGame() {
  // Emitir evento para cada contador de vida para resetar
  window.dispatchEvent(new CustomEvent('reset-game'))

  // Fechar o diálogo
  showResetConfirm.value = false
}
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
  display: flex;
  gap: 15px;
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

/* Estilos para o botão de dado */
.dice-button {
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

.dice-button:hover:not(:disabled) {
  transform: scale(1.1);
  background-color: rgba(0, 0, 0, 0.7) !important;
  border: none !important;
  box-shadow: 0 0 15px rgba(0, 0, 0, 0.7);
}

.dice-button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.dice-icon {
  font-size: 22px;
  display: flex;
  align-items: center;
  justify-content: center;
}

/* Estilos para o overlay de resultado */
.dice-result-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.7);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
  cursor: pointer;
}

.dice-result-container {
  background-color: rgba(30, 30, 30, 0.95);
  border-radius: 20px;
  padding: 30px;
  box-shadow: 0 0 30px rgba(0, 0, 0, 0.8);
  display: flex;
  flex-direction: column;
  align-items: center;
  min-width: 250px;
}

.rolling-dice {
  font-size: 80px;
  animation: roll 0.5s infinite;
}

@keyframes roll {
  0% {
    transform: rotate(0deg);
  }

  25% {
    transform: rotate(-30deg);
  }

  50% {
    transform: rotate(0deg);
  }

  75% {
    transform: rotate(30deg);
  }

  100% {
    transform: rotate(0deg);
  }
}

.dice-result {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 15px;
}

.result-title {
  font-size: 24px;
  font-weight: bold;
  color: white;
  margin-bottom: 10px;
}

.result-player {
  font-size: 60px;
  font-weight: bold;
  width: 120px;
  height: 120px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 0 15px rgba(0, 0, 0, 0.7);
  color: white;
  text-shadow: 1px 1px 3px rgba(0, 0, 0, 0.7);
}

.result-instruction {
  font-size: 14px;
  color: rgba(255, 255, 255, 0.7);
  margin-top: 15px;
}

/* Animação de fade */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

/* Estilos para o botão de reset */
.reset-button {
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

.reset-button:hover {
  transform: scale(1.1);
  background-color: rgba(0, 0, 0, 0.7) !important;
  border: none !important;
  box-shadow: 0 0 15px rgba(0, 0, 0, 0.7);
}

.reset-icon {
  font-size: 22px;
  display: flex;
  align-items: center;
  justify-content: center;
}

/* Estilos para o diálogo de confirmação */
.confirm-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
  margin-bottom: 20px;
}

.confirm-buttons {
  display: flex;
  justify-content: center;
  gap: 15px;
}

.confirm-button {
  padding: 10px 20px;
  border-radius: 10px;
  font-weight: bold;
  transition: all 0.3s ease;
}

.confirm-yes {
  background-color: #d32f2f !important;
  color: white !important;
  border: none !important;
}

.confirm-yes:hover {
  background-color: #b71c1c !important;
  transform: scale(1.05);
}

.confirm-no {
  background-color: #424242 !important;
  color: white !important;
  border: none !important;
}

.confirm-no:hover {
  background-color: #212121 !important;
  transform: scale(1.05);
}

/* Estilos responsivos para telas pequenas */
@media (max-width: 768px) {
  .player-selector-container {
    top: 5px;
    left: 5px;
    gap: 8px;
  }

  .player-count-button,
  .dice-button,
  .reset-button {
    width: 38px;
    height: 38px;
  }

  .player-icon,
  .dice-icon,
  .reset-icon {
    font-size: 18px;
  }

  :deep(.custom-speeddial-action) {
    width: 36px;
    height: 36px;
    margin: 4px;
  }

  .dice-result-container {
    padding: 20px;
    min-width: 200px;
  }

  .result-player {
    width: 100px;
    height: 100px;
    font-size: 50px;
  }

  .rolling-dice {
    font-size: 60px;
  }

  /* Ajustar diálogos para telas pequenas */
  :deep(.custom-dialog) {
    width: 90vw !important;
    max-width: 300px;
  }

  .confirm-buttons {
    flex-direction: column;
    gap: 10px;
  }

  .confirm-button {
    width: 100%;
  }
}

/* Ajuste específico para telas muito pequenas */
@media (max-width: 360px) {
  .player-selector-container {
    gap: 5px;
  }

  .player-count-button,
  .dice-button,
  .reset-button {
    width: 34px;
    height: 34px;
  }
}
</style>
