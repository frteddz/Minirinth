<script setup lang="ts">
import { reactive, ref } from 'vue'
import { Trash, X } from '@lucide/vue'
import {
  addVersionFiles,
  deleteVersionFile,
  modifyVersion,
  type ProjectVersion,
} from '../api/client'

const props = defineProps<{ version: ProjectVersion }>()
const emit = defineEmits<{ close: []; saved: [] }>()

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
  dependencies: '',
})

const versionTypes = ['release', 'beta', 'alpha']

form.name = props.version.name
form.versionNumber = props.version.version_number
form.changelog = props.version.changelog ?? ''
form.gameVersions = props.version.game_versions.join(', ')
form.loaders = props.version.loaders.join(', ')
form.versionType = props.version.version_type

function splitList(value: string) {
  return value
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean)
}

function parseDependencies() {
  return form.dependencies
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const [type, projectId, versionId] = line.split('|').map((part) => part.trim())
      const dependency_type = ['required', 'optional', 'incompatible', 'embedded'].includes(type)
        ? type
        : 'required'
      return {
        dependency_type: dependency_type as 'required' | 'optional' | 'incompatible' | 'embedded',
        project_id: projectId || null,
        version_id: versionId || null,
      }
    })
}

function onFilesChange(event: Event) {
  const input = event.target as HTMLInputElement
  files.value = Array.from(input.files ?? [])
}

async function addFiles() {
  if (files.value.length === 0) return
  saving.value = true
  error.value = ''
  try {
    await addVersionFiles(props.version.id, files.value)
    files.value = []
    emit('saved')
  } catch (cause) {
    error.value = cause instanceof Error ? cause.message : 'Could not add those files.'
  } finally {
    saving.value = false
  }
}

async function removeFile(file: ProjectVersion['files'][number]) {
  const hash = file.hashes?.sha1
  if (!hash) return
  saving.value = true
  error.value = ''
  try {
    await deleteVersionFile(hash, props.version.id)
    emit('saved')
  } catch (cause) {
    error.value = cause instanceof Error ? cause.message : 'Could not remove that file.'
  } finally {
    saving.value = false
  }
}

async function save() {
  saving.value = true
  error.value = ''
  try {
    await modifyVersion(props.version.id, {
      name: form.name.trim(),
      version_number: form.versionNumber.trim(),
      changelog: form.changelog.trim() || null,
      game_versions: splitList(form.gameVersions),
      loaders: splitList(form.loaders),
      version_type: form.versionType,
      dependencies: parseDependencies(),
    })
    emit('saved')
  } catch (cause) {
    error.value = cause instanceof Error ? cause.message : 'Could not save this version.'
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
          aria-label="Edit version"
        >
          <header class="download-dialog__header">
            <h2>Edit {{ props.version.version_number }}</h2>
            <button type="button" aria-label="Close edit dialog" @click="close">
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
                <input v-model="form.versionNumber" type="text" />
              </label>
            </div>
            <label class="edit-field">
              <span>Changelog (Markdown)</span>
              <textarea v-model="form.changelog" rows="5"></textarea>
            </label>
            <label class="edit-field">
              <span>Game versions</span>
              <input v-model="form.gameVersions" type="text" />
            </label>
            <label class="edit-field">
              <span>Loaders</span>
              <input v-model="form.loaders" type="text" />
            </label>
            <label class="edit-field">
              <span>Release channel</span>
              <select v-model="form.versionType">
                <option v-for="type in versionTypes" :key="type" :value="type">{{ type }}</option>
              </select>
            </label>
            <label class="edit-field">
              <span>Dependencies (one per line, type|projectId|versionId)</span>
              <textarea v-model="form.dependencies" rows="3"></textarea>
            </label>
            <div class="edit-field">
              <span>Files</span>
              <div v-for="file in props.version.files" :key="file.filename" class="version-file-row">
                <span>{{ file.filename }}</span>
                <button
                  v-if="file.hashes?.sha1"
                  type="button"
                  :aria-label="`Remove ${file.filename}`"
                  @click="removeFile(file)"
                >
                  <Trash :size="18" :stroke-width="2.2" />
                </button>
              </div>
              <input type="file" multiple accept=".jar,.zip,.mrpack,.litemod" @change="onFilesChange" />
              <button type="button" class="version-file-add" :disabled="saving" @click="addFiles">
                Add files
              </button>
            </div>

            <p v-if="error" class="edit-dialog__error">{{ error }}</p>

            <div class="edit-dialog__actions">
              <button type="button" class="edit-dialog__cancel" :disabled="saving" @click="close">
                Cancel
              </button>
              <button type="button" class="edit-dialog__save" :disabled="saving" @click="save">
                {{ saving ? 'Saving...' : 'Save changes' }}
              </button>
            </div>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>
