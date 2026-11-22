<script setup lang="ts">
import { reactive, ref, watch } from 'vue'
import { X } from '@lucide/vue'
import {
  createVersion,
  type ProjectDetail,
  type ProjectVersion,
} from '../api/client'

const props = defineProps<{ project: ProjectDetail }>()
const emit = defineEmits<{
  close: []
  uploaded: [version: ProjectVersion]
}>()

const saving = ref(false)
const error = ref('')
const files = ref<File[]>([])
const form = reactive({
  name: '',
  versionNumber: '',
  changelog: '',
  gameVersions: '',
  loaders: '',
  versionType: 'release',
  environment: 'client_and_server',
  featured: false,
  status: 'listed',
})

const versionTypes = ['release', 'beta', 'alpha']
const environments = [
  'client_and_server',
  'client_only',
  'server_only',
  'client_only_server_optional',
  'server_only_client_optional',
  'singleplayer_only',
  'dedicated_server_only',
]
const statusOptions = ['listed', 'draft', 'unlisted', 'archived']

watch(
  () => props.project,
  (project) => {
    form.gameVersions = project.game_versions.join(', ')
    form.loaders = project.loaders.join(', ')
  },
  { immediate: true },
)

function splitList(value: string) {
  return value
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean)
}

function onFilesChange(event: Event) {
  const input = event.target as HTMLInputElement
  files.value = Array.from(input.files ?? [])
}

async function upload() {
  if (files.value.length === 0) {
    error.value = 'Pick at least one version file.'
    return
  }
  saving.value = true
  error.value = ''
  try {
    const version = await createVersion({
      project_id: props.project.id,
      name: form.name.trim() || form.versionNumber.trim(),
      version_number: form.versionNumber.trim(),
      changelog: form.changelog.trim() || undefined,
      game_versions: splitList(form.gameVersions),
      loaders: splitList(form.loaders),
      version_type: form.versionType,
      featured: form.featured,
      status: form.status,
      environment: form.environment,
      files: files.value,
    })
    emit('uploaded', version)
  } catch (cause) {
    error.value = cause instanceof Error ? cause.message : 'Could not upload this version.'
  } finally {
    saving.value = false
  }
}

function close() {
  if (!saving.value) emit('close')
}
</script>

<template>
  <Teleport to="body">
    <Transition name="pop">
      <div class="download-overlay edit-overlay" @click.self="close">
        <div
          class="download-dialog edit-dialog"
          role="dialog"
          aria-modal="true"
          aria-label="Upload version"
        >
          <header class="download-dialog__header">
            <h2>Upload version</h2>
            <button type="button" aria-label="Close upload dialog" @click="close">
              <X :size="24" :stroke-width="2.5" />
            </button>
          </header>

          <div class="edit-dialog__body">
            <div class="edit-field__row">
              <label class="edit-field">
                <span>Name</span>
                <input v-model="form.name" type="text" />
              </label>
              <label class="edit-field">
                <span>Version number</span>
                <input v-model="form.versionNumber" type="text" required />
              </label>
            </div>
            <label class="edit-field">
              <span>Changelog (Markdown)</span>
              <textarea v-model="form.changelog" rows="4"></textarea>
            </label>
            <label class="edit-field">
              <span>Game versions</span>
              <input v-model="form.gameVersions" type="text" placeholder="1.20.1, 1.20.2" />
            </label>
            <label class="edit-field">
              <span>Loaders</span>
              <input v-model="form.loaders" type="text" placeholder="fabric, forge" />
            </label>
            <div class="edit-field__row">
              <label class="edit-field">
                <span>Release channel</span>
                <select v-model="form.versionType">
                  <option v-for="type in versionTypes" :key="type" :value="type">{{ type }}</option>
                </select>
              </label>
              <label class="edit-field">
                <span>Status</span>
                <select v-model="form.status">
                  <option v-for="status in statusOptions" :key="status" :value="status">
                    {{ status }}
                  </option>
                </select>
              </label>
            </div>
            <label class="edit-field">
              <span>Environment</span>
              <select v-model="form.environment">
                <option v-for="option in environments" :key="option" :value="option">
                  {{ option }}
                </option>
              </select>
            </label>
            <label class="edit-field edit-field--check">
              <span>Featured version</span>
              <input v-model="form.featured" type="checkbox" />
            </label>
            <label class="edit-field">
              <span>Version files</span>
              <input
                type="file"
                multiple
                accept=".jar,.zip,.mrpack,.litemod"
                @change="onFilesChange"
              />
            </label>

            <p v-if="error" class="edit-dialog__error">{{ error }}</p>

            <div class="edit-dialog__actions">
              <button type="button" class="edit-dialog__cancel" :disabled="saving" @click="close">
                Cancel
              </button>
              <button type="button" class="edit-dialog__save" :disabled="saving" @click="upload">
                {{ saving ? 'Uploading...' : 'Upload version' }}
              </button>
            </div>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>
