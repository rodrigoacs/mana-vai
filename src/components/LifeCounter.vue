<template>
  <div class="container">
    <input
      type="color"
      v-model="backgroundColor"
    >
    <h2 class="title">Life Counter</h2>
    <div class="counter">
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
    <span class="section-title">Commander Damage</span>
    <div class="commander-damage">
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
import { ref } from 'vue'
import { watch } from 'vue'

const lifeTotal = ref(40)
const commanderDamage = ref(0)
const backgroundColor = ref('#218838')

watch(backgroundColor, (newColor) => {
  document.querySelector('.container').style.backgroundColor = newColor
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
  background-color: #218838;
}

.title {
  font-size: 28px;
  text-align: center;
  margin-bottom: 20px;
  color: #ffcc00;
}

.section-title {
  display: block;
  margin-top: 30px;
  font-size: 20px;
  text-align: center;
  color: #ffc400;
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

.button i {
  font-size: 20px;
  vertical-align: middle;
}

.life-total,
.commander-damage-total {
  font-size: 32px;
  font-weight: bold;
  margin: 0 15px;
  color: #ffc400;
  text-shadow: 1px 1px 3px rgba(0, 0, 0, 0.5);
}

@media (max-width: 600px) {
  .button {
    padding: 10px 14px;
    font-size: 16px;
  }

  .life-total,
  .commander-damage-total {
    font-size: 24px;
  }

  .title {
    font-size: 24px;
  }
}
</style>
