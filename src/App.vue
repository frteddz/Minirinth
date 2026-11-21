<script setup lang="ts">
import BottomNav from './components/BottomNav.vue'
import SearchOverlay from './components/SearchOverlay.vue'
import FilterOverlay from './components/FilterOverlay.vue'
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
