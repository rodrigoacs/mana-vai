<script setup>
defineProps({
  show: {
    type: Boolean,
    required: true,
  },
  title: {
    type: String,
    default: 'Alterar Valor'
  },
  isRotated: {
    type: Boolean,
    default: false
  }
})
const emit = defineEmits(['close'])
</script>

<template>
  <Transition name="modal-fade">
    <div
      v-if="show"
      class="modal-backdrop"
      @click.self="emit('close')"
    >
      <div
        class="modal-content"
        :class="{ 'rotated-content': isRotated }"
      >
        <header class="modal-header">
          <h3 class="modal-title">{{ title }}</h3>
          <button
            @click="emit('close')"
            class="close-btn"
            aria-label="Fechar"
          >&times;</button>
        </header>
        <section class="modal-body">
          <slot></slot>
        </section>
      </div>
    </div>
  </Transition>
</template>

<style scoped>
.modal-backdrop {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  background-color: rgba(0, 0, 0, 0.6);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 100;
  backdrop-filter: blur(5px);
}

.modal-content {
  background-color: #2c2c2c;
  border-radius: 12px;
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.5);
  width: 90%;
  max-width: 450px;
  display: flex;
  flex-direction: column;
  border: 1px solid #444;
  transition: transform 0.3s ease;
}

.modal-content.rotated-content {
  transform: rotate(180deg);
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem 1.5rem;
  border-bottom: 1px solid #444;
}

.modal-title {
  font-size: 1.25rem;
  font-weight: 600;
  color: #fff;
}

.close-btn {
  background: none;
  border: none;
  font-size: 2rem;
  color: #aaa;
  cursor: pointer;
  line-height: 1;
  padding: 0;
}

.modal-body {
  padding: 1.5rem;
  color: #ddd;
}

.modal-fade-enter-active,
.modal-fade-leave-active {
  transition: opacity 0.3s ease;
}

.modal-fade-enter-from,
.modal-fade-leave-to {
  opacity: 0;
}
</style>