<script setup lang="ts">
import { RefreshCw } from '@lucide/vue'
import { onMounted, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import Card from '../ui/components/Card.vue'
import Button from '../ui/components/buttons/Button.vue'
import { useAuth } from '../composables/useAuth'
import { useOAuth } from '../composables/useOAuth'
import { ArchonError, listServers, type ArchonServer } from '../api/archon'

const { user } = useAuth()
const { start, busy: signInBusy } = useOAuth()
const router = useRouter()

const servers = ref<ArchonServer[]>([])
const loading = ref(false)
const error = ref('')
const errorCause = ref<unknown>(null)

function regionLabel(server: ArchonServer) {
  if (server.location.status !== 'assigned') return 'No region assigned'
  return server.location.location_metadata.region
}

async function load() {
  if (!user.value) return
  loading.value = true
  error.value = ''
  try {
    servers.value = await listServers()
  } catch (cause) {
    servers.value = []
    errorCause.value = cause
    error.value = cause instanceof Error ? cause.message : 'Could not load your servers.'
  } finally {
    loading.value = false
  }
}

function scopeHint(cause: unknown) {
  return cause instanceof ArchonError && (cause.status === 401 || cause.status === 403)
}

onMounted(() => {
  if (user.value) void load()
})

watch(user, (value) => {
  if (value) void load()
  else servers.value = []
})
</script>

<template>
  <section class="page servers">
    <Card>
      <template #header>
        <div class="servers__header">
          <h1 class="page__title">Servers</h1>
          <button
            v-if="user && !loading"
            type="button"
            class="servers__refresh"
            aria-label="Refresh servers"
            @click="load"
          >
            <RefreshCw :size="18" :stroke-width="2.2" />
          </button>
        </div>
      </template>

      <div class="servers__body">
        <p class="servers__intro">
          Your Modrinth Hosting servers. Install content, check worlds and control power from your
          phone.
        </p>

        <div v-if="!user" class="servers__gate">
          <p>Sign in with Modrinth to see your hosting servers.</p>
          <Button type="colored" color="green" :disabled="signInBusy" @click="start">
            {{ signInBusy ? 'Opening Modrinth...' : 'Sign in with Modrinth' }}
          </Button>
        </div>

        <template v-else>
          <p v-if="error" class="servers__error">
            {{ error }}
            <span v-if="scopeHint(errorCause)" class="servers__error-hint">
              This token may not have access to Modrinth Hosting.
            </span>
          </p>

          <p v-if="loading" class="servers__message">Loading servers...</p>
          <p v-else-if="!error && servers.length === 0" class="servers__empty">
            No hosting servers on this account yet.
          </p>

          <button
            v-for="server in servers"
            :key="server.id"
            type="button"
            class="hosting-server"
            @click="router.push(`/servers/${server.id}`)"
          >
            <span class="hosting-server__main">
              <span class="hosting-server__name">{{ server.name }}</span>
              <span class="hosting-server__meta">
                {{ regionLabel(server) }} · {{ server.specs.memory_mb }} MB ·
                {{ server.worlds.length }} world{{ server.worlds.length === 1 ? '' : 's' }}
              </span>
            </span>
            <span class="hosting-server__arrow" aria-hidden="true">›</span>
          </button>
        </template>
      </div>
    </Card>
  </section>
</template>
