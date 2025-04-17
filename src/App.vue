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
      :playerId="n"
      :counters="counters"
      v-model:background-color="backgroundColor"
    />
  </div>
</template>

<script setup>
import { ref } from 'vue'
import LifeCounter from './components/LifeCounter.vue'
import SpeedDial from 'primevue/speeddial'
import Button from 'primevue/button'

const counters = ref(3)
const backgroundColor = ref('#111111')
const emit = defineEmits(['update:backgroundColor'])

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
