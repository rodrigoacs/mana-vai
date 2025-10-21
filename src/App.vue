<template>
  <div class="app">
    <router-view />
    <Toast position="bottom-right" />
  </div>
</template>

<script setup>
// Sem script necessário
</script>

<style>
/* Estilos globais agora estão em src/assets/main.css */
/* Este estilo garante que o app preencha a tela */
.app {
  width: 100vw;
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}
</style>