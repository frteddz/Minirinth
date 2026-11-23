<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ArrowLeft, Trash } from '@lucide/vue'
import Card from '../ui/components/Card.vue'
import { useAuth } from '../composables/useAuth'
import {
  getCollection,
  getProjectsByIds,
  removeProjectFromCollection,
  type Collection,
  type Project,
} from '../api/client'
import { projectPath } from '../utils/project-path'

const route = useRoute()
const router = useRouter()
const { user } = useAuth()

const collection = ref<Collection | null>(null)
const projects = ref<Project[]>([])
const loading = ref(false)
const error = ref('')
const pendingRemove = ref<Project | null>(null)
const removing = ref(false)

const canEdit = computed(
  () => !!user.value && !!collection.value && user.value.id === collection.value.user,
)

async function load() {
  const id = String(route.params.id ?? '')
  if (!id) return

  loading.value = true
  error.value = ''
  collection.value = null
  projects.value = []

  try {
    const result = await getCollection(id)
    collection.value = result
    projects.value = await getProjectsByIds(result.projects)
  } catch (cause) {
    error.value = cause instanceof Error ? cause.message : 'Could not load collection.'
  } finally {
    loading.value = false
  }
}

async function confirmRemove() {
  const target = pendingRemove.value
  const current = collection.value
  if (!target || !current) return

  removing.value = true
  error.value = ''
  try {
    const remaining = await removeProjectFromCollection(current.id, target.id)
    projects.value = projects.value.filter((project) => project.id !== target.id)
    current.projects = remaining
    pendingRemove.value = null
  } catch (cause) {
    error.value = cause instanceof Error ? cause.message : 'Could not remove project.'
  } finally {
    removing.value = false
  }
}

watch(() => route.params.id, load)
onMounted(load)
</script>

<template>
  <section class="page collection-page">
    <button type="button" class="project-page__back" aria-label="Go back" @click="router.back()">
      <ArrowLeft :size="24" :stroke-width="2.5" />
    </button>

    <Card>
      <template #header>
        <h1 class="page__title">{{ collection?.name ?? 'Collection' }}</h1>
      </template>

      <div class="collection-page__body">
        <p v-if="loading" class="collections-page__empty">Loading collection...</p>
        <p v-else-if="error" class="edit-dialog__error">{{ error }}</p>

        <template v-else-if="collection">
          <p v-if="collection.description" class="collection-page__description">
            {{ collection.description }}
          </p>
          <p class="collection-page__meta">{{ projects.length }} projects</p>

          <p v-if="projects.length === 0" class="collections-page__empty">
            Nothing in this collection yet.
          </p>

          <div v-for="project in projects" :key="project.id" class="collection-item">
            <RouterLink class="collection-item__main" :to="projectPath(project.project_type, project.slug)">
              <img
                v-if="project.icon_url"
                class="collection-item__icon"
                :src="project.icon_url"
                alt=""
              />
              <span v-else class="collection-item__icon collection-item__icon--fallback">
                {{ project.title.charAt(0) }}
              </span>
              <span class="collection-item__copy">
                <span class="collection-item__name">{{ project.title }}</span>
                <span class="collection-item__type">{{ project.project_type }}</span>
              </span>
            </RouterLink>
            <button
              v-if="canEdit"
              type="button"
              class="collection-item__remove"
              :aria-label="`Remove ${project.title}`"
              @click="pendingRemove = project"
            >
              <Trash :size="16" :stroke-width="2.2" />
            </button>
          </div>
        </template>
      </div>
    </Card>

    <Teleport to="body">
      <div v-if="pendingRemove" class="overlay confirm-overlay" @click.self="pendingRemove = null">
        <div class="confirm-card" role="dialog" aria-modal="true" aria-label="Confirm remove project">
          <h2 class="confirm-card__title">Remove {{ pendingRemove.title }}?</h2>
          <p class="confirm-card__text">This removes it from the collection, not from Modrinth.</p>
          <div class="confirm-card__actions">
            <button type="button" class="confirm-card__cancel" :disabled="removing" @click="pendingRemove = null">
              Cancel
            </button>
            <button type="button" class="confirm-card__confirm" :disabled="removing" @click="confirmRemove">
              {{ removing ? 'Removing...' : 'Remove' }}
            </button>
          </div>
        </div>
      </div>
    </Teleport>
  </section>
</template>
