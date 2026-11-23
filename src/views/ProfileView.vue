<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import Card from '../ui/components/Card.vue'
import Button from '../ui/components/buttons/Button.vue'
import { useAuth } from '../composables/useAuth'
import { useFollows } from '../composables/useFollows'
import { getUserProjects, type Project } from '../api/client'
import { projectPath } from '../utils/project-path'
import { tagIconSvg } from '../data/tag-icons'
import downloadIcon from '../assets/icons/download.svg?raw'
import heartIcon from '../assets/icons/heart.svg?raw'
import globeIcon from '../assets/icons/globe.svg?raw'
import pkg from '../../package.json'

const router = useRouter()
const { user, loading, error, restore, signOut } = useAuth()
const { followed, load: loadFollows, clear: clearFollows } = useFollows()

const projects = ref<Project[]>([])
const projectsLoading = ref(false)
const activeTab = ref('all')
const search = ref('')
const FOUNDER_ID = 'AEfLnF7W'
const isFounder = computed(() => user.value?.id === FOUNDER_ID)
const confirmSignOutOpen = ref(false)
const tabs = [
  { id: 'all', label: 'All' },
  { id: 'mod', label: 'Mods' },
  { id: 'resourcepack', label: 'Resource Packs' },
  { id: 'modpack', label: 'Modpacks' },
  { id: 'plugin', label: 'Plugins' },
]

const filteredProjects = computed(() => {
  const scoped =
    activeTab.value === 'all'
      ? projects.value
      : projects.value.filter((project) => project.project_type === activeTab.value)
  const query = search.value.trim().toLowerCase()
  const filtered = query
    ? scoped.filter((project) => project.title.toLowerCase().includes(query))
    : scoped
  return [...filtered].sort((a, b) => b.downloads - a.downloads)
})

const totalDownloads = computed(() =>
  projects.value.reduce((sum, project) => sum + project.downloads, 0),
)

function visibilityLabel(status: string) {
  return status === 'approved' ? 'Public' : status
}

function formatCount(value: number) {
  if (value >= 1_000_000_000) return `${(value / 1_000_000_000).toFixed(2)}B`
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(2)}M`
  if (value >= 1_000) return `${(value / 1_000).toFixed(1)}K`
  return String(value)
}

function joinedLabel(date: string) {
  return new Date(date).toLocaleDateString(undefined, { month: 'short', year: 'numeric' })
}

function tagLabel(slug: string) {
  return slug
    .split('-')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ')
}

async function loadProjects() {
  if (!user.value) return
  projectsLoading.value = true
  try {
    projects.value = await getUserProjects(user.value.id)
  } catch {
    projects.value = []
  } finally {
    projectsLoading.value = false
  }
}

async function confirmSignOut() {
  confirmSignOutOpen.value = false
  await signOut()
}

watch(user, (value) => {
  if (value) {
    loadProjects()
    loadFollows(value.id)
  } else {
    projects.value = []
    activeTab.value = 'all'
    clearFollows()
  }
})

onMounted(restore)
</script>

<template>
  <section class="page profile">
    <Card>
      <template #header>
        <h1 class="page__title">Profile</h1>
      </template>

      <p v-if="loading" class="page__lead">Loading account...</p>

      <template v-else-if="user">
        <div class="profile__user">
          <img
            v-if="user.avatar_url"
            class="profile__avatar"
            :src="user.avatar_url"
            alt=""
          />
          <span v-else class="profile__avatar profile__avatar--fallback">
            {{ user.username.charAt(0).toUpperCase() }}
          </span>
          <div class="profile__identity">
            <h2 class="profile__name">{{ user.username }}</h2>
            <span v-if="isFounder" class="founder-badge">Minirynth Creator</span>
            <p v-if="user.bio" class="profile__bio">{{ user.bio }}</p>
            <div class="profile__stats-line">
              <span>{{ projects.length }} projects</span>
              <span>{{ formatCount(totalDownloads) }} downloads</span>
              <span>Joined {{ joinedLabel(user.created) }}</span>
            </div>
          </div>
        </div>
        <div class="profile__actions">
          <Button
            type="outlined"
            color="red"
            class="profile__sign-out"
            @click="confirmSignOutOpen = true"
          >
            Sign out
          </Button>
        </div>
      </template>

      <template v-else>
        <p class="profile__hint">Sign in to see your projects and account details.</p>
        <div class="profile__actions">
          <Button type="colored" color="green" @click="router.push('/login')">Sign in</Button>
        </div>
      </template>
    </Card>

    <Card v-if="user && followed.length > 0" class="following-card">
      <template #header>
        <h2 class="following-card__title">Following</h2>
      </template>
      <button
        v-for="item in followed"
        :key="item.id"
        type="button"
        class="following-card__item"
        @click="router.push(projectPath(item.project_type, item.slug))"
      >
        <img
          v-if="item.icon_url"
          class="following-card__icon"
          :src="item.icon_url"
          alt=""
        />
        <span v-else class="following-card__icon following-card__icon--fallback">
          {{ item.title.charAt(0) }}
        </span>
        <span class="following-card__name">{{ item.title }}</span>
        <span class="following-card__type">{{ tagLabel(item.project_type) }}</span>
      </button>
    </Card>

    <template v-if="user">
      <div class="profile__tabs" role="group" aria-label="Project types">
        <button
          v-for="tab in tabs"
          :key="tab.id"
          type="button"
          class="profile__tab"
          :class="{ 'is-active': activeTab === tab.id }"
          @click="activeTab = tab.id"
        >
          {{ tab.label }}
        </button>
        <input
          v-model="search"
          class="profile__tabs-search"
          type="search"
          placeholder="Search projects"
          aria-label="Search projects"
        />
      </div>

      <p v-if="projectsLoading" class="profile__message">Loading projects...</p>
      <p v-else-if="error" class="profile__message">{{ error }}</p>
      <p v-else-if="filteredProjects.length === 0" class="profile__message">No projects here yet.</p>

      <Card
        v-for="project in filteredProjects"
        :key="project.id"
        class="project-card profile-project project-card--link"
        role="link"
        tabindex="0"
        @click="router.push(projectPath(project.project_type, project.slug))"
        @keyup.enter="router.push(projectPath(project.project_type, project.slug))"
      >
        <div class="project-card__row">
          <img
            v-if="project.icon_url"
            class="project-card__icon project-card__icon--image"
            :src="project.icon_url"
            alt=""
          />
          <span v-else class="project-card__icon">{{ project.title.charAt(0) }}</span>
          <div class="project-card__body">
            <h2 class="project-card__title">
              {{ project.title }}
              <span class="profile-project__visibility">
                <span class="profile-project__visibility-icon" aria-hidden="true" v-html="globeIcon"></span>
                {{ visibilityLabel(project.status) }}
              </span>
            </h2>
            <p class="project-card__description">{{ project.description }}</p>
            <div class="project-card__tags">
              <span
                v-for="tag in project.categories.slice(0, 3)"
                :key="tag"
                class="project-card__tag"
              >
                <span
                  v-if="tagIconSvg(tag)"
                  class="project-card__tag-icon"
                  aria-hidden="true"
                  v-html="tagIconSvg(tag)"
                ></span>
                {{ tagLabel(tag) }}
              </span>
            </div>
          </div>
        </div>
        <div class="project-card__meta">
          <div class="project-card__stats">
            <span>
              <span class="project-card__stat-icon" aria-hidden="true" v-html="downloadIcon"></span>
              {{ formatCount(project.downloads) }}
            </span>
            <span v-if="project.follows !== null">
              <span class="project-card__stat-icon" aria-hidden="true" v-html="heartIcon"></span>
              {{ formatCount(project.follows) }}
            </span>
          </div>
        </div>
      </Card>
    </template>

    <p class="page__footer">
      <span class="app-version">{{ pkg.displayVersion }}</span>
      Powered by the <a href="https://modrinth.com" target="_blank" rel="noopener">Modrinth API</a>.
    </p>

    <Teleport to="body">
      <div v-if="confirmSignOutOpen" class="confirm-overlay" @click.self="confirmSignOutOpen = false">
        <div class="confirm-card" role="dialog" aria-modal="true" aria-label="Sign out">
          <h2 class="confirm-card__title">Sign out?</h2>
          <p class="confirm-card__text">
            This removes your saved account from this device. You can sign in again anytime.
          </p>
          <div class="confirm-card__actions">
            <button type="button" class="confirm-card__cancel" @click="confirmSignOutOpen = false">
              Cancel
            </button>
            <button type="button" class="confirm-card__confirm" @click="confirmSignOut">
              Sign out
            </button>
          </div>
        </div>
      </div>
    </Teleport>
  </section>
</template>
