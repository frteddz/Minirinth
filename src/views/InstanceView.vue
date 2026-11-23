<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ArrowLeft, Trash } from '@lucide/vue'
import Card from '../ui/components/Card.vue'
import { useLauncherFolders, type LauncherInstance } from '../composables/useLauncherFolders'
import { useInstalledContent } from '../composables/useInstalledContent'
import {
  CONTENT_FOLDERS,
  deleteInstanceFile,
  listInstanceFiles,
  type ContentFolder,
  type InstanceFile,
} from '../utils/launcher-folders'
import { projectPath } from '../utils/project-path'

const route = useRoute()
const router = useRouter()
const { instances } = useLauncherFolders()
const { find, forget } = useInstalledContent()

const instance = computed(
  () => instances.value.find((item) => item.id === route.params.id) ?? null,
)
const activeFolder = ref<ContentFolder>('mods')
const files = ref<InstanceFile[]>([])
const loading = ref(false)
const error = ref('')
const pendingDelete = ref('')
const deleting = ref(false)
const deleteError = ref('')

function folderLabel(folder: ContentFolder) {
  if (folder === 'resourcepacks') return 'Resource packs'
  if (folder === 'shaders') return 'Shaders'
  if (folder === 'datapacks') return 'Data packs'
  return 'Mods'
}

function folderTarget(inst: LauncherInstance, folder: ContentFolder) {
  const directUri = inst.folderUris[folder]
  return {
    uri: directUri || inst.uri,
    folder: directUri ? '' : inst.folders[folder] || folder,
  }
}

const entries = computed(() => {
  const inst = instance.value
  if (!inst) return []
  return files.value.map((file) => ({
    file,
    record: find(inst.id, activeFolder.value, file.name),
  }))
})

function formatSize(value: number) {
  if (!Number.isFinite(value)) return ''
  if (value < 1024) return `${value} B`
  if (value < 1024 * 1024) return `${(value / 1024).toFixed(1)} KB`
  return `${(value / (1024 * 1024)).toFixed(1)} MB`
}

function formatDate(value: number) {
  if (!value) return ''
  return new Date(value).toLocaleDateString()
}

async function loadFiles() {
  const inst = instance.value
  if (!inst) return

  loading.value = true
  error.value = ''
  try {
    const target = folderTarget(inst, activeFolder.value)
    files.value = await listInstanceFiles(target.uri, target.folder)
  } catch (cause) {
    files.value = []
    error.value = cause instanceof Error ? cause.message : 'Could not load files.'
  } finally {
    loading.value = false
  }
}

async function confirmDelete() {
  const inst = instance.value
  const name = pendingDelete.value
  if (!inst || !name) return

  deleting.value = true
  deleteError.value = ''
  try {
    const target = folderTarget(inst, activeFolder.value)
    await deleteInstanceFile(target.uri, target.folder, name)
    forget(inst.id, activeFolder.value, name)
    pendingDelete.value = ''
    await loadFiles()
  } catch (cause) {
    deleteError.value = cause instanceof Error ? cause.message : 'Could not delete file.'
  } finally {
    deleting.value = false
  }
}

watch([instance, activeFolder], () => {
  files.value = []
  void loadFiles()
}, { immediate: true })
</script>

<template>
  <section class="page instance-page">
    <button type="button" class="project-page__back" aria-label="Go back" @click="router.back()">
      <ArrowLeft :size="24" :stroke-width="2.5" />
    </button>

    <Card>
      <template #header>
        <h1 class="page__title">{{ instance?.name ?? 'Instance' }}</h1>
      </template>

      <div class="instance-page__body">
        <p v-if="!instance" class="instance-page__empty">Instance not found.</p>

        <template v-else>
          <div class="instance-page__tabs">
            <button
              v-for="folder in CONTENT_FOLDERS"
              :key="folder"
              type="button"
              class="instance-page__tab"
              :class="{ 'is-active': activeFolder === folder }"
              :aria-pressed="activeFolder === folder"
              @click="activeFolder = folder"
            >
              {{ folderLabel(folder) }}
            </button>
          </div>

          <p v-if="error" class="instance-page__error">{{ error }}</p>
          <p v-else-if="loading" class="instance-page__empty">Loading files...</p>
          <p v-else-if="files.length === 0" class="instance-page__empty">No files in this folder.</p>

          <div v-for="entry in entries" :key="entry.file.name" class="instance-file">
            <img
              v-if="entry.record?.iconUrl"
              class="instance-file__icon"
              :src="entry.record.iconUrl"
              alt=""
            />
            <span v-else class="instance-file__icon instance-file__icon--fallback" aria-hidden="true">
              {{ entry.record ? entry.record.projectTitle.charAt(0) : '?' }}
            </span>

            <div class="instance-file__main">
              <span class="instance-file__name">{{ entry.record?.projectTitle ?? 'Unknown' }}</span>
              <span class="instance-file__filename">{{ entry.file.name }}</span>
              <span class="instance-file__meta">
                {{ formatSize(entry.file.size) }} · {{ formatDate(entry.file.modified) }}
                <template v-if="entry.record"> · {{ entry.record.versionName }}</template>
              </span>
              <RouterLink
                v-if="entry.record"
                class="instance-file__link"
                :to="projectPath(entry.record.projectType, entry.record.projectSlug)"
              >
                View project
              </RouterLink>
            </div>
            <button
              type="button"
              class="instance-file__delete"
              :aria-label="`Delete ${entry.file.name}`"
              @click="pendingDelete = entry.file.name"
            >
              <Trash :size="18" :stroke-width="2.2" />
            </button>
          </div>
        </template>
      </div>
    </Card>

    <Teleport to="body">
      <div v-if="pendingDelete" class="overlay confirm-overlay" @click.self="pendingDelete = ''">
        <div class="confirm-card" role="dialog" aria-modal="true" aria-label="Confirm delete">
          <h2 class="confirm-card__title">Delete {{ pendingDelete }}?</h2>
          <p class="confirm-card__text">This can't be undone.</p>
          <p v-if="deleteError" class="confirm-card__text">{{ deleteError }}</p>
          <div class="confirm-card__actions">
            <button type="button" class="confirm-card__cancel" :disabled="deleting" @click="pendingDelete = ''">
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
