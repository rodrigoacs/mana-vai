<script setup>
import { ref, computed, defineProps, defineEmits } from 'vue'
import Modal from './Modal.vue'

const props = defineProps({
  player: Object,
  opponents: Array,
  isRotated: Boolean,
  isHighlighted: Boolean,
  isWinner: Boolean,
})

const emit = defineEmits([
  'update:life',
  'toggle-rotation',
  'update:counter',
  'update:commanderDamage',
  'update:color'
])

// --- LÓGICA DE DERROTA ---
const isDefeated = computed(() => {
  return props.player.life <= 0 || props.player.poison >= 10
})

// --- LÓGICA DO TOOLTIP DE VIDA ---
const lifeDelta = ref(0)
const showLifeTooltip = ref(false)
const lifeTooltipTimer = ref(null)
const handleLifeChange = (amount) => {
  clearTimeout(lifeTooltipTimer.value)
  lifeDelta.value += amount
  showLifeTooltip.value = true
  emit('update:life', props.player.life + amount)
  lifeTooltipTimer.value = setTimeout(() => {
    showLifeTooltip.value = false
    lifeDelta.value = 0
  }, 2000)
}

// --- LÓGICA DO SELETOR DE CORES ---
const showColorPalette = ref(false)
const colorOptions = [
  '#D94545', '#457AD9', '#D9C645', '#8B45D9',
  '#45D98B', '#D98B45', '#303030', '#BDBDBD',
]
const selectColor = (color) => {
  emit('update:color', color)
  showColorPalette.value = false
}

// --- LÓGICA DO MODAL ---
const isModalOpen = ref(false)
const activeModalType = ref(null)
const modalTitle = computed(() => {
  switch (activeModalType.value) {
    case 'commander': return 'Dano de Comandante Recebido'
    case 'poison': return 'Marcadores de Veneno'
    case 'energy': return 'Contadores de Energia'
    case 'experience': return 'Contadores de Experiência'
    default: return 'Alterar Valor'
  }
})
const openModal = (type) => {
  if (isDefeated.value) return
  activeModalType.value = type
  isModalOpen.value = true
}
const closeModal = () => {
  isModalOpen.value = false
}

// --- FUNÇÕES DE EMISSÃO DE EVENTOS ---
const decreaseLife = () => handleLifeChange(-1)
const increaseLife = () => handleLifeChange(1)
const flipScreen = () => emit('toggle-rotation')
const updateCounter = (counter, delta) => {
  const newValue = props.player[counter] + delta
  if (newValue >= 0) {
    emit('update:counter', { counter, value: newValue })
  }
}
const updateCommanderDamage = (opponentId, delta) => {
  const newValue = props.player.commanderDamageFrom[opponentId] + delta
  if (newValue >= 0) {
    emit('update:commanderDamage', { opponentId, damage: newValue })
  }
}
</script>

<template>
  <div
    class="player-area"
    :style="{ backgroundColor: player.color }"
    :class="{ highlighted: isHighlighted, winner: isWinner }"
  >
    <div class="player-settings">
      <button
        @click="showColorPalette = !showColorPalette"
        class="settings-btn"
        title="Mudar cor"
      >
        🎨
      </button>
      <transition name="palette-fade">
        <div
          v-if="showColorPalette"
          class="color-palette"
        >
          <button
            v-for="color in colorOptions"
            :key="color"
            class="color-option"
            :style="{ backgroundColor: color }"
            @click="selectColor(color)"
          ></button>
        </div>
      </transition>
    </div>

    <div
      class="player-content"
      :class="{ 'rotated': isRotated, 'defeated': isDefeated }"
    >
      <div class="life-counter-wrapper">
        <div class="life-counter">
          <button
            @click="decreaseLife"
            class="life-btn minus"
          >-</button>
          <span class="life-total">{{ player.life }}</span>
          <button
            @click="increaseLife"
            class="life-btn plus"
          >+</button>
        </div>
        <transition name="tooltip-fade">
          <div
            v-if="showLifeTooltip"
            class="delta-tooltip"
          >
            {{ lifeDelta > 0 ? '+' : '' }}{{ lifeDelta }}
          </div>
        </transition>
      </div>

      <div class="icon-tray">
        <div
          @click="openModal('commander')"
          class="commander-damage-panel"
          title="Editar Dano de Comandante"
        >
          <div
            v-for="opponent in opponents"
            :key="opponent.id"
            class="commander-damage-item"
          >
            <span
              class="opponent-dot"
              :style="{ backgroundColor: opponent.color }"
            ></span>
            <span class="damage-value">{{ player.commanderDamageFrom[opponent.id] || 0 }}</span>
          </div>
        </div>
        <button
          @click="openModal('poison')"
          class="tray-btn"
          title="Veneno"
        >
          <span class="emoji-icon">☠️</span>
          <span class="counter-badge">{{ player.poison }}</span>
        </button>
        <button
          @click="openModal('energy')"
          class="tray-btn"
          title="Energia"
        >
          <span class="emoji-icon">⚡️</span>
          <span class="counter-badge">{{ player.energy }}</span>
        </button>
        <button
          @click="openModal('experience')"
          class="tray-btn"
          title="Experiência"
        >
          <span class="emoji-icon">⭐</span>
          <span class="counter-badge">{{ player.experience }}</span>
        </button>
        <button
          @click="flipScreen"
          class="tray-btn"
          title="Virar Ecrã"
        >
          <span class="emoji-icon">🔄</span>
        </button>
      </div>
    </div>

    <transition name="defeat-fade">
      <div
        v-if="isDefeated"
        class="defeat-overlay"
      >
        <span class="defeat-icon">💀</span>
      </div>
    </transition>

    <Teleport to="body">
      <Modal
        :show="isModalOpen"
        :title="modalTitle"
        :is-rotated="isRotated"
        @close="closeModal"
      >
        <div class="modal-counters-wrapper">
          <div
            v-if="activeModalType === 'commander'"
            class="counters-group"
          >
            <div
              class="counter-item"
              v-for="opponent in opponents"
              :key="opponent.id"
            >
              <span class="counter-label">
                <span
                  class="modal-opponent-dot"
                  :style="{ backgroundColor: opponent.color }"
                ></span>
                {{ opponent.name }}
              </span>
              <div class="counter-control">
                <button @click="updateCommanderDamage(opponent.id, -1)">-</button>
                <span>{{ player.commanderDamageFrom[opponent.id] }}</span>
                <button @click="updateCommanderDamage(opponent.id, 1)">+</button>
              </div>
            </div>
          </div>

          <div
            v-if="['poison', 'energy', 'experience'].includes(activeModalType)"
            class="counters-group"
          >
            <div class="single-counter-item">
              <button
                @click="updateCounter(activeModalType, -1)"
                class="large-btn"
              >-</button>
              <span class="counter-value">{{ player[activeModalType] }}</span>
              <button
                @click="updateCounter(activeModalType, 1)"
                class="large-btn"
              >+</button>
            </div>
          </div>
        </div>
      </Modal>
    </Teleport>
  </div>
</template>

<style scoped>
.player-area {
  position: relative;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  padding: 1rem;
  overflow: hidden;
  transition: transform 0.2s ease-out, box-shadow 0.2s ease-out, border-color 0.2s ease-out;
  border: 4px solid transparent;
}

.player-area.highlighted {
  transform: scale(1.03);
  box-shadow: 0 0 30px 10px rgba(255, 255, 255, 0.7);
  z-index: 50;
}

.player-area.winner {
  transform: scale(1.05);
  border-color: #FFD700;
  box-shadow: 0 0 40px 15px #FFD700;
  z-index: 50;
}

.defeat-overlay {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(20, 20, 20, 0.7);
  backdrop-filter: blur(4px);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 15;
}

.defeat-icon {
  font-size: 10rem;
  text-shadow: 0 0 25px rgba(0, 0, 0, 0.5);
  transform: rotate(-15deg);
}

.defeat-fade-enter-active,
.defeat-fade-leave-active {
  transition: opacity 0.5s ease, transform 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275);
}

.defeat-fade-enter-from,
.defeat-fade-leave-to {
  opacity: 0;
  transform: scale(1.5);
}

.player-settings {
  position: absolute;
  top: 0.75rem;
  right: 0.75rem;
  z-index: 20;
}

.settings-btn {
  background-color: rgba(0, 0, 0, 0.3);
  border: none;
  border-radius: 50%;
  width: 40px;
  height: 40px;
  display: grid;
  place-content: center;
  font-size: 1.25rem;
  cursor: pointer;
}

.color-palette {
  position: absolute;
  top: 100%;
  right: 0;
  margin-top: 0.5rem;
  background-color: rgba(0, 0, 0, 0.7);
  backdrop-filter: blur(5px);
  border-radius: 12px;
  padding: 0.75rem;
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 0.75rem;
}

.color-option {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  border: 2px solid rgba(255, 255, 255, 0.6);
  cursor: pointer;
}

.palette-fade-enter-active,
.palette-fade-leave-active {
  transition: opacity 0.2s ease, transform 0.2s ease;
}

.palette-fade-enter-from,
.palette-fade-leave-to {
  opacity: 0;
  transform: translateY(-10px);
}

.player-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1rem;
  transition: transform 0.4s ease, opacity 0.5s ease, filter 0.5s ease;
}

.player-content.rotated {
  transform: rotate(180deg);
}

.player-content.defeated {
  opacity: 0.3;
  filter: grayscale(80%);
  pointer-events: none;
}

.life-counter-wrapper {
  position: relative;
}

.life-counter {
  display: flex;
  align-items: center;
  gap: 1rem;
  background-color: rgba(0, 0, 0, 0.25);
  padding: 0.5rem 1rem;
  border-radius: 999px;
}

.life-total {
  font-size: 2.5rem;
  font-weight: 700;
  min-width: 60px;
  text-align: center;
}

.life-btn {
  width: 36px;
  height: 36px;
  font-size: 1.75rem;
  border: none;
  background-color: rgba(255, 255, 255, 0.2);
  color: white;
  border-radius: 50%;
  cursor: pointer;
  display: flex;
  justify-content: center;
  align-items: center;
}

.delta-tooltip {
  font-size: 1.75rem;
  padding: 0.4rem 1rem;
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  background-color: rgba(0, 0, 0, 0.75);
  color: white;
  border-radius: 1.5rem;
  font-weight: bold;
  pointer-events: none;
  z-index: 10;
}

.tooltip-fade-enter-active,
.tooltip-fade-leave-active {
  transition: opacity 0.3s ease, transform 0.3s ease;
}

.tooltip-fade-enter-from,
.tooltip-fade-leave-to {
  opacity: 0;
  transform: translate(-50%, -50%) scale(0.8);
}

.icon-tray {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  align-items: center;
  gap: 0.5rem;
  background-color: rgba(0, 0, 0, 0.25);
  padding: 0.5rem;
  border-radius: 999px;
}

.commander-damage-panel {
  display: flex;
  gap: 0.5rem;
  background-color: rgba(0, 0, 0, 0.2);
  padding: 0.4rem 0.6rem;
  border-radius: 20px;
  cursor: pointer;
}

.commander-damage-item {
  display: flex;
  align-items: center;
  gap: 0.3rem;
}

.opponent-dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  border: 1px solid rgba(255, 255, 255, 0.5);
}

.damage-value {
  font-size: 0.9rem;
  color: white;
  font-weight: 600;
  line-height: 1;
}

.tray-btn {
  display: flex;
  align-items: center;
  gap: 0.4rem;
  background-color: rgba(0, 0, 0, 0.2);
  padding: 0.4rem 0.6rem;
  border-radius: 20px;
  border: none;
  cursor: pointer;
}

.emoji-icon {
  font-size: 1rem;
  line-height: 1;
}

.counter-badge {
  font-size: 0.8rem;
  color: white;
  background-color: rgba(0, 0, 0, 0.3);
  padding: 0.1rem 0.4rem;
  border-radius: 10px;
  text-align: center;
}

.modal-counters-wrapper,
.counters-group,
.counter-item,
.counter-label,
.modal-opponent-dot,
.counter-control,
.single-counter-item,
.counter-value,
.large-btn {
  /* Estilos do Modal */
  display: flex;
}

.modal-counters-wrapper {
  flex-direction: column;
  gap: 1rem;
}

.counters-group {
  flex-direction: column;
  gap: 0.75rem;
}

.counter-item {
  align-items: center;
  justify-content: space-between;
  background-color: rgba(0, 0, 0, 0.2);
  border-radius: 20px;
  padding: 0.5rem 1rem;
  width: 100%;
}

.counter-label {
  font-size: 1rem;
  font-weight: 500;
  align-items: center;
  gap: 0.75rem;
}

.modal-opponent-dot {
  width: 16px;
  height: 16px;
  border-radius: 50%;
  border: 1px solid rgba(255, 255, 255, 0.5);
  flex-shrink: 0;
}

.counter-control {
  align-items: center;
  gap: 1rem;
}

.counter-control span {
  font-size: 1.25rem;
  font-weight: bold;
  min-width: 30px;
  text-align: center;
}

.counter-control button {
  background-color: rgba(255, 255, 255, 0.15);
  border: none;
  color: white;
  width: 30px;
  height: 30px;
  border-radius: 50%;
  font-size: 1.5rem;
  font-weight: bold;
  cursor: pointer;
}

.single-counter-item {
  justify-content: space-around;
  align-items: center;
  padding: 1rem 0;
}

.counter-value {
  font-size: 3rem;
  font-weight: bold;
}

/* Tamanho reduzido para mobile */
.large-btn {
  font-size: 2.5rem;
  width: 50px;
  height: 50px;
  border-radius: 50%;
  border: none;
  background-color: rgba(0, 0, 0, 0.3);
  color: white;
  cursor: pointer;
}

/* --- MEDIA QUERY PARA DESKTOPS --- */
@media (min-width: 769px) {

  /* Restaura os tamanhos maiores para ecrãs grandes */
  .player-content {
    gap: 1.5rem;
  }

  .settings-btn {
    width: 44px;
    height: 44px;
    font-size: 1.5rem;
  }

  .life-total {
    font-size: 3rem;
    min-width: 80px;
  }

  .life-btn {
    width: 40px;
    height: 40px;
    font-size: 2rem;
  }

  .delta-tooltip {
    font-size: 2rem;
    padding: 0.5rem 1.25rem;
  }

  .icon-tray {
    flex-wrap: nowrap;
  }

  .emoji-icon {
    font-size: 1.25rem;
  }

  .counter-badge {
    font-size: 0.9rem;
  }

  .damage-value {
    font-size: 1rem;
  }

  .counter-value {
    font-size: 4rem;
  }

  .large-btn {
    font-size: 3rem;
    width: 60px;
    height: 60px;
  }
}
</style>