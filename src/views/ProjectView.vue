<script setup lang="ts">
import { ArrowLeft, ChevronLeft, ChevronRight, ExternalLink, Heart, X } from '@lucide/vue'
import { computed, nextTick, onMounted, onUnmounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import Card from '../ui/components/Card.vue'
import SelectMenu from '../components/SelectMenu.vue'
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
import { userPath } from '../utils/user-path'
import { useAuth } from '../composables/useAuth'
import { useFollows } from '../composables/useFollows'

const route = useRoute()
const router = useRouter()
const { user } = useAuth()
const { writeError: followWriteError, load: loadFollows, isFollowing, toggle: toggleFollow } = useFollows()

const project = ref<ProjectDetail | null>(null)
const versions = ref<ProjectVersion[]>([])
const members = ref<ProjectMember[]>([])
const tab = ref('about')
const loading = ref(false)
const error = ref('')
const downloadOpen = ref(false)
const selectedGameVersion = ref('')
const selectedLoader = ref('')
const copiedId = ref(false)
const expandedChangelogs = ref<Record<string, boolean>>({})
const galleryOpen = ref(false)
const galleryIndex = ref(0)
let galleryTouchX = 0

function openGallery(index: number) {
  galleryIndex.value = index
  galleryOpen.value = true
}

function closeGallery() {
  galleryOpen.value = false
}

function galleryStep(step: number) {
  const length = project.value?.gallery.length ?? 0
  if (length === 0) return
  galleryIndex.value = (galleryIndex.value + step + length) % length
}

function onGalleryTouchStart(event: TouchEvent) {
  galleryTouchX = event.changedTouches[0]?.clientX ?? 0
}

function onGalleryTouchEnd(event: TouchEvent) {
  const endX = event.changedTouches[0]?.clientX ?? 0
  const distance = endX - galleryTouchX
  if (Math.abs(distance) < 50) return
  galleryStep(distance < 0 ? 1 : -1)
}

async function downloadGalleryImage() {
  const image = project.value?.gallery[galleryIndex.value]
  if (!image) return

  const extension = image.url.includes('.png') ? 'png' : image.url.includes('.webp') ? 'webp' : 'jpg'
  const name = (image.title?.trim() || `gallery-${galleryIndex.value + 1}`)
    .replace(/[^a-z0-9-_]+/gi, '-')
    .toLowerCase()

  try {
    const response = await fetch(image.url)
    if (!response.ok) throw new Error('Download failed')
    const blob = await response.blob()
    const objectUrl = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = objectUrl
    link.download = `${name}.${extension}`
    document.body.appendChild(link)
    link.click()
    link.remove()
    setTimeout(() => URL.revokeObjectURL(objectUrl), 1000)
  } catch {
    window.open(image.url, '_blank', 'noopener')
  }
}

watch(galleryOpen, (open) => {
  document.body.style.overflow = open ? 'hidden' : ''
})

watch(downloadOpen, (open) => {
  if (open) {
    document.body.style.overflow = 'hidden'
  } else if (!document.querySelector('.overlay')) {
    document.body.style.overflow = ''
  }
})

onUnmounted(() => {
  window.removeEventListener('resize', measureIndicator)
  if (downloadOpen.value || galleryOpen.value) document.body.style.overflow = ''
})

const tabs = [
  { id: 'about', label: 'About' },
  { id: 'versions', label: 'Versions' },
  { id: 'gallery', label: 'Gallery' },
  { id: 'links', label: 'More' },
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
onMounted(() => {
  measureIndicator()
  window.addEventListener('resize', measureIndicator)
})

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

function compareVersions(a: string, b: string) {
  const snapshotA = a.match(/^(\d+)w(\d+)([a-z])$/)
  const snapshotB = b.match(/^(\d+)w(\d+)([a-z])$/)
  if (snapshotA || snapshotB) {
    if (snapshotA && !snapshotB) return 1
    if (!snapshotA && snapshotB) return -1
    if (snapshotA && snapshotB) {
      const yearDiff = Number(snapshotB[1]) - Number(snapshotA[1])
      if (yearDiff) return yearDiff
      const weekDiff = Number(snapshotB[2]) - Number(snapshotA[2])
      if (weekDiff) return weekDiff
      return snapshotB[3].localeCompare(snapshotA[3])
    }
  }

  const baseNums = (value: string) =>
    (value.split('-')[0].match(/\d+/g) ?? []).map(Number)
  const baseA = baseNums(a)
  const baseB = baseNums(b)
  const baseLength = Math.max(baseA.length, baseB.length)
  for (let i = 0; i < baseLength; i++) {
    const diff = (baseB[i] ?? 0) - (baseA[i] ?? 0)
    if (diff) return diff
  }

  const rank = (value: string) => {
    if (value.includes('-rc')) return 3
    if (value.includes('-pre')) return 2
    if (value.includes('-snapshot') || value.includes('-beta')) return 1
    return 4
  }
  const rankDiff = rank(b) - rank(a)
  if (rankDiff) return rankDiff

  const numsA = (a.match(/\d+/g) ?? []).map(Number)
  const numsB = (b.match(/\d+/g) ?? []).map(Number)
  const length = Math.max(numsA.length, numsB.length)
  for (let i = 0; i < length; i++) {
    const diff = (numsB[i] ?? 0) - (numsA[i] ?? 0)
    if (diff) return diff
  }
  return b.localeCompare(a)
}

const gameVersionOptions = computed(() => {
  const values = new Set<string>()
  versions.value.forEach((version) => version.game_versions.forEach((value) => values.add(value)))
  return [...values].sort(compareVersions)
})

const loaderOptions = computed(() => {
  const values = new Set<string>()
  versions.value.forEach((version) => version.loaders.forEach((value) => values.add(value)))
  return [...values]
})

const matchedVersion = computed(() =>
  versions.value.find(
    (version) =>
      (!selectedGameVersion.value || version.game_versions.includes(selectedGameVersion.value)) &&
      (!selectedLoader.value || version.loaders.includes(selectedLoader.value)),
  ),
)

const matchedFile = computed(() => matchedVersion.value?.files[0] ?? null)

const following = computed(() =>
  project.value ? isFollowing(project.value.id) : false,
)

function followAction() {
  if (!user.value) {
    router.push('/login')
    return
  }
  if (project.value) toggleFollow(project.value.id)
}

function openDownload() {
  if (!selectedGameVersion.value && gameVersionOptions.value.length) {
    selectedGameVersion.value = gameVersionOptions.value[0]
  }
  if (!selectedLoader.value && loaderOptions.value.length) {
    selectedLoader.value = loaderOptions.value[0]
  }
  downloadOpen.value = true
}

function formatCount(value: number) {
  if (value >= 1_000_000_000) return `${(value / 1_000_000_000).toFixed(2)}B`
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(2)}M`
  if (value >= 1_000) return `${(value / 1_000).toFixed(1)}K`
  return String(value)
}

function formatDate(value: string) {
  return new Date(value).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })
}

async function copyProjectId() {
  if (!project.value) return
  try {
    await navigator.clipboard.writeText(project.value.id)
    copiedId.value = true
    setTimeout(() => (copiedId.value = false), 1600)
  } catch {
    copiedId.value = false
  }
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
  versions.value = []
  members.value = []
  tab.value = 'about'
  downloadOpen.value = false
  selectedGameVersion.value = ''
  selectedLoader.value = ''
  expandedChangelogs.value = {}
  try {
    project.value = await getProject(slug)
    await nextTick()
    measureIndicator()
    versions.value = await getProjectVersions(slug, 100).catch(() => [])
    members.value = await getProjectMembers(slug).catch(() => [])
  } catch (cause) {
    error.value = cause instanceof Error ? cause.message : 'Could not load this project.'
  } finally {
    loading.value = false
  }
}

watch(() => route.params.slug, load)
watch(
  user,
  (value) => {
    if (value) loadFollows(value.id)
  },
  { immediate: true },
)
onMounted(load)
</script>

<template>
  <section class="page project-page">
    <button type="button" class="project-page__back" aria-label="Go back" @click="router.back()">
      <ArrowLeft :size="24" :stroke-width="2.5" />
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
          <div class="project-page__stats">
            <span>
              <span class="project-card__stat-icon" aria-hidden="true" v-html="downloadIcon"></span>
              {{ formatCount(project.downloads) }} downloads
            </span>
            <span>
              <span class="project-card__stat-icon" aria-hidden="true" v-html="heartIcon"></span>
              {{ formatCount(project.followers) }} followers
            </span>
          </div>
        </div>
        <div class="project-page__actions">
          <button
            type="button"
            class="project-page__follow"
            :class="{ 'is-following': following }"
            :aria-label="!user ? 'Sign in to follow' : following ? 'Unfollow project' : 'Follow project'"
            @click="followAction"
          >
            <Heart :size="18" :stroke-width="2.5" :fill="following ? 'currentColor' : 'none'" />
          </button>
          <button type="button" class="project-page__download" @click="openDownload">
            <span class="project-page__action-icon" aria-hidden="true" v-html="downloadIcon"></span>
            Download
          </button>
        </div>
      </header>

      <p v-if="followWriteError" class="project-page__hint">
        This token can't follow projects. Add the Write user data scope and sign in again.
      </p>

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
            <div class="version-card__heading">
              <h2 class="version-card__title">{{ version.name }}</h2>
              <span class="version-card__number">{{ version.version_number }}</span>
            </div>
          </template>
          <p class="version-card__meta">
            {{ formatDate(version.date_published) }} · {{ formatCount(version.downloads) }} downloads
          </p>
          <div class="project-page__tags">
            <span v-for="loader in version.loaders.slice(0, 3)" :key="loader" class="project-card__tag">
              {{ tagLabel(loader) }}
            </span>
          </div>
          <div
            v-if="version.changelog"
            class="version-card__changelog"
            :class="{ 'is-expanded': expandedChangelogs[version.id] }"
          >
            <div class="markdown-body" v-html="renderMarkdown(version.changelog)"></div>
          </div>
          <button
            v-if="version.changelog && version.changelog.length > 180"
            type="button"
            class="version-card__more"
            @click="expandedChangelogs[version.id] = !expandedChangelogs[version.id]"
          >
            {{ expandedChangelogs[version.id] ? 'Show less' : 'Show more' }}
          </button>
          <a
            v-if="version.files[0]"
            class="version-card__download"
            :href="version.files[0].url"
            target="_blank"
            rel="noopener"
          >
            <span class="project-page__action-icon" aria-hidden="true" v-html="downloadIcon"></span>
            Download {{ version.files[0].filename }}
          </a>
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
          <button
            type="button"
            class="gallery-card__open"
            :aria-label="`View ${image.title ?? project.title}`"
            @click="openGallery(index)"
          >
            <img class="gallery-card__image" :src="image.url" :alt="image.title ?? project.title" />
          </button>
          <h2 v-if="image.title" class="gallery-card__title">{{ image.title }}</h2>
          <p v-if="image.description" class="gallery-card__description">{{ image.description }}</p>
        </Card>
      </div>

      <div v-else-if="tab === 'links'">
        <Card class="info-card">
          <template #header>
            <h2 class="info-card__title">Project details</h2>
          </template>
          <div class="info-card__row">
            <span>Project ID</span>
            <span class="info-card__value info-card__value--id">
              <code>{{ project.id }}</code>
              <button type="button" class="info-card__copy" @click="copyProjectId">
                {{ copiedId ? 'Copied' : 'Copy' }}
              </button>
            </span>
          </div>
          <div class="info-card__row">
            <span>Type</span>
            <span class="info-card__value">{{ tagLabel(project.project_type) }}</span>
          </div>
          <div class="info-card__row">
            <span>Published</span>
            <span class="info-card__value">{{ formatDate(project.published) }}</span>
          </div>
          <div class="info-card__row">
            <span>Updated</span>
            <span class="info-card__value">{{ formatDate(project.updated) }}</span>
          </div>
          <div v-if="project.license" class="info-card__row">
            <span>License</span>
            <span class="info-card__value">
              <a :href="project.license.url" target="_blank" rel="noopener">
                {{ project.license.name }}
              </a>
            </span>
          </div>
          <div class="info-card__row">
            <span>Availability</span>
            <span class="info-card__value">
              Client {{ tagLabel(project.client_side) }} · Server {{ tagLabel(project.server_side) }}
            </span>
          </div>
          <div class="info-card__row">
            <span>Loaders</span>
            <span class="info-card__value">
              {{ project.loaders.slice(0, 3).map(tagLabel).join(', ')
              }}<template v-if="project.loaders.length > 3"> +{{ project.loaders.length - 3 }} more</template>
            </span>
          </div>
        </Card>

        <Card class="info-card">
          <template #header>
            <h2 class="info-card__title">People</h2>
          </template>
          <p v-if="members.length === 0" class="project-page__message">
            No member information available.
          </p>
          <button
            v-for="member in members"
            :key="member.user.id"
            type="button"
            class="project-page__member"
            @click="router.push(userPath(member.user.username))"
          >
            <img
              v-if="member.user.avatar_url"
              class="project-page__member-avatar"
              :src="member.user.avatar_url"
              :alt="`${member.user.username} avatar`"
            />
            <span v-else class="project-page__member-avatar project-page__member-avatar--fallback">
              {{ member.user.username.charAt(0).toUpperCase() }}
            </span>
            <span class="project-page__member-copy">
              <span class="project-page__member-name">{{ member.user.username }}</span>
              <span class="project-page__member-role">{{ tagLabel(member.role) }}</span>
            </span>
          </button>
        </Card>

        <h2 class="project-page__section-title">External links</h2>
        <Card class="link-card">
          <a :href="`https://modrinth.com/project/${project.slug}`" target="_blank" rel="noopener">
            <span class="link-card__icon" aria-hidden="true" v-html="linkIcon('link')"></span>
            <span class="link-card__label">View on Modrinth</span>
            <ExternalLink :size="16" :stroke-width="2" class="link-card__external" />
          </a>
        </Card>
        <p v-if="links.length === 0" class="project-page__message">No other links listed.</p>
        <Card v-for="link in links" :key="link.label + link.url" class="link-card">
          <a :href="link.url" target="_blank" rel="noopener">
            <span class="link-card__icon" aria-hidden="true" v-html="linkIcon(link.label)"></span>
            <span class="link-card__label">{{ link.label }}</span>
            <ExternalLink :size="16" :stroke-width="2" class="link-card__external" />
          </a>
        </Card>
      </div>
    </template>

    <Teleport to="body">
      <Transition name="pop">
        <div v-if="downloadOpen" class="download-overlay" @click.self="downloadOpen = false">
          <div class="download-dialog" role="dialog" aria-modal="true" aria-label="Download project">
            <header class="download-dialog__header">
              <div class="download-dialog__heading">
                <img
                  v-if="project?.icon_url"
                  class="download-dialog__icon"
                  :src="project.icon_url"
                  alt=""
                />
                <span v-else class="download-dialog__icon download-dialog__icon--fallback">
                  {{ project?.title.charAt(0) }}
                </span>
                <h2>Download {{ project?.title }}</h2>
              </div>
              <button type="button" aria-label="Close download" @click="downloadOpen = false">
                <X :size="20" :stroke-width="2.5" />
              </button>
            </header>

            <div class="download-dialog__body">
              <p class="download-dialog__label">Download manually</p>
              <div class="download-dialog__selects">
                <SelectMenu
                  v-model="selectedGameVersion"
                  :options="gameVersionOptions"
                  prefix="Game version"
                  searchable
                  show-all-toggle
                  toggle-label="Show all versions"
                />
                <SelectMenu
                  v-if="loaderOptions.length > 0"
                  v-model="selectedLoader"
                  :options="loaderOptions"
                  prefix="Loader"
                />
              </div>
              <a
                v-if="matchedFile"
                class="download-dialog__button"
                :href="matchedFile.url"
                target="_blank"
                rel="noopener"
              >
                <span class="project-page__action-icon" aria-hidden="true" v-html="downloadIcon"></span>
                Download {{ matchedFile.filename }}
              </a>
              <p v-else class="download-dialog__empty">No file matches that combination.</p>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>

    <Teleport to="body">
      <div v-if="galleryOpen && project" class="gallery-viewer" role="dialog" aria-modal="true" aria-label="Gallery image">
        <div class="gallery-viewer__top">
          <span class="gallery-viewer__counter">
            {{ galleryIndex + 1 }} / {{ project.gallery.length }}
          </span>
          <div class="gallery-viewer__actions">
            <button
              type="button"
              class="gallery-viewer__download"
              aria-label="Download image"
              @click="downloadGalleryImage"
            >
              <span class="gallery-viewer__download-icon" aria-hidden="true" v-html="downloadIcon"></span>
              <span>Download</span>
            </button>
            <button type="button" class="gallery-viewer__close" aria-label="Close gallery" @click="closeGallery">
              <X :size="24" :stroke-width="2.5" />
            </button>
          </div>
        </div>

        <div
          class="gallery-viewer__stage"
          @touchstart="onGalleryTouchStart"
          @touchend="onGalleryTouchEnd"
          @click.self="closeGallery"
        >
          <img
            v-if="project.gallery[galleryIndex]"
            class="gallery-viewer__image"
            :src="project.gallery[galleryIndex].url"
            :alt="project.gallery[galleryIndex].title ?? project.title"
          />
        </div>

        <div class="gallery-viewer__bottom">
          <button
            type="button"
            class="gallery-viewer__nav"
            aria-label="Previous image"
            @click="galleryStep(-1)"
          >
            <ChevronLeft :size="24" :stroke-width="2.5" />
          </button>
          <div v-if="project.gallery[galleryIndex]" class="gallery-viewer__caption">
            <p v-if="project.gallery[galleryIndex].title" class="gallery-viewer__title">
              {{ project.gallery[galleryIndex].title }}
            </p>
            <p v-if="project.gallery[galleryIndex].description" class="gallery-viewer__description">
              {{ project.gallery[galleryIndex].description }}
            </p>
          </div>
          <button
            type="button"
            class="gallery-viewer__nav"
            aria-label="Next image"
            @click="galleryStep(1)"
          >
            <ChevronRight :size="24" :stroke-width="2.5" />
          </button>
        </div>
      </div>
    </Teleport>
  </section>
</template>
