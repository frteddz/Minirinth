<script setup lang="ts">
import { onMounted, onUnmounted } from 'vue'
import BottomNav from './components/BottomNav.vue'
import SearchOverlay from './components/SearchOverlay.vue'
import FilterOverlay from './components/FilterOverlay.vue'
import { useOAuth } from './composables/useOAuth'

const { listenForCallback } = useOAuth()
let stopListening: (() => void) | undefined

onMounted(() => {
  stopListening = listenForCallback()
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
