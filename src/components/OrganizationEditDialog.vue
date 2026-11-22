<script setup lang="ts">
import { reactive, ref } from 'vue'
import { X } from '@lucide/vue'
import {
  changeOrganizationIcon,
  deleteOrganizationIcon,
  modifyOrganization,
  type Organization,
} from '../api/client'

const props = defineProps<{ organization: Organization }>()
const emit = defineEmits<{ close: []; saved: [slug: string] }>()

const saving = ref(false)
const error = ref('')
const icon = ref<File | null>(null)
const form = reactive({
  name: props.organization.name,
  slug: props.organization.slug,
  description: props.organization.description,
  removeIcon: false,
})

function onIconChange(event: Event) {
  const input = event.target as HTMLInputElement
  icon.value = input.files?.[0] ?? null
}

async function save() {
  saving.value = true
  error.value = ''
  try {
    await modifyOrganization(props.organization.id, {
      name: form.name.trim(),
      slug: form.slug.trim(),
      description: form.description.trim(),
    })
    if (form.removeIcon) {
      await deleteOrganizationIcon(props.organization.id)
    } else if (icon.value) {
      await changeOrganizationIcon(props.organization.id, icon.value)
    }
    emit('saved', form.slug.trim())
  } catch (cause) {
    error.value = cause instanceof Error ? cause.message : 'Could not save this organization.'
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
          aria-label="Edit organization"
        >
          <header class="download-dialog__header">
            <h2>Edit organization</h2>
            <button type="button" aria-label="Close edit dialog" @click="close">
              <X :size="24" :stroke-width="2.5" />
            </button>
          </header>

          <div class="edit-dialog__body">
            <label class="edit-field">
              <span>Name</span>
              <input v-model="form.name" type="text" />
            </label>
            <label class="edit-field">
              <span>Slug</span>
              <input v-model="form.slug" type="text" />
            </label>
            <label class="edit-field">
              <span>Description</span>
              <textarea v-model="form.description" rows="3"></textarea>
            </label>
            <label class="edit-field">
              <span>New icon</span>
              <input type="file" accept="image/*" @change="onIconChange" />
            </label>
            <label class="edit-field edit-field--check">
              <span>Remove current icon</span>
              <input v-model="form.removeIcon" type="checkbox" />
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
