import { createRouter, createWebHistory } from 'vue-router'
import TournamentView from '../views/TournamentView.vue'

const routes = [
  {
    path: '/',
    name: 'tournament',
    component: TournamentView
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

export default router