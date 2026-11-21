import { createRouter, createWebHistory } from 'vue-router'
import HomeView from '../views/HomeView.vue'
import CategoryView from '../views/CategoryView.vue'
import SearchView from '../views/SearchView.vue'
import ProfileView from '../views/ProfileView.vue'
import LoginView from '../views/LoginView.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    { path: '/', name: 'home', component: HomeView },
    { path: '/search', name: 'search', component: SearchView },
    { path: '/profile', name: 'profile', component: ProfileView },
    { path: '/login', name: 'login', component: LoginView },
    { path: '/mods', name: 'mods', component: CategoryView, meta: { category: true } },
    { path: '/shaders', name: 'shaders', component: CategoryView, meta: { category: true } },
    {
      path: '/resource-packs',
      name: 'resource-packs',
      component: CategoryView,
      meta: { category: true },
    },
    { path: '/data-packs', name: 'data-packs', component: CategoryView, meta: { category: true } },
    { path: '/modpacks', name: 'modpacks', component: CategoryView, meta: { category: true } },
    { path: '/plugins', name: 'plugins', component: CategoryView, meta: { category: true } },
  ],
})

export default router
