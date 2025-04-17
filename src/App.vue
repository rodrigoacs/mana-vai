<template>
  <SpeedDial
    :model="items"
    direction="down"
    style="position: absolute;"
  >
    <template #button="{ toggleCallback }">
      <Button
        @click="toggleCallback"
        icon="pi pi-user"
      />
    </template>
  </SpeedDial>

  <div
    class="top-container"
    :style="{
      'flex-direction': counters > 2 ? 'row' : 'column',
      'justify-content': counters > 2 ? 'space-around' : 'center'
    }"
  >
    <LifeCounter
      v-for="n in counters"
      :key="'player-' + n"
      :playerId="n"
      :counters="counters"
      @update:color="updateColor"
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
.top-container {
  display: flex;
  flex-wrap: wrap;
  width: 100%;
  height: 100%;
}
</style>
