<script setup lang="ts">
import { onMounted, onUnmounted } from 'vue'
import BottomNav from './components/BottomNav.vue'
import SearchOverlay from './components/SearchOverlay.vue'
import FilterOverlay from './components/FilterOverlay.vue'
import { useOAuth } from './composables/useOAuth'
import { setupNotificationChannels } from './composables/useSystemNotifications'
import { useAuth } from './composables/useAuth'

const { listenForCallback } = useOAuth()
const { restore } = useAuth()
let stopListening: (() => void) | undefined

onMounted(() => {
  stopListening = listenForCallback()
  void restore()
  void setupNotificationChannels()
})

onUnmounted(() => {
  stopListening?.()
})
</script>

<template>
  <div class="app-shell">
    <main class="app-content">
      <RouterView />
    </main>

    <BottomNav />
    <SearchOverlay />
    <FilterOverlay />
  </div>
</template>
