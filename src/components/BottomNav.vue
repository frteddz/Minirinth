<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import { useSearchOverlay } from '../composables/useSearchOverlay'

const route = useRoute()
const { searchOpen, closeSearch, toggleSearch } = useSearchOverlay()

const hidden = ref(false)
let lastScroll = 0

function onScroll() {
  const content = document.querySelector('.app-content')
  if (!content) return
  const current = content.scrollTop
  if (current < 60) {
    hidden.value = false
  } else if (current > lastScroll + 6) {
    hidden.value = true
  } else if (current < lastScroll - 6) {
    hidden.value = false
  }
  lastScroll = current
}

onMounted(() => {
  document.querySelector('.app-content')?.addEventListener('scroll', onScroll, { passive: true })
})

onUnmounted(() => {
  document.querySelector('.app-content')?.removeEventListener('scroll', onScroll)
})

watch(
  () => route.path,
  () => {
    hidden.value = false
    lastScroll = 0
  },
)

const homeActive = computed(() => route.path === '/' && !searchOpen.value)
const searchActive = computed(() => searchOpen.value || !!route.meta.category)
const profileActive = computed(() => route.path === '/profile' && !searchOpen.value)
</script>

<template>
  <nav class="dock" :class="{ 'is-hidden': hidden }" aria-label="Main navigation">
    <RouterLink
      to="/"
      class="dock__item"
      :class="{ 'is-active': homeActive }"
      aria-label="Home"
      @click="closeSearch"
    >
      <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-house preview-icon"><path d="M15 21v-8a1 1 0 0 0-1-1h-4a1 1 0 0 0-1 1v8"/><path d="M3 10a2 2 0 0 1 .709-1.528l7-6a2 2 0 0 1 2.582 0l7 6A2 2 0 0 1 21 10v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/></svg>
    </RouterLink>

    <button
      type="button"
      class="dock__item"
      :class="{ 'is-active': searchActive }"
      aria-label="Search"
      :aria-expanded="searchOpen"
      @click="toggleSearch"
    >
      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-compass preview-icon"><circle cx="12" cy="12" r="10"/><path d="m16.24 7.76-1.804 5.411a2 2 0 0 1-1.265 1.265L7.76 16.24l1.804-5.411a2 2 0 0 1 1.265-1.265z"/></svg>
    </button>

    <RouterLink
      to="/profile"
      class="dock__item"
      :class="{ 'is-active': profileActive }"
      aria-label="Profile"
      @click="closeSearch"
    >
      <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-user preview-icon"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
    </RouterLink>
  </nav>
</template>
