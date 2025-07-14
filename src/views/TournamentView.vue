<template>
  <div class="tournament-container">
    <!-- Sidebar with Rankings -->
    <div class="tournament-sidebar">
      <div class="sidebar-header">
        <h3>Classificação</h3>
        <div class="ranking-info">
          <Button
            icon="pi pi-info-circle"
            class="p-button-rounded p-button-text p-button-sm"
            v-tooltip.right.focus="tiebreakersTooltip"
          />
        </div>
      </div>
      <div
        v-if="players.length === 0"
        class="empty-rankings"
      >
        <p>Adicione jogadores para ver a classificação</p>
      </div>
      <div
        v-else
        class="rankings-list"
      >
        <div class="ranking-header">
          <span class="ranking-pos-header">#</span>
          <span class="ranking-name-header">Nome</span>
          <span class="ranking-stats-header">Pontos</span>
          <span class="ranking-tiebreaker-header">Desempate</span>
        </div>
        <div
          v-for="(player, index) in sortedPlayers"
          :key="player.id"
          class="ranking-item"
        >
          <div class="ranking-position">{{ index + 1 }}</div>
          <div class="ranking-name">{{ player.name }}</div>
          <div class="ranking-points">{{ player.points || 0 }}</div>
          <div
            class="ranking-tiebreakers"
            :title="`Posição média: ${getAveragePosition(player).toFixed(2)}`"
          >
            <span
              class="tiebreaker-item"
              title="1º lugares"
            >
              <span class="tiebreaker-position gold">1º:</span>{{(player.matches || []).filter(m => m.position ===
                1).length}}
            </span>
            <span
              class="tiebreaker-item"
              title="2º lugares"
            >
              <span class="tiebreaker-position silver">2º:</span>{{(player.matches || []).filter(m => m.position ===
                2).length}}
            </span>
            <span
              class="tiebreaker-item"
              title="3º lugares"
            >
              <span class="tiebreaker-position bronze">3º:</span>{{(player.matches || []).filter(m => m.position ===
                3).length}}
            </span>
          </div>
        </div>
      </div>
    </div>

    <!-- Main Content -->
    <div class="tournament-content">
      <h1>Gerenciador de Torneios</h1>

      <!-- Tournament Setup Section -->
      <div
        v-if="!tournamentStarted"
        class="tournament-setup"
      >
        <h2>Configuração do Torneio</h2>

        <div class="setup-form">
          <div class="form-group">
            <label for="playerCount">Número de Jogadores</label>
            <InputNumber
              id="playerCount"
              v-model="playerCount"
              :min="4"
              :step="4"
              showButtons
            />
            <small>Deve ser múltiplo de 4</small>
          </div>

          <div class="form-group">
            <label for="tableCount">Número de Mesas</label>
            <InputNumber
              id="tableCount"
              v-model="tableCount"
              :min="1"
              showButtons
              :max="Math.floor(playerCount / 4)"
            />
            <small>Baseado no número de jogadores ({{ playerCount }} jogadores / 4 = {{ Math.floor(playerCount / 4) }}
              mesas)</small>
          </div>

          <div class="form-group">
            <label for="roundCount">Número de Rodadas</label>
            <InputNumber
              id="roundCount"
              v-model="roundCount"
              :min="1"
              :max="5"
              showButtons
            />
          </div>
        </div>

        <div class="player-setup">
          <h3>Jogadores</h3>
          <div class="player-form">
            <div class="form-group player-input">
              <InputText
                v-model="newPlayerName"
                placeholder="Nome do jogador"
                @keydown.enter="addPlayer"
              />
              <Button
                label="Adicionar"
                icon="pi pi-plus"
                @click="addPlayer"
                :disabled="!newPlayerName"
              />
            </div>

            <!-- Random Player Generator -->
            <div class="random-generator">
              <Button
                label="Gerar Jogadores Aleatórios"
                icon="pi pi-users"
                @click="generateRandomPlayers"
                class="p-button-secondary"
              />
              <small>Adiciona jogadores aleatórios para testes (até o limite configurado)</small>
            </div>
          </div>

          <div
            v-if="players.length > 0"
            class="player-list"
          >
            <DataTable
              :value="players"
              responsiveLayout="scroll"
            >
              <Column
                field="name"
                header="Nome"
              ></Column>
              <Column
                header="Ações"
                style="width: 100px"
              >
                <template #body="slotProps">
                  <Button
                    icon="pi pi-trash"
                    @click="removePlayer(slotProps.index)"
                    class="p-button-rounded p-button-text p-button-danger"
                  />
                </template>
              </Column>
            </DataTable>
          </div>
          <div
            v-else
            class="empty-players"
          >
            <p>Nenhum jogador adicionado</p>
          </div>

          <div class="start-tournament">
            <Button
              label="Iniciar Torneio"
              icon="pi pi-play"
              @click="startTournament"
              :disabled="players.length < 4 || players.length % 4 !== 0 || players.length !== playerCount"
            />
            <small v-if="players.length !== playerCount">
              Adicione {{ playerCount - players.length }} jogadores para iniciar o torneio
            </small>
          </div>
        </div>
      </div>

      <!-- Tournament Active Section -->
      <div
        v-else
        class="tournament-active"
      >
        <div class="tournament-header">
          <h2>Torneio em Andamento</h2>
          <div class="tournament-info">
            <span>Rodada {{ currentRound }} de {{ roundCount }}</span>
            <span>{{ playerCount }} Jogadores</span>
            <span>{{ tableCount }} Mesas</span>
          </div>
        </div>

        <div class="rounds-section">
          <div class="round-header">
            <h3>Rodada {{ currentRound }}</h3>
            <div class="round-actions">
              <Button
                label="Resultados Aleatórios"
                icon="pi pi-bolt"
                @click="generateRandomResults"
                class="p-button-warning"
                v-if="!allResultsRegistered && currentTables.length > 0"
                tooltip="Gera resultados aleatórios para todas as mesas pendentes"
                tooltipPosition="left"
              />
              <Button
                label="Próxima Rodada"
                icon="pi pi-arrow-right"
                @click="nextRound"
                :disabled="currentRound >= roundCount || !allResultsRegistered"
              />
            </div>
          </div>

          <div class="tables-container">
            <div
              v-for="(table, tableIndex) in currentTables"
              :key="tableIndex"
              class="table-card"
            >
              <div class="table-header">
                <h4>Mesa {{ tableIndex + 1 }}</h4>
                <span
                  class="table-status"
                  :class="table.status"
                >
                  {{ table.status === 'completed' ? 'Concluída' : 'Pendente' }}
                </span>
              </div>

              <div class="table-players">
                <div
                  v-for="(player, playerIndex) in table.players"
                  :key="playerIndex"
                  class="table-player"
                  :class="{ 'winner': player.result === 1 }"
                >
                  <span>{{ player.name }}</span>
                </div>
              </div>

              <div
                v-if="table.status !== 'completed'"
                class="table-actions"
              >
                <Button
                  label="Registrar Resultado"
                  icon="pi pi-check"
                  @click="openResultDialog(tableIndex)"
                />
              </div>
            </div>
          </div>
        </div>

        <div class="tournament-actions">
          <Button
            label="Finalizar Torneio"
            icon="pi pi-stop-circle"
            @click="endTournament"
            class="p-button-danger"
          />
          <Button
            label="Reiniciar"
            icon="pi pi-refresh"
            @click="resetTournament"
            class="p-button-secondary"
          />
        </div>
      </div>
    </div>

    <!-- Result Dialog -->
    <Dialog
      v-model:visible="showResultDialog"
      header="Registrar Resultados"
      modal
      :style="{ width: '400px' }"
    >
      <div
        class="p-fluid"
        v-if="selectedTable !== null"
      >
        <div class="results-info">
          <strong>Mesa {{ selectedTable + 1 }}</strong>
          <p>Selecione a ordem dos jogadores (1º ao 4º lugar)</p>
        </div>

        <div
          v-for="(player, index) in currentTables[selectedTable]?.players"
          :key="index"
          class="field"
        >
          <div class="p-inputgroup">
            <span class="p-inputgroup-addon">{{ player.name }}</span>
            <Dropdown
              v-model="playerResults[index]"
              :options="[1, 2, 3, 4]"
              placeholder="Posição"
              optionLabel=""
              :class="{ 'duplicate-position': isDuplicatePosition(playerResults[index]) }"
            />
          </div>
        </div>
      </div>
      <template #footer>
        <Button
          label="Cancelar"
          icon="pi pi-times"
          @click="showResultDialog = false"
          class="p-button-text"
        />
        <Button
          label="Salvar"
          icon="pi pi-check"
          @click="saveResults"
          :disabled="!isValidResults"
        />
      </template>
    </Dialog>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { useToast } from 'primevue/usetoast'

const toast = useToast()

// Tournament setup
const playerCount = ref(8)
const tableCount = ref(2)
const roundCount = ref(3)
const players = ref([])
const newPlayerName = ref('')
const tournamentStarted = ref(false)
const currentRound = ref(1)
const rounds = ref([])
const showResultDialog = ref(false)
const selectedTable = ref(null)
const playerResults = ref([null, null, null, null])

// Random names for player generation
const firstNames = [
  'João', 'Maria', 'Pedro', 'Ana', 'Carlos', 'Lucia', 'Bruno', 'Camila',
  'Rafael', 'Juliana', 'Fernando', 'Amanda', 'Lucas', 'Larissa', 'Ricardo',
  'Renata', 'Paulo', 'Gabriela', 'Marcos', 'Isabel', 'André', 'Patrícia'
]

const lastNames = [
  'Silva', 'Santos', 'Oliveira', 'Souza', 'Costa', 'Pereira', 'Carvalho',
  'Almeida', 'Ferreira', 'Ribeiro', 'Rodrigues', 'Gomes', 'Martins',
  'Araújo', 'Barbosa', 'Cardoso', 'Teixeira', 'Moreira', 'Lima', 'Campos'
]

// Computed values
const sortedPlayers = computed(() => {
  return [...players.value].sort((a, b) => {
    // 1. Sort by points (descending)
    if ((b.points || 0) !== (a.points || 0)) {
      return (b.points || 0) - (a.points || 0)
    }

    // 2. Tiebreaker: Number of 1st places (descending)
    const aFirstPlaces = (a.matches || []).filter(m => m.position === 1).length
    const bFirstPlaces = (b.matches || []).filter(m => m.position === 1).length
    if (bFirstPlaces !== aFirstPlaces) {
      return bFirstPlaces - aFirstPlaces
    }

    // 3. Tiebreaker: Number of 2nd places (descending)
    const aSecondPlaces = (a.matches || []).filter(m => m.position === 2).length
    const bSecondPlaces = (b.matches || []).filter(m => m.position === 2).length
    if (bSecondPlaces !== aSecondPlaces) {
      return bSecondPlaces - aSecondPlaces
    }

    // 4. Tiebreaker: Number of 3rd places (descending)
    const aThirdPlaces = (a.matches || []).filter(m => m.position === 3).length
    const bThirdPlaces = (b.matches || []).filter(m => m.position === 3).length
    if (bThirdPlaces !== aThirdPlaces) {
      return bThirdPlaces - aThirdPlaces
    }

    // 5. Tiebreaker: Average finishing position (ascending - lower is better)
    const aAvgPosition = a.matches && a.matches.length > 0
      ? a.matches.reduce((sum, match) => sum + match.position, 0) / a.matches.length
      : 4 // Default to worst position if no matches

    const bAvgPosition = b.matches && b.matches.length > 0
      ? b.matches.reduce((sum, match) => sum + match.position, 0) / b.matches.length
      : 4 // Default to worst position if no matches

    if (aAvgPosition !== bAvgPosition) {
      return aAvgPosition - bAvgPosition
    }

    // 6. Last resort: random choice (instead of alphabetical)
    return Math.random() - 0.5 // Random sort
  })
})

const currentTables = computed(() => {
  if (!tournamentStarted.value || rounds.value.length === 0) {
    return []
  }
  return rounds.value[currentRound.value - 1]?.tables || []
})

const allResultsRegistered = computed(() => {
  return currentTables.value.every(table => table.status === 'completed')
})

const isValidResults = computed(() => {
  // Check if all positions are set and no duplicates
  const positions = playerResults.value.filter(pos => pos !== null)
  return positions.length === 4 &&
    new Set(positions).size === 4 &&
    positions.every(pos => pos >= 1 && pos <= 4)
})

// Watch for changes in playerCount
watch(playerCount, (newValue) => {
  if (newValue < 4) {
    playerCount.value = 4
  }

  // Make sure it's a multiple of 4
  if (newValue % 4 !== 0) {
    playerCount.value = Math.floor(newValue / 4) * 4
  }

  // Update tableCount if needed
  const maxTables = Math.floor(playerCount.value / 4)
  if (tableCount.value > maxTables) {
    tableCount.value = maxTables
  }
})

// Functions
function addPlayer() {
  if (!newPlayerName.value.trim()) return

  if (players.value.length >= playerCount.value) {
    toast.add({
      severity: 'warn',
      summary: 'Limite atingido',
      detail: `Máximo de ${playerCount.value} jogadores permitido`,
      life: 3000
    })
    return
  }

  players.value.push({
    id: Date.now(), // Simple unique ID
    name: newPlayerName.value.trim(),
    points: 0,
    matches: []
  })

  newPlayerName.value = ''
}

function removePlayer(index) {
  players.value.splice(index, 1)
}

function startTournament() {
  if (players.value.length !== playerCount.value) {
    toast.add({
      severity: 'error',
      summary: 'Erro',
      detail: `Precisamos exatamente de ${playerCount.value} jogadores`,
      life: 3000
    })
    return
  }

  // Generate first round
  generateRound()
  tournamentStarted.value = true

  toast.add({
    severity: 'success',
    summary: 'Torneio iniciado',
    detail: 'Primeira rodada gerada com sucesso',
    life: 3000
  })
}

function generateRound() {
  // Copy and shuffle players for the first round
  // For subsequent rounds, use the standings
  let roundPlayers = [...players.value]

  if (currentRound.value === 1) {
    // Shuffle for first round
    for (let i = roundPlayers.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [roundPlayers[i], roundPlayers[j]] = [roundPlayers[j], roundPlayers[i]]
    }
  } else {
    // Sort by points for subsequent rounds
    roundPlayers.sort((a, b) => (b.points || 0) - (a.points || 0))
  }

  // Generate tables
  const tables = []

  for (let i = 0; i < tableCount.value; i++) {
    const tablePlayerCount = Math.floor(playerCount.value / tableCount.value)
    const startIdx = i * tablePlayerCount
    const tablePlayers = roundPlayers.slice(startIdx, startIdx + tablePlayerCount).map(player => ({
      id: player.id,
      name: player.name,
      result: null
    }))

    tables.push({
      number: i + 1,
      players: tablePlayers,
      status: 'pending'
    })
  }

  rounds.value.push({
    number: currentRound.value,
    tables
  })
}

function openResultDialog(tableIndex) {
  selectedTable.value = tableIndex
  playerResults.value = [null, null, null, null]
  showResultDialog.value = true
}

function isDuplicatePosition(position) {
  if (position === null) return false
  return playerResults.value.filter(pos => pos === position).length > 1
}

function saveResults() {
  if (!isValidResults.value || selectedTable.value === null) {
    return
  }

  const table = currentTables.value[selectedTable.value]

  // Update player results in the table
  table.players.forEach((player, idx) => {
    player.result = playerResults.value[idx]
  })

  // Sort players by result
  table.players.sort((a, b) => a.result - b.result)

  // Mark table as completed
  table.status = 'completed'

  // Award points to players in the tournament
  table.players.forEach(tablePlayer => {
    const player = players.value.find(p => p.id === tablePlayer.id)
    if (!player) return

    // Award points based on position (1st: 3pts, 2nd: 2pts, 3rd: 1pt, 4th: 0pts)
    let points = 0
    switch (tablePlayer.result) {
      case 1: points = 3; break
      case 2: points = 2; break
      case 3: points = 1; break
      case 4: points = 0; break
    }

    player.points = (player.points || 0) + points

    // Record match result
    if (!player.matches) player.matches = []
    player.matches.push({
      round: currentRound.value,
      table: selectedTable.value + 1,
      position: tablePlayer.result,
      points
    })
  })

  showResultDialog.value = false
  toast.add({
    severity: 'success',
    summary: 'Resultado registrado',
    detail: `Resultados da mesa ${selectedTable.value + 1} salvos com sucesso`,
    life: 3000
  })
}

function nextRound() {
  if (currentRound.value >= roundCount.value) {
    toast.add({
      severity: 'info',
      summary: 'Última rodada',
      detail: 'O torneio já atingiu o número máximo de rodadas',
      life: 3000
    })
    return
  }

  if (!allResultsRegistered.value) {
    toast.add({
      severity: 'warn',
      summary: 'Resultados pendentes',
      detail: 'Registre os resultados de todas as mesas antes de avançar',
      life: 3000
    })
    return
  }

  currentRound.value++
  generateRound()

  toast.add({
    severity: 'success',
    summary: 'Nova rodada',
    detail: `Rodada ${currentRound.value} iniciada com sucesso`,
    life: 3000
  })
}

function endTournament() {
  tournamentStarted.value = false

  // Announce the winner
  if (players.value.length > 0) {
    const winner = sortedPlayers.value[0]
    toast.add({
      severity: 'success',
      summary: 'Torneio finalizado',
      detail: `O vencedor é ${winner.name} com ${winner.points} pontos!`,
      life: 5000
    })
  }
}

function resetTournament() {
  // Reset tournament state
  tournamentStarted.value = false
  currentRound.value = 1
  rounds.value = []

  // Reset player points
  players.value.forEach(player => {
    player.points = 0
    player.matches = []
  })

  toast.add({
    severity: 'info',
    summary: 'Torneio reiniciado',
    detail: 'Todas as configurações foram mantidas',
    life: 3000
  })
}

// Function to generate random players
function generateRandomPlayers() {
  const playersNeeded = playerCount.value - players.value.length

  if (playersNeeded <= 0) {
    toast.add({
      severity: 'info',
      summary: 'Limite atingido',
      detail: 'Você já atingiu o limite de jogadores configurado',
      life: 3000
    })
    return
  }

  // Shuffle and pick random names
  for (let i = 0; i < playersNeeded; i++) {
    const firstName = firstNames[Math.floor(Math.random() * firstNames.length)]
    const lastName = lastNames[Math.floor(Math.random() * lastNames.length)]
    const playerName = `${firstName} ${lastName}`

    // Skip if the name already exists
    if (players.value.some(p => p.name === playerName)) {
      i-- // Try again
      continue
    }

    players.value.push({
      id: Date.now() + i, // Simple unique ID with offset
      name: playerName,
      points: 0,
      matches: []
    })
  }

  toast.add({
    severity: 'success',
    summary: 'Jogadores gerados',
    detail: `${playersNeeded} jogadores aleatórios foram adicionados`,
    life: 3000
  })
}

// Function to generate random results for all pending tables
function generateRandomResults() {
  if (currentTables.value.length === 0) return

  let pendingTablesCount = 0

  // For each table that doesn't have results yet
  currentTables.value.forEach((table, tableIndex) => {
    if (table.status === 'completed') return

    pendingTablesCount++

    // Generate a random permutation of [1,2,3,4]
    const positions = [1, 2, 3, 4]

    // Shuffle positions
    for (let i = positions.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [positions[i], positions[j]] = [positions[j], positions[i]]
    }

    // Assign positions to players
    table.players.forEach((player, playerIndex) => {
      player.result = positions[playerIndex]
    })

    // Sort players by result
    table.players.sort((a, b) => a.result - b.result)

    // Mark table as completed
    table.status = 'completed'

    // Award points to players
    table.players.forEach(tablePlayer => {
      const player = players.value.find(p => p.id === tablePlayer.id)
      if (!player) return

      // Award points based on position
      let points = 0
      switch (tablePlayer.result) {
        case 1: points = 3; break
        case 2: points = 2; break
        case 3: points = 1; break
        case 4: points = 0; break
      }

      player.points = (player.points || 0) + points

      // Record match result
      if (!player.matches) player.matches = []
      player.matches.push({
        round: currentRound.value,
        table: tableIndex + 1,
        position: tablePlayer.result,
        points
      })
    })
  })

  if (pendingTablesCount > 0) {
    toast.add({
      severity: 'success',
      summary: 'Resultados gerados',
      detail: `Resultados aleatórios gerados para ${pendingTablesCount} ${pendingTablesCount === 1 ? 'mesa' : 'mesas'}`,
      life: 3000
    })
  } else {
    toast.add({
      severity: 'info',
      summary: 'Não há mesas pendentes',
      detail: 'Todas as mesas já possuem resultados registrados',
      life: 3000
    })
  }
}

// Function to calculate average finishing position
function getAveragePosition(player) {
  if (!player.matches || player.matches.length === 0) return 4 // Default to worst position
  return player.matches.reduce((sum, match) => sum + match.position, 0) / player.matches.length
}

// Tiebreakers explanation
const tiebreakersTooltip = {
  value: `<div class="tiebreaker-tooltip" style="width: 100%;">
    <h4>Critérios de Desempate</h4>
    <ol style="padding-left: 1rem; margin: 0;">
      <li ><strong>Pontos totais</strong></li>
      <li ><strong>Número de 1ºs lugares</strong></li>
      <li ><strong>Número de 2ºs lugares</strong></li>
      <li ><strong>Número de 3ºs lugares</strong></li>
      <li ><strong>Posição média</strong></li>
      <li ><strong>Escolha aleatória</strong></li>
    </ol>
  </div>`,
  escape: false
}
</script>

<style scoped>
.tournament-container {
  display: flex;
  height: calc(100vh - 60px);
  width: 100%;
  color: white;
}

.tournament-sidebar {
  width: 350px;
  background-color: rgba(30, 30, 30, 0.8);
  border-right: 1px solid rgba(255, 255, 255, 0.1);
  padding: 1rem;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.tournament-content {
  flex: 1;
  padding: 1rem 2rem;
  overflow-y: auto;
}

h1 {
  text-align: center;
  margin-bottom: 2rem;
  color: white;
}

h2 {
  margin-bottom: 1.5rem;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  padding-bottom: 0.5rem;
}

.sidebar-header {
  margin-bottom: 1rem;
  text-align: center;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  padding-bottom: 0.5rem;
  display: flex;
  justify-content: center;
  align-items: center;
  position: relative;
}

.ranking-info {
  position: absolute;
  right: 10px;
  top: 50%;
  transform: translateY(-50%);
  font-size: 0.8rem;
  color: rgba(255, 255, 255, 0.6);
}

/* Override PrimeVue tooltip styles */
:deep(.p-tooltip) {
  max-width: none !important;
  opacity: 1 !important;
}

:deep(.p-tooltip .p-tooltip-text) {
  background: rgba(30, 30, 30, 0.95);
  color: white;
  padding: 1.25rem;
  box-shadow: 0 5px 15px rgba(0, 0, 0, 0.5);
  border-radius: 8px;
  border: 1px solid rgba(156, 39, 176, 0.3);
  width: 450px !important;
}

:deep(.p-tooltip .p-tooltip-arrow) {
  border-right-color: rgba(30, 30, 30, 0.95);
}

:deep(.tiebreaker-tooltip h4) {
  margin-top: 0;
  margin-bottom: 0.75rem;
  color: rgba(156, 39, 176, 0.9);
  border-bottom: 1px solid rgba(156, 39, 176, 0.3);
  padding-bottom: 0.5rem;
  font-size: 1rem;
  text-align: center;
}

:deep(.tiebreaker-tooltip ol) {
  margin: 0;
  padding-left: 1.75rem;
  width: 100%;
}

:deep(.tiebreaker-tooltip li) {
  margin-bottom: 0.75rem;
  line-height: 1.5;
  padding-right: 0.5rem;
}

.empty-rankings,
.empty-players {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100px;
  color: rgba(255, 255, 255, 0.6);
  text-align: center;
}

.rankings-list {
  flex: 1;
  overflow-y: auto;
}

.ranking-header {
  display: flex;
  padding: 0.5rem;
  border-bottom: 1px solid rgba(255, 255, 255, 0.2);
  font-weight: bold;
  align-items: center;
}

.ranking-pos-header {
  width: 30px;
  text-align: center;
}

.ranking-name-header {
  flex: 1;
}

.ranking-stats-header {
  width: 60px;
  text-align: center;
}

.ranking-tiebreaker-header {
  width: 100px;
  text-align: center;
  font-size: 0.8rem;
}

.ranking-tiebreakers {
  display: flex;
  gap: 5px;
  font-size: 0.8rem;
  min-width: 100px;
  justify-content: flex-end;
}

.tiebreaker-item {
  display: flex;
  align-items: center;
  background: rgba(0, 0, 0, 0.2);
  padding: 2px 4px;
  border-radius: 3px;
}

.ranking-stats-header {
  width: 60px;
  text-align: center;
}

.ranking-tiebreaker-header {
  width: 100px;
  text-align: center;
  font-size: 0.8rem;
}

.ranking-item {
  display: flex;
  padding: 0.5rem;
  border-bottom: 1px solid rgba(255, 255, 255, 0.05);
  align-items: center;
}

.ranking-position {
  width: 30px;
  height: 30px;
  border-radius: 50%;
  background-color: rgba(156, 39, 176, 0.2);
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: bold;
}

.ranking-name {
  flex: 1;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  padding: 0 0.5rem;
  min-width: 150px;
}

.ranking-points {
  width: 60px;
  font-weight: bold;
  color: rgba(156, 39, 176, 0.9);
  text-align: center;
}

.tournament-setup,
.tournament-active {
  background-color: rgba(30, 30, 30, 0.8);
  border-radius: 10px;
  padding: 1.5rem;
  margin-bottom: 2rem;
}

.setup-form {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1rem;
  margin-bottom: 2rem;
}

.form-group {
  margin-bottom: 1rem;
}

.form-group label {
  display: block;
  margin-bottom: 0.5rem;
  font-weight: bold;
}

.form-group small {
  display: block;
  color: rgba(255, 255, 255, 0.6);
  margin-top: 0.25rem;
}

.player-form {
  margin-bottom: 1rem;
}

.player-input {
  display: flex;
  gap: 0.5rem;
}

.player-list {
  margin-bottom: 1.5rem;
}

.start-tournament {
  display: flex;
  flex-direction: column;
  align-items: center;
  margin-top: 2rem;
}

.start-tournament small {
  margin-top: 0.5rem;
  color: rgba(255, 255, 255, 0.6);
}

.tournament-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;
}

.tournament-info {
  display: flex;
  gap: 1rem;
}

.tournament-info span {
  background-color: rgba(156, 39, 176, 0.2);
  padding: 0.25rem 0.75rem;
  border-radius: 1rem;
  font-size: 0.8rem;
  border: 1px solid rgba(156, 39, 176, 0.5);
}

.round-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
}

.round-actions {
  display: flex;
  gap: 0.5rem;
}

.tables-container {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
  gap: 1rem;
  margin-bottom: 2rem;
}

.table-card {
  background-color: rgba(50, 50, 50, 0.5);
  border-radius: 8px;
  padding: 1rem;
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.2);
}

.table-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  padding-bottom: 0.5rem;
}

.table-header h4 {
  margin: 0;
}

.table-status {
  font-size: 0.8rem;
  padding: 0.2rem 0.5rem;
  border-radius: 4px;
}

.table-status.completed {
  background-color: rgba(76, 175, 80, 0.2);
  color: #81c784;
}

.table-status.pending {
  background-color: rgba(255, 152, 0, 0.2);
  color: #ffb74d;
}

.table-players {
  margin-bottom: 1rem;
}

.table-player {
  padding: 0.5rem;
  margin-bottom: 0.5rem;
  background-color: rgba(0, 0, 0, 0.2);
  border-radius: 4px;
}

.table-player.winner {
  background-color: rgba(156, 39, 176, 0.2);
  border-left: 3px solid #9c27b0;
}

.table-actions {
  display: flex;
  justify-content: center;
}

.tournament-actions {
  display: flex;
  justify-content: center;
  gap: 1rem;
  margin-top: 2rem;
}

.results-info {
  text-align: center;
  margin-bottom: 1rem;
}

.duplicate-position {
  background-color: rgba(244, 67, 54, 0.1) !important;
  border-color: rgba(244, 67, 54, 0.5) !important;
}

.random-generator {
  margin-top: 1rem;
  padding-top: 1rem;
  border-top: 1px dashed rgba(255, 255, 255, 0.1);
  display: flex;
  flex-direction: column;
  align-items: center;
}

.random-generator small {
  margin-top: 0.5rem;
  color: rgba(255, 255, 255, 0.6);
  text-align: center;
}

.tiebreaker-position {
  margin-right: 2px;
  font-weight: bold;
}

.gold {
  color: gold;
}

.silver {
  color: silver;
}

.bronze {
  color: #cd7f32;
}

@media (max-width: 768px) {
  .tournament-container {
    flex-direction: column;
    height: auto;
  }

  .tournament-sidebar {
    width: 100%;
    height: auto;
    max-height: 300px;
    border-right: none;
    border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  }

  .setup-form {
    grid-template-columns: 1fr;
  }

  .tables-container {
    grid-template-columns: 1fr;
  }

  .tournament-info {
    flex-direction: column;
    gap: 0.5rem;
  }

  .round-actions {
    flex-direction: column;
    gap: 0.5rem;
    width: 100%;
  }

  .round-actions .p-button {
    width: 100%;
  }
}

@media (max-width: 1024px) and (min-width: 769px) {
  .tournament-sidebar {
    width: 300px;
  }
}
</style>