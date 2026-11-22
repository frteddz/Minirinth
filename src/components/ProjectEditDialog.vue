<script setup lang="ts">
import { reactive, ref, watch } from 'vue'
import { X } from '@lucide/vue'
import {
  changeProjectIcon,
  deleteProjectIcon,
  modifyProject,
  type ProjectDetail,
  type ProjectEditPayload,
} from '../api/client'

const props = defineProps<{ project: ProjectDetail }>()
const emit = defineEmits<{ close: []; saved: [] }>()

const saving = ref(false)
const error = ref('')
const icon = ref<File | null>(null)
const form = reactive({
  title: '',
  summary: '',
  body: '',
  categories: '',
  additionalCategories: '',
  licenseId: '',
  licenseUrl: '',
  issuesUrl: '',
  sourceUrl: '',
  wikiUrl: '',
  discordUrl: '',
  clientSide: 'required',
  serverSide: 'optional',
  requestedStatus: '',
  donationUrls: '',
  removeIcon: false,
})

const statusOptions = ['approved', 'archived', 'unlisted', 'private', 'draft']

watch(
  () => props.project,
  (project) => {
    form.title = project.title
    form.summary = project.description
    form.body = project.body
    form.categories = project.categories.join(', ')
    form.additionalCategories = project.additional_categories.join(', ')
    form.licenseId = project.license?.id ?? ''
    form.licenseUrl = project.license?.url ?? ''
    form.issuesUrl = project.issues_url ?? ''
    form.sourceUrl = project.source_url ?? ''
    form.wikiUrl = project.wiki_url ?? ''
    form.discordUrl = project.discord_url ?? ''
    form.clientSide = project.client_side || 'required'
    form.serverSide = project.server_side || 'optional'
    form.requestedStatus = statusOptions.includes(project.status) ? project.status : ''
    form.donationUrls = project.donation_urls
      .map((item) => `${item.platform}|${item.url}`)
      .join('\n')
  },
  { immediate: true },
)

function splitList(value: string) {
  return value
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean)
}

function parseDonations(value: string) {
  return value
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const [platform, ...rest] = line.split('|')
      return {
        id: platform.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-'),
        platform: platform.trim(),
        url: rest.join('|').trim(),
      }
    })
    .filter((item) => item.platform && item.url)
}

function onIconChange(event: Event) {
  const input = event.target as HTMLInputElement
  icon.value = input.files?.[0] ?? null
}

async function save() {
  saving.value = true
  error.value = ''
  const payload: ProjectEditPayload = {
    title: form.title.trim(),
    description: form.summary.trim(),
    body: form.body,
    categories: splitList(form.categories),
    additional_categories: splitList(form.additionalCategories),
    client_side: form.clientSide,
    server_side: form.serverSide,
    issues_url: form.issuesUrl.trim() || null,
    source_url: form.sourceUrl.trim() || null,
    wiki_url: form.wikiUrl.trim() || null,
    discord_url: form.discordUrl.trim() || null,
    license_id: form.licenseId.trim() || undefined,
    license_url: form.licenseUrl.trim() || null,
    donation_urls: parseDonations(form.donationUrls),
  }
  if (form.requestedStatus) payload.requested_status = form.requestedStatus

  try {
    await modifyProject(props.project.id, payload)
    if (form.removeIcon) {
      await deleteProjectIcon(props.project.id)
    } else if (icon.value) {
      await changeProjectIcon(props.project.id, icon.value)
    }
    emit('saved')
  } catch (cause) {
    error.value = cause instanceof Error ? cause.message : 'Could not save this project.'
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
        <div class="download-dialog edit-dialog" role="dialog" aria-modal="true" aria-label="Edit project">
          <header class="download-dialog__header">
            <h2>Edit {{ props.project.title }}</h2>
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
              <span>Summary</span>
              <input v-model="form.summary" type="text" />
            </label>
            <label class="edit-field">
              <span>Description (Markdown)</span>
              <textarea v-model="form.body" rows="7"></textarea>
            </label>
            <label class="edit-field">
              <span>Featured tags</span>
              <input v-model="form.categories" type="text" placeholder="fabric, technology" />
            </label>
            <label class="edit-field">
              <span>Additional tags</span>
              <input v-model="form.additionalCategories" type="text" placeholder="adventure, client" />
            </label>
            <div class="edit-field__row">
              <label class="edit-field">
                <span>License ID</span>
                <input v-model="form.licenseId" type="text" placeholder="MIT" />
              </label>
              <label class="edit-field">
                <span>License URL</span>
                <input v-model="form.licenseUrl" type="text" />
              </label>
            </div>
            <label class="edit-field">
              <span>Issues URL</span>
              <input v-model="form.issuesUrl" type="text" />
            </label>
            <label class="edit-field">
              <span>Source URL</span>
              <input v-model="form.sourceUrl" type="text" />
            </label>
            <label class="edit-field">
              <span>Wiki URL</span>
              <input v-model="form.wikiUrl" type="text" />
            </label>
            <label class="edit-field">
              <span>Discord invite</span>
              <input v-model="form.discordUrl" type="text" />
            </label>
            <div class="edit-field__row">
              <label class="edit-field">
                <span>Client side</span>
                <select v-model="form.clientSide">
                  <option value="required">Required</option>
                  <option value="optional">Optional</option>
                  <option value="unsupported">Unsupported</option>
                </select>
              </label>
              <label class="edit-field">
                <span>Server side</span>
                <select v-model="form.serverSide">
                  <option value="required">Required</option>
                  <option value="optional">Optional</option>
                  <option value="unsupported">Unsupported</option>
                </select>
              </label>
            </div>
            <label class="edit-field">
              <span>Requested status</span>
              <select v-model="form.requestedStatus">
                <option value="">Keep current</option>
                <option v-for="status in statusOptions" :key="status" :value="status">
                  {{ status }}
                </option>
              </select>
            </label>
            <label class="edit-field">
              <span>Donation links (one per line, platform|url)</span>
              <textarea v-model="form.donationUrls" rows="3"></textarea>
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
