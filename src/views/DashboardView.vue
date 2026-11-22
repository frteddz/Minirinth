<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import Card from '../ui/components/Card.vue'
import SelectMenu from '../components/SelectMenu.vue'
import { useAuth } from '../composables/useAuth'
import { useCreatorProjects } from '../composables/useCreatorProjects'
import { projectPath } from '../utils/project-path'
import type { Project } from '../api/client'

const router = useRouter()
const { user } = useAuth()
const { projects, loading, error, load, refresh } = useCreatorProjects()
const activeStatus = ref('all')
const search = ref('')
const sort = ref('Downloads')
const sortOptions = ['Downloads', 'Followers', 'Name', 'Status']

const statuses = [
  { id: 'all', label: 'All' },
  { id: 'approved', label: 'Approved' },
  { id: 'unlisted', label: 'Unlisted' },
  { id: 'processing', label: 'Under review' },
  { id: 'draft', label: 'Drafts' },
  { id: 'rejected', label: 'Rejected' },
  { id: 'withheld', label: 'Withheld' },
]

const approvedCount = computed(() => projects.value.filter((item) => item.status === 'approved').length)
const reviewCount = computed(() => projects.value.filter((item) => item.status === 'processing').length)
const draftCount = computed(() => projects.value.filter((item) => item.status === 'draft').length)
const totalDownloads = computed(() => projects.value.reduce((sum, item) => sum + item.downloads, 0))

const visibleProjects = computed(() => {
  const scoped =
    activeStatus.value === 'all'
      ? projects.value
      : projects.value.filter((item) => item.status === activeStatus.value)
  const query = search.value.trim().toLowerCase()
  const filtered = query
    ? scoped.filter((item) => item.title.toLowerCase().includes(query))
    : [...scoped]

  if (sort.value === 'Followers') {
    return filtered.sort((a, b) => followersFor(b) - followersFor(a))
  }
  if (sort.value === 'Name') {
    return filtered.sort((a, b) => a.title.localeCompare(b.title))
  }
  if (sort.value === 'Status') {
    return filtered.sort((a, b) => labelFor(a.status).localeCompare(labelFor(b.status)))
  }
  return filtered.sort((a, b) => b.downloads - a.downloads)
})

function countFor(id: string) {
  if (id === 'all') return projects.value.length
  return projects.value.filter((item) => item.status === id).length
}

function labelFor(value: string) {
  if (value === 'processing') return 'Under review'
  return value
    .split('-')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ')
}

function followersFor(item: Project) {
  return item.followers ?? item.follows ?? 0
}

function formatNumber(value: number) {
  return new Intl.NumberFormat('en-US').format(value)
}

onMounted(load)
</script>

<template>
  <section class="page creator">
    <Card>
      <template #header>
        <h1 class="page__title">Dashboard</h1>
      </template>

      <div v-if="!user" class="creator__signed-out">
        <p>Sign in to see your projects on Modrinth.</p>
        <button type="button" class="creator__action" @click="router.push('/login')">Sign in</button>
      </div>

      <div v-else>
        <div class="creator__intro-row">
          <input
            v-model="search"
            class="creator__search"
            type="search"
            placeholder="Search projects"
            aria-label="Search projects"
          />
          <SelectMenu v-model="sort" :options="sortOptions" prefix="Sort by" />
          <button type="button" class="creator__action" @click="refresh">Refresh</button>
        </div>

        <div class="creator__stats">
          <div class="creator__stat">
            <span class="creator__stat-value">{{ formatNumber(projects.length) }}</span>
            <span class="creator__stat-label">Projects</span>
          </div>
          <div class="creator__stat">
            <span class="creator__stat-value">{{ formatNumber(approvedCount) }}</span>
            <span class="creator__stat-label">Approved</span>
          </div>
          <div class="creator__stat">
            <span class="creator__stat-value">{{ formatNumber(reviewCount) }}</span>
            <span class="creator__stat-label">Under review</span>
          </div>
          <div class="creator__stat">
            <span class="creator__stat-value">{{ formatNumber(draftCount) }}</span>
            <span class="creator__stat-label">Drafts</span>
          </div>
        </div>

        <div class="creator__tabs">
          <button
            v-for="status in statuses"
            :key="status.id"
            type="button"
            class="creator__tab"
            :class="{ 'is-active': activeStatus === status.id }"
            @click="activeStatus = status.id"
          >
            <span>{{ status.label }}</span>
            <span class="creator__tab-count">{{ countFor(status.id) }}</span>
          </button>
        </div>

        <p v-if="loading" class="creator__message">Loading projects...</p>
        <p v-else-if="error" class="creator__error">{{ error }}</p>
        <p v-else-if="visibleProjects.length === 0" class="creator__message">
          No projects in this group.
        </p>

        <div v-else class="creator__list">
          <button
            v-for="item in visibleProjects"
            :key="item.id"
            type="button"
            class="creator__project"
            @click="router.push(projectPath(item.project_type, item.slug))"
          >
            <span class="creator__project-icon">
              <img v-if="item.icon_url" :src="item.icon_url" :alt="`${item.title} icon`" />
              <span v-else>{{ item.title.charAt(0).toUpperCase() }}</span>
            </span>
            <span class="creator__project-copy">
              <span class="creator__project-title">{{ item.title }}</span>
              <span class="creator__project-meta">
                {{ labelFor(item.project_type) }} / {{ labelFor(item.status) }}
              </span>
            </span>
            <span class="creator__project-numbers">
              <span>{{ formatNumber(item.downloads) }} downloads</span>
              <span>{{ formatNumber(followersFor(item)) }} followers</span>
            </span>
          </button>
        </div>

        <p class="creator__footnote">{{ formatNumber(totalDownloads) }} downloads across all projects.</p>
      </div>
    </Card>
  </section>
</template>
