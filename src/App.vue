<script setup>
import { ref, computed, onMounted } from 'vue'
import Player from './components/Player.vue'
import Modal from './components/Modal.vue'

const initialPlayersData = [
  { id: 1, name: 'Player 1', life: 40, color: '#D94545' },
  { id: 2, name: 'Player 2', life: 40, color: '#457AD9' },
  { id: 3, name: 'Player 3', life: 40, color: '#D9C645' },
  { id: 4, name: 'Player 4', life: 40, color: '#8B45D9' },
]
const players = ref([])
const isPlayerCountModalOpen = ref(false)

// --- ESTADO PARA O SORTEIO ---
const isRollingDice = ref(false)
const highlightedPlayerId = ref(null)
const winnerId = ref(null)

// --- LÓGICA DO SORTEIO ---
const rollDice = () => {
  if (isRollingDice.value || players.value.length < 2) return

  isRollingDice.value = true
  winnerId.value = null
  let rollCount = 0
  const totalRolls = 30

  const rollInterval = setInterval(() => {
    const randomIndex = Math.floor(Math.random() * players.value.length)
    highlightedPlayerId.value = players.value[randomIndex].id
    rollCount++

    if (rollCount >= totalRolls) {
      clearInterval(rollInterval)
      winnerId.value = highlightedPlayerId.value
      highlightedPlayerId.value = null

      setTimeout(() => {
        winnerId.value = null
        isRollingDice.value = false
      }, 5000)
    }
  }, 100)
}

// --- LÓGICA EXISTENTE ---
const setupPlayers = (count) => {
  const activePlayersData = initialPlayersData.slice(0, count)
  players.value = activePlayersData.map((p, index) => {
    const opponentIds = activePlayersData.filter(op => op.id !== p.id).map(op => op.id)
    const commanderDamageFrom = {}
    opponentIds.forEach(id => { commanderDamageFrom[id] = 0 })
    return {
      ...p,
      poison: 0,
      experience: 0,
      energy: 0,
      commanderDamageFrom,
      isRotated: index < 2 && count > 2,
    }
  })
}

const handleSetPlayerCount = (count) => {
  setupPlayers(count)
  isPlayerCountModalOpen.value = false
}

onMounted(() => {
  setupPlayers(4)
})

const playerCount = computed(() => players.value.length)
const mainGridClass = computed(() => {
  if (playerCount.value === 3) return 'grid-players-3'
  if (playerCount.value <= 2) return 'grid-players-2'
  return 'grid-players-4'
})

const updatePlayerLife = (playerId, newLife) => {
  const player = players.value.find(p => p.id === playerId)
  if (player) player.life = newLife
}

const updatePlayerColor = (playerId, newColor) => {
  const player = players.value.find(p => p.id === playerId)
  if (player) player.color = newColor
}

const toggleRotation = (playerId) => {
  const player = players.value.find(p => p.id === playerId)
  if (player) player.isRotated = !player.isRotated
}

const updateCounter = (playerId, counter, value) => {
  const player = players.value.find(p => p.id === playerId)
  if (player && value >= 0) player[counter] = value
}

const updateCommanderDamage = (playerId, opponentId, damage) => {
  const player = players.value.find(p => p.id === playerId)
  if (player && damage >= 0) player.commanderDamageFrom[opponentId] = damage
}
</script>

<template>
  <div id="app-container">
    <main
      class="main-grid"
      :class="mainGridClass"
    >
      <Player
        v-for="player in players"
        :key="player.id"
        :player="player"
        :opponents="players.filter(p => p.id !== player.id)"
        :is-rotated="player.isRotated"
        :is-highlighted="player.id === highlightedPlayerId"
        :is-winner="player.id === winnerId"
        @update:life="newLife => updatePlayerLife(player.id, newLife)"
        @toggle-rotation="() => toggleRotation(player.id)"
        @update:counter="({ counter, value }) => updateCounter(player.id, counter, value)"
        @update:commanderDamage="({ opponentId, damage }) => updateCommanderDamage(player.id, opponentId, damage)"
        @update:color="newColor => updatePlayerColor(player.id, newColor)"
      />

      <div class="central-controls">
        <button
          @click="rollDice"
          class="control-btn"
          :disabled="isRollingDice"
          title="Sortear Jogador"
        >
          🎲
        </button>
        <button
          @click="isPlayerCountModalOpen = true"
          class="control-btn"
          title="Definir Jogadores"
        >
          👥
        </button>
      </div>
    </main>

    <Teleport to="body">
      <Modal
        :show="isPlayerCountModalOpen"
        title="Definir Quantidade de Jogadores"
        @close="isPlayerCountModalOpen = false"
      >
        <div class="player-count-options">
          <button
            @click="handleSetPlayerCount(2)"
            class="option-btn"
          >2 Jogadores</button>
          <button
            @click="handleSetPlayerCount(3)"
            class="option-btn"
          >3 Jogadores</button>
          <button
            @click="handleSetPlayerCount(4)"
            class="option-btn"
          >4 Jogadores</button>
        </div>
      </Modal>
    </Teleport>
  </div>
</template>

<style scoped>
#app-container {
  height: 100vh;
  width: 100vw;
  background-color: #121212;
  color: white;
  overflow: hidden;
  /* Previne scroll em mobile */
}

.main-grid {
  position: relative;
  height: 100%;
  display: grid;
  gap: 4px;
}

.central-controls {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  z-index: 100;
  display: flex;
  gap: 1rem;
  background-color: #1F1F1F;
  padding: 0.75rem;
  border-radius: 999px;
  box-shadow: 0 0 20px rgba(0, 0, 0, 0.5);
  border: 2px solid #333;
}

.control-btn {
  background: #333;
  color: white;
  border: none;
  width: 48px;
  height: 48px;
  border-radius: 50%;
  cursor: pointer;
  font-size: 1.5rem;
  display: grid;
  place-content: center;
  transition: background-color 0.2s, transform 0.2s;
}

.control-btn:hover {
  background: #444;
  transform: scale(1.1);
}

.control-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
  transform: none;
}

/* Layouts da Grelha */
.grid-players-2 {
  grid-template-rows: 1fr 1fr;
}

.grid-players-3 {
  grid-template-rows: 1fr 1fr;
  grid-template-columns: 1fr 1fr;
}

.grid-players-3> :nth-child(3) {
  grid-column: 1 / -1;
}

/* Faz o 3º jogador ocupar a largura toda */
.grid-players-4 {
  grid-template-columns: 1fr 1fr;
  grid-template-rows: 1fr 1fr;
}

.player-count-options {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.option-btn {
  width: 100%;
  padding: 1rem;
  font-size: 1.2rem;
  border: none;
  border-radius: 8px;
  background-color: #4A90E2;
  color: white;
  cursor: pointer;
}

.option-btn:hover {
  background-color: #357ABD;
}


/* --- MEDIA QUERY PARA MOBILE --- */
@media (max-width: 768px) {

  /* Força todos os layouts a serem uma única coluna vertical */
  .grid-players-2,
  .grid-players-3,
  .grid-players-4 {
    grid-template-columns: 1fr;
    grid-template-rows: repeat(auto-fit, minmax(0, 1fr));
  }

  /* Ajusta o terceiro jogador no layout de 3 para não ter formatação especial */
  .grid-players-3> :nth-child(3) {
    grid-column: auto;
  }

  .central-controls {
    padding: 0.5rem;
    gap: 0.5rem;
  }

  .control-btn {
    width: 44px;
    height: 44px;
    font-size: 1.25rem;
  }
}
</style>