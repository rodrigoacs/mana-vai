<template>
  <div class="home-view">
    <h1>Mana VAI</h1>
    <p>Escolha uma opção abaixo para começar:</p>
    
    <div class="nav-cards">
      <router-link to="/life-counter" class="nav-card">
        <div class="card-icon">❤️</div>
        <div class="card-title">Contador de Vida</div>
      </router-link>
      
      <router-link to="/deck-validator" class="nav-card">
        <div class="card-icon">📝</div>
        <div class="card-title">Validador de Deck</div>
      </router-link>
      
      <router-link to="/tournament" class="nav-card">
        <div class="card-icon">🏆</div>
        <div class="card-title">Torneios</div>
      </router-link>
    </div>
  </div>
</template>

<script setup>
// Home page
</script>

<style scoped>
.home-view {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 2rem;
  text-align: center;
}

h1 {
  font-size: 3rem;
  margin-bottom: 1rem;
  color: white;
  text-shadow: 0 0 10px rgba(156, 39, 176, 0.5);
}

p {
  font-size: 1.2rem;
  color: rgba(255, 255, 255, 0.8);
  margin-bottom: 2rem;
}

.nav-cards {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 1.5rem;
  margin-top: 1rem;
}

.nav-card {
  width: 200px;
  height: 200px;
  background-color: rgba(30, 30, 30, 0.8);
  border-radius: 15px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-decoration: none;
  color: white;
  box-shadow: 0 5px 15px rgba(0, 0, 0, 0.3);
  transition: all 0.3s ease;
  border: 2px solid rgba(255, 255, 255, 0.1);
  padding: 1.5rem;
}

.nav-card:hover {
  transform: translateY(-10px);
  box-shadow: 0 15px 30px rgba(0, 0, 0, 0.4);
  background-color: rgba(50, 50, 50, 0.8);
  border-color: rgba(156, 39, 176, 0.7);
}

.card-icon {
  font-size: 3rem;
  margin-bottom: 1rem;
}

.card-title {
  font-weight: bold;
  font-size: 1.2rem;
}

/* Responsivo */
@media (max-width: 600px) {
  h1 {
    font-size: 2.2rem;
  }
  
  .nav-card {
    width: 150px;
    height: 150px;
  }
  
  .card-icon {
    font-size: 2.5rem;
  }
}
</style> 