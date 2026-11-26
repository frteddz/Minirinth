<script setup lang="ts">
import { ChevronLeft, RefreshCw } from '@lucide/vue'
import { computed, onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import Card from '../ui/components/Card.vue'
import Button from '../ui/components/buttons/Button.vue'
import { getProjectVersions, searchProjects, type SearchHit } from '../api/client'
import {
  addAddon,
  createBackup,
  deleteBackup,
  disableAddon,
  enableAddon,
  getAddons,
  getProperties,
  getServer,
  listBackups,
  patchProperties,
  removeAddon,
  restoreBackup,
  type AddonKind,
  type ArchonAddon,
  type ArchonBackup,
  type ArchonProperties,
  type ArchonServer,
} from '../api/archon'
import { useAuth } from '../composables/useAuth'
import { useOAuth } from '../composables/useOAuth'

type Tab = 'content' | 'backups' | 'properties' | 'files'

const route = useRoute()
const router = useRouter()
const { user } = useAuth()
const { start, busy: signInBusy } = useOAuth()

const serverId = computed(() => String(route.params.id ?? ''))
const worldId = computed(() => String(route.params.worldId ?? ''))

const server = ref<ArchonServer | null>(null)
const addons = ref<ArchonAddon[]>([])
const loader = ref<{ modloader: string | null; version: string | null; game: string | null }>({
  modloader: null,
  version: null,
  game: null,
})
const backups = ref<ArchonBackup[]>([])
const properties = ref<ArchonProperties>({ known: {}, custom: {} })
const activeTab = ref<Tab>('content')
const loading = ref(false)
const error = ref('')
const busy = ref('')
const backupName = ref('')

const query = ref('')
const results = ref<SearchHit[]>([])
const selectedProject = ref<SearchHit | null>(null)
const selectedVersionId = ref('')
const versions = ref<{ id: string; version_number: string }[]>([])

const world = computed(() =>
  server.value?.worlds.find((item) => item.id === worldId.value) ?? null,
)

const fileManagerUrl = computed(
  () => `https://modrinth.com/hosting/manage/${serverId.value}/files`,
)

const propertyKeys = [
  'motd',
  'difficulty',
  'gamemode',
  'max_players',
  'allow_cheats',
  'view_distance',
]

function kindFor(project: SearchHit): AddonKind | null {
  const map: Record<string, AddonKind> = {
    mod: 'mod',
    plugin: 'plugin',
    datapack: 'datapack',
    shader: 'shader',
    resourcepack: 'resourcepack',
  }
  return map[project.project_type] ?? null
}

async function load() {
  if (!user.value || !serverId.value || !worldId.value) return
  loading.value = true
  error.value = ''
  try {
    server.value = await getServer(serverId.value)
    const [addonData, backupData, propertyData] = await Promise.all([
      getAddons(serverId.value, worldId.value),
      listBackups(serverId.value, worldId.value),
      getProperties(serverId.value, worldId.value),
    ])
    addons.value = addonData.addons ?? []
    loader.value = {
      modloader: addonData.modloader,
      version: addonData.modloader_version,
      game: addonData.game_version,
    }
    backups.value = backupData.backups ?? []
    properties.value = propertyData
  } catch (cause) {
    error.value = cause instanceof Error ? cause.message : 'Could not load this world.'
  } finally {
    loading.value = false
  }
}

async function runAction(key: string, action: () => Promise<void>) {
  busy.value = key
  error.value = ''
  try {
    await action()
    await load()
  } catch (cause) {
    error.value = cause instanceof Error ? cause.message : 'Could not finish that action.'
  } finally {
    busy.value = ''
  }
}

async function search() {
  error.value = ''
  try {
    const result = await searchProjects({ query: query.value.trim(), limit: 10 })
    results.value = result.hits.filter((hit) => kindFor(hit) !== null)
  } catch (cause) {
    error.value = cause instanceof Error ? cause.message : 'Could not search Modrinth.'
  }
}

async function chooseProject(project: SearchHit) {
  selectedProject.value = project
  selectedVersionId.value = ''
  error.value = ''
  try {
    const list = await getProjectVersions(project.slug, 10)
    versions.value = list.map((version) => ({
      id: version.id,
      version_number: version.version_number,
    }))
  } catch (cause) {
    error.value = cause instanceof Error ? cause.message : 'Could not load versions.'
  }
}

function installSelected() {
  const project = selectedProject.value
  const kind = project ? kindFor(project) : null
  if (!project || !kind || !selectedVersionId.value) {
    error.value = 'Pick a project and a version first.'
    return
  }
  void runAction('install', async () => {
    await addAddon(serverId.value, worldId.value, {
      project_id: project.project_id,
      version_id: selectedVersionId.value,
      kind,
    })
    selectedProject.value = null
    selectedVersionId.value = ''
    versions.value = []
    query.value = ''
    results.value = []
  })
}

function makeBackup() {
  const name = backupName.value.trim() || 'Backup'
  void runAction('backup', async () => {
    await createBackup(serverId.value, worldId.value, name)
    backupName.value = ''
  })
}

async function saveProperties() {
  const known: Record<string, string | null> = {}
  for (const key of propertyKeys) {
    known[key] = properties.value.known[key] ?? null
  }
  await runAction('properties', async () => {
    properties.value = await patchProperties(serverId.value, worldId.value, known)
  })
}

onMounted(() => {
  if (user.value) void load()
})

watch(user, (value) => {
  if (value) void load()
})
</script>

<template>
  <section class="page world-page">
    <Card>
      <template #header>
        <div class="server-page__header">
          <button
            type="button"
            class="server-page__back"
            aria-label="Back to server"
            @click="router.push(`/servers/${serverId}`)"
          >
            <ChevronLeft :size="20" :stroke-width="2.2" />
          </button>
          <h1 class="page__title">{{ world?.name ?? 'World' }}</h1>
          <button
            v-if="!loading"
            type="button"
            class="servers__refresh"
            aria-label="Refresh world"
            @click="load"
          >
            <RefreshCw :size="18" :stroke-width="2.2" />
          </button>
        </div>
      </template>

      <div class="servers__body">
        <div v-if="!user" class="servers__gate">
          <p>Sign in with Modrinth to manage this world.</p>
          <Button type="colored" color="green" :disabled="signInBusy" @click="start">
            {{ signInBusy ? 'Opening Modrinth...' : 'Sign in with Modrinth' }}
          </Button>
        </div>

        <p v-if="error" class="servers__error">{{ error }}</p>
        <p v-if="loading" class="servers__message">Loading world...</p>

        <template v-else-if="world">
          <div class="world-page__facts">
            <span>{{ loader.modloader || 'Unknown loader' }} {{ loader.version || '' }}</span>
            <span>{{ loader.game || 'Unknown version' }}</span>
            <span>{{ addons.length }} content files</span>
            <span>{{ backups.length }} backups</span>
          </div>

          <div class="world-page__tabs">
            <button
              v-for="tab in (['content', 'backups', 'properties', 'files'] as Tab[])"
              :key="tab"
              type="button"
              class="world-page__tab"
              :class="{ 'is-active': activeTab === tab }"
              @click="activeTab = tab"
            >
              {{ tab }}
            </button>
          </div>

          <template v-if="activeTab === 'content'">
            <div class="world-page__install">
              <h2 class="server-page__subtitle">Install from Modrinth</h2>
              <input
                v-model="query"
                type="search"
                placeholder="Search mods, plugins, shaders..."
                aria-label="Search content to install"
              />
              <button type="button" class="server-page__power-btn" @click="search">Search</button>

              <div v-if="results.length" class="world-page__results">
                <button
                  v-for="result in results"
                  :key="result.project_id"
                  type="button"
                  class="world-page__result"
                  :class="{ 'is-active': selectedProject?.project_id === result.project_id }"
                  @click="chooseProject(result)"
                >
                  {{ result.title }}
                </button>
              </div>

              <div v-if="selectedProject" class="world-page__versions">
                <p class="servers__intro">Version for {{ selectedProject.title }}</p>
                <div class="world-page__results">
                  <button
                    v-for="version in versions"
                    :key="version.id"
                    type="button"
                    class="world-page__result"
                    :class="{ 'is-active': selectedVersionId === version.id }"
                    @click="selectedVersionId = version.id"
                  >
                    {{ version.version_number }}
                  </button>
                </div>
                <button
                  type="button"
                  class="server-page__power-btn"
                  :disabled="busy === 'install' || !selectedVersionId"
                  @click="installSelected"
                >
                  {{ busy === 'install' ? 'Installing...' : 'Install' }}
                </button>
              </div>
            </div>

            <h2 class="server-page__subtitle">Installed content</h2>
            <p v-if="addons.length === 0" class="servers__empty">No content installed.</p>
            <div v-for="addon in addons" :key="addon.id" class="world-addon">
              <div class="world-addon__top">
                <span class="world-addon__name">{{ addon.name || addon.filename }}</span>
                <span class="world-addon__kind">{{ addon.kind }}</span>
              </div>
              <span class="server-world__meta">
                {{ addon.manifest?.version || 'Unknown version' }} · {{ addon.filename }}
              </span>
              <span v-if="addon.has_update" class="world-addon__update">Update available</span>
              <div class="world-addon__actions">
                <button
                  type="button"
                  class="server-page__power-btn"
                  :disabled="!!busy"
                  @click="runAction('enable', () => enableAddon(serverId, worldId, addon))"
                >
                  Enable
                </button>
                <button
                  type="button"
                  class="server-page__power-btn"
                  :disabled="!!busy"
                  @click="runAction('disable', () => disableAddon(serverId, worldId, addon))"
                >
                  Disable
                </button>
                <button
                  type="button"
                  class="world-addon__remove"
                  :disabled="!!busy"
                  @click="runAction('remove', () => removeAddon(serverId, worldId, addon))"
                >
                  Remove
                </button>
              </div>
            </div>
          </template>

          <template v-else-if="activeTab === 'backups'">
            <div class="world-page__install">
              <h2 class="server-page__subtitle">New backup</h2>
              <input v-model="backupName" type="text" placeholder="Backup name" aria-label="Backup name" />
              <button type="button" class="server-page__power-btn" @click="makeBackup">
                {{ busy === 'backup' ? 'Creating...' : 'Create' }}
              </button>
            </div>

            <h2 class="server-page__subtitle">Backups</h2>
            <p v-if="backups.length === 0" class="servers__empty">No backups yet.</p>
            <div v-for="backup in backups" :key="backup.id" class="world-addon">
              <div class="world-addon__top">
                <span class="world-addon__name">{{ backup.name }}</span>
                <span class="world-addon__kind">{{ backup.status }}</span>
              </div>
              <span class="server-world__meta">
                {{ new Date(backup.created_at).toLocaleString() }}
                <template v-if="backup.automated"> · automatic</template>
              </span>
              <div class="world-addon__actions">
                <button
                  type="button"
                  class="server-page__power-btn"
                  :disabled="backup.locked || !!busy"
                  @click="runAction('restore', () => restoreBackup(serverId, worldId, backup.id))"
                >
                  Restore
                </button>
                <button
                  type="button"
                  class="world-addon__remove"
                  :disabled="backup.locked || !!busy"
                  @click="runAction('delete', () => deleteBackup(serverId, worldId, backup.id))"
                >
                  Delete
                </button>
              </div>
            </div>
          </template>

          <template v-else-if="activeTab === 'properties'">
            <h2 class="server-page__subtitle">server.properties</h2>
            <div class="world-properties">
              <label v-for="key in propertyKeys" :key="key" class="edit-field">
                <span>{{ key.replaceAll('_', ' ') }}</span>
                <input v-model="properties.known[key]" type="text" />
              </label>
            </div>
            <button
              type="button"
              class="server-page__power-btn"
              :disabled="busy === 'properties'"
              @click="saveProperties"
            >
              {{ busy === 'properties' ? 'Saving...' : 'Save properties' }}
            </button>
          </template>

          <template v-else>
            <h2 class="server-page__subtitle">Files</h2>
            <p class="servers__intro">
              Full file editing uses Modrinth's node-backed file manager. Open it in your browser:
            </p>
            <a class="settings__link" :href="fileManagerUrl" target="_blank" rel="noopener">
              Open file manager
            </a>
            <h2 class="server-page__subtitle">Files Minirynth manages</h2>
            <p v-for="addon in addons" :key="addon.id" class="world-file">
              {{ addon.filename }}
            </p>
          </template>
        </template>
      </div>
    </Card>
  </section>
</template>
