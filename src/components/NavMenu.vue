<template>
  <nav class="nav-menu">
    <router-link
      to="/"
      class="nav-logo"
      @click="closeMenu"
    >
      <span class="logo-text">Mana VAI</span>
    </router-link>

    <div
      class="mobile-toggle"
      @click="toggleMenu"
    >
      <div
        class="menu-icon"
        :class="{ 'open': isMenuOpen }"
      >
        <span></span>
        <span></span>
        <span></span>
      </div>
    </div>

    <div
      class="nav-links"
      :class="{ 'open': isMenuOpen }"
    >
      <router-link
        to="/"
        class="nav-link"
        exact-active-class="active"
        @click="closeMenu"
      >
        <span class="nav-icon"><i class="fa-solid fa-house"></i></span>
        <span class="nav-text">Home</span>
      </router-link>

      <router-link
        to="/life-counter"
        class="nav-link"
        active-class="active"
        @click="closeMenu"
      >
        <span class="nav-icon"><i class="fa-solid fa-heart-pulse"></i></span>
        <span class="nav-text">Contador de Vida</span>
      </router-link>

      <router-link
        to="/tournament"
        class="nav-link"
        active-class="active"
        @click="closeMenu"
      >
        <span class="nav-icon"><i class="fa-solid fa-trophy"></i></span>
        <span class="nav-text">Torneios</span>
      </router-link>
    </div>
  </nav>
</template>

<script setup>
import { ref } from 'vue'

const isMenuOpen = ref(false)

function toggleMenu() {
  isMenuOpen.value = !isMenuOpen.value

  // Prevent scrolling when menu is open on mobile
  if (isMenuOpen.value) {
    document.body.style.overflow = 'hidden'
  } else {
    document.body.style.overflow = ''
  }
}

function closeMenu() {
  isMenuOpen.value = false
  document.body.style.overflow = ''
}
</script>

<style scoped>
.nav-menu {
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 60px;
  padding: 0 20px;
  background-color: rgba(0, 0, 0, 0.8);
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  z-index: 1000;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.5);
}

.nav-logo {
  display: flex;
  align-items: center;
  text-decoration: none;
  color: white;
  font-weight: bold;
  font-size: 1.5rem;
  transition: all 0.3s ease;
}

.nav-logo:hover {
  transform: scale(1.05);
  text-shadow: 0 0 10px rgba(255, 255, 255, 0.5);
}

.logo-text {
  margin-left: 8px;
}

.nav-links {
  display: flex;
  align-items: center;
  gap: 15px;
}

.nav-link {
  display: flex;
  align-items: center;
  padding: 8px 15px;
  text-decoration: none;
  color: #e0e0e0;
  font-weight: bold;
  border-radius: 8px;
  transition: all 0.3s ease;
}

.nav-link:hover {
  background-color: rgba(255, 255, 255, 0.1);
  color: white;
}

.nav-link.active {
  background-color: rgba(255, 255, 255, 0.2);
  color: white;
  box-shadow: 0 0 10px rgba(0, 0, 0, 0.3);
}

.nav-icon {
  font-size: 1.2rem;
  margin-right: 8px;
}

.mobile-toggle {
  display: none;
  cursor: pointer;
  padding: 10px;
}

.menu-icon {
  width: 30px;
  height: 20px;
  position: relative;
  transform: rotate(0deg);
  transition: 0.5s ease-in-out;
}

.menu-icon span {
  display: block;
  position: absolute;
  height: 3px;
  width: 100%;
  background: white;
  border-radius: 9px;
  opacity: 1;
  left: 0;
  transform: rotate(0deg);
  transition: 0.25s ease-in-out;
}

.menu-icon span:nth-child(1) {
  top: 0px;
}

.menu-icon span:nth-child(2) {
  top: 8px;
}

.menu-icon span:nth-child(3) {
  top: 16px;
}

.menu-icon.open span:nth-child(1) {
  top: 8px;
  transform: rotate(135deg);
}

.menu-icon.open span:nth-child(2) {
  opacity: 0;
  left: -60px;
}

.menu-icon.open span:nth-child(3) {
  top: 8px;
  transform: rotate(-135deg);
}

@media (max-width: 768px) {
  .mobile-toggle {
    display: block;
  }

  .nav-links {
    position: fixed;
    top: 60px;
    left: 0;
    right: 0;
    bottom: 0;
    flex-direction: column;
    background-color: rgba(0, 0, 0, 0.9);
    padding: 20px;
    transform: translateX(100%);
    transition: transform 0.3s ease;
    z-index: 1000;
  }

  .nav-links.open {
    transform: translateX(0);
  }

  .nav-link {
    width: 100%;
    padding: 15px;
    border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  }
}
</style>