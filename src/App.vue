<template>
  <button @click="counters++">Add Counter</button>
  <div class="top-container">
    <LifeCounter v-for="counter in counters" />
  </div>
  <button @click="counters--">Remove Counter</button>
</template>

<script setup>
import { ref } from 'vue'
import LifeCounter from './components/LifeCounter.vue'

const counters = ref(2)



</script>

<style scoped>
.top-container {
  display: flex;
  flex-wrap: wrap;
}
</style>