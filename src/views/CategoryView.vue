<script setup lang="ts">
import { ChevronLeft, ChevronRight, Search, SlidersHorizontal } from '@lucide/vue'
import { computed, onMounted, onUnmounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import Card from '../ui/components/Card.vue'
import SelectMenu from '../components/SelectMenu.vue'
import { categories } from '../data/categories'
import { tagIconSvg, tagSlug } from '../data/tag-icons'
import { useCategoryFilters } from '../composables/useCategoryFilters'
import { projectPath } from '../utils/project-path'
import { searchProjects, type SearchHit } from '../api/client'
import downloadIcon from '../assets/icons/download.svg?raw'
import heartIcon from '../assets/icons/heart.svg?raw'

const route = useRoute()
const router = useRouter()
const category = computed(() => categories.find((item) => item.path === route.path))
const { state, openFilter, clearAll } = useCategoryFilters()

const sorts = ['Relevance', 'Downloads', 'Follows', 'Newest', 'Recently Updated'] as const
type Sort = (typeof sorts)[number]
const sortOptions: Sort[] = [...sorts]
const viewOptions = [10, 20, 50, 100]

const sort = ref<Sort>('Relevance')
const pageSize = ref(10)
const query = ref('')
const currentPage = ref(1)

const hits = ref<SearchHit[]>([])
const totalHits = ref(0)
const loading = ref(false)
const error = ref('')

let timer: ReturnType<typeof setTimeout> | undefined

const projectTypes: Record<string, string> = {
  '/mods': 'mod',
  '/shaders': 'shader',
  '/resource-packs': 'resourcepack',
  '/data-packs': 'datapack',
  '/modpacks': 'modpack',
  '/plugins': 'plugin',
}

const indexMap: Record<Sort, string> = {
  Relevance: 'relevance',
  Downloads: 'downloads',
  Follows: 'follows',
  Newest: 'newest',
  'Recently Updated': 'updated',
}

const openSourceLicenses = [
  'MIT', 'Apache-2.0', 'GPL-3.0', 'LGPL-3.0', 'AGPL-3.0', 'GPL-2.0',
  'LGPL-2.1', 'BSD-2-Clause', 'BSD-3-Clause', 'MPL-2.0', 'ISC', 'Unlicense',
]

function buildFacets() {
  const facets: string[][] = [[`project_type:${projectTypes[route.path] ?? 'mod'}`]]

  if (state.categories.length) {
    facets.push(state.categories.map((label) => `categories:${tagSlug(label)}`))
  }
  if (state.loaders.length) {
    facets.push(state.loaders.map((label) => `categories:${tagSlug(label)}`))
  }
  if (state.versions.length) {
    facets.push(state.versions.map((version) => `versions:${version}`))
  }
  if (state.environments.length === 1) {
    const key = state.environments[0] === 'Client' ? 'client_side' : 'server_side'
    facets.push([`${key}:required`, `${key}:optional`])
  }
  if (state.openSourceOnly) {
    facets.push(openSourceLicenses.map((license) => `license:${license}`))
  }

  return JSON.stringify(facets)
}

function formatCount(value: number) {
  if (value >= 1_000_000_000) return `${(value / 1_000_000_000).toFixed(2)}B`
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(2)}M`
  if (value >= 1_000) return `${(value / 1_000).toFixed(1)}K`
  return String(value)
}

function tagLabel(slug: string) {
  return slug
    .split('-')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ')
}

const projects = computed(() =>
  hits.value.filter((hit) => {
    if (state.excluded.categories.some((label) => hit.categories.includes(tagSlug(label)))) return false
    if (state.excluded.loaders.some((label) => hit.categories.includes(tagSlug(label)))) return false
    return true
  }),
)

const totalPages = computed(() => Math.max(1, Math.ceil(totalHits.value / pageSize.value)))

const pageNumbers = computed<(number | string)[]>(() => {
  if (totalPages.value <= 5) return Array.from({ length: totalPages.value }, (_, i) => i + 1)
  return [1, 2, '...', totalPages.value]
})

async function load() {
  if (!category.value) return
  loading.value = true
  error.value = ''
  try {
    const result = await searchProjects({
      query: query.value.trim(),
      index: indexMap[sort.value],
      facets: buildFacets(),
      limit: pageSize.value,
      offset: (currentPage.value - 1) * pageSize.value,
    })
    hits.value = result.hits
    totalHits.value = result.total_hits
  } catch (cause) {
    hits.value = []
    totalHits.value = 0
    error.value = cause instanceof Error ? cause.message : 'Could not load projects.'
  } finally {
    loading.value = false
  }
}

function scheduleLoad() {
  if (timer) clearTimeout(timer)
  timer = setTimeout(load, 250)
}

function goToPage(page: number | string) {
  if (typeof page === 'number') currentPage.value = page
}

watch([query, sort, pageSize, currentPage, () => state], scheduleLoad, { deep: true })

watch(
  () => route.path,
  () => {
    clearAll()
    query.value = ''
    sort.value = 'Relevance'
    pageSize.value = 10
    currentPage.value = 1
    load()
  },
)

onMounted(load)
onUnmounted(() => {
  if (timer) clearTimeout(timer)
})
</script>

<template>
  <section v-if="category" class="page category">
    <header class="category__header">
      <h1 class="page__title">{{ category.title }}</h1>
    </header>

    <label class="category__search">
      <Search :size="18" :stroke-width="2" aria-hidden="true" />
      <input
        v-model="query"
        type="search"
        :placeholder="`Search ${category.title.toLowerCase()}...`"
        :aria-label="`Search ${category.title}`"
      />
    </label>

    <div class="category__select--sort">
      <SelectMenu v-model="sort" :options="sortOptions" prefix="Sort by" />
    </div>

    <div class="category__controls">
      <SelectMenu v-model="pageSize" :options="viewOptions" prefix="View" />
      <button
        type="button"
        class="category__filter-icon"
        aria-label="Open filters"
        @click="openFilter"
      >
        <SlidersHorizontal :size="18" :stroke-width="2" aria-hidden="true" />
      </button>
    </div>

    <div class="category__pagination" aria-label="Pagination">
      <button
        v-if="currentPage > 1"
        type="button"
        class="category__page category__page--nav"
        aria-label="Previous page"
        @click="currentPage--"
      >
        <ChevronLeft :size="16" :stroke-width="2" />
      </button>
      <template v-for="page in pageNumbers" :key="page">
        <span v-if="page === '...'" class="category__page-gap">...</span>
        <button
          v-else
          type="button"
          class="category__page"
          :class="{ 'is-active': page === currentPage }"
          @click="goToPage(page)"
        >
          {{ page }}
        </button>
      </template>
      <button
        v-if="currentPage < totalPages"
        type="button"
        class="category__page category__page--nav"
        aria-label="Next page"
        @click="currentPage++"
      >
        <ChevronRight :size="16" :stroke-width="2" />
      </button>
    </div>

    <p v-if="loading" class="category__message">Loading projects...</p>
    <p v-else-if="error" class="category__message">{{ error }}</p>
    <p v-else-if="projects.length === 0" class="category__empty">No projects match these filters.</p>

    <Card
      v-for="project in projects"
      :key="project.project_id"
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
          <h2 class="project-card__title">
            {{ project.title }}
            <span class="project-card__author">by {{ project.author }}</span>
          </h2>
          <p class="project-card__description">{{ project.description }}</p>

          <div class="project-card__tags">
            <span
              v-for="tag in project.categories.slice(0, 3)"
              :key="tag"
              class="project-card__tag"
            >
              <span v-if="tagIconSvg(tag)" class="project-card__tag-icon" aria-hidden="true" v-html="tagIconSvg(tag)"></span>
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
          <span>
            <span class="project-card__stat-icon" aria-hidden="true" v-html="heartIcon"></span>
            {{ formatCount(project.follows) }}
          </span>
        </div>
      </div>
    </Card>
  </section>
</template>
