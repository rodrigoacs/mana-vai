<template>
  <div
    ref="containerRef"
    class="container"
  >
    <input
      type="color"
      v-model="backgroundColor"
    >
    <div class="counter">
      <i class="fa-solid fa-heart"></i>
      <button
        class="button decrease"
        @click="decreaseLife"
      >
        <i class="fa-solid fa-square-minus"></i>
      </button>
      <span class="life-total">{{ lifeTotal }}</span>
      <button
        class="button increase"
        @click="increaseLife"
      >
        <i class="fa-solid fa-square-plus"></i>
      </button>
    </div>
    <div class="commander-damage">
      <i class="fa-solid fa-user"></i>
      <button
        class="button decrease"
        @click="decreaseCommanderDamage"
      >
        <i class="fa-solid fa-square-minus"></i>
      </button>
      <span class="commander-damage-total">{{ commanderDamage }}</span>
      <button
        class="button increase"
        @click="increaseCommanderDamage"
      >
        <i class="fa-solid fa-square-plus"></i>
      </button>
    </div>
  </div>
</template>

<script setup>
import { ref, watch } from 'vue'

const lifeTotal = ref(40)
const commanderDamage = ref(0)
const backgroundColor = ref('#111111')
const containerRef = ref(null)

watch(backgroundColor, (newColor) => {
  if (containerRef.value) {
    containerRef.value.style.backgroundColor = newColor
  }
})

function increaseLife() {
  lifeTotal.value++
}

function decreaseLife() {
  lifeTotal.value--
}

function increaseCommanderDamage() {
  commanderDamage.value++
  lifeTotal.value--
}

function decreaseCommanderDamage() {
  commanderDamage.value--
  lifeTotal.value++
}
</script>

<style scoped>
.container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  width: 40vw;
  margin: 1rem;
  padding: .4rem;
}

.counter,
.commander-damage {
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 10px 0;
}

.button {
  border: none;
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  justify-content: center;
  align-items: center;
}

.button:hover {
  transform: scale(1.1);
}

.button.decrease {
  color: #dc3545;
  background-color: transparent;
}

.button.decrease:hover {
  color: #c82333;
  background-color: transparent;
}

.button.increase {
  color: #28a745;
  background-color: transparent;
}

.button.increase:hover {
  color: #218838;
  background-color: transparent;
}

.life-total,
.commander-damage-total {
  font-size: 32px;
  font-weight: bold;
  margin: 0 15px;
  color: #ffc400;
  text-shadow: 1px 1px 3px rgba(0, 0, 0, 0.5);
}
</style>