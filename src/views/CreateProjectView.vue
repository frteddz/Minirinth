<script setup lang="ts">
import { reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import Card from '../ui/components/Card.vue'
import { useAuth } from '../composables/useAuth'
import { clearApiCache, createProject } from '../api/client'
import { projectPath } from '../utils/project-path'

const router = useRouter()
const { user } = useAuth()

const saving = ref(false)
const error = ref('')
const icon = ref<File | null>(null)
const form = reactive({
  title: '',
  slug: '',
  summary: '',
  body: '',
  projectType: 'mod',
  requestedStatus: 'draft',
  licenseId: '',
  categories: '',
  additionalCategories: '',
})

const projectTypes = ['mod', 'modpack', 'resourcepack', 'shader']
const statusOptions = ['draft', 'private', 'unlisted', 'approved']

function splitList(value: string) {
  return value
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean)
}

function onIconChange(event: Event) {
  const input = event.target as HTMLInputElement
  icon.value = input.files?.[0] ?? null
}

async function save() {
  saving.value = true
  error.value = ''
  try {
    const created = await createProject({
      title: form.title.trim(),
      slug: form.slug.trim() || undefined,
      description: form.summary.trim(),
      body: form.body,
      project_type: form.projectType,
      categories: splitList(form.categories),
      additional_categories: splitList(form.additionalCategories),
      license_id: form.licenseId.trim() || undefined,
      client_side: 'required',
      server_side: 'required',
      requested_status: form.requestedStatus,
      is_draft: true,
      icon: icon.value,
    })
    clearApiCache()
    router.push(projectPath(created.project_type, created.slug ?? created.id))
  } catch (cause) {
    error.value = cause instanceof Error ? cause.message : 'Could not create this project.'
  } finally {
    saving.value = false
  }
}
</script>

<template>
  <section class="page create-project">
    <Card>
      <template #header>
        <h1 class="create-project__title">Create a project</h1>
      </template>

      <p v-if="!user" class="create-project__message">
        Sign in with Modrinth first, then come back here.
      </p>

      <form v-else class="create-project__form" @submit.prevent="save">
        <label class="edit-field">
          <span>Title</span>
          <input v-model="form.title" type="text" required />
        </label>
        <label class="edit-field">
          <span>Slug</span>
          <input v-model="form.slug" type="text" placeholder="my_project" />
        </label>
        <label class="edit-field">
          <span>Summary</span>
          <input v-model="form.summary" type="text" required />
        </label>
        <label class="edit-field">
          <span>Description (Markdown)</span>
          <textarea v-model="form.body" rows="7"></textarea>
        </label>
        <div class="edit-field__row">
          <label class="edit-field">
            <span>Project type</span>
            <select v-model="form.projectType">
              <option v-for="type in projectTypes" :key="type" :value="type">{{ type }}</option>
            </select>
          </label>
          <label class="edit-field">
            <span>Requested status</span>
            <select v-model="form.requestedStatus">
              <option v-for="status in statusOptions" :key="status" :value="status">
                {{ status }}
              </option>
            </select>
          </label>
        </div>
        <label class="edit-field">
          <span>Featured tags</span>
          <input v-model="form.categories" type="text" placeholder="fabric, technology" />
        </label>
        <label class="edit-field">
          <span>Additional tags</span>
          <input v-model="form.additionalCategories" type="text" placeholder="adventure, client" />
        </label>
        <label class="edit-field">
          <span>License ID</span>
          <input v-model="form.licenseId" type="text" placeholder="MIT" />
        </label>
        <label class="edit-field">
          <span>Icon</span>
          <input type="file" accept="image/*" @change="onIconChange" />
        </label>

        <p v-if="error" class="edit-dialog__error">{{ error }}</p>

        <div class="create-project__actions">
          <button type="button" class="edit-dialog__cancel" @click="router.back()">Cancel</button>
          <button type="submit" class="edit-dialog__save" :disabled="saving">
            {{ saving ? 'Creating...' : 'Create project' }}
          </button>
        </div>
      </form>
    </Card>
  </section>
</template>
