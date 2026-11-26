<script setup lang="ts">
import {
  ArrowLeft,
  Bookmark,
  ChevronLeft,
  ChevronRight,
  Clock,
  Download,
  ExternalLink,
  Heart,
  Pencil,
  Plus,
  Settings,
  Trash,
  X,
} from '@lucide/vue'
import { computed, nextTick, onMounted, onUnmounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import Card from '../ui/components/Card.vue'
import SelectMenu from '../components/SelectMenu.vue'
import ProjectEditDialog from '../components/ProjectEditDialog.vue'
import VersionUploadDialog from '../components/VersionUploadDialog.vue'
import VersionEditDialog from '../components/VersionEditDialog.vue'
import GalleryUploadDialog from '../components/GalleryUploadDialog.vue'
import GalleryEditDialog from '../components/GalleryEditDialog.vue'
import ScheduleDialog from '../components/ScheduleDialog.vue'
import downloadIcon from '../assets/icons/download.svg?raw'
import heartIcon from '../assets/icons/heart.svg?raw'
import {
  deleteGalleryImage,
  deleteProject,
  addProjectToCollection,
  createCollection,
  deleteCollection,
  deleteVersion,
  getProject,
  getProjectMembers,
  getProjectVersions,
  getUserCollections,
  scheduleProject,
  scheduleVersion,
  type ProjectDetail,
  type ProjectMember,
  type ProjectVersion,
  type ScheduleInput,
  type Collection,
} from '../api/client'
import { renderMarkdown } from '../utils/markdown'
import { tagIconSvg } from '../data/tag-icons'
import { linkIcon } from '../utils/link-icons'
import { userPath } from '../utils/user-path'
import { useAuth } from '../composables/useAuth'
import { useFollows } from '../composables/useFollows'
import { useLauncherFolders } from '../composables/useLauncherFolders'
import { useInstalledContent } from '../composables/useInstalledContent'
import { isNativeLauncherFolders, writeFileNative } from '../plugins/launcher-folders'
import type { ContentFolder } from '../utils/launcher-folders'
import {
  addAddon,
  listServers,
  type AddonKind,
  type ArchonServer,
} from '../api/archon'

const route = useRoute()
const router = useRouter()
const { user } = useAuth()
const { writeError: followWriteError, load: loadFollows, isFollowing, toggle: toggleFollow } = useFollows()
const { instances } = useLauncherFolders()
const { recordInstall } = useInstalledContent()

const project = ref<ProjectDetail | null>(null)
const versions = ref<ProjectVersion[]>([])
const members = ref<ProjectMember[]>([])
const tab = ref('about')
const loading = ref(false)
const error = ref('')
const downloadOpen = ref(false)
const selectedGameVersion = ref('')
const selectedLoader = ref('')
const selectedInstanceId = ref('')
const instanceDownloading = ref(false)
const instanceDownloadError = ref('')
const instanceDownloadDone = ref(false)
const hostingServers = ref<ArchonServer[]>([])
const hostingLoading = ref(false)
const hostingInstalling = ref('')
const hostingError = ref('')
const hostingDone = ref('')
const collections = ref<Collection[]>([])
const collectionsLoading = ref(false)
const collectionOpen = ref(false)
const collectionError = ref('')
const collectionSavingId = ref('')
const collectionSavedIds = ref<string[]>([])
const showCreateCollection = ref(false)
const newCollectionName = ref('')
const newCollectionDescription = ref('')
const creatingCollection = ref(false)
const pendingCollectionDelete = ref<Collection | null>(null)
const deletingCollection = ref(false)
const copiedId = ref(false)
const expandedChangelogs = ref<Record<string, boolean>>({})
const galleryOpen = ref(false)
const galleryIndex = ref(0)
const editOpen = ref(false)
const uploadOpen = ref(false)
const galleryUploadOpen = ref(false)
const editingVersion = ref<ProjectVersion | null>(null)
const projectScheduleOpen = ref(false)
const schedulingVersion = ref<ProjectVersion | null>(null)
const scheduling = ref(false)
const scheduleError = ref('')
const pendingDelete = ref<{
  kind: 'gallery' | 'version' | 'project'
  id: string
  label: string
} | null>(null)
const editingGalleryImage = ref<{
  image: ProjectDetail['gallery'][number]
  index: number
} | null>(null)
const deleting = ref(false)
const deleteError = ref('')
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

watch([downloadOpen, collectionOpen], ([download, collection]) => {
  if (download || collection) {
    document.body.style.overflow = 'hidden'
  } else if (!document.querySelector('.overlay')) {
    document.body.style.overflow = ''
  }
})

onUnmounted(() => {
  window.removeEventListener('resize', measureIndicator)
  if (downloadOpen.value || galleryOpen.value || collectionOpen.value) {
    document.body.style.overflow = ''
  }
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

const hostingKind = computed<AddonKind | null>(() => {
  const type = project.value?.project_type ?? ''
  const map: Record<string, AddonKind> = {
    mod: 'mod',
    plugin: 'plugin',
    datapack: 'datapack',
    'data-pack': 'datapack',
    shader: 'shader',
    resourcepack: 'resourcepack',
    'resource-pack': 'resourcepack',
  }
  return map[type] ?? null
})

function contentFolderForProject(type: string): ContentFolder | null {
  if (type === 'mod') return 'mods'
  if (type === 'resource-pack') return 'resourcepacks'
  if (type === 'shader') return 'shaders'
  if (type === 'data-pack') return 'datapacks'
  return null
}

const contentFolder = computed(() =>
  project.value ? contentFolderForProject(project.value.project_type) : null,
)

const selectedInstance = computed(
  () => instances.value.find((item) => item.id === selectedInstanceId.value) ?? null,
)

const targetFolderName = computed(() => {
  const instance = selectedInstance.value
  const folder = contentFolder.value
  if (!instance || !folder) return ''
  return instance.folders[folder] || folder
})

function folderLabel(folder: ContentFolder) {
  if (folder === 'resourcepacks') return 'Resource packs'
  if (folder === 'shaders') return 'Shaders'
  if (folder === 'datapacks') return 'Data packs'
  return 'Mods'
}

const following = computed(() =>
  project.value ? isFollowing(project.value.id) : false,
)

const canEdit = computed(() => {
  if (!user.value) return false
  const editableRoles = ['Owner', 'Admin', 'Moderator']
  return members.value.some(
    (member) =>
      member.user.id === user.value?.id &&
      member.accepted &&
      editableRoles.includes(member.role),
  )
})

function openEdit() {
  editOpen.value = true
}

function openUpload() {
  uploadOpen.value = true
}

function openGalleryUpload() {
  galleryUploadOpen.value = true
}

function editVersion(version: ProjectVersion) {
  editingVersion.value = version
}

function openProjectSchedule() {
  scheduleError.value = ''
  projectScheduleOpen.value = true
}

function openVersionSchedule(version: ProjectVersion) {
  scheduleError.value = ''
  schedulingVersion.value = version
}

async function onProjectScheduled(input: ScheduleInput) {
  if (!project.value) return
  scheduling.value = true
  scheduleError.value = ''
  try {
    await scheduleProject(project.value.id, input)
    projectScheduleOpen.value = false
    await load()
  } catch (cause) {
    scheduleError.value = cause instanceof Error ? cause.message : 'Could not schedule this release.'
  } finally {
    scheduling.value = false
  }
}

async function onVersionScheduled(input: ScheduleInput) {
  const target = schedulingVersion.value
  if (!target) return
  scheduling.value = true
  scheduleError.value = ''
  try {
    await scheduleVersion(target.id, input)
    schedulingVersion.value = null
    await load()
  } catch (cause) {
    scheduleError.value = cause instanceof Error ? cause.message : 'Could not schedule this version.'
  } finally {
    scheduling.value = false
  }
}

function requestGalleryDelete(image: ProjectDetail['gallery'][number]) {
  pendingDelete.value = {
    kind: 'gallery',
    id: image.url,
    label: image.title || 'this image',
  }
}

function editGalleryImage(image: ProjectDetail['gallery'][number], index: number) {
  editingGalleryImage.value = { image, index }
}

function requestProjectDelete() {
  if (!project.value) return
  pendingDelete.value = {
    kind: 'project',
    id: project.value.id,
    label: project.value.title,
  }
}

function requestVersionDelete(version: ProjectVersion) {
  pendingDelete.value = {
    kind: 'version',
    id: version.id,
    label: version.version_number,
  }
}

function closeDelete() {
  if (!deleting.value) pendingDelete.value = null
}

async function confirmDelete() {
  const target = pendingDelete.value
  if (!target || !project.value) return
  deleting.value = true
  deleteError.value = ''
  try {
    if (target.kind === 'gallery') {
      await deleteGalleryImage(project.value.id, target.id)
    } else if (target.kind === 'project') {
      await deleteProject(target.id)
      pendingDelete.value = null
      router.push('/dashboard')
      return
    } else {
      await deleteVersion(target.id)
    }
    pendingDelete.value = null
    await load()
  } catch (cause) {
    deleteError.value = cause instanceof Error ? cause.message : 'Could not delete this item.'
  } finally {
    deleting.value = false
  }
}

async function onProjectSaved() {
  editOpen.value = false
  await load()
}

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
  if (!selectedInstanceId.value && instances.value.length) {
    selectedInstanceId.value = instances.value[0].id
  }
  instanceDownloadError.value = ''
  instanceDownloadDone.value = false
  downloadOpen.value = true
  void loadHostingServers()
}

async function loadHostingServers() {
  hostingServers.value = []
  hostingError.value = ''
  hostingDone.value = ''
  if (!user.value || !hostingKind.value) return

  hostingLoading.value = true
  try {
    hostingServers.value = await listServers()
  } catch {
    hostingServers.value = []
  } finally {
    hostingLoading.value = false
  }
}

function targetWorld(server: ArchonServer) {
  return server.worlds.find((world) => world.is_active) ?? server.worlds[0] ?? null
}

async function installToServer(server: ArchonServer) {
  const version = matchedVersion.value
  const kind = hostingKind.value
  const world = targetWorld(server)
  if (!project.value || !version || !kind || !world) {
    hostingError.value = 'No matching version or world to install into.'
    return
  }

  hostingInstalling.value = server.id
  hostingError.value = ''
  hostingDone.value = ''
  try {
    await addAddon(server.id, world.id, {
      project_id: project.value.id,
      version_id: version.id,
      kind,
    })
    hostingDone.value = `Added to ${server.name} (${world.name}).`
  } catch (cause) {
    hostingError.value = cause instanceof Error ? cause.message : 'Could not install to that server.'
  } finally {
    hostingInstalling.value = ''
  }
}

async function downloadToInstance() {
  const file = matchedFile.value
  const instance = selectedInstance.value
  const folder = contentFolder.value
  if (!file || !instance || !folder) return

  const directUri = instance.folderUris[folder]
  const uri = directUri || instance.uri
  if (!uri) {
    instanceDownloadError.value = 'That folder is not connected yet. Set it up in Launcher folders.'
    return
  }

  instanceDownloading.value = true
  instanceDownloadError.value = ''
  instanceDownloadDone.value = false

  try {
    await writeFileNative({
      uri,
      folder: directUri ? '' : instance.folders[folder] || folder,
      filename: file.filename,
      url: file.url,
    })

    if (project.value && matchedVersion.value) {
      recordInstall({
        instanceId: instance.id,
        folder,
        filename: file.filename,
        projectId: project.value.id,
        projectSlug: project.value.slug,
        projectTitle: project.value.title,
        projectType: project.value.project_type,
        iconUrl: project.value.icon_url,
        versionId: matchedVersion.value.id,
        versionName: matchedVersion.value.version_number,
      })
    }

    instanceDownloadDone.value = true
  } catch (error) {
    instanceDownloadError.value = error instanceof Error ? error.message : 'Download failed.'
  } finally {
    instanceDownloading.value = false
  }
}

async function openCollections() {
  collectionOpen.value = true
  collectionError.value = ''
  collectionSavedIds.value = []
  showCreateCollection.value = false
  newCollectionName.value = ''
  newCollectionDescription.value = ''
  pendingCollectionDelete.value = null
  if (!user.value) {
    collectionOpen.value = false
    router.push('/login')
    return
  }

  collectionsLoading.value = true
  try {
    collections.value = await getUserCollections(user.value.id)
  } catch (error) {
    collections.value = []
    collectionError.value =
      error instanceof Error ? error.message : 'Could not load collections.'
  } finally {
    collectionsLoading.value = false
  }
}

async function addToCollection(collection: Collection) {
  if (!project.value) return

  collectionSavingId.value = collection.id
  collectionError.value = ''
  try {
    await addProjectToCollection(collection.id, project.value.id)
    collectionSavedIds.value = [...collectionSavedIds.value, collection.id]
    collection.projects = [...collection.projects, project.value.id]
  } catch (error) {
    collectionError.value = error instanceof Error ? error.message : 'Could not save to collection.'
  } finally {
    collectionSavingId.value = ''
  }
}

async function createNewCollection() {
  const name = newCollectionName.value.trim()
  const description = newCollectionDescription.value.trim()
  if (name.length < 3 || name.length > 64) {
    collectionError.value = 'Name must be between 3 and 64 characters.'
    return
  }
  if (description && (description.length < 3 || description.length > 255)) {
    collectionError.value = 'Description must be between 3 and 255 characters.'
    return
  }

  creatingCollection.value = true
  collectionError.value = ''
  try {
    const collection = await createCollection(name, description)
    collections.value = [collection, ...collections.value]
    newCollectionName.value = ''
    newCollectionDescription.value = ''
    showCreateCollection.value = false
  } catch (error) {
    collectionError.value = error instanceof Error ? error.message : 'Could not create collection.'
  } finally {
    creatingCollection.value = false
  }
}

async function removeCollection() {
  const collection = pendingCollectionDelete.value
  if (!collection) return

  deletingCollection.value = true
  collectionError.value = ''
  try {
    await deleteCollection(collection.id)
    collections.value = collections.value.filter((item) => item.id !== collection.id)
    pendingCollectionDelete.value = null
  } catch (error) {
    collectionError.value = error instanceof Error ? error.message : 'Could not delete collection.'
  } finally {
    deletingCollection.value = false
  }
}

function isCollectionSaved(collection: Collection) {
  return (
    collectionSavedIds.value.includes(collection.id) ||
    (!!project.value && collection.projects.includes(project.value.id))
  )
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
  collectionOpen.value = false
  editOpen.value = false
  uploadOpen.value = false
  galleryUploadOpen.value = false
  editingVersion.value = null
  editingGalleryImage.value = null
  pendingDelete.value = null
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
          <template v-if="canEdit">
            <button type="button" class="project-page__edit" @click="openEdit">
              <Settings :size="18" :stroke-width="2.5" />
              Edit project
            </button>
            <button
              type="button"
              class="project-page__follow"
              aria-label="Schedule project release"
              @click="openProjectSchedule"
            >
              <Clock :size="18" :stroke-width="2.5" />
            </button>
            <button
              type="button"
              class="project-page__follow"
              aria-label="Save to collection"
              @click="openCollections"
            >
              <Bookmark :size="18" :stroke-width="2.5" />
            </button>
            <button
              type="button"
              class="project-page__follow"
              aria-label="Download"
              @click="openDownload"
            >
              <Download :size="18" :stroke-width="2.5" />
            </button>
            <button
              type="button"
              class="project-page__follow"
              :class="{ 'is-following': following }"
              :aria-label="following ? 'Unfollow project' : 'Follow project'"
              @click="followAction"
            >
              <Heart :size="18" :stroke-width="2.5" :fill="following ? 'currentColor' : 'none'" />
            </button>
          </template>
          <template v-else>
            <button type="button" class="project-page__download" @click="openDownload">
              <span class="project-page__action-icon" aria-hidden="true" v-html="downloadIcon"></span>
              Download
            </button>
            <button
              type="button"
              class="project-page__follow"
              aria-label="Save to collection"
              @click="openCollections"
            >
              <Bookmark :size="18" :stroke-width="2.5" />
            </button>
            <button
              type="button"
              class="project-page__follow"
              :class="{ 'is-following': following }"
              :aria-label="!user ? 'Sign in to follow' : following ? 'Unfollow project' : 'Follow project'"
              @click="followAction"
            >
              <Heart :size="18" :stroke-width="2.5" :fill="following ? 'currentColor' : 'none'" />
            </button>
          </template>
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
        <button v-if="canEdit" type="button" class="project-page__upload" @click="openUpload">
          Upload version
        </button>
        <Card v-for="version in versions" :key="version.id" class="version-card">
          <template #header>
            <div class="version-card__heading">
              <div class="version-card__title-wrap">
                <h2 class="version-card__title">{{ version.name }}</h2>
                <span class="version-card__number">{{ version.version_number }}</span>
              </div>
              <div v-if="canEdit" class="version-card__manage">
                <button
                  v-if="canEdit"
                  type="button"
                  aria-label="Schedule version release"
                  @click="openVersionSchedule(version)"
                >
                  <Clock :size="18" :stroke-width="2.2" />
                </button>
                <button v-if="canEdit" type="button" aria-label="Edit version" @click="editVersion(version)">
                  <Pencil :size="18" :stroke-width="2.2" />
                </button>
                <button
                  v-if="canEdit"
                  type="button"
                  class="is-danger"
                  aria-label="Delete version"
                  @click="requestVersionDelete(version)"
                >
                  <Trash :size="18" :stroke-width="2.2" />
                </button>
              </div>
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
          <div class="version-card__footer">
            <a
              v-if="version.files[0]"
              class="version-card__download"
              :href="version.files[0].url"
              target="_blank"
              rel="noopener"
            >
              <Download :size="18" :stroke-width="2.2" />
              <span class="version-card__filename">{{ version.files[0].filename }}</span>
            </a>
            <a
              class="version-card__link"
              :href="`https://modrinth.com/project/${project.slug}/version/${version.id}`"
              target="_blank"
              rel="noopener"
              aria-label="Open on Modrinth"
            >
              <ExternalLink :size="18" :stroke-width="2.2" />
            </a>
          </div>
        </Card>
        <p v-if="versions.length === 0" class="project-page__message">No versions found.</p>
      </div>

      <div v-else-if="tab === 'gallery'">
        <button v-if="canEdit" type="button" class="project-page__upload" @click="openGalleryUpload">
          Add image
        </button>
        <p v-if="project.gallery.length === 0" class="project-page__message">No gallery images.</p>
        <Card v-for="(image, index) in project.gallery" :key="index" class="gallery-card">
          <div class="gallery-card__media">
            <button
              type="button"
              class="gallery-card__open"
              :aria-label="`View ${image.title ?? project.title}`"
              @click="openGallery(index)"
            >
              <img class="gallery-card__image" :src="image.url" :alt="image.title ?? project.title" />
            </button>
            <div v-if="canEdit" class="gallery-card__tools">
              <button
                type="button"
                class="gallery-card__edit"
                aria-label="Edit image"
                @click="editGalleryImage(image, index)"
              >
                <Pencil :size="20" :stroke-width="2.2" />
              </button>
              <button
                type="button"
                class="gallery-card__delete"
                aria-label="Delete image"
                @click="requestGalleryDelete(image)"
              >
                <Trash :size="20" :stroke-width="2.2" />
              </button>
            </div>
            <div v-if="image.title || image.description" class="gallery-card__caption">
              <h2 v-if="image.title" class="gallery-card__title">{{ image.title }}</h2>
              <p v-if="image.description" class="gallery-card__description">
                {{ image.description }}
              </p>
            </div>
          </div>
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
        <button
          v-if="canEdit"
          type="button"
          class="project-page__delete"
          @click="requestProjectDelete"
        >
          <Trash :size="18" :stroke-width="2.2" />
          Delete project
        </button>
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
                <X :size="24" :stroke-width="2.5" />
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

              <div v-if="isNativeLauncherFolders() && instances.length" class="download-dialog__instance">
                <p class="download-dialog__label">Download to instance</p>
                <label class="edit-field">
                  <span>Instance</span>
                  <select v-model="selectedInstanceId">
                    <option v-for="instance in instances" :key="instance.id" :value="instance.id">
                      {{ instance.name }}
                    </option>
                  </select>
                </label>
                <p v-if="contentFolder" class="download-dialog__hint">
                  Saves to {{ folderLabel(contentFolder) }} in {{ targetFolderName }}
                </p>
                <p v-else class="download-dialog__empty">
                  No matching folder for this project type.
                </p>
                <button
                  v-if="matchedFile && contentFolder"
                  type="button"
                  class="download-dialog__button"
                  :disabled="instanceDownloading"
                  @click="downloadToInstance"
                >
                  <span class="project-page__action-icon" aria-hidden="true" v-html="downloadIcon"></span>
                  {{
                    instanceDownloading
                      ? 'Downloading...'
                      : `Download to ${selectedInstance?.name ?? 'instance'}`
                  }}
                </button>
                <p v-if="instanceDownloadError" class="download-dialog__error">
                  {{ instanceDownloadError }}
                </p>
                <p v-if="instanceDownloadDone" class="download-dialog__done">
                  Saved to {{ targetFolderName }}.
                </p>
              </div>

              <div v-if="hostingKind && user" class="download-dialog__instance">
                <p class="download-dialog__label">Download to Modrinth Hosting</p>
                <p v-if="hostingLoading" class="download-dialog__hint">Loading servers...</p>
                <p v-else-if="hostingServers.length === 0" class="download-dialog__empty">
                  No hosting servers on this account.
                </p>
                <div v-for="server in hostingServers" :key="server.id" class="download-dialog__hosting">
                  <button
                    type="button"
                    class="download-dialog__button"
                    :disabled="!!hostingInstalling || !matchedVersion || !targetWorld(server)"
                    :title="targetWorld(server) ? `Installs into ${targetWorld(server)?.name}` : 'No worlds on this server'"
                    @click="installToServer(server)"
                  >
                    <span class="project-page__action-icon" aria-hidden="true" v-html="downloadIcon"></span>
                    {{
                      hostingInstalling === server.id
                        ? 'Installing...'
                        : `Download to ${server.name}`
                    }}
                  </button>
                  <span v-if="targetWorld(server)" class="download-dialog__hint">
                    World: {{ targetWorld(server)?.name }}
                  </span>
                </div>
                <p v-if="hostingError" class="download-dialog__error">{{ hostingError }}</p>
                <p v-if="hostingDone" class="download-dialog__done">{{ hostingDone }}</p>
              </div>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>

    <Teleport to="body">
      <Transition name="pop">
        <div v-if="collectionOpen" class="download-overlay edit-overlay" @click.self="collectionOpen = false">
          <div class="download-dialog edit-dialog" role="dialog" aria-modal="true" aria-label="Save to collection">
            <header class="download-dialog__header">
              <h2>Save to collection</h2>
              <button type="button" aria-label="Close collections" @click="collectionOpen = false">
                <X :size="24" :stroke-width="2.5" />
              </button>
            </header>

            <div class="edit-dialog__body">
              <p class="schedule-dialog__note">Choose a collection on your Modrinth profile.</p>
              <p v-if="collectionError" class="edit-dialog__error">{{ collectionError }}</p>

              <button
                v-if="!showCreateCollection"
                type="button"
                class="collection-new"
                @click="showCreateCollection = true"
              >
                <Plus :size="16" :stroke-width="2.5" /> New collection
              </button>
              <div v-else class="collection-create">
                <label class="edit-field">
                  <span>Name</span>
                  <input v-model="newCollectionName" placeholder="e.g. Performance mods" />
                </label>
                <label class="edit-field">
                  <span>Description</span>
                  <input v-model="newCollectionDescription" placeholder="Optional" />
                </label>
                <div class="edit-dialog__actions">
                  <button
                    type="button"
                    class="edit-dialog__cancel"
                    :disabled="creatingCollection"
                    @click="showCreateCollection = false"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    class="edit-dialog__save"
                    :disabled="creatingCollection"
                    @click="createNewCollection"
                  >
                    {{ creatingCollection ? 'Creating...' : 'Create' }}
                  </button>
                </div>
              </div>

              <p v-if="collectionsLoading" class="schedule-dialog__note">Loading collections...</p>
              <p v-else-if="collections.length === 0 && !collectionError" class="schedule-dialog__note">
                No collections yet. Create one above.
              </p>
              <div v-for="collection in collections" :key="collection.id" class="collection-row">
                <div class="collection-row__main">
                  <span class="collection-row__name">{{ collection.name }}</span>
                  <span class="collection-row__meta">{{ collection.projects.length }} projects</span>
                </div>
                <div class="collection-row__actions">
                  <button
                    type="button"
                    class="collection-row__button"
                    :disabled="collectionSavingId === collection.id || isCollectionSaved(collection)"
                    @click="addToCollection(collection)"
                  >
                    {{ collectionSavingId === collection.id ? 'Saving...' : isCollectionSaved(collection) ? 'Saved' : 'Add' }}
                  </button>
                  <button
                    type="button"
                    class="collection-row__delete"
                    :aria-label="`Delete ${collection.name}`"
                    @click="pendingCollectionDelete = collection"
                  >
                    <Trash :size="16" :stroke-width="2.2" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>

    <Teleport to="body">
      <div
        v-if="pendingCollectionDelete"
        class="overlay confirm-overlay"
        @click.self="pendingCollectionDelete = null"
      >
        <div class="confirm-card" role="dialog" aria-modal="true" aria-label="Confirm delete collection">
          <h2 class="confirm-card__title">Delete {{ pendingCollectionDelete.name }}?</h2>
          <p class="confirm-card__text">This can't be undone.</p>
          <div class="confirm-card__actions">
            <button
              type="button"
              class="confirm-card__cancel"
              :disabled="deletingCollection"
              @click="pendingCollectionDelete = null"
            >
              Cancel
            </button>
            <button
              type="button"
              class="confirm-card__confirm"
              :disabled="deletingCollection"
              @click="removeCollection"
            >
              {{ deletingCollection ? 'Deleting...' : 'Delete' }}
            </button>
          </div>
        </div>
      </div>
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

    <ProjectEditDialog
      v-if="editOpen && project"
      :project="project"
      @close="editOpen = false"
      @saved="onProjectSaved"
    />

    <VersionUploadDialog
      v-if="uploadOpen && project"
      :project="project"
      @close="uploadOpen = false"
      @uploaded="onProjectSaved"
    />

    <GalleryUploadDialog
      v-if="galleryUploadOpen && project"
      :project="project"
      @close="galleryUploadOpen = false"
      @uploaded="onProjectSaved"
    />

    <GalleryEditDialog
      v-if="editingGalleryImage && project"
      :project="project"
      :image="editingGalleryImage.image"
      :index="editingGalleryImage.index"
      @close="editingGalleryImage = null"
      @saved="onProjectSaved"
    />

    <VersionEditDialog
      v-if="editingVersion"
      :version="editingVersion"
      @close="editingVersion = null"
      @saved="onProjectSaved"
    />

    <ScheduleDialog
      v-if="projectScheduleOpen && project"
      title="Schedule project release"
      :saving="scheduling"
      :error="scheduleError"
      @close="projectScheduleOpen = false"
      @scheduled="onProjectScheduled"
    />

    <ScheduleDialog
      v-if="schedulingVersion"
      :title="'Schedule ' + schedulingVersion.version_number"
      :saving="scheduling"
      :error="scheduleError"
      @close="schedulingVersion = null"
      @scheduled="onVersionScheduled"
    />

    <Teleport to="body">
      <div
        v-if="pendingDelete"
        class="overlay confirm-overlay"
        @click.self="closeDelete"
      >
        <div class="confirm-card" role="dialog" aria-modal="true" aria-label="Confirm delete">
          <h2 class="confirm-card__title">Delete {{ pendingDelete.label }}?</h2>
          <p class="confirm-card__text">This can't be undone.</p>
          <p v-if="deleteError" class="confirm-card__text">{{ deleteError }}</p>
          <div class="confirm-card__actions">
            <button type="button" class="confirm-card__cancel" :disabled="deleting" @click="closeDelete">
              Cancel
            </button>
            <button type="button" class="confirm-card__confirm" :disabled="deleting" @click="confirmDelete">
              {{ deleting ? 'Deleting...' : 'Delete' }}
            </button>
          </div>
        </div>
      </div>
    </Teleport>
  </section>
</template>
