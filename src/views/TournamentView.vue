<template>
  <div
    class="tournament-page"
    :class="{ 'drawer-open': isDrawerOpen }"
  >

    <Button
      icon="pi pi-bars"
      class="drawer-toggle p-button-rounded p-button-secondary"
      @click="isDrawerOpen = !isDrawerOpen"
    />
    <div
      class="drawer-overlay"
      @click="isDrawerOpen = false"
    ></div>

    <aside class="ranking-drawer">
      <div class="drawer-header">
        <h3>Classificação</h3>
      </div>
      <div
        v-if="players.length === 0"
        class="empty-list"
      >
        <i class="pi pi-users"></i>
        <p>Adicione jogadores para ver o ranking</p>
      </div>
      <div
        v-else
        class="rankings-list"
      >
        <div class="ranking-item header">
          <span class="pos">#</span>
          <span class="name">Jogador</span>
          <span class="points">Pts</span>
          <span class="tiebreaks"><i
              class="pi pi-sort-alt"
              title="Critérios de Desempate (1º, 2º, 3º)"
            ></i></span>
        </div>
        <div
          v-for="(player, index) in sortedPlayers"
          :key="player.id"
          class="ranking-item"
        >
          <div class="pos">{{ index + 1 }}</div>
          <div
            class="name"
            :title="player.name"
          >{{ player.name }}</div>
          <div class="points">{{ player.points || 0 }}</div>
          <div class="tiebreaks">
            <span :title="`1º Lugares: ${(player.matches || []).filter(m => m.position === 1).length}`">
              <i class="pi pi-star-fill gold"></i> {{(player.matches || []).filter(m => m.position === 1).length}}
            </span>
            <span :title="`2º Lugares: ${(player.matches || []).filter(m => m.position === 2).length}`">
              <i class="pi pi-star-fill silver"></i> {{(player.matches || []).filter(m => m.position === 2).length}}
            </span>
            <span :title="`3º Lugares: ${(player.matches || []).filter(m => m.position === 3).length}`">
              <i class="pi pi-star-fill bronze"></i> {{(player.matches || []).filter(m => m.position === 3).length}}
            </span>
          </div>
        </div>
      </div>
    </aside>

    <main class="main-content">
      <div
        v-if="!tournamentStarted"
        class="setup-container"
      >
        <div class="setup-header">
          <h1>Gerenciador de Torneios</h1>
          <p>Configure os jogadores e as rodadas para começar.</p>
        </div>
        <div class="card setup-card">
          <div class="card-header">
            <h2>Configuração do Torneio</h2>
          </div>
          <div class="card-content">
            <div class="setup-controls">
              <div class="form-group rounds-group">
                <label for="roundCount">Nº de Rodadas</label>
                <InputNumber
                  id="roundCount"
                  v-model="roundCount"
                  :min="1"
                  showButtons
                />
              </div>
              <div class="form-group add-player-group">
                <label>Adicionar Jogador</label>
                <div class="p-inputgroup">
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
              </div>
            </div>
            <h3>Jogadores ({{ players.length }})</h3>
            <div
              v-if="players.length > 0"
              class="player-list-container"
            >
              <DataTable
                :value="players"
                size="small"
              >
                <Column
                  field="name"
                  header="Nome"
                ></Column>
                <Column
                  header="Ações"
                  style="width: 100px; text-align: right;"
                >
                  <template #body="slotProps">
                    <Button
                      icon="pi pi-trash"
                      @click="removePlayer(slotProps.index)"
                      class="p-button-rounded p-button-text p-button-danger action-button"
                      title="Remover Jogador"
                    >X</Button>
                  </template>
                </Column>
              </DataTable>
            </div>
            <div
              v-else
              class="empty-list small"
            >
              <p>Nenhum jogador adicionado</p>
            </div>
            <div class="start-tournament">
              <Button
                :label="`Iniciar Torneio com ${players.length} Jogadores`"
                icon="pi pi-play"
                @click="handleStartTournament"
                :disabled="players.length < 4"
                class="p-button-lg start-button"
              />
              <small v-if="players.length < 4">(Mínimo de 4 jogadores)</small>
            </div>
          </div>
        </div>
      </div>

      <div
        v-else
        class="active-container"
      >
        <div class="active-header">
          <h1>Rodada {{ currentRound }} <span class="round-total">/ {{ roundCount }}</span></h1>
          <div class="tournament-stats">
            <span title="Jogadores"><i class="pi pi-users"></i> {{ players.length }}</span>
            <span title="Mesas"><i class="pi pi-table"></i> {{ tableCount }}</span>
          </div>
        </div>
        <div class="round-actions">
          <Button
            label="Resultados Aleatórios"
            icon="pi pi-bolt"
            @click="generateRandomResults"
            class="p-button-warning"
            v-if="!allResultsRegistered && currentTables.length > 0"
          />
          <Button
            label="Próxima Rodada"
            icon="pi pi-arrow-right"
            @click="handleNextRound"
            :disabled="currentRound >= roundCount || !allResultsRegistered"
            class="next-round-button"
          />
        </div>
        <div class="tables-grid">
          <div
            v-for="(table, tableIndex) in currentTables"
            :key="tableIndex"
            class="table-card"
            :class="table.status"
          >
            <div class="table-card-header">
              <h4>Mesa {{ tableIndex + 1 }}</h4>
              <span class="table-status">
                <i :class="table.status === 'completed' ? 'pi pi-check-circle' : 'pi pi-clock'"></i>
                {{ table.status === 'completed' ? 'Concluída' : 'Pendente' }}
              </span>
            </div>
            <div class="table-card-players">
              <div
                v-for="(player) in table.players"
                :key="player.id"
                class="player-chip"
                :class="{ 'winner': player.result === 1 }"
              >
                <i class="pi pi-user"></i>
                <span :title="player.name">{{ player.name }}</span>
                <span
                  v-if="player.result"
                  class="player-pos"
                >{{ player.result }}º</span>
              </div>
            </div>
            <div
              v-if="table.status !== 'completed'"
              class="table-card-actions"
            >
              <Button
                label="Registrar Resultado"
                icon="pi pi-check"
                @click="openResultDialog(tableIndex)"
                class="register-result-button"
              />
            </div>
            <div
              v-else
              class="table-card-actions"
            >
              <Button
                label="Editar Resultado"
                icon="pi pi-pencil"
                @click="openResultDialog(tableIndex, true)"
                class="p-button-secondary p-button-outlined edit-result-button"
              />
            </div>
          </div>
        </div>
        <div class="tournament-actions">
          <Button
            label="Finalizar Torneio"
            icon="pi pi-stop-circle"
            @click="showFinishConfirmDialog = true"
            class="p-button-danger p-button-outlined"
          />
          <Button
            label="Reiniciar"
            icon="pi pi-refresh"
            @click="showResetConfirmDialog = true"
            class="p-button-secondary"
          />
        </div>
      </div>
    </main>

    <Dialog
      v-model:visible="showResultDialog"
      :header="isEditingResult ? 'Editar Resultados' : 'Registrar Resultados'"
      modal
      class="results-dialog"
      :style="{ width: '450px' }"
      :draggable="false"
    >
      <div
        class="p-fluid"
        v-if="selectedTable !== null && currentTables[selectedTable]"
      >
        <div class="results-info">
          <strong>Mesa {{ selectedTable + 1 }}</strong>
          <p>Selecione a ordem dos jogadores (1º ao {{ currentTables[selectedTable].players.length }}º lugar)</p>
        </div>
        <div
          v-for="(player, index) in currentTables[selectedTable].players"
          :key="index"
          class="field"
        >
          <div class="p-inputgroup">
            <span class="p-inputgroup-addon"><i class="pi pi-user"></i></span>
            <span class="p-inputgroup-addon player-name">{{ player.name }}</span>
            <Dropdown
              v-model="playerResults[index]"
              :options="Array.from({ length: currentTables[selectedTable].players.length }, (_, i) => i + 1)"
              placeholder="Posição"
            />
          </div>
        </div>
        <div
          v-if="resultsError"
          class="results-error-message"
        ><i class="pi pi-exclamation-triangle"></i> {{ resultsError }}
        </div>
      </div>
      <template #footer>
        <Button
          label="Cancelar"
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

    <Dialog
      v-model:visible="showResetConfirmDialog"
      modal
      header="Confirmar Reinício"
      :style="{ width: '400px' }"
      :draggable="false"
    >
      <div class="confirmation-content">
        <i
          class="pi pi-exclamation-triangle p-mr-3"
          style="font-size: 2rem"
        ></i>
        <span>Tem certeza que deseja reiniciar o torneio? Todos os dados da rodada atual e pontuações serão
          perdidos.</span>
      </div>
      <template #footer>
        <Button
          label="Não"
          icon="pi pi-times"
          @click="showResetConfirmDialog = false"
          class="p-button-text"
        />
        <Button
          label="Sim, Reiniciar"
          icon="pi pi-check"
          @click="confirmReset"
          class="p-button-danger"
        />
      </template>
    </Dialog>

    <Dialog
      v-model:visible="showFinishConfirmDialog"
      modal
      header="Confirmar Finalização"
      :style="{ width: '400px' }"
      :draggable="false"
    >
      <div class="confirmation-content">
        <i
          class="pi pi-question-circle p-mr-3"
          style="font-size: 2rem"
        ></i>
        <span>Deseja realmente finalizar o torneio? A classificação final será exibida.</span>
      </div>
      <template #footer>
        <Button
          label="Não"
          icon="pi pi-times"
          @click="showFinishConfirmDialog = false"
          class="p-button-text"
        />
        <Button
          label="Sim, Finalizar"
          icon="pi pi-check"
          @click="confirmFinish"
        />
      </template>
    </Dialog>

    <Dialog
      v-model:visible="showFinalResultsDialog"
      modal
      header="🏆 Resultado Final do Torneio 🏆"
      :style="{ width: '500px' }"
      :draggable="false"
    >
      <div class="final-results-content">
        <div
          v-if="sortedPlayers.length > 0"
          class="winner-announcement"
        >
          Parabéns ao campeão:
          <div class="winner-name">
            <i class="pi pi-crown"></i>
            {{ sortedPlayers[0].name }}
            <i class="pi pi-crown"></i>
          </div>
          com <strong>{{ sortedPlayers[0].points }}</strong> pontos!
        </div>

        <h4>Classificação Final:</h4>
        <div class="final-rankings-list">
          <div
            v-for="(player, index) in sortedPlayers.slice(0, sortedPlayers.length)"
            :key="player.id"
            class="final-ranking-item"
            :class="{ 'top-player': index < 3 }"
          >
            <span class="final-pos">{{ index + 1 }}º</span>
            <span class="final-name">{{ player.name }}</span>
            <span class="final-points">{{ player.points || 0 }} pts</span>
          </div>
        </div>
      </div>
      <template #footer>
        <Button
          label="Fechar"
          icon="pi pi-check"
          @click="showFinalResultsDialog = false"
        />
      </template>
    </Dialog>

  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useToast } from 'primevue/usetoast'
import { useTournament } from '../composables/useTournament'

const isDrawerOpen = ref(false)
const toast = useToast()
const {
  tableCount, roundCount, players, tournamentStarted,
  currentRound, sortedPlayers, currentTables, allResultsRegistered,
  addPlayer, removePlayer, startTournament, saveResults, nextRound,
  endTournament, resetTournament, getAveragePosition,
} = useTournament()

const newPlayerName = ref('')
const randomPlayerCount = ref(16)
const showResultDialog = ref(false)
const selectedTable = ref(null)
const playerResults = ref([])
const isEditingResult = ref(false)
const showResetConfirmDialog = ref(false)
const showFinishConfirmDialog = ref(false)
const showFinalResultsDialog = ref(false)

const firstNames = ['João', 'Maria', 'Pedro', 'Ana', 'Carlos', 'Lucia', 'Bruno', 'Camila', 'Rafael', 'Juliana', 'Fernando', 'Amanda', 'Lucas', 'Larissa', 'Ricardo', 'Renata', 'Paulo', 'Gabriela', 'Marcos', 'Isabel', 'André', 'Patrícia']
const lastNames = ['Silva', 'Santos', 'Oliveira', 'Souza', 'Costa', 'Pereira', 'Carvalho', 'Almeida', 'Ferreira', 'Ribeiro', 'Rodrigues', 'Gomes', 'Martins', 'Araújo', 'Barbosa', 'Cardoso', 'Teixeira', 'Moreira', 'Lima', 'Campos']

const resultsError = computed(() => {
  if (selectedTable.value === null) return 'Nenhuma mesa selecionada.'
  const table = currentTables.value[selectedTable.value]
  if (!table) return 'Erro ao carregar mesa.'
  const numPlayersOnTable = table.players.length
  const positions = playerResults.value.slice(0, numPlayersOnTable)
  if (positions.some(pos => pos === null || pos === undefined)) {
    return 'Todas as posições devem ser preenchidas.'
  }
  const expectedPositions = Array.from({ length: numPlayersOnTable }, (_, i) => i + 1)
  const sortedPositions = [...positions].sort((a, b) => a - b)
  if (JSON.stringify(sortedPositions) !== JSON.stringify(expectedPositions)) {
    return `As posições devem ser únicas (1 a ${numPlayersOnTable}).`
  }
  return null
})
const isValidResults = computed(() => resultsError.value === null)

function handleAddPlayer() {
  if (addPlayer(newPlayerName.value)) {
    newPlayerName.value = ''
  } else {
    toast.add({ severity: 'warn', summary: 'Nome Inválido', detail: 'O nome do jogador não pode estar vazio.', life: 3000 })
  }
}

function handleStartTournament() {
  if (startTournament()) {
    toast.add({ severity: 'success', summary: 'Torneio iniciado!', detail: 'Primeira rodada gerada com sucesso.', life: 3000 })
  } else {
    toast.add({ severity: 'error', summary: 'Erro', detail: 'É necessário ter pelo menos 4 jogadores.', life: 3000 })
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
    toast.add({ severity: 'error', summary: 'Resultados Inválidos', detail: resultsError.value, life: 3000 })
    return
  }
  const numPlayersOnTable = currentTables.value[selectedTable.value].players.length
  const finalResults = playerResults.value.slice(0, numPlayersOnTable)
  saveResults(selectedTable.value, finalResults, isEditingResult.value)
  showResultDialog.value = false
  toast.add({
    severity: 'success',
    summary: 'Resultado Salvo',
    detail: `Resultados da mesa ${selectedTable.value + 1} foram ${isEditingResult.value ? 'atualizados' : 'registrados'}.`,
    life: 3000
  })
  isEditingResult.value = false // Reset flag
}

function handleEndTournament() {
  endTournament()
  if (players.value.length > 0) {
    const winner = sortedPlayers.value[0]
    toast.add({ severity: 'success', summary: 'Torneio Finalizado!', detail: `O vencedor é ${winner.name} com ${winner.points} pontos!`, life: 5000 })
  }
  else {
    toast.add({ severity: 'info', summary: 'Torneio Finalizado!', detail: 'O torneio foi finalizado.', life: 3000 })
  }
}

function openResultDialog(tableIndex, isEditing = false) {
  selectedTable.value = tableIndex
  isEditingResult.value = isEditing
  const table = currentTables.value[tableIndex]

  if (isEditing && table && table.players) {
    playerResults.value = table.players.map(p => p.result)
    while (playerResults.value.length < 4) {
      playerResults.value.push(null)
    }
  } else {
    playerResults.value = new Array(4).fill(null)
  }
  showResultDialog.value = true
}

document.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') {
    generateRandomPlayers()
  }
})

function generateRandomPlayers() {
  const count = randomPlayerCount.value
  if (count <= 0) return
  players.value = []
  let addedCount = 0
  while (addedCount < count) {
    const name = `${firstNames[Math.floor(Math.random() * firstNames.length)]} ${lastNames[Math.floor(Math.random() * lastNames.length)]}`
    if (!players.value.some(p => p.name === name)) {
      addPlayer(name)
      addedCount++
    }
  }
  toast.add({ severity: 'success', summary: 'Jogadores Gerados', detail: `${addedCount} jogadores aleatórios foram adicionados.`, life: 3000 })
}

function generateRandomResults() {
  let pendingTablesCount = 0
  currentTables.value.forEach((table, tableIndex) => {
    if (table.status === 'completed') return
    pendingTablesCount++
    const numPlayersOnTable = table.players.length
    const positions = Array.from({ length: numPlayersOnTable }, (_, i) => i + 1).sort(() => Math.random() - 0.5)
    saveResults(tableIndex, positions) // Pass false for isEditing
  })
  if (pendingTablesCount > 0) {
    toast.add({ severity: 'success', summary: 'Resultados Gerados', detail: `Resultados aleatórios para ${pendingTablesCount} mesas foram registrados.`, life: 3000 })
  } else {
    toast.add({ severity: 'info', summary: 'Sem Mesas Pendentes', detail: 'Todos os resultados já foram registrados.', life: 3000 })
  }
}

// Confirmation handler functions
function confirmReset() {
  resetTournament()
  showResetConfirmDialog.value = false
  toast.add({ severity: 'info', summary: 'Torneio Reiniciado', detail: 'O torneio foi reiniciado para a configuração inicial.', life: 3000 })
}

function confirmFinish() {
  handleEndTournament() // Chama a função que muda o estado
  showFinishConfirmDialog.value = false
  // Abre o diálogo de resultados FINAIS
  showFinalResultsDialog.value = true // *** ADICIONADO ***
}
</script>

<style scoped>
/* * 1. LAYOUT PRINCIPAL E DRAWER */
.tournament-page {
  display: flex;
  width: 100%;
  height: 100vh;
  background-color: var(--bg-primary);
}

.ranking-drawer {
  width: 480px;
  flex-shrink: 0;
  background-color: var(--bg-secondary);
  height: 100vh;
  position: sticky;
  top: 0;
  display: flex;
  flex-direction: column;
  border-right: 1px solid var(--border-color);
  transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  z-index: 10;
}

.main-content {
  flex: 1;
  overflow-y: auto;
  padding: 3rem 4rem;
  height: 100vh;
}

.drawer-header {
  padding: 1.5rem;
  border-bottom: 1px solid var(--border-color);
  flex-shrink: 0;
  background-color: var(--bg-card);
}

.drawer-header h3 {
  font-size: 1.5rem;
  font-weight: 600;
  color: var(--text-primary);
  text-align: center;
}

.empty-list {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  padding: 2rem;
  color: var(--text-secondary);
  height: 100%;
  flex: 1;
}

.empty-list i {
  font-size: 3rem;
  margin-bottom: 1.5rem;
  color: var(--border-color);
}

.empty-list p {
  font-size: 1rem;
}

.empty-list.small {
  height: auto;
  padding: 1.5rem;
  background-color: var(--bg-card);
  border-radius: 8px;
  margin-top: 1.5rem;
  border: 1px dashed var(--border-color);
}

.empty-list.small p {
  font-size: 0.9rem;
}

.rankings-list {
  flex: 1;
  overflow-y: auto;
  padding: 0.5rem;
}

.ranking-item {
  display: flex;
  align-items: center;
  padding: 1rem 1rem;
  border-bottom: 1px solid var(--border-color);
  transition: background-color 0.15s ease-out;
}

.ranking-item:hover {
  background-color: var(--bg-card);
}

.ranking-item:last-child {
  border-bottom: none;
}

.ranking-item.header {
  font-weight: 600;
  color: var(--text-secondary);
  font-size: 0.8rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  padding: 0.75rem 1rem;
  position: sticky;
  top: 0;
  background: var(--bg-secondary);
  z-index: 10;
  border-bottom: 2px solid var(--border-color);
}

.ranking-item .pos {
  font-weight: 700;
  font-size: 1.1rem;
  color: var(--text-primary);
  width: 45px;
  text-align: center;
  flex-shrink: 0;
}

.ranking-item.header .pos {
  font-size: 0.8rem;
  font-weight: 600;
}

.ranking-item .name {
  flex: 1;
  font-weight: 500;
  padding: 0 1rem;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.ranking-item .points {
  font-size: 1.25rem;
  font-weight: 700;
  color: var(--accent-primary);
  width: 60px;
  text-align: right;
  flex-shrink: 0;
}

.ranking-item.header .points {
  font-size: 0.8rem;
  font-weight: 600;
  color: var(--text-secondary);
}

.ranking-item .tiebreaks {
  display: flex;
  gap: 0.6rem;
  font-size: 0.9rem;
  font-weight: 500;
  color: var(--text-secondary);
  min-width: 125px;
  justify-content: flex-end;
  flex-shrink: 0;
  align-items: center;
}

.ranking-item .tiebreaks span {
  display: flex;
  align-items: center;
  gap: 0.25rem;
  min-width: 30px;
  justify-content: flex-end;
}

.ranking-item .tiebreaks i {
  font-size: 0.85rem;
}

.ranking-item .tiebreaks .gold {
  color: #f59e0b;
}

.ranking-item .tiebreaks .silver {
  color: #a0aec0;
}

.ranking-item .tiebreaks .bronze {
  color: #cd7f32;
}

.ranking-item.header .tiebreaks {
  font-size: 0.8rem;
  font-weight: 600;
  color: var(--text-secondary);
  justify-content: center;
}

.ranking-item.header .tiebreaks i {
  cursor: help;
}

/* * 3. CONTEÚDO PRINCIPAL - SETUP */
.setup-container {
  max-width: 900px;
  margin: 0 auto;
}

.setup-header {
  text-align: center;
  margin-bottom: 3rem;
}

.setup-header h1 {
  font-size: 2.8rem;
  font-weight: 700;
  color: var(--text-primary);
  background: linear-gradient(45deg, var(--accent-primary), #fb923c);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  margin-bottom: 0.5rem;
}

.setup-header p {
  font-size: 1.1rem;
  color: var(--text-secondary);
  max-width: 600px;
  margin: 0 auto;
}

.setup-card {
  background-color: var(--bg-secondary);
  border: 1px solid var(--border-color);
  border-radius: 16px;
  margin-bottom: 2rem;
  overflow: hidden;
  box-shadow: 0 5px 15px rgba(0, 0, 0, 0.1);
}

.card-header {
  padding: 1.25rem 1.75rem;
  border-bottom: 1px solid var(--border-color);
  background-color: var(--bg-card);
}

.card-header h2 {
  font-size: 1.35rem;
  font-weight: 600;
  color: var(--text-primary);
}

.card-content {
  padding: 1.75rem;
}

.setup-controls {
  display: flex;
  gap: 1.75rem;
  align-items: center;
  margin-bottom: 2.5rem;
  padding-bottom: 2rem;
  border-bottom: 1px dashed var(--border-color);
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.form-group label {
  font-size: 0.9rem;
  font-weight: 500;
  color: var(--text-secondary);
  margin-bottom: 0.25rem;
}

.p-inputgroup {
  display: flex;
  border-radius: 8px;
  overflow: hidden;
  align-items: center;
  gap: 1rem;
}

.p-inputgroup .p-button {
  border-radius: 0 8px 8px 0 !important;
}

.p-inputgroup .p-inputtext,
.p-inputgroup .p-inputnumber {
  border-radius: 8px 0 0 8px !important;
}

.add-player-group {
  flex-grow: 1;
}

.setup-controls .p-inputgroup .p-inputtext,
.setup-controls .p-inputgroup .p-inputnumber {
  width: 100%;
}

.setup-controls .p-inputgroup .p-button {
  flex-shrink: 0;
}

.setup-divider {
  display: none;
}

.setup-card h3 {
  font-size: 1.2rem;
  font-weight: 600;
  margin-bottom: 1.25rem;
  color: var(--text-primary);
}

.player-list-container {
  max-height: 450px;
  overflow-y: auto;
  margin-bottom: 2.5rem;
}

:deep(.player-list-container .p-datatable .action-button) {
  color: var(--status-danger) !important;
}

:deep(.player-list-container .p-datatable .action-button:hover) {
  background-color: rgba(239, 68, 68, 0.1) !important;
}

.start-tournament {
  display: flex;
  flex-direction: column;
  align-items: center;
  margin-top: 2rem;
}

.start-button {
  padding: 1rem 2.5rem;
  font-size: 1.15rem;
}

.start-tournament small {
  margin-top: 1rem;
  font-size: 0.9rem;
  color: var(--text-secondary);
}

/* * 4. CONTEÚDO PRINCIPAL - ATIVO */
.active-header {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  flex-wrap: wrap;
  gap: 1rem;
  margin-bottom: 2rem;
  padding-bottom: 1rem;
  border-bottom: 1px solid var(--border-color);
}

.active-header h1 {
  font-size: 2.8rem;
  font-weight: 700;
  color: var(--text-primary);
  line-height: 1.2;
  margin: 0;
  background: linear-gradient(45deg, var(--accent-primary), #fb923c);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
}

.active-header h1 .round-total {
  background: none;
  -webkit-text-fill-color: var(--text-secondary);
  color: var(--text-secondary);
  font-weight: 500;
  font-size: 1.5rem;
}

.tournament-stats {
  display: flex;
  gap: 1.75rem;
  background-color: var(--bg-secondary);
  padding: 0.85rem 1.5rem;
  border-radius: 8px;
  border: 1px solid var(--border-color);
}

.tournament-stats span {
  display: flex;
  align-items: center;
  gap: 0.6rem;
  font-size: 1.1rem;
  font-weight: 600;
  color: var(--text-secondary);
}

.tournament-stats span i {
  color: var(--accent-primary);
  font-size: 1.1rem;
}

.round-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 1rem;
  margin-bottom: 2.5rem;
}

@keyframes pulse-orange {
  0% {
    box-shadow: 0 0 0 0 var(--accent-primary-glow);
  }

  70% {
    box-shadow: 0 0 0 10px rgba(232, 93, 41, 0);
  }

  100% {
    box-shadow: 0 0 0 0 rgba(232, 93, 41, 0);
  }
}

.next-round-button:not(:disabled) {
  animation: pulse-orange 2s infinite;
}

.tables-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(340px, 1fr));
  gap: 2rem;
}

.table-card {
  background-color: var(--bg-secondary);
  border: 1px solid var(--border-color);
  border-radius: 16px;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  transition: all 0.25s ease-out;
  box-shadow: 0 3px 6px rgba(0, 0, 0, 0.1);
}

.table-card:hover {
  transform: translateY(-4px);
  border-color: var(--accent-primary);
  box-shadow: 0 8px 25px var(--accent-primary-glow);
}

.table-card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1.25rem 1.5rem;
  border-bottom: 1px solid var(--border-color);
  background-color: var(--bg-card);
}

.table-card-header h4 {
  font-size: 1.2rem;
  font-weight: 600;
}

.table-status {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.9rem;
  font-weight: 500;
  padding: 0.25rem 0.75rem;
  border-radius: 6px;
}

.table-card.completed .table-status {
  color: var(--status-success);
  background-color: rgba(34, 197, 94, 0.1);
}

.table-card.pending .table-status {
  color: var(--status-warning);
  background-color: rgba(245, 158, 11, 0.1);
}

.table-card-players {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
  padding: 1.5rem;
  flex: 1;
}

.player-chip {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  background: var(--bg-card);
  padding: 0.85rem 1rem;
  border-radius: 8px;
  font-size: 1rem;
  font-weight: 500;
  border: 1px solid var(--border-color);
  position: relative;
  overflow: hidden;
  transition: all 0.2s ease;
  white-space: nowrap;
}

.player-chip span {
  overflow: hidden;
  text-overflow: ellipsis;
}

.player-chip:hover {
  transform: scale(1.03);
  border-color: var(--text-secondary);
}

.player-chip i {
  color: var(--text-secondary);
  font-size: 0.9rem;
  flex-shrink: 0;
}

.player-chip.winner {
  border-color: var(--accent-primary);
  color: var(--accent-primary);
  font-weight: 600;
  box-shadow: 0 0 10px var(--accent-primary-glow);
}

.player-chip.winner i {
  color: var(--accent-primary);
}

.player-pos {
  position: absolute;
  top: 0;
  right: 0;
  background: var(--accent-primary);
  color: var(--accent-primary-text);
  font-weight: 700;
  font-size: 0.8rem;
  padding: 0.25rem 0.6rem;
  border-bottom-left-radius: 8px;
  border-top-right-radius: 8px;
}

.table-card-actions {
  padding: 1.5rem;
  border-top: 1px solid var(--border-color);
  background-color: var(--bg-card);
}

.table-card-actions .p-button {
  width: 100%;
}

.register-result-button:not(:disabled) {
  animation: pulse-orange 2s infinite 0.5s;
}

.edit-result-button {
  width: 100%;
}

.tournament-actions {
  display: flex;
  justify-content: center;
  gap: 1.5rem;
  margin-top: 3rem;
  padding-top: 2rem;
  border-top: 1px dashed var(--border-color);
}

/* * 5. DIÁLOGOS */
:deep(.results-dialog) .p-dialog-content {
  background-color: var(--bg-secondary);
}

.results-info {
  text-align: center;
  margin-bottom: 2rem;
}

.results-info strong {
  font-size: 1.35rem;
  font-weight: 600;
  display: block;
  color: var(--text-primary);
}

.results-info p {
  color: var(--text-secondary);
  font-size: 0.95rem;
  margin-top: 0.35rem;
}

.results-dialog .field {
  margin-bottom: 1rem;
}

.results-dialog .p-inputgroup-addon {
  background: var(--bg-card);
  border-color: var(--border-color);
  color: var(--text-secondary);
}

.results-dialog .p-inputgroup-addon.player-name {
  flex: 1;
  font-weight: 500;
  color: var(--text-primary);
  text-align: left;
}

.results-dialog .p-dropdown {
  flex: 0 0 130px;
}

.results-error-message {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  color: var(--status-warning);
  background-color: rgba(245, 158, 11, 0.1);
  padding: 1rem 1.25rem;
  border-radius: 8px;
  text-align: left;
  margin-top: 2rem;
  font-size: 0.95rem;
  font-weight: 500;
  border: 1px solid var(--status-warning);
}

.results-error-message i {
  font-size: 1.25rem;
  flex-shrink: 0;
}

.confirmation-content {
  display: flex;
  align-items: center;
  text-align: left;
}

.confirmation-content i {
  font-size: 1.5rem !important;
  margin-right: 1rem;
  flex-shrink: 0;
}

.confirmation-content span {
  line-height: 1.5;
  color: var(--text-secondary);
}

/* Cor ajustada */
:deep(.p-dialog[header="Confirmar Reinício"]) .confirmation-content i {
  color: var(--status-danger);
}

:deep(.p-dialog[header="Confirmar Finalização"]) .confirmation-content i {
  color: var(--accent-primary);
}

/* *** NOVO: Estilos para Diálogo Final *** */
.final-results-content {
  text-align: center;
}

.winner-announcement {
  font-size: 1.1rem;
  color: var(--text-secondary);
  margin-bottom: 1.5rem;
}

.winner-name {
  font-size: 2rem;
  font-weight: 700;
  color: var(--accent-primary);
  margin: 0.5rem 0;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.75rem;
}

.winner-name .pi-crown {
  font-size: 1.5rem;
  color: #f59e0b;
  /* Coroa dourada */
}

.final-results-content h4 {
  font-size: 1.1rem;
  font-weight: 600;
  color: var(--text-primary);
  margin-bottom: 1rem;
  text-align: left;
  border-bottom: 1px solid var(--border-color);
  padding-bottom: 0.5rem;
}

.final-rankings-list {
  max-height: 300px;
  overflow-y: auto;
  text-align: left;
  margin-top: 1rem;
  border: 1px solid var(--border-color);
  border-radius: 8px;
  background-color: var(--bg-primary);
  /* Fundo ligeiramente diferente */
}

.final-ranking-item {
  display: flex;
  align-items: center;
  padding: 0.75rem 1rem;
  border-bottom: 1px solid var(--border-color);
}

.final-ranking-item:last-child {
  border-bottom: none;
}

.final-ranking-item.top-player {
  background-color: rgba(255, 255, 255, 0.03);
}

/* Destaque sutil para Top 3 */

.final-pos {
  font-weight: 600;
  color: var(--text-secondary);
  width: 40px;
  flex-shrink: 0;
}

.final-name {
  flex: 1;
  color: var(--text-primary);
  padding: 0 0.75rem;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.final-points {
  font-weight: 500;
  color: var(--accent-primary);
}

.drawer-toggle {
  display: none;
}

@media (max-width: 1024px) {
  .ranking-drawer {
    width: 320px;
  }
}

@media (max-width: 992px) {
  .tournament-page {
    height: auto;
    min-height: 100vh;
    display: block;
  }

  .main-content {
    height: auto;
    padding: 1.5rem;
    padding-top: 6rem;
    overflow-y: visible;
  }

  .ranking-drawer {
    position: fixed;
    top: 0;
    left: 0;
    width: 320px;
    height: 100%;
    z-index: 1000;
    transform: translateX(-100%);
    box-shadow: 5px 0 40px rgba(0, 0, 0, 0.4);
    border-right: 1px solid var(--border-color);
  }

  .drawer-open .ranking-drawer {
    transform: translateX(0);
  }

  .drawer-toggle {
    display: flex;
    position: fixed;
    top: 1rem;
    left: 1rem;
    z-index: 1001;
    background: var(--bg-card);
    border: 1px solid var(--border-color);
    color: var(--text-primary);
    box-shadow: 0 5px 15px rgba(0, 0, 0, 0.3);
    transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  }

  .drawer-open .drawer-toggle {
    transform: translateX(calc(320px + 1rem));
  }

  .drawer-overlay {
    display: none;
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: rgba(0, 0, 0, 0.6);
    backdrop-filter: blur(5px);
    z-index: 999;
    opacity: 0;
    transition: opacity 0.3s ease;
  }

  .drawer-open .drawer-overlay {
    display: block;
    opacity: 1;
  }

  .setup-header h1,
  .active-header h1 {
    font-size: 2.2rem;
  }

  .setup-controls {
    flex-direction: column;
    gap: 1.75rem;
    align-items: stretch;
    padding-bottom: 1.5rem;
    margin-bottom: 2rem;
  }

  /* Flex column on mobile */
  .rounds-group,
  .generate-group,
  .add-player-group {
    width: 100%;
  }

  .generate-group .p-inputnumber {
    width: 100%;
  }

  .tables-grid {
    grid-template-columns: 1fr;
  }

  .active-header {
    flex-direction: column;
    align-items: flex-start;
    border-bottom: none;
    margin-bottom: 1rem;
  }

  .tournament-stats {
    width: 100%;
    justify-content: space-around;
  }

  .round-actions {
    justify-content: center;
  }
}

@media (max-width: 480px) {
  .main-content {
    padding: 1rem;
    padding-top: 5.5rem;
  }

  .card-content {
    padding: 1.25rem;
  }

  :deep(.results-dialog),
  :deep(.p-dialog[header^="Confirmar"]),
  :deep(.p-dialog[header^="🏆"]) {
    width: 95vw !important;
  }

  /* Diálogos menores */
  .table-card-players {
    grid-template-columns: 1fr;
  }

  .ranking-drawer {
    width: 85vw;
    max-width: 300px;
  }

  .drawer-open .drawer-toggle {
    transform: translateX(calc(85vw + 1rem));
  }

  .ranking-item .name {
    padding: 0 0.5rem;
  }

  .ranking-item .tiebreaks {
    min-width: 100px;
    gap: 0.4rem;
    font-size: 0.8rem;
    justify-content: space-between;
  }

  .ranking-item .tiebreaks i {
    font-size: 0.75rem;
  }

  .ranking-item.header {
    padding: 0.6rem 0.75rem;
  }

  .ranking-item.header .tiebreaks {
    min-width: 100px;
  }

  .setup-header h1,
  .active-header h1 {
    font-size: 1.8rem;
  }

  .card-header h2 {
    font-size: 1.2rem;
  }

  .setup-card h3 {
    font-size: 1.1rem;
  }

  .tournament-stats span {
    font-size: 1rem;
  }

  .start-button {
    font-size: 1rem;
    padding: 0.8rem 1.5rem;
  }

  /* Estilos do diálogo final no mobile */
  .winner-name {
    font-size: 1.6rem;
  }

  .final-results-content h4 {
    font-size: 1rem;
  }

  .final-ranking-item {
    padding: 0.6rem 0.8rem;
    font-size: 0.9rem;
  }

  .final-pos {
    width: 30px;
  }

  .final-points {
    font-size: 0.9rem;
  }
}
</style>