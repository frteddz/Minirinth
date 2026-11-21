<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import Card from '../ui/components/Card.vue'
import Button from '../ui/components/buttons/Button.vue'
import { useAuth } from '../composables/useAuth'
import { getUserProjects, type Project } from '../api/client'
import { tagIconSvg } from '../data/tag-icons'
import downloadIcon from '../assets/icons/download.svg?raw'
import heartIcon from '../assets/icons/heart.svg?raw'
import globeIcon from '../assets/icons/globe.svg?raw'

const router = useRouter()
const { user, loading, error, restore, signOut } = useAuth()

const projects = ref<Project[]>([])
const projectsLoading = ref(false)
const activeTab = ref('all')

const tabs = [
  { id: 'all', label: 'All' },
  { id: 'mod', label: 'Mods' },
  { id: 'resourcepack', label: 'Resource Packs' },
  { id: 'modpack', label: 'Modpacks' },
  { id: 'plugin', label: 'Plugins' },
]

const filteredProjects = computed(() =>
  activeTab.value === 'all'
    ? projects.value
    : projects.value.filter((project) => project.project_type === activeTab.value),
)

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

watch(user, (value) => {
  if (value) loadProjects()
  else {
    projects.value = []
    activeTab.value = 'all'
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
            <p v-if="user.bio" class="profile__bio">{{ user.bio }}</p>
            <div class="profile__stats-line">
              <span>{{ projects.length }} projects</span>
              <span>{{ formatCount(totalDownloads) }} downloads</span>
              <span>Joined {{ joinedLabel(user.created) }}</span>
            </div>
          </div>
        </div>
        <div class="profile__actions">
          <Button type="outlined" @click="signOut">Sign out</Button>
        </div>
      </template>

      <template v-else>
        <p class="profile__hint">Sign in to see your projects and account details.</p>
        <div class="profile__actions">
          <Button type="colored" color="green" @click="router.push('/login')">Sign in</Button>
        </div>
      </template>
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
      </div>

      <p v-if="projectsLoading" class="profile__message">Loading projects...</p>
      <p v-else-if="error" class="profile__message">{{ error }}</p>
      <p v-else-if="filteredProjects.length === 0" class="profile__message">No projects here yet.</p>

      <Card
        v-for="project in filteredProjects"
        :key="project.id"
        class="project-card profile-project"
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
      <span class="app-version">Minirinth v0.1.2-dev</span>
      Powered by the <a href="https://modrinth.com" target="_blank" rel="noopener">Modrinth API</a>.
    </p>
  </section>
</template>
