<template>
  <div
    ref="containerRef"
    class="container no-select"
    :style="{
      backgroundColor: colorValue
    }"
  >
    <!-- Container para controles no canto superior direito -->
    <div class="controls-container">
      <input
        type="color"
        class="color-input"
        :value="colorValue"
        @input="updateColorFromInput"
      />
      <Button
        class="button reverse-orientation"
        @click="isReversed = !isReversed"
      >
        🔄️
      </Button>
    </div>

    <div
      v-if="isDead"
      class="skull"
    >☠️</div>

    <template v-else>
      <div
        class="counter no-select"
        :style="{
          transform: isReversed ? 'rotate(180deg)' : 'rotate(0deg)',
          transition: 'transform 0.3s ease'
        }"
      >
        ❤️
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
              {{ lifeDelta > 0 ? '+' + lifeDelta : lifeDelta }}
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
          v-for="(label, name) in markerLabels"
          :key="name"
          class="marker-toggle"
          @click="markerDialogs[name] = true"
        >
          {{ label }}
          <span v-if="markers[name] > 0">({{ markers[name] }})</span>
        </Button>

        <Button
          v-for="opponent in opponents"
          :key="'commander-' + opponent.id"
          class="marker-toggle cmd-button"
          :style="{ backgroundColor: opponent.color }"
          @click="markerDialogs['commander_' + opponent.id] = true"
        >
          🗡️
          <span v-if="markers['commander_' + opponent.id] > 0">
            ({{ markers['commander_' + opponent.id] }})
          </span>
        </Button>
      </div>

      <Dialog
        v-for="(label, name) in markerLabels"
        :key="name + '-dialog'"
        v-model:visible="markerDialogs[name]"
        modal
        :header="label"
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

      <!-- Diálogos para dano de comandante dos oponentes -->
      <Dialog
        v-for="opponent in opponents"
        :key="'commander_' + opponent.id + '-dialog'"
        v-model:visible="markerDialogs['commander_' + opponent.id]"
        modal
        header="Dano de Comandante"
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
            @click="changeMarker('commander_' + opponent.id, -1)"
            icon="pi pi-minus"
          />
          <div class="marker-value-wrapper">
            <span class="marker-value">{{ markers['commander_' + opponent.id] }}</span>
            <transition name="fade-up">
              <span
                v-if="markerDeltas['commander_' + opponent.id] !== 0"
                class="life-delta"
                :class="{
                  positive: markerDeltas['commander_' + opponent.id] > 0,
                  negative: markerDeltas['commander_' + opponent.id] < 0
                }"
              >
                {{ markerDeltas['commander_' + opponent.id] > 0 ? '+' + markerDeltas['commander_' + opponent.id] :
                  markerDeltas['commander_' + opponent.id] }}
              </span>
            </transition>
          </div>
          <Button
            class="button increase"
            @click="changeMarker('commander_' + opponent.id, 1)"
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
import ColorPicker from 'primevue/colorpicker'
import Dialog from 'primevue/dialog'

// Injetar as cores dos jogadores do estado global
const playerColors = inject('playerColors')

const props = defineProps({
  counters: Number,
  playerId: Number,
})

const emit = defineEmits(['update:color'])

const lifeTotal = ref(40)
const lifeDelta = ref(0)
let lifeDeltaTimeout = null

// Estado para controlar exibição do ColorPicker
const showColorPicker = ref(false)

// Cor do jogador atual
const colorValue = ref('#111111')
const containerRef = ref(null)

// Função para atualizar a cor a partir do input nativo
function updateColorFromInput(event) {
  const newColor = event.target.value
  console.log(`LifeCounter - Atualizando cor do jogador ${props.playerId} para ${newColor} (input nativo)`)

  // Atualizar estado local
  colorValue.value = newColor

  // Atualizar estado global
  playerColors.value[props.playerId] = newColor

  // Atualizar o estilo diretamente
  if (containerRef.value) {
    containerRef.value.style.backgroundColor = newColor
  }

  // Emitir evento para o componente pai
  emit('update:color', newColor, props.playerId)
}

// Inicializar a cor e aplicar ao container
onMounted(() => {
  if (playerColors.value[props.playerId]) {
    colorValue.value = playerColors.value[props.playerId]
  } else {
    // Definir uma cor inicial aleatória para cada jogador
    const colors = ['#ff5555', '#5555ff', '#55ff55', '#ffff55', '#ff55ff', '#55ffff']
    const randomColor = colors[props.playerId % colors.length] || '#' + Math.floor(Math.random() * 16777215).toString(16)
    colorValue.value = randomColor
    playerColors.value[props.playerId] = randomColor
  }

  // Adicionar event listener para reset do jogo
  window.addEventListener('reset-game', resetCounter)
})

// Remover event listener ao desmontar o componente
onBeforeUnmount(() => {
  window.removeEventListener('reset-game', resetCounter)
})

// Calcular a lista de oponentes e suas cores
const opponents = computed(() => {
  const result = []
  const opponentCount = props.counters

  for (let i = 1; i <= opponentCount; i++) {
    // Pular o próprio jogador
    if (i === props.playerId) continue

    // Acessar diretamente o objeto reativo para máxima reatividade
    result.push({
      id: i,
      // Acessar a cor atual do jogador a partir do objeto reativo global
      color: playerColors.value[i] || '#111111'
    })
  }

  return result
})

// Observar mudanças nas cores globais
watch(playerColors, () => {
  // Garantir que o componente reflita a cor atual do próprio jogador
  const myColor = playerColors.value[props.playerId]
  if (myColor && myColor !== colorValue.value) {
    console.log(`LifeCounter - Atualizando cor do jogador ${props.playerId} para ${myColor} (via watch global)`)
    colorValue.value = myColor
  }
}, { deep: true })

// Função para atualizar a vida
function changeLife(amount) {
  // Se estamos diminuindo a vida e já está em 0, não permitir
  if (amount < 0 && lifeTotal.value <= 0) {
    return
  }

  lifeTotal.value += amount
  lifeDelta.value += amount
  clearTimeout(lifeDeltaTimeout)
  lifeDeltaTimeout = setTimeout(() => (lifeDelta.value = 0), 1000)
}

const markers = ref({
  poison: 0,
  energy: 0,
  experience: 0,
})

const markerDeltas = ref({
  poison: 0,
  energy: 0,
  experience: 0,
})

const markerLabels = {
  poison: '☠️',
  energy: '⚡',
  experience: '⭐',
}

const markerDialogs = ref({
  poison: false,
  energy: false,
  experience: false,
})

const markerTimers = {}

// Inicializar marcadores para os oponentes
onMounted(() => {
  // Para cada oponente, garantir que existam os marcadores correspondentes
  opponents.value.forEach(opponent => {
    const key = 'commander_' + opponent.id
    if (markers.value[key] === undefined) {
      markers.value[key] = 0
    }
    if (markerDeltas.value[key] === undefined) {
      markerDeltas.value[key] = 0
    }
    if (markerDialogs.value[key] === undefined) {
      markerDialogs.value[key] = false
    }
  })
})

function changeMarker(name, amount) {
  // Garantir que o marcador existe
  if (markers.value[name] === undefined) {
    markers.value[name] = 0
  }
  if (markerDeltas.value[name] === undefined) {
    markerDeltas.value[name] = 0
  }

  // Impedir valores negativos quando tentamos diminuir (-1)
  if (amount < 0 && markers.value[name] <= 0) {
    return // Não permite que fique negativo
  }

  markers.value[name] += amount
  markerDeltas.value[name] += amount

  if (name === 'commander') {
    changeLife(-amount)
  }

  clearTimeout(markerTimers[name])
  markerTimers[name] = setTimeout(() => {
    markerDeltas.value[name] = 0
  }, 1000)
}

const isDead = computed(() => {
  return (
    lifeTotal.value <= 0 ||
    markers.value.poison >= 10 ||
    markers.value.commander >= 21 ||
    Object.keys(markers.value)
      .filter(key => key.startsWith('commander_'))
      .some(key => markers.value[key] >= 21)
  )
})

const isReversed = ref(false)

// Função para resetar o contador de vida e marcadores
function resetCounter() {
  lifeTotal.value = 40
  lifeDelta.value = 0

  // Resetar todos os marcadores
  Object.keys(markers.value).forEach(key => {
    markers.value[key] = 0
    markerDeltas.value[key] = 0
  })
}
</script>

<style scoped>
.container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  background-color: #1d1d1d;
  /* Cor de fallback */
  width: 100%;
  margin: 0;
  padding: 0;
  flex: 1;
  position: relative;
  /* Necessário para posicionamento absoluto do controls-container */
  overflow: hidden;
  /* Evitar que elementos extrapolem o contêiner */
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

.color-input::-webkit-color-swatch-wrapper {
  padding: 0;
}

.color-input::-webkit-color-swatch {
  border: none;
}

.color-input:hover {
  transform: scale(1.1);
  box-shadow: 0 0 10px rgba(0, 0, 0, 0.5);
}

.counter {
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 35px 0 25px 0;
  background-color: rgba(0, 0, 0, 0.5);
  padding: 15px 20px;
  border-radius: 30px;
  position: relative;
  /* Para posicionamento do delta */
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
  /* Impede que os botões encolham */
}

.button:hover {
  transform: scale(1.1);
  background-color: rgba(0, 0, 0, 0.7) !important;
  color: #ffffff !important;
  border: none !important;
}

.life-wrapper,
.marker-value-wrapper {
  position: relative;
  display: flex;
  justify-content: center;
  align-items: center;
  height: 40px;
  /* Altura reduzida */
  margin-bottom: 0;
  /* Removendo margem, já adicionamos no counter */
}

.counter .life-total {
  font-size: 42px;
  /* Aumentando um pouco mais */
  line-height: 1;
  margin: 0 20px;
}

/* Para telas menores */
@media (max-width: 768px) {
  .counter {
    padding: 10px 15px;
    margin: 15px 0 15px 0;
  }

  .button {
    width: 35px;
    height: 35px;
    margin: 0 5px;
  }

  .counter .life-total {
    font-size: 36px;
    margin: 0 10px;
  }

  .life-delta {
    top: -24px;
    font-size: 18px;
  }

  .marker-buttons {
    padding: 8px;
    max-width: 90%;
    gap: 8px;
    order: 2;
    /* Posicionar após o contador */
  }

  .marker-toggle:not(.cmd-button) {
    font-size: 13px;
    padding: 6px 10px;
  }

  .controls-container {
    position: relative;
    top: auto;
    right: auto;
    order: 3;
    /* Colocar após os marcadores */
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

  /* Ajustar organização do container para posicionar os controles por último */
  .container {
    display: flex;
    flex-direction: column;
    justify-content: center;
    padding-top: 10px;
    padding-bottom: 10px;
  }

  /* Garantir que o skull não interfira com o layout quando o jogador estiver morto */
  .skull {
    order: 2;
  }

  .reverse-orientation {
    width: 35px;
    height: 35px;
  }

  /* Ajuste para diálogos */
  :deep(.p-dialog-content) {
    padding: 15px;
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

  /* Ajustar o posicionamento do contador */
  .counter {
    order: 1;
  }
}

/* Responsividade para telas pequenas */
@media (max-width: 480px) {
  .counter {
    padding: 8px 12px;
    margin: 10px 0 10px 0;
  }

  .button {
    width: 32px;
    height: 32px;
    margin: 0 3px;
  }

  .counter .life-total {
    font-size: 32px;
    margin: 0 8px;
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

  /* Ajustar tamanho do color-picker e botão de inversão */
  .color-input {
    width: 30px;
    height: 30px;
  }

  .reverse-orientation {
    width: 30px;
    height: 30px;
    font-size: 16px;
  }

  .controls-container {
    margin-top: 10px;
    padding: 6px;
    gap: 8px;
    width: 95%;
    max-width: 180px;
  }
}

.life-delta {
  position: absolute;
  top: -28px;
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
}

.life-delta.positive {
  color: #4caf50;
}

.life-delta.negative {
  color: #f44336;
}

.fade-up-enter-active,
.fade-up-leave-active {
  transition: all 0.5s ease;
}

.fade-up-enter-from {
  opacity: 0;
  transform: translateY(-10px);
}

.fade-up-leave-to {
  opacity: 0;
  transform: translateY(10px);
}

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
  text-shadow: 0 0 2px white;
  box-shadow: 0 0 5px rgba(0, 0, 0, 0.5);
  font-size: 16px !important;
}

.cmd-button:hover {
  opacity: 0.8;
  transform: scale(1.05);
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

.color-button {
  display: none;
}

.custom-color-picker {
  display: none;
}

.color-picker-container {
  display: none;
  /* Removido, usando controls-container agora */
}

.marker {
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 10px 0 30px 0;
  /* Espaço para o delta abaixo */
  background-color: rgba(0, 0, 0, 0.5);
  padding: 15px;
  border-radius: 20px;
  min-height: 60px;
  /* Altura reduzida */
  position: relative;
  /* Para posicionamento do delta */
}

/* Ajuste para os marcadores de valor nos diálogos */
.marker .marker-value-wrapper {
  height: 45px;
  margin-bottom: 0;
}

.marker .marker-value {
  font-size: 38px;
  margin: 0 20px;
}

/* Botões nos diálogos */
.marker .button {
  width: 42px;
  height: 42px;
  margin: 0 10px;
}

/* Estilo para os diálogos */
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

/* Estilo para os diálogos customizados */
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

.life-total,
.marker-value {
  font-weight: bold;
  color: #ffffff;
  text-shadow: 1px 1px 3px rgba(0, 0, 0, 0.5);
  line-height: 1;
  /* Ajuste para alinhamento vertical */
}

.marker-value {
  font-size: 32px;
  margin: 0 15px;
}

.marker .life-delta {
  top: -25px;
}
</style>
