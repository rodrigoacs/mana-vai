<template>
  <div
    ref="containerRef"
    class="container"
  >
    <ColorPicker v-model="backgroundColor" />
    <div class="counter">
      <i class="pi pi-heart"></i>
      <Button
        class="button decrease"
        @click="decreaseLife"
        icon="pi pi-minus"
      />
      <span class="life-total">{{ lifeTotal }}</span>
      <Button
        class="button increase"
        @click="increaseLife"
        icon="pi pi-plus"
      />
    </div>
    <div class="commander-damage">
      <i class="pi pi-user"></i>
      <Button
        class="button decrease"
        @click="decreaseCommanderDamage"
        icon="pi pi-minus"
      />
      <span class="commander-damage-total">{{ commanderDamage }}</span>
      <Button
        class="button increase"
        @click="increaseCommanderDamage"
        icon="pi pi-plus"
      />
    </div>
  </div>
</template>

<script setup>
import { ref, watch } from 'vue'
import Button from 'primevue/button'
import ColorPicker from 'primevue/colorpicker'

const lifeTotal = ref(40)
const commanderDamage = ref(0)
const backgroundColor = ref('#1111111')
const containerRef = ref(null)

watch(backgroundColor, (newColor) => {
  if (containerRef.value) {
    containerRef.value.style.backgroundColor = '#' + newColor
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
  background-color: #1d1d1d;
  width: 20%;
  height: 20%;
  margin: 0;
  padding: 0;
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