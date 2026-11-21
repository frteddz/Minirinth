<script setup lang="ts">
import { ArrowLeft, ExternalLink } from '@lucide/vue'
import { computed, nextTick, onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import Card from '../ui/components/Card.vue'
import downloadIcon from '../assets/icons/download.svg?raw'
import heartIcon from '../assets/icons/heart.svg?raw'
import {
  getProject,
  getProjectMembers,
  getProjectVersions,
  type ProjectDetail,
  type ProjectMember,
  type ProjectVersion,
} from '../api/client'
import { renderMarkdown } from '../utils/markdown'
import { tagIconSvg } from '../data/tag-icons'
import { linkIcon } from '../utils/link-icons'

const route = useRoute()
const router = useRouter()

const project = ref<ProjectDetail | null>(null)
const owner = ref<ProjectMember | null>(null)
const versions = ref<ProjectVersion[]>([])
const tab = ref('about')
const loading = ref(false)
const error = ref('')

const tabs = [
  { id: 'about', label: 'About' },
  { id: 'versions', label: 'Versions' },
  { id: 'gallery', label: 'Gallery' },
  { id: 'links', label: 'Links' },
]

const bodyHtml = computed(() => (project.value ? renderMarkdown(project.value.body) : ''))

const activeIndex = computed(() => tabs.findIndex((item) => item.id === tab.value))
const tabButtons = ref<HTMLElement[]>([])
const indicatorStyle = ref({ left: '0px', width: '0px' })

async function measureIndicator() {
  await nextTick()
  const button = tabButtons.value[activeIndex.value]
  if (!button) {
    if (project.value) setTimeout(measureIndicator, 30)
    return
  }
  indicatorStyle.value = { left: `${button.offsetLeft}px`, width: `${button.offsetWidth}px` }
}

watch([activeIndex, project], measureIndicator)
onMounted(measureIndicator)

const links = computed(() => {
  const source = project.value
  if (!source) return []
  const items = [
    { label: 'Source', url: source.source_url },
    { label: 'Issues', url: source.issues_url },
    { label: 'Wiki', url: source.wiki_url },
    { label: 'Discord', url: source.discord_url },
    ...source.donation_urls.map((item) => ({ label: item.platform, url: item.url })),
  ]
  return items.filter((item): item is { label: string; url: string } => Boolean(item.url))
})

function formatCount(value: number) {
  if (value >= 1_000_000_000) return `${(value / 1_000_000_000).toFixed(2)}B`
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(2)}M`
  if (value >= 1_000) return `${(value / 1_000).toFixed(1)}K`
  return String(value)
}

function formatDate(value: string) {
  return new Date(value).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })
}

function tagLabel(slug: string) {
  return slug
    .split('-')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ')
}

async function load() {
  const slug = String(route.params.slug ?? '')
  if (!slug) return
  loading.value = true
  error.value = ''
  project.value = null
  owner.value = null
  versions.value = []
  tab.value = 'about'
  try {
    project.value = await getProject(slug)
    await nextTick()
    measureIndicator()
    const [members, versionList] = await Promise.all([
      getProjectMembers(slug).catch(() => []),
      getProjectVersions(slug).catch(() => []),
    ])
    owner.value = members.find((member) => member.role === 'Owner') ?? members[0] ?? null
    versions.value = versionList
  } catch (cause) {
    error.value = cause instanceof Error ? cause.message : 'Could not load this project.'
  } finally {
    loading.value = false
  }
}

watch(() => route.params.slug, load)
onMounted(load)
</script>

<template>
  <section class="page project-page">
    <button type="button" class="project-page__back" aria-label="Go back" @click="router.back()">
      <ArrowLeft :size="20" :stroke-width="2.5" />
      <span>Back</span>
    </button>

    <p v-if="loading" class="project-page__message">Loading project...</p>
    <p v-else-if="error" class="project-page__message">{{ error }}</p>

    <template v-else-if="project">
      <header class="project-page__header">
        <img
          v-if="project.icon_url"
          class="project-page__icon"
          :src="project.icon_url"
          alt=""
        />
        <span v-else class="project-page__icon project-page__icon--fallback">
          {{ project.title.charAt(0) }}
        </span>
        <div class="project-page__identity">
          <h1 class="project-page__title">{{ project.title }}</h1>
          <p v-if="owner" class="project-page__author">by {{ owner.user.username }}</p>
          <p v-else class="project-page__author">{{ tagLabel(project.project_type) }}</p>
        </div>
      </header>

      <div class="project-page__stats">
        <span>
          <span class="project-card__stat-icon" aria-hidden="true" v-html="downloadIcon"></span>
          {{ formatCount(project.downloads) }}
        </span>
        <span>
          <span class="project-card__stat-icon" aria-hidden="true" v-html="heartIcon"></span>
          {{ formatCount(project.followers) }}
        </span>
        <span>Updated {{ formatDate(project.updated) }}</span>
      </div>

      <div class="project-page__tabs" role="tablist" aria-label="Project sections">
        <span
          class="project-page__tab-indicator"
          aria-hidden="true"
          :style="indicatorStyle"
        ></span>
        <button
          v-for="(item, i) in tabs"
          :key="item.id"
          :ref="(el) => { if (el) tabButtons[i] = el as HTMLElement }"
          type="button"
          role="tab"
          :aria-selected="tab === item.id"
          class="project-page__tab"
          :class="{ 'is-active': tab === item.id }"
          @click="tab = item.id"
        >
          {{ item.label }}
        </button>
      </div>

      <div v-if="tab === 'about'">
        <div class="project-page__tags">
          <span v-for="tag in [...project.categories, ...project.loaders]" :key="tag" class="project-card__tag">
            <span v-if="tagIconSvg(tag)" class="project-card__tag-icon" aria-hidden="true" v-html="tagIconSvg(tag)"></span>
            {{ tagLabel(tag) }}
          </span>
        </div>
        <Card class="project-page__body">
          <div class="markdown-body" v-html="bodyHtml"></div>
        </Card>
      </div>

      <div v-else-if="tab === 'versions'">
        <Card v-for="version in versions" :key="version.id" class="version-card">
          <template #header>
            <h2 class="version-card__title">{{ version.name }}</h2>
          </template>
          <p class="version-card__meta">
            {{ version.version_number }} · {{ formatDate(version.date_published) }} ·
            {{ formatCount(version.downloads) }} downloads
          </p>
          <p v-if="version.changelog" class="version-card__changelog">{{ version.changelog }}</p>
          <div class="project-page__tags">
            <span v-for="loader in version.loaders.slice(0, 3)" :key="loader" class="project-card__tag">
              {{ tagLabel(loader) }}
            </span>
          </div>
          <a
            class="version-card__link"
            :href="`https://modrinth.com/project/${project.slug}/version/${version.id}`"
            target="_blank"
            rel="noopener"
          >
            Open on Modrinth
            <ExternalLink :size="14" :stroke-width="2" />
          </a>
        </Card>
        <p v-if="versions.length === 0" class="project-page__message">No versions found.</p>
      </div>

      <div v-else-if="tab === 'gallery'">
        <p v-if="project.gallery.length === 0" class="project-page__message">No gallery images.</p>
        <Card v-for="(image, index) in project.gallery" :key="index" class="gallery-card">
          <img class="gallery-card__image" :src="image.url" :alt="image.title ?? project.title" />
          <h2 v-if="image.title" class="gallery-card__title">{{ image.title }}</h2>
          <p v-if="image.description" class="gallery-card__description">{{ image.description }}</p>
        </Card>
      </div>

      <div v-else-if="tab === 'links'">
        <p v-if="links.length === 0" class="project-page__message">No links listed.</p>
        <Card v-for="link in links" :key="link.label + link.url" class="link-card">
          <a :href="link.url" target="_blank" rel="noopener">
            <span class="link-card__icon" aria-hidden="true" v-html="linkIcon(link.label)"></span>
            <span class="link-card__label">{{ link.label }}</span>
            <ExternalLink :size="16" :stroke-width="2" class="link-card__external" />
          </a>
        </Card>
      </div>
    </template>
  </section>
</template>
