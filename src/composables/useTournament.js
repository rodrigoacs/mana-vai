import { ref, computed, watch } from 'vue'

// Lógica de negócio do Torneio, extraída para ser reutilizável.
export function useTournament() {
  // --- ESTADO REATIVO ---
  const playerCount = ref(8)
  const tableCount = ref(2)
  const roundCount = ref(3)
  const players = ref([])
  const tournamentStarted = ref(false)
  const currentRound = ref(1)
  const rounds = ref([])

  // --- FUNÇÕES PRIVADAS (Helpers) ---
  const getAveragePosition = (player) => {
    if (!player.matches || player.matches.length === 0) return 4
    return player.matches.reduce((sum, match) => sum + match.position, 0) / player.matches.length
  }

  // --- WATCHER INTERNO ---
  watch(playerCount, (newValue) => {
    let correctedValue = newValue
    if (correctedValue < 4) correctedValue = 4
    if (correctedValue % 4 !== 0) correctedValue = Math.floor(correctedValue / 4) * 4
    if (playerCount.value !== correctedValue) playerCount.value = correctedValue
    const maxTables = Math.floor(playerCount.value / 4)
    if (tableCount.value > maxTables) tableCount.value = maxTables
  })

  // --- COMPUTED PROPERTIES ---
  const sortedPlayers = computed(() => {
    return [...players.value].sort((a, b) => {
      if ((b.points || 0) !== (a.points || 0)) return (b.points || 0) - (a.points || 0)
      const aFirsts = (a.matches || []).filter(m => m.position === 1).length
      const bFirsts = (b.matches || []).filter(m => m.position === 1).length
      if (bFirsts !== aFirsts) return bFirsts - aFirsts
      const aSeconds = (a.matches || []).filter(m => m.position === 2).length
      const bSeconds = (b.matches || []).filter(m => m.position === 2).length
      if (bSeconds !== aSeconds) return bSeconds - aSeconds
      const aThirds = (a.matches || []).filter(m => m.position === 3).length
      const bThirds = (b.matches || []).filter(m => m.position === 3).length
      if (bThirds !== aThirds) return bThirds - aThirds
      const aAvg = getAveragePosition(a)
      const bAvg = getAveragePosition(b)
      if (aAvg !== bAvg) return aAvg - bAvg
      return Math.random() - 0.5
    })
  })

  const currentTables = computed(() => {
    if (!tournamentStarted.value || rounds.value.length === 0) return []
    return rounds.value[currentRound.value - 1]?.tables || []
  })

  const allResultsRegistered = computed(() => {
    if (currentTables.value.length === 0) return false
    return currentTables.value.every(table => table.status === 'completed')
  })

  // --- FUNÇÕES PÚBLICAS (Ações) ---
  function addPlayer(name) {
    if (!name.trim() || players.value.length >= playerCount.value) return false
    players.value.push({ id: Date.now() + players.value.length, name: name.trim(), points: 0, matches: [] })
    return true
  }

  function removePlayer(index) {
    players.value.splice(index, 1)
  }

  function generateRound() {
    let roundPlayers = [...players.value]
    if (currentRound.value > 1) {
      roundPlayers.sort((a, b) => (b.points || 0) - (a.points || 0))
    } else {
      for (let i = roundPlayers.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [roundPlayers[i], roundPlayers[j]] = [roundPlayers[j], roundPlayers[i]]
      }
    }
    const tables = []
    const playersPerTable = Math.floor(playerCount.value / tableCount.value)
    for (let i = 0; i < tableCount.value; i++) {
      const tablePlayers = roundPlayers.slice(i * playersPerTable, (i + 1) * playersPerTable)
      if (tablePlayers.length > 0) {
        tables.push({ number: i + 1, players: tablePlayers.map(p => ({ id: p.id, name: p.name, result: null })), status: 'pending' })
      }
    }
    rounds.value.push({ number: currentRound.value, tables })
  }

  function startTournament() {
    if (players.value.length !== playerCount.value) return false
    players.value.forEach(p => { p.points = 0; p.matches = [] })
    currentRound.value = 1
    rounds.value = []
    tournamentStarted.value = true
    generateRound()
    return true
  }

  function saveResults(tableIndex, results) {
    const table = currentTables.value[tableIndex]
    if (!table) return
    table.players.forEach((player, idx) => {
      const position = results[idx]
      player.result = position
      const originalPlayer = players.value.find(p => p.id === player.id)
      if (originalPlayer) {
        let points = 0
        if (position === 1) points = 3
        if (position === 2) points = 2
        if (position === 3) points = 1
        originalPlayer.points = (originalPlayer.points || 0) + points
        if (!originalPlayer.matches) originalPlayer.matches = []
        originalPlayer.matches.push({ round: currentRound.value, table: tableIndex + 1, position, points })
      }
    })
    table.status = 'completed'
  }

  function nextRound() {
    if (currentRound.value >= roundCount.value || !allResultsRegistered.value) return false
    currentRound.value++
    generateRound()
    return true
  }

  // ADICIONADO: Função para finalizar o torneio
  function endTournament() {
    tournamentStarted.value = false
  }

  function resetTournament() {
    tournamentStarted.value = false
    currentRound.value = 1
    rounds.value = []
    players.value.forEach(p => { p.points = 0; p.matches = [] })
  }

  return {
    playerCount, tableCount, roundCount, players, tournamentStarted,
    currentRound, rounds, sortedPlayers, currentTables, allResultsRegistered,
    addPlayer, removePlayer, startTournament, saveResults, nextRound,
    endTournament, // Exportando a nova função
    resetTournament, getAveragePosition,
  }
}
