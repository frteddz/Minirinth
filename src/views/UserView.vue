<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import Card from '../ui/components/Card.vue'
import { getUser, getUserProjects, type ModrinthUser, type Project } from '../api/client'
import { projectPath } from '../utils/project-path'
import { tagIconSvg } from '../data/tag-icons'
import downloadIcon from '../assets/icons/download.svg?raw'
import heartIcon from '../assets/icons/heart.svg?raw'

const route = useRoute()
const router = useRouter()
const profile = ref<ModrinthUser | null>(null)
const projects = ref<Project[]>([])
const loading = ref(false)
const error = ref('')
const FOUNDER_ID = 'AEfLnF7W'
const isFounder = computed(() => profile.value?.id === FOUNDER_ID)

function joinedLabel(date: string) {
  return new Date(date).toLocaleDateString(undefined, { month: 'long', year: 'numeric' })
}

function tagLabel(slug: string) {
  return slug
    .split('-')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ')
}

function formatCount(value: number) {
  if (value >= 1_000_000_000) return `${(value / 1_000_000_000).toFixed(2)}B`
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(2)}M`
  if (value >= 1_000) return `${(value / 1_000).toFixed(1)}K`
  return String(value)
}

async function load() {
  const username = String(route.params.username ?? '')
  if (!username) return
  loading.value = true
  error.value = ''
  profile.value = null
  projects.value = []
  try {
    const found = await getUser(username)
    profile.value = found
    projects.value = (await getUserProjects(found.id)).sort((a, b) => b.downloads - a.downloads)
  } catch (cause) {
    error.value = cause instanceof Error ? cause.message : 'Could not load this user.'
  } finally {
    loading.value = false
  }
}

watch(() => route.params.username, load, { immediate: true })
</script>

<template>
  <section class="page user-page">
    <Card>
      <template #header>
        <h1 class="page__title">User</h1>
      </template>

      <p v-if="loading" class="user-page__message">Loading user...</p>
      <p v-else-if="error" class="user-page__message user-page__message--error">{{ error }}</p>

      <div v-else-if="profile" class="user-page__identity">
        <img
          v-if="profile.avatar_url"
          class="user-page__avatar"
          :src="profile.avatar_url"
          :alt="`${profile.username} avatar`"
        />
        <span v-else class="user-page__avatar user-page__avatar--fallback">
          {{ profile.username.charAt(0).toUpperCase() }}
        </span>
        <div class="user-page__details">
          <h2 class="user-page__name">{{ profile.username }}</h2>
          <span v-if="isFounder" class="founder-badge">Minirynth Creator</span>
          <p v-if="profile.bio" class="user-page__bio">{{ profile.bio }}</p>
          <p class="user-page__joined">Joined {{ joinedLabel(profile.created) }}</p>
        </div>
      </div>
    </Card>

    <template v-if="profile">
      <h2 class="user-page__section-title">Projects</h2>
      <p v-if="loading" class="user-page__message">Loading projects...</p>
      <p v-else-if="projects.length === 0" class="user-page__message">
        No public projects yet.
      </p>

      <Card
        v-for="project in projects"
        :key="project.id"
        class="project-card project-card--link"
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
            <h3 class="project-card__title">{{ project.title }}</h3>
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
  </section>
</template>
