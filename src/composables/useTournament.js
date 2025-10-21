import { ref, computed } from 'vue'

export function useTournament() {
  // --- ESTADO REATIVO ---
  // playerCount e tableCount foram removidos daqui
  const roundCount = ref(3)
  const players = ref([])
  const tournamentStarted = ref(false)
  const currentRound = ref(1)
  const rounds = ref([])

  // --- COMPUTED PROPERTIES ---
  const playerCount = computed(() => players.value.length)
  const tableCount = computed(() => {
    if (players.value.length < 4) return 0
    return Math.ceil(players.value.length / 4)
  })

  // --- FUNÇÕES PRIVADAS (Helpers) ---
  const getAveragePosition = (player) => {
    if (!player.matches || player.matches.length === 0) return 4
    return player.matches.reduce((sum, match) => sum + match.position, 0) / player.matches.length
  }

  // --- WATCHER INTERNO ---
  // O watcher que forçava múltiplos de 4 foi REMOVIDO.

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
    if (!name.trim()) return false
    // Verificação de limite de jogadores foi REMOVIDA
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
    const numPlayers = playerCount.value
    const numTables = tableCount.value
    if (numTables === 0) return

    // Lógica de distribuição de jogadores
    // Isso cria mesas de 4 e 3 da forma mais equilibrada possível
    // Ex: 10 jogadores -> 3 mesas (4, 3, 3)
    // Ex: 11 jogadores -> 3 mesas (4, 4, 3)
    // Ex: 13 jogadores -> 4 mesas (4, 3, 3, 3)
    const basePlayersPerTable = Math.floor(numPlayers / numTables)
    let extraPlayers = numPlayers % numTables
    let playerIndex = 0

    for (let i = 0; i < numTables; i++) {
      const playersForThisTable = basePlayersPerTable + (extraPlayers > 0 ? 1 : 0)
      extraPlayers--

      const tablePlayers = roundPlayers.slice(playerIndex, playerIndex + playersForThisTable)
      playerIndex += playersForThisTable

      if (tablePlayers.length > 0) {
        tables.push({ number: i + 1, players: tablePlayers.map(p => ({ id: p.id, name: p.name, result: null })), status: 'pending' })
      }
    }
    rounds.value.push({ number: currentRound.value, tables })
  }

  function startTournament() {
    // A verificação agora é muito mais simples
    if (players.value.length < 4) return false

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

    // A lógica de pontuação (3, 2, 1) já funciona para mesas de 3 pessoas,
    // pois a 4ª posição (null) não dá pontos.
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
    // Exporta os novos computeds
    playerCount, tableCount,
    roundCount, players, tournamentStarted,
    currentRound, rounds, sortedPlayers, currentTables, allResultsRegistered,
    addPlayer, removePlayer, startTournament, saveResults, nextRound,
    endTournament,
    resetTournament, getAveragePosition,
  }
}