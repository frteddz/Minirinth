<script setup lang="ts">
import { onMounted, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import { Pencil, Plus, Trash } from '@lucide/vue'
import Card from '../ui/components/Card.vue'
import { useAuth } from '../composables/useAuth'
import {
  createCollection,
  deleteCollection,
  getUserCollections,
  updateCollection,
  type Collection,
} from '../api/client'

const { user } = useAuth()
const router = useRouter()

const collections = ref<Collection[]>([])
const loading = ref(false)
const error = ref('')
const showCreate = ref(false)
const newName = ref('')
const newDescription = ref('')
const creating = ref(false)
const editingId = ref('')
const editName = ref('')
const editDescription = ref('')
const saving = ref(false)
const pendingDelete = ref<Collection | null>(null)
const deleting = ref(false)

async function load() {
  if (!user.value) return

  loading.value = true
  error.value = ''
  try {
    collections.value = await getUserCollections(user.value.id)
  } catch (cause) {
    collections.value = []
    error.value = cause instanceof Error ? cause.message : 'Could not load collections.'
  } finally {
    loading.value = false
  }
}

function validate(name: string, description: string) {
  if (name.trim().length < 3 || name.trim().length > 64) {
    return 'Name must be between 3 and 64 characters.'
  }
  if (description.trim() && (description.trim().length < 3 || description.trim().length > 255)) {
    return 'Description must be between 3 and 255 characters.'
  }
  return ''
}

async function createNew() {
  const problem = validate(newName.value, newDescription.value)
  if (problem) {
    error.value = problem
    return
  }

  creating.value = true
  error.value = ''
  try {
    const collection = await createCollection(newName.value.trim(), newDescription.value.trim())
    collections.value = [collection, ...collections.value]
    newName.value = ''
    newDescription.value = ''
    showCreate.value = false
  } catch (cause) {
    error.value = cause instanceof Error ? cause.message : 'Could not create collection.'
  } finally {
    creating.value = false
  }
}

function openCollection(collection: Collection) {
  if (editingId.value) return
  void router.push(`/collections/${collection.id}`)
}

function startEdit(collection: Collection) {
  editingId.value = collection.id
  editName.value = collection.name
  editDescription.value = collection.description ?? ''
  error.value = ''
}

async function saveEdit() {
  const problem = validate(editName.value, editDescription.value)
  if (problem) {
    error.value = problem
    return
  }

  saving.value = true
  error.value = ''
  try {
    await updateCollection(editingId.value, editName.value.trim(), editDescription.value.trim())
    collections.value = collections.value.map((item) =>
      item.id === editingId.value
        ? { ...item, name: editName.value.trim(), description: editDescription.value.trim() || null }
        : item,
    )
    editingId.value = ''
  } catch (cause) {
    error.value = cause instanceof Error ? cause.message : 'Could not save collection.'
  } finally {
    saving.value = false
  }
}

async function removeCollection() {
  const collection = pendingDelete.value
  if (!collection) return

  deleting.value = true
  error.value = ''
  try {
    await deleteCollection(collection.id)
    collections.value = collections.value.filter((item) => item.id !== collection.id)
    pendingDelete.value = null
  } catch (cause) {
    error.value = cause instanceof Error ? cause.message : 'Could not delete collection.'
  } finally {
    deleting.value = false
  }
}

watch(user, (value) => {
  if (value) void load()
})
onMounted(() => {
  if (user.value) void load()
})
</script>

<template>
  <section class="page collections-page">
    <Card>
      <template #header>
        <h1 class="page__title">Collections</h1>
      </template>

      <div class="collections-page__body">
        <p v-if="!user" class="collections-page__empty">
          Sign in to manage your Modrinth collections.
        </p>

        <template v-else>
          <button v-if="!showCreate" type="button" class="collection-new" @click="showCreate = true">
            <Plus :size="16" :stroke-width="2.5" /> New collection
          </button>
          <div v-else class="collection-create">
            <label class="edit-field">
              <span>Name</span>
              <input v-model="newName" placeholder="e.g. Performance mods" />
            </label>
            <label class="edit-field">
              <span>Description</span>
              <input v-model="newDescription" placeholder="Optional" />
            </label>
            <div class="edit-dialog__actions">
              <button type="button" class="edit-dialog__cancel" :disabled="creating" @click="showCreate = false">
                Cancel
              </button>
              <button type="button" class="edit-dialog__save" :disabled="creating" @click="createNew">
                {{ creating ? 'Creating...' : 'Create' }}
              </button>
            </div>
          </div>

          <p v-if="error" class="edit-dialog__error">{{ error }}</p>
          <p v-if="loading" class="collections-page__empty">Loading collections...</p>
          <p v-else-if="collections.length === 0" class="collections-page__empty">
            No collections yet. Create one above.
          </p>

          <div
            v-for="collection in collections"
            :key="collection.id"
            class="collection-row"
            role="button"
            tabindex="0"
            @click="openCollection(collection)"
            @keydown.enter="openCollection(collection)"
          >
            <div class="collection-row__main">
              <span class="collection-row__name">{{ collection.name }}</span>
              <span class="collection-row__meta">
                {{ collection.projects.length }} projects
                <template v-if="collection.description"> · {{ collection.description }}</template>
              </span>
            </div>

            <div v-if="editingId === collection.id" class="collections-page__edit">
              <label class="edit-field">
                <span>Name</span>
                <input v-model="editName" />
              </label>
              <label class="edit-field">
                <span>Description</span>
                <input v-model="editDescription" />
              </label>
              <div class="edit-dialog__actions">
                <button type="button" class="edit-dialog__cancel" :disabled="saving" @click="editingId = ''">
                  Cancel
                </button>
                <button type="button" class="edit-dialog__save" :disabled="saving" @click="saveEdit">
                  {{ saving ? 'Saving...' : 'Save' }}
                </button>
              </div>
            </div>

            <div v-else class="collection-row__actions">
              <button
                type="button"
                class="collection-row__icon"
                :aria-label="`Edit ${collection.name}`"
                @click.stop="startEdit(collection)"
              >
                <Pencil :size="16" :stroke-width="2.2" />
              </button>
              <button
                type="button"
                class="collection-row__delete"
                :aria-label="`Delete ${collection.name}`"
                @click.stop="pendingDelete = collection"
              >
                <Trash :size="16" :stroke-width="2.2" />
              </button>
            </div>
          </div>
        </template>
      </div>
    </Card>

    <Teleport to="body">
      <div v-if="pendingDelete" class="overlay confirm-overlay" @click.self="pendingDelete = null">
        <div class="confirm-card" role="dialog" aria-modal="true" aria-label="Confirm delete collection">
          <h2 class="confirm-card__title">Delete {{ pendingDelete.name }}?</h2>
          <p class="confirm-card__text">This can't be undone.</p>
          <div class="confirm-card__actions">
            <button type="button" class="confirm-card__cancel" :disabled="deleting" @click="pendingDelete = null">
              Cancel
            </button>
            <button type="button" class="confirm-card__confirm" :disabled="deleting" @click="removeCollection">
              {{ deleting ? 'Deleting...' : 'Delete' }}
            </button>
          </div>
        </div>
      </div>
    </Teleport>
  </section>
</template>
