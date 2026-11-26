<script setup lang="ts">
import { ChevronLeft, RefreshCw } from '@lucide/vue'
import { computed, onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import Card from '../ui/components/Card.vue'
import Button from '../ui/components/buttons/Button.vue'
import { useAuth } from '../composables/useAuth'
import { useOAuth } from '../composables/useOAuth'
import {
  ArchonError,
  getServer,
  sendPower,
  type ArchonServer,
} from '../api/archon'

const route = useRoute()
const router = useRouter()
const { user } = useAuth()
const { start, busy: signInBusy } = useOAuth()

const serverId = computed(() => String(route.params.id ?? ''))
const server = ref<ArchonServer | null>(null)
const loading = ref(false)
const error = ref('')
const errorCause = ref<unknown>(null)
const actionBusy = ref('')

async function load() {
  if (!user.value || !serverId.value) return
  loading.value = true
  error.value = ''
  try {
    server.value = await getServer(serverId.value)
  } catch (cause) {
    server.value = null
    errorCause.value = cause
    error.value = cause instanceof Error ? cause.message : 'Could not load that server.'
  } finally {
    loading.value = false
  }
}

async function power(action: 'Start' | 'Stop' | 'Restart' | 'Kill') {
  actionBusy.value = action
  error.value = ''
  try {
    await sendPower(serverId.value, action)
    await load()
  } catch (cause) {
    errorCause.value = cause
    error.value = cause instanceof Error ? cause.message : `Could not ${action.toLowerCase()} the server.`
  } finally {
    actionBusy.value = ''
  }
}

function regionLabel(value: ArchonServer) {
  if (value.location.status !== 'assigned') return 'No region assigned'
  return value.location.location_metadata.region
}

function worldMeta(world: ArchonServer['worlds'][number]) {
  if (!world.content) return 'No content info'
  return `${world.content.game_version} · ${world.content.modloader} ${world.content.modloader_version}`
}

onMounted(() => {
  if (user.value) void load()
})
</script>

<template>
  <section class="page server-page">
    <Card>
      <template #header>
        <div class="server-page__header">
          <button
            type="button"
            class="server-page__back"
            aria-label="Back to servers"
            @click="router.push('/servers')"
          >
            <ChevronLeft :size="20" :stroke-width="2.2" />
          </button>
          <h1 class="page__title">{{ server?.name ?? 'Server' }}</h1>
          <button
            v-if="user && !loading"
            type="button"
            class="servers__refresh"
            aria-label="Refresh server"
            @click="load"
          >
            <RefreshCw :size="18" :stroke-width="2.2" />
          </button>
        </div>
      </template>

      <div class="servers__body">
        <div v-if="!user" class="servers__gate">
          <p>Sign in with Modrinth to manage your hosting servers.</p>
          <Button type="colored" color="green" :disabled="signInBusy" @click="start">
            {{ signInBusy ? 'Opening Modrinth...' : 'Sign in with Modrinth' }}
          </Button>
        </div>

        <template v-else>
          <p v-if="error" class="servers__error">
            {{ error }}
            <span v-if="errorCause instanceof ArchonError && errorCause.status === 401" class="servers__error-hint">
              This token may not have access to Modrinth Hosting.
            </span>
          </p>

          <p v-if="loading" class="servers__message">Loading server...</p>

          <template v-else-if="server">
            <div class="server-page__facts">
              <span>{{ regionLabel(server) }}</span>
              <span>{{ server.specs.memory_mb }} MB RAM</span>
              <span>{{ server.specs.storage_mb }} MB storage</span>
            </div>

            <div class="server-page__power">
              <button
                v-for="action in (['Start', 'Stop', 'Restart'] as const)"
                :key="action"
                type="button"
                class="server-page__power-btn"
                :disabled="!!actionBusy"
                @click="power(action)"
              >
                {{ actionBusy === action ? '...' : action }}
              </button>
            </div>

            <h2 class="server-page__subtitle">Worlds</h2>
            <p v-if="server.worlds.length === 0" class="servers__empty">No worlds yet.</p>
            <button
              v-for="world in server.worlds"
              :key="world.id"
              type="button"
              class="server-world"
              @click="router.push(`/servers/${server.id}/worlds/${world.id}`)"
            >
              <div class="server-world__top">
                <span class="server-world__name">{{ world.name }}</span>
                <span v-if="world.is_active" class="server-world__badge">Active</span>
              </div>
              <span class="server-world__meta">{{ worldMeta(world) }}</span>
              <span class="server-world__meta">Manage loader, files, backups and properties</span>
            </button>
          </template>
        </template>
      </div>
    </Card>
  </section>
</template>
