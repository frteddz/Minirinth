<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useSearchOverlay } from '../composables/useSearchOverlay'
import { useNotifications } from '../composables/useNotifications'
import bellIcon from '../assets/icons/notifications/bell.svg?raw'
import menuIcon from '../assets/icons/menu.svg?raw'
import userIcon from '../assets/icons/user.svg?raw'

const route = useRoute()
const router = useRouter()
const { searchOpen, closeSearch, toggleSearch } = useSearchOverlay()
const { unreadCount } = useNotifications()

const badgeLabel = computed(() =>
  unreadCount.value > 99 ? '99+' : String(unreadCount.value),
)

const hidden = ref(false)
const menuOpen = ref(false)
const popped = ref('')
let popTimer: ReturnType<typeof setTimeout> | undefined
let lastScroll = 0

function popIcon(name: string) {
  popped.value = name
  if (popTimer) clearTimeout(popTimer)
  popTimer = setTimeout(() => {
    popped.value = ''
  }, 340)
}

function selectHome() {
  closeSearch()
  popIcon('home')
}

function selectSearch() {
  toggleSearch()
  popIcon('search')
}

function selectMenu() {
  menuOpen.value = !menuOpen.value
  popIcon('menu')
}

function onScroll() {
  const content = document.querySelector('.app-content')
  if (!content) return
  const current = content.scrollTop
  if (current < 60) {
    hidden.value = false
  } else if (current > lastScroll + 6) {
    hidden.value = true
    menuOpen.value = false
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
  if (popTimer) clearTimeout(popTimer)
})

watch(
  () => route.path,
  () => {
    hidden.value = false
    lastScroll = 0
    menuOpen.value = false
  },
)

watch(searchOpen, (open) => {
  if (open) menuOpen.value = false
})

const homeActive = computed(() => route.path === '/' && !searchOpen.value && !menuOpen.value)
const searchActive = computed(() => searchOpen.value || !!route.meta.category)
const menuActive = computed(() => route.path === '/profile' || menuOpen.value)

function openNotifications() {
  menuOpen.value = false
  closeSearch()
  router.push('/profile#notifications')
  setTimeout(() => {
    document.getElementById('notifications')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }, 120)
}

function openProfile() {
  menuOpen.value = false
  closeSearch()
  router.push('/profile')
}
</script>

<template>
  <nav class="dock" :class="{ 'is-hidden': hidden }" aria-label="Main navigation">
    <RouterLink
      to="/"
      class="dock__item"
      :class="{ 'is-active': homeActive, pop: popped === 'home' }"
      aria-label="Home"
      @click="selectHome"
    >
      <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-house preview-icon"><path d="M15 21v-8a1 1 0 0 0-1-1h-4a1 1 0 0 0-1 1v8"/><path d="M3 10a2 2 0 0 1 .709-1.528l7-6a2 2 0 0 1 2.582 0l7 6A2 2 0 0 1 21 10v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/></svg>
    </RouterLink>

    <button
      type="button"
      class="dock__item"
      :class="{ 'is-active': searchActive, pop: popped === 'search' }"
      aria-label="Search"
      :aria-expanded="searchOpen"
      @click="selectSearch"
    >
      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-compass preview-icon"><circle cx="12" cy="12" r="10"/><path d="m16.24 7.76-1.804 5.411a2 2 0 0 1-1.265 1.265L7.76 16.24l1.804-5.411a2 2 0 0 1 1.265-1.265z"/></svg>
    </button>

    <button
      type="button"
      class="dock__item"
      :class="{ 'is-active': menuActive, pop: popped === 'menu' }"
      aria-label="Menu"
      :aria-expanded="menuOpen"
      @click="selectMenu"
    >
      <span class="dock__menu-icon" aria-hidden="true" v-html="menuIcon"></span>
      <span v-if="unreadCount > 0 && !menuOpen" class="dock__badge">{{ badgeLabel }}</span>
    </button>
  </nav>

  <Teleport to="body">
    <Transition name="pop">
      <div v-if="menuOpen" class="menu-overlay" @click.self="menuOpen = false">
        <div class="menu-popover" role="menu" aria-label="Account menu">
          <button type="button" class="menu-popover__item" role="menuitem" @click="openNotifications">
            <span class="menu-popover__icon" aria-hidden="true" v-html="bellIcon"></span>
            <span>Notifications</span>
            <span v-if="unreadCount > 0" class="menu-popover__count">{{ badgeLabel }}</span>
          </button>
          <button type="button" class="menu-popover__item" role="menuitem" @click="openProfile">
            <span class="menu-popover__icon" aria-hidden="true" v-html="userIcon"></span>
            <span>Profile</span>
          </button>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>
