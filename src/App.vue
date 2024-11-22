<template>
  <SpeedDial
    :model="items"
    direction="up"
  >
    <template #button="{ toggleCallback }">
      <Button
        @click="toggleCallback"
        icon="pi pi-user"
      />
    </template>
  </SpeedDial>
  <div class="top-container">
    <LifeCounter v-for="counter in counters" />
  </div>
</template>

<script setup>
import { ref } from 'vue'
import LifeCounter from './components/LifeCounter.vue'
import SpeedDial from 'primevue/speeddial'
import Button from 'primevue/button'

const items = ref([
  { icon: 'fa-solid fa-1', command: () => (counters.value = 1) },
  { icon: 'fa-solid fa-2', command: () => (counters.value = 2) },
  { icon: 'fa-solid fa-3', command: () => (counters.value = 3) },
  { icon: 'fa-solid fa-4', command: () => (counters.value = 4) },
  { icon: 'fa-solid fa-5', command: () => (counters.value = 5) },
  { icon: 'fa-solid fa-6', command: () => (counters.value = 6) },
])

const counters = ref(0)
</script>

<style scoped>
.top-container {
  display: flex;
  flex-wrap: wrap;
  width: 100vw;
}
</style>
