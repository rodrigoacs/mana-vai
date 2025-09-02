<template>
  <div class="app">
    <NavMenu />
    <main class="main-content">
      <router-view />
    </main>
    <Toast position="bottom-right" />
  </div>
</template>

<script setup>
import NavMenu from './components/NavMenu.vue'
</script>

<style>
html,
body {
  margin: 0;
  padding: 0;
  width: 100%;
  height: 100%;
  overflow: hidden;
  font-family: 'Roboto', sans-serif;
  background-color: #121212;
  color: white;
}

.app {
  width: 100%;
  height: 100vh;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.main-content {
  flex: 1;
  overflow: auto;
  padding-top: 60px;
  /* Height of the navbar */
  height: calc(100vh - 60px);
}

/* Utility classes */
.no-select {
  user-select: none;
  -webkit-user-select: none;
  -moz-user-select: none;
}

/* Global styles for buttons, if needed */
button {
  cursor: pointer;
  outline: none;
}

/* Override any PrimeVue styles as needed */
:root {
  --primary-color: #9c27b0;
  --secondary-color: #2196f3;
  --surface-ground: #121212;
  --surface-card: rgba(30, 30, 30, 0.8);
  --surface-border: rgba(255, 255, 255, 0.1);
  --surface-section: rgba(0, 0, 0, 0.5);
  --text-color: #ffffff;
  --text-color-secondary: rgba(255, 255, 255, 0.7);
}

/* Ensure all views take full height */
.router-view {
  height: 100%;
  width: 100%;
}
</style>
