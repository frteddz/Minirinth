<script setup lang="ts">
import { reactive, ref } from 'vue'
import { X } from '@lucide/vue'
import { modifyGalleryImage, type GalleryImage, type ProjectDetail } from '../api/client'

const props = defineProps<{ project: ProjectDetail; image: GalleryImage; index: number }>()
const emit = defineEmits<{ close: []; saved: [] }>()

const saving = ref(false)
const error = ref('')
const form = reactive({
  title: props.image.title ?? '',
  description: props.image.description ?? '',
  featured: props.image.featured,
  ordering: props.image.ordering ?? props.index,
})

async function save() {
  saving.value = true
  error.value = ''
  try {
    await modifyGalleryImage(props.project.id, {
      url: props.image.url,
      title: form.title.trim(),
      description: form.description.trim(),
      featured: form.featured,
      ordering: Number(form.ordering),
    })
    emit('saved')
  } catch (cause) {
    error.value = cause instanceof Error ? cause.message : 'Could not save this image.'
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
          aria-label="Edit gallery image"
        >
          <header class="download-dialog__header">
            <h2>Edit gallery image</h2>
            <button type="button" aria-label="Close edit dialog" @click="close">
              <X :size="24" :stroke-width="2.5" />
            </button>
          </header>

          <div class="edit-dialog__body">
            <label class="edit-field">
              <span>Title</span>
              <input v-model="form.title" type="text" />
            </label>
            <label class="edit-field">
              <span>Description</span>
              <textarea v-model="form.description" rows="3"></textarea>
            </label>
            <label class="edit-field">
              <span>Ordering</span>
              <input v-model.number="form.ordering" type="number" />
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
