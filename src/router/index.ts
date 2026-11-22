import { createRouter, createWebHistory } from 'vue-router'
import HomeView from '../views/HomeView.vue'
import CategoryView from '../views/CategoryView.vue'
import SearchView from '../views/SearchView.vue'
import ProfileView from '../views/ProfileView.vue'
import LoginView from '../views/LoginView.vue'
import SettingsView from '../views/SettingsView.vue'
import DashboardView from '../views/DashboardView.vue'
import AnalyticsView from '../views/AnalyticsView.vue'
import NotificationsView from '../views/NotificationsView.vue'
import UserView from '../views/UserView.vue'
import OAuthCallbackView from '../views/OAuthCallbackView.vue'
import CreditsView from '../views/CreditsView.vue'
import CreateProjectView from '../views/CreateProjectView.vue'
import OrganizationsView from '../views/OrganizationsView.vue'
import OrganizationView from '../views/OrganizationView.vue'
import ProjectView from '../views/ProjectView.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    { path: '/', name: 'home', component: HomeView },
    { path: '/search', name: 'search', component: SearchView },
    { path: '/profile', name: 'profile', component: ProfileView },
    { path: '/notifications', name: 'notifications', component: NotificationsView },
    { path: '/user/:username', name: 'user', component: UserView },
    { path: '/login', name: 'login', component: LoginView },
    { path: '/oauth/callback', name: 'oauth-callback', component: OAuthCallbackView },
    { path: '/settings', name: 'settings', component: SettingsView },
    { path: '/dashboard', name: 'dashboard', component: DashboardView },
    { path: '/analytics', name: 'analytics', component: AnalyticsView },
    { path: '/credits', name: 'credits', component: CreditsView },
    { path: '/create', name: 'create-project', component: CreateProjectView },
    { path: '/organizations', name: 'organizations', component: OrganizationsView },
    { path: '/organization/:slug', name: 'organization', component: OrganizationView },
    { path: '/mod/:slug', name: 'project-mod', component: ProjectView, meta: { project: true } },
    { path: '/shader/:slug', name: 'project-shader', component: ProjectView, meta: { project: true } },
    {
      path: '/resource-pack/:slug',
      name: 'project-resource-pack',
      component: ProjectView,
      meta: { project: true },
    },
    {
      path: '/data-pack/:slug',
      name: 'project-data-pack',
      component: ProjectView,
      meta: { project: true },
    },
    {
      path: '/modpack/:slug',
      name: 'project-modpack',
      component: ProjectView,
      meta: { project: true },
    },
    {
      path: '/plugin/:slug',
      name: 'project-plugin',
      component: ProjectView,
      meta: { project: true },
    },
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
