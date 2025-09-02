<template>
  <div class="tournament-container">
    <div class="tournament-sidebar">
      <div class="sidebar-header">
        <h3>Classificação</h3>
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

    <div class="tournament-content">
      <h1>Gerenciador de Torneios</h1>

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
                @keydown.enter="handleAddPlayer"
              />
              <Button
                label="Adicionar"
                icon="pi pi-plus"
                @click="handleAddPlayer"
                :disabled="!newPlayerName"
              />
            </div>

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
              @click="handleStartTournament"
              :disabled="players.length < 4 || players.length % 4 !== 0 || players.length !== playerCount"
            />
            <small v-if="players.length !== playerCount">
              Adicione {{ playerCount - players.length }} jogadores para iniciar o torneio
            </small>
          </div>
        </div>
      </div>

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
                @click="handleNextRound"
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
            @click="handleEndTournament"
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
          @click="handleSaveResults"
          :disabled="!isValidResults"
        />
      </template>
    </Dialog>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useToast } from 'primevue/usetoast'
import { useTournament } from '../composables/useTournament'

const toast = useToast()

const {
  playerCount,
  tableCount,
  roundCount,
  players,
  tournamentStarted,
  currentRound,
  sortedPlayers,
  currentTables,
  allResultsRegistered,
  addPlayer,
  removePlayer,
  startTournament,
  saveResults,
  nextRound,
  endTournament,
  resetTournament,
  getAveragePosition,
} = useTournament()

const newPlayerName = ref('')
const showResultDialog = ref(false)
const selectedTable = ref(null)
const playerResults = ref([])

const firstNames = ['João', 'Maria', 'Pedro', 'Ana', 'Carlos', 'Lucia', 'Bruno', 'Camila', 'Rafael', 'Juliana', 'Fernando', 'Amanda', 'Lucas', 'Larissa', 'Ricardo', 'Renata', 'Paulo', 'Gabriela', 'Marcos', 'Isabel', 'André', 'Patrícia']
const lastNames = ['Silva', 'Santos', 'Oliveira', 'Souza', 'Costa', 'Pereira', 'Carvalho', 'Almeida', 'Ferreira', 'Ribeiro', 'Rodrigues', 'Gomes', 'Martins', 'Araújo', 'Barbosa', 'Cardoso', 'Teixeira', 'Moreira', 'Lima', 'Campos']

const isValidResults = computed(() => {
  const positions = playerResults.value.filter(pos => pos !== null)
  return positions.length === 4 && new Set(positions).size === 4 && positions.every(pos => pos >= 1 && pos <= 4)
})

function handleAddPlayer() {
  if (addPlayer(newPlayerName.value)) {
    newPlayerName.value = ''
  } else {
    toast.add({ severity: 'warn', summary: 'Limite atingido', detail: `Máximo de ${playerCount.value} jogadores permitido.`, life: 3000 })
  }
}

function handleStartTournament() {
  if (startTournament()) {
    toast.add({ severity: 'success', summary: 'Torneio iniciado!', detail: 'Primeira rodada gerada com sucesso.', life: 3000 })
  } else {
    toast.add({ severity: 'error', summary: 'Erro', detail: `Precisamos de exatamente ${playerCount.value} jogadores.`, life: 3000 })
  }
}

function handleNextRound() {
  if (nextRound()) {
    toast.add({ severity: 'success', summary: 'Nova Rodada', detail: `Rodada ${currentRound.value} iniciada.`, life: 3000 })
  } else {
    if (currentRound.value >= roundCount.value) {
      toast.add({ severity: 'info', summary: 'Fim do Torneio', detail: 'O número máximo de rodadas foi atingido.', life: 3000 })
    } else {
      toast.add({ severity: 'warn', summary: 'Aguardando Resultados', detail: 'Registre os resultados de todas as mesas para avançar.', life: 3000 })
    }
  }
}

function handleSaveResults() {
  if (!isValidResults.value) {
    toast.add({ severity: 'error', summary: 'Resultados Inválidos', detail: 'As posições devem ser únicas e entre 1 e 4.', life: 3000 })
    return
  }
  saveResults(selectedTable.value, playerResults.value)
  showResultDialog.value = false
  toast.add({ severity: 'success', summary: 'Resultado Registrado', detail: `Resultados da mesa ${selectedTable.value + 1} salvos.`, life: 3000 })
}

function handleEndTournament() {
  endTournament()
  if (players.value.length > 0) {
    const winner = sortedPlayers.value[0]
    toast.add({ severity: 'success', summary: 'Torneio Finalizado!', detail: `O vencedor é ${winner.name} com ${winner.points} pontos!`, life: 5000 })
  }
}

function openResultDialog(tableIndex) {
  selectedTable.value = tableIndex
  playerResults.value = new Array(4).fill(null)
  showResultDialog.value = true
}

function generateRandomPlayers() {
  const playersNeeded = playerCount.value - players.value.length
  if (playersNeeded <= 0) {
    toast.add({ severity: 'info', summary: 'Limite Atingido', detail: 'O número de jogadores já foi alcançado.', life: 3000 })
    return
  }
  for (let i = 0; i < playersNeeded; i++) {
    const name = `${firstNames[Math.floor(Math.random() * firstNames.length)]} ${lastNames[Math.floor(Math.random() * lastNames.length)]}`
    if (!players.value.some(p => p.name === name)) {
      addPlayer(name)
    } else {
      i--
    }
  }
  toast.add({ severity: 'success', summary: 'Jogadores Gerados', detail: `${playersNeeded} jogadores aleatórios foram adicionados.`, life: 3000 })
}

function generateRandomResults() {
  let pendingTablesCount = 0
  currentTables.value.forEach((table, tableIndex) => {
    if (table.status === 'completed') return
    pendingTablesCount++
    const positions = [1, 2, 3, 4].sort(() => Math.random() - 0.5)
    saveResults(tableIndex, positions)
  })

  if (pendingTablesCount > 0) {
    toast.add({ severity: 'success', summary: 'Resultados Gerados', detail: `Resultados aleatórios para ${pendingTablesCount} mesas foram registrados.`, life: 3000 })
  } else {
    toast.add({ severity: 'info', summary: 'Sem Mesas Pendentes', detail: 'Todos os resultados já foram registrados.', life: 3000 })
  }
}
</script>

<style scoped>
:root {
  --purple-primary: #9c27b0;
  --purple-light: rgba(156, 39, 176, 0.2);
  --purple-glow: rgba(156, 39, 176, 0.5);
  --gold-accent: #ffd700;
  --silver-accent: #c0c0c0;
  --bronze-accent: #cd7f32;
  --surface-ground: #121212;
  --surface-card: rgba(28, 28, 32, 0.85);
  --surface-sidebar: rgba(22, 22, 25, 0.9);
  --surface-highlight: rgba(40, 40, 45, 0.9);
  --border-color: rgba(255, 255, 255, 0.1);
  --text-color: #f0f0f0;
  --text-muted: rgba(255, 255, 255, 0.6);
  --status-completed-bg: rgba(76, 175, 80, 0.2);
  --status-completed-text: #81c784;
  --status-pending-bg: rgba(255, 152, 0, 0.2);
  --status-pending-text: #ffb74d;
}

.tournament-container {
  display: flex;
  height: calc(100vh - 60px);
  width: 100%;
  color: var(--text-color);
  background: radial-gradient(ellipse at top, #282030, var(--surface-ground));
  font-family: 'Poppins', sans-serif;
}

/* 2. Conteúdo Principal e Painéis */
.tournament-content {
  flex: 1;
  padding: 1.5rem 2.5rem;
  overflow-y: auto;
}

h1 {
  text-align: center;
  margin-bottom: 2rem;
  font-weight: 700;
  letter-spacing: 1.5px;
  /* Aumentado para mais impacto */
  font-size: 2.2rem;
  /* Aumentado */
  color: var(--purple-primary);
  text-shadow: 0 0 10px var(--purple-glow);
}

h2 {
  margin-bottom: 1.5rem;
  border-bottom: 1px solid var(--border-color);
  padding-bottom: 0.75rem;
  /* Aumentado */
  font-weight: 600;
  font-size: 1.8rem;
  /* Aumentado */
}

.tournament-setup,
.tournament-active {
  background-color: var(--surface-card);
  backdrop-filter: blur(10px);
  border-radius: 16px;
  /* Aumentado */
  padding: 2.5rem;
  /* Aumentado */
  margin-bottom: 2.5rem;
  border: 1px solid var(--border-color);
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
}

/* 3. Sidebar e Ranking */
.tournament-sidebar {
  width: 480px;
  background-color: var(--surface-sidebar);
  backdrop-filter: blur(10px);
  border-right: 1px solid var(--border-color);
  padding: 1.5rem;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  transition: width 0.3s ease;
}

.sidebar-header {
  margin-bottom: 1rem;
  text-align: center;
  border-bottom: 1px solid var(--border-color);
  padding-bottom: 0.5rem;
  display: flex;
  justify-content: center;
  align-items: center;
  position: relative;
}

.sidebar-header h3 {
  font-weight: 600;
  letter-spacing: 1px;
  font-size: 1.4rem;
  /* Aumentado */
}



.empty-rankings,
.empty-players {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100px;
  color: var(--text-muted);
  text-align: center;
}

.rankings-list {
  flex: 1;
  overflow-y: auto;
  padding-right: 5px;
}

.rankings-list::-webkit-scrollbar {
  width: 6px;
}

.rankings-list::-webkit-scrollbar-track {
  background: transparent;
}

.rankings-list::-webkit-scrollbar-thumb {
  background: #444;
  border-radius: 3px;
}

.rankings-list::-webkit-scrollbar-thumb:hover {
  background: #555;
}

.ranking-header {
  display: flex;
  padding: 0.5rem;
  border-bottom: 1px solid var(--border-color);
  font-weight: 600;
  align-items: center;
  font-size: 0.9rem;
  color: var(--text-muted);
  position: sticky;
  /* Mantém o cabeçalho visível */
  top: 0;
  background-color: var(--surface-sidebar);
  /* Garante que não fique transparente */
  z-index: 10;
}

.ranking-pos-header {
  width: 40px;
  text-align: center;
}

/* Aumentado */
.ranking-name-header {
  flex: 1;
  padding-left: 1rem;
}

.ranking-stats-header {
  width: 70px;
  text-align: center;
}

/* Aumentado */
.ranking-tiebreaker-header {
  width: 110px;
  text-align: center;
}

/* Aumentado */

.ranking-item {
  display: flex;
  padding: 0.75rem 0.5rem;
  border-bottom: 1px solid var(--border-color);
  align-items: center;
  transition: background-color 0.2s ease;
}

.ranking-item:hover {
  background-color: var(--surface-highlight);
}

.ranking-position {
  width: 35px;
  height: 35px;
  border-radius: 50%;
  background-color: var(--purple-light);
  border: 1px solid var(--purple-glow);
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
  font-size: 1.1rem;
  flex-shrink: 0;
  /* Impede que encolha */
}

.ranking-name {
  flex: 1;
  padding: 0 1rem;
  font-weight: 500;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.ranking-points {
  width: 70px;
  /* Aumentado */
  font-weight: 700;
  font-size: 1.2rem;
  color: var(--purple-primary);
  text-align: center;
}

.ranking-tiebreakers {
  display: flex;
  gap: 8px;
  /* Aumentado */
  font-size: 0.8rem;
  min-width: 110px;
  /* Aumentado */
  justify-content: flex-end;
}

.tiebreaker-item {
  display: flex;
  align-items: center;
  background: rgba(0, 0, 0, 0.3);
  padding: 3px 6px;
  border-radius: 4px;
}

.tiebreaker-position {
  margin-right: 4px;
  font-weight: bold;
}

.gold {
  color: var(--gold-accent);
}

.silver {
  color: var(--silver-accent);
}

.bronze {
  color: var(--bronze-accent);
}


/* 4. Formulários e Entradas */
.setup-form {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: 1.5rem;
  margin-bottom: 2rem;
}

.form-group {
  margin-bottom: 1rem;
}

.form-group label {
  display: block;
  margin-bottom: 0.5rem;
  font-weight: 600;
}

.form-group small {
  display: block;
  color: var(--text-muted);
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

.random-generator {
  margin-top: 1.5rem;
  padding-top: 1.5rem;
  border-top: 1px dashed var(--border-color);
  display: flex;
  flex-direction: column;
  align-items: center;
}

.random-generator small {
  margin-top: 0.5rem;
  color: var(--text-muted);
  text-align: center;
}

:deep(.p-inputtext),
:deep(.p-inputnumber-input) {
  background: rgba(0, 0, 0, 0.3) !important;
  border: 1px solid var(--border-color) !important;
  color: var(--text-color) !important;
  border-radius: 6px !important;
}

:deep(.p-inputtext:focus) {
  border-color: var(--purple-primary) !important;
  box-shadow: 0 0 0 1px var(--purple-primary) !important;
}

/* 5. Botões e Ações */
.start-tournament {
  display: flex;
  flex-direction: column;
  align-items: center;
  margin-top: 2rem;
}

.start-tournament small {
  margin-top: 0.5rem;
  color: var(--text-muted);
}

.start-tournament .p-button,
.round-actions .p-button-warning,
.round-actions .p-button:not(:disabled) {
  transition: all 0.3s ease;
  box-shadow: 0 0 10px transparent;
}

.start-tournament .p-button:hover,
.round-actions .p-button:not(:disabled):hover {
  transform: translateY(-2px);
  box-shadow: 0 5px 15px var(--purple-glow);
}

.tournament-actions {
  display: flex;
  justify-content: center;
  gap: 1rem;
  margin-top: 2rem;
}

/* 6. Seção de Torneio Ativo */
.tournament-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;
  flex-wrap: wrap;
  /* Permite quebrar linha em telas menores */
  gap: 1rem;
}

.tournament-info {
  display: flex;
  gap: 1rem;
  flex-wrap: wrap;
}

.tournament-info span {
  background-color: var(--purple-light);
  padding: 0.5rem 1rem;
  /* Aumentado */
  border-radius: 1rem;
  font-size: 0.9rem;
  border: 1px solid var(--purple-glow);
  font-weight: 500;
}

.round-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
  flex-wrap: wrap;
  gap: 1rem;
}

.round-actions {
  display: flex;
  gap: 0.5rem;
}

.tables-container {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 1.5rem;
  margin-bottom: 2rem;
}

.table-card {
  background-color: var(--surface-highlight);
  border-radius: 12px;
  /* Aumentado */
  padding: 1.5rem;
  /* Aumentado */
  border: 1px solid transparent;
  transition: all 0.3s ease;
}

.table-card:hover {
  transform: translateY(-5px);
  border-color: var(--purple-glow);
  box-shadow: 0 10px 20px rgba(0, 0, 0, 0.2);
}

.table-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
  border-bottom: 1px solid var(--border-color);
  padding-bottom: 0.5rem;
}

.table-header h4 {
  margin: 0;
  font-size: 1.2rem;
}

.table-status {
  font-size: 0.8rem;
  padding: 0.2rem 0.5rem;
  border-radius: 4px;
  font-weight: 600;
}

.table-status.completed {
  background-color: var(--status-completed-bg);
  color: var(--status-completed-text);
}

.table-status.pending {
  background-color: var(--status-pending-bg);
  color: var(--status-pending-text);
}

.table-players {
  margin-bottom: 1rem;
}

.table-player {
  padding: 0.75rem;
  /* Aumentado */
  margin-bottom: 0.5rem;
  background-color: rgba(0, 0, 0, 0.2);
  border-radius: 6px;
  transition: background-color 0.2s ease;
}

.table-player:hover {
  background-color: rgba(0, 0, 0, 0.4);
}

.table-player.winner {
  background-color: rgba(255, 215, 0, 0.1);
  border-left: 3px solid var(--gold-accent);
  font-weight: 600;
}

.table-actions {
  display: flex;
  justify-content: center;
  margin-top: 1rem;
}

/* 7. Diálogo de Resultados */
.results-info {
  text-align: center;
  margin-bottom: 1rem;
}

/* 8. Tooltip de Desempate */
:deep(.p-tooltip) {
  max-width: none !important;
  opacity: 1 !important;
}

:deep(.p-tooltip .p-tooltip-text) {
  background: var(--surface-card);
  backdrop-filter: blur(5px);
  color: var(--text-color);
  padding: 1rem;
  box-shadow: 0 5px 15px rgba(0, 0, 0, 0.5);
  border-radius: 8px;
  border: 1px solid var(--purple-glow);
  width: auto !important;
}

:deep(.p-tooltip .p-tooltip-arrow) {
  border-right-color: var(--surface-card);
}

:deep(.tiebreaker-tooltip h4) {
  margin-top: 0;
  margin-bottom: 0.75rem;
  color: var(--purple-primary);
  border-bottom: 1px solid var(--purple-glow);
  padding-bottom: 0.5rem;
  font-size: 1rem;
  text-align: center;
}

:deep(.tiebreaker-tooltip ol) {
  margin: 0;
  padding-left: 1.25rem;
}

:deep(.tiebreaker-tooltip li) {
  margin-bottom: 0.5rem;
  line-height: 1.4;
}

/* 9. Responsividade */
@media (max-width: 1200px) {
  .tournament-sidebar {
    width: 420px;
  }
}

@media (max-width: 992px) {
  .tournament-container {
    flex-direction: column;
    height: auto;
  }

  .tournament-sidebar {
    width: 100%;
    height: auto;
    max-height: 50vh;
    /* Aumentado para melhor visualização */
    border-right: none;
    border-bottom: 1px solid var(--border-color);
  }

  .tournament-content {
    padding: 1rem 1.5rem;
  }
}

@media (max-width: 768px) {
  .setup-form {
    grid-template-columns: 1fr;
  }

  .tables-container {
    grid-template-columns: 1fr;
  }

  .tournament-info {
    flex-direction: column;
    gap: 0.5rem;
    align-items: flex-start;
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
</style>
