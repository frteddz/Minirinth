<script setup lang="ts">
import { reactive, ref } from 'vue'
import { X } from '@lucide/vue'
import { addGalleryImage, type ProjectDetail } from '../api/client'

const props = defineProps<{ project: ProjectDetail }>()
const emit = defineEmits<{ close: []; uploaded: [] }>()

const saving = ref(false)
const error = ref('')
const file = ref<File | null>(null)
const form = reactive({ title: '', description: '', featured: false })
const allowedExtensions = ['png', 'jpg', 'jpeg', 'bmp', 'gif', 'webp', 'svg', 'svgz', 'rgb']

function onFileChange(event: Event) {
  const input = event.target as HTMLInputElement
  file.value = input.files?.[0] ?? null
}

async function upload() {
  if (!file.value) {
    error.value = 'Pick an image first.'
    return
  }
  const ext = file.value.name.split('.').pop()?.toLowerCase() ?? ''
  if (!allowedExtensions.includes(ext)) {
    error.value = 'That image type is not supported.'
    return
  }
  saving.value = true
  error.value = ''
  try {
    await addGalleryImage(props.project.id, file.value, {
      ext,
      featured: form.featured,
      title: form.title.trim() || undefined,
      description: form.description.trim() || undefined,
    })
    emit('uploaded')
  } catch (cause) {
    error.value = cause instanceof Error ? cause.message : 'Could not upload this image.'
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
          aria-label="Add gallery image"
        >
          <header class="download-dialog__header">
            <h2>Add gallery image</h2>
            <button type="button" aria-label="Close upload dialog" @click="close">
              <X :size="24" :stroke-width="2.5" />
            </button>
          </header>

          <div class="edit-dialog__body">
            <label class="edit-field">
              <span>Image</span>
              <input type="file" accept="image/*" @change="onFileChange" />
            </label>
            <label class="edit-field">
              <span>Title</span>
              <input v-model="form.title" type="text" />
            </label>
            <label class="edit-field">
              <span>Description</span>
              <textarea v-model="form.description" rows="3"></textarea>
            </label>
            <label class="edit-field edit-field--check">
              <span>Featured image</span>
              <input v-model="form.featured" type="checkbox" />
            </label>

            <p v-if="error" class="edit-dialog__error">{{ error }}</p>

            <div class="edit-dialog__actions">
              <button type="button" class="edit-dialog__cancel" :disabled="saving" @click="close">
                Cancel
              </button>
              <button type="button" class="edit-dialog__save" :disabled="saving" @click="upload">
                {{ saving ? 'Uploading...' : 'Add image' }}
              </button>
            </div>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>
