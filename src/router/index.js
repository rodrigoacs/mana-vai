import { createRouter, createWebHistory } from 'vue-router'
import HomeView from '../views/HomeView.vue'
import LifeCounterView from '../views/LifeCounterView.vue'
import TournamentView from '../views/TournamentView.vue'

const routes = [
  {
    path: '/',
    name: 'home',
    component: HomeView
  },
  {
    path: '/life-counter',
    name: 'life-counter',
    component: LifeCounterView
  },
  {
    path: '/tournament',
    name: 'tournament',
    component: TournamentView
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

export default router 