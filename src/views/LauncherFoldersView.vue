<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { Layers, Plus, Trash } from '@lucide/vue'
import Card from '../ui/components/Card.vue'
import { useLauncherFolders, type LauncherInstance } from '../composables/useLauncherFolders'
import { CONTENT_FOLDERS, pickLauncherFolder, type ContentFolder } from '../utils/launcher-folders'

const { instances, addInstance, removeInstance } = useLauncherFolders()
const router = useRouter()

const notice = ref('')
const warnings = ref<Record<string, string>>({})
const detectingId = ref('')
const picking = ref<{ id: string; folder: ContentFolder } | null>(null)
const pendingRemoval = ref<LauncherInstance | null>(null)

function confirmRemoval() {
  if (!pendingRemoval.value) return
  removeInstance(pendingRemoval.value.id)
  pendingRemoval.value = null
}

function folderLabel(folder: ContentFolder) {
  if (folder === 'resourcepacks') return 'Resource packs'
  if (folder === 'shaders') return 'Shaders'
  if (folder === 'datapacks') return 'Data packs'
  return 'Mods'
}

function isAbort(error: unknown) {
  if (!(error instanceof Error)) return false
  return error.name === 'AbortError' || error.message === 'Cancelled'
}

function isPicking(id: string, folder: ContentFolder) {
  return picking.value?.id === id && picking.value.folder === folder
}

async function autoDetect(instance: LauncherInstance) {
  notice.value = ''
  detectingId.value = instance.id

  try {
    const picked = await pickLauncherFolder()
    instance.root = picked.name
    instance.uri = picked.uri

    const missing: ContentFolder[] = []
    for (const folder of CONTENT_FOLDERS) {
      const found = picked.children.find((child) => child.toLowerCase() === folder)
      if (found) instance.folders[folder] = found
      else missing.push(folder)
    }

    warnings.value = {
      ...warnings.value,
      [instance.id]: missing.length
        ? `Couldn't find: ${missing.map(folderLabel).join(', ')}. Set them below.`
        : '',
    }
  } catch (error) {
    if (isAbort(error)) return
    notice.value = error instanceof Error ? error.message : 'Could not read that folder.'
  } finally {
    detectingId.value = ''
  }
}

async function pickContentFolder(instance: LauncherInstance, folder: ContentFolder) {
  notice.value = ''
  picking.value = { id: instance.id, folder }

  try {
    const picked = await pickLauncherFolder()
    instance.folders[folder] = picked.name
    instance.folderUris[folder] = picked.uri
  } catch (error) {
    if (isAbort(error)) return
    notice.value = error instanceof Error ? error.message : 'Could not pick that folder.'
  } finally {
    picking.value = null
  }
}
</script>

<template>
  <section class="page launcher-folders">
    <Card>
      <template #header>
        <h1 class="page__title">Launcher folders</h1>
      </template>

      <div class="launcher-folders__body">
        <p class="launcher-folders__intro">
          Point Minirynth at your launcher's instance folders so downloads land in the right place.
        </p>

        <p v-if="notice" class="launcher-folders__error">{{ notice }}</p>

        <div v-if="instances.length === 0" class="launcher-folders__empty">
          No instances yet. Add one to get started.
        </div>

        <div v-for="instance in instances" :key="instance.id" class="launcher-instance">
          <div class="launcher-instance__top">
            <input
              v-model="instance.name"
              class="launcher-instance__name"
              aria-label="Instance name"
            />
            <button
              type="button"
              class="launcher-instance__open"
              @click="router.push(`/instances/${instance.id}`)"
            >
              <Layers :size="16" :stroke-width="2.2" />
              Manage content
            </button>
            <button
              type="button"
              class="launcher-instance__remove"
              :aria-label="`Remove ${instance.name}`"
              @click="pendingRemoval = instance"
            >
              <Trash :size="18" :stroke-width="2.2" />
            </button>
          </div>

          <div class="launcher-instance__root">
            <label class="edit-field">
              <span>Instance folder</span>
              <input v-model="instance.root" placeholder="e.g. Pojav instances/My instance" />
            </label>
            <button
              type="button"
              class="launcher-instance__detect"
              :disabled="detectingId === instance.id"
              @click="autoDetect(instance)"
            >
              {{ detectingId === instance.id ? 'Scanning...' : 'Auto-detect' }}
            </button>
          </div>

          <p v-if="warnings[instance.id]" class="launcher-instance__warning">
            {{ warnings[instance.id] }}
          </p>

          <div class="launcher-instance__folders">
            <div v-for="folder in CONTENT_FOLDERS" :key="folder" class="launcher-instance__folder">
              <label class="edit-field">
                <span>{{ folderLabel(folder) }}</span>
                <input v-model="instance.folders[folder]" :placeholder="folder" />
              </label>
              <button
                type="button"
                class="launcher-instance__pick"
                :disabled="!!picking && !isPicking(instance.id, folder)"
                :aria-label="`Pick ${folderLabel(folder)} folder`"
                @click="pickContentFolder(instance, folder)"
              >
                {{ isPicking(instance.id, folder) ? '...' : 'Pick' }}
              </button>
            </div>
          </div>
        </div>

        <button type="button" class="version-file-add" @click="addInstance">
          <Plus :size="16" :stroke-width="2.5" /> Add instance
        </button>

        <p class="launcher-folders__note">Folders are saved on this device.</p>
      </div>
    </Card>

    <Teleport to="body">
      <div v-if="pendingRemoval" class="overlay confirm-overlay" @click.self="pendingRemoval = null">
        <div class="confirm-card" role="dialog" aria-modal="true" aria-label="Confirm remove instance">
          <h2 class="confirm-card__title">Remove {{ pendingRemoval.name }}?</h2>
          <p class="confirm-card__text">The saved folder setup for this instance will be removed from Minirynth.</p>
          <div class="confirm-card__actions">
            <button type="button" class="confirm-card__cancel" @click="pendingRemoval = null">
              Cancel
            </button>
            <button type="button" class="confirm-card__confirm" @click="confirmRemoval">
              Remove
            </button>
          </div>
        </div>
      </div>
    </Teleport>
  </section>
</template>
