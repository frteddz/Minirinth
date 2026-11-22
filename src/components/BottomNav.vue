<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useSearchOverlay } from '../composables/useSearchOverlay'
import { useNotifications } from '../composables/useNotifications'
import { useAuth } from '../composables/useAuth'
import bellIcon from '../assets/icons/notifications/bell.svg?raw'
import menuIcon from '../assets/icons/menu.svg?raw'
import userIcon from '../assets/icons/user.svg?raw'
import organizationIcon from '../assets/icons/organization.svg?raw'

const route = useRoute()
const router = useRouter()
const { searchOpen, closeSearch, toggleSearch } = useSearchOverlay()
const { unreadCount } = useNotifications()
const { user, accounts, currentAccount, signOut, switchAccount } = useAuth()

const badgeLabel = computed(() =>
  unreadCount.value > 99 ? '99+' : String(unreadCount.value),
)

const hidden = ref(false)
const menuOpen = ref(false)
const accountBubbleOpen = ref(false)
const logoutConfirmOpen = ref(false)
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
    accountBubbleOpen.value = false
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
    accountBubbleOpen.value = false
  },
)

watch(searchOpen, (open) => {
  if (open) {
    menuOpen.value = false
    accountBubbleOpen.value = false
  }
})

const homeActive = computed(() => route.path === '/' && !searchOpen.value && !menuOpen.value)
const searchActive = computed(() => searchOpen.value || !!route.meta.category)
const menuActive = computed(
  () => route.path === '/profile' || menuOpen.value || accountBubbleOpen.value,
)
const otherAccounts = computed(() =>
  accounts.value.filter((item) => item.id !== currentAccount.value?.id),
)

function openNotifications() {
  menuOpen.value = false
  closeSearch()
  router.push('/notifications')
}

function openProfile() {
  menuOpen.value = false
  closeSearch()
  router.push('/profile')
}

function openSettings() {
  menuOpen.value = false
  closeSearch()
  router.push('/settings')
}

function openDashboard() {
  menuOpen.value = false
  closeSearch()
  router.push('/dashboard')
}

function openOrganizations() {
  menuOpen.value = false
  closeSearch()
  router.push('/organizations')
}

function openAnalytics() {
  menuOpen.value = false
  closeSearch()
  router.push('/analytics')
}

function openAccountBubble() {
  menuOpen.value = false
  closeSearch()
  accountBubbleOpen.value = true
}

function backToMenu() {
  accountBubbleOpen.value = false
  menuOpen.value = true
}

async function chooseAccount(id: string) {
  if (id === currentAccount.value?.id) {
    accountBubbleOpen.value = false
    return
  }
  await switchAccount(id)
  accountBubbleOpen.value = false
}

function addAccount() {
  accountBubbleOpen.value = false
  closeSearch()
  router.push('/login')
}

function requestLogout() {
  menuOpen.value = false
  logoutConfirmOpen.value = true
}

function closeLogoutConfirm() {
  logoutConfirmOpen.value = false
}

async function confirmLogout() {
  logoutConfirmOpen.value = false
  closeSearch()
  await signOut()
  router.push('/profile')
}

function openSignIn() {
  menuOpen.value = false
  closeSearch()
  router.push('/login')
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
          <button
            v-if="!user"
            type="button"
            class="menu-popover__item menu-popover__item--signin"
            role="menuitem"
            @click="openSignIn"
          >
            <span class="menu-popover__icon" aria-hidden="true">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-log-in preview-icon"><path d="m10 17 5-5-5-5"/><path d="M15 12H3"/><path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"/></svg>
            </span>
            <span>Sign in</span>
          </button>
          <div v-if="!user" class="menu-popover__divider" role="separator"></div>
          <button
            v-if="user"
            type="button"
            class="menu-popover__item"
            role="menuitem"
            @click="openProfile"
          >
            <span class="menu-popover__icon" aria-hidden="true" v-html="userIcon"></span>
            <span>Profile</span>
          </button>
          <button type="button" class="menu-popover__item" role="menuitem" @click="openDashboard">
            <span class="menu-popover__icon" aria-hidden="true">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-layout-dashboard preview-icon"><rect width="7" height="9" x="3" y="3" rx="1"/><rect width="7" height="5" x="14" y="3" rx="1"/><rect width="7" height="9" x="14" y="12" rx="1"/><rect width="7" height="5" x="3" y="16" rx="1"/></svg>
            </span>
            <span>Dashboard</span>
          </button>
          <button type="button" class="menu-popover__item" role="menuitem" @click="openOrganizations">
            <span class="menu-popover__icon" aria-hidden="true">
              <span aria-hidden="true" v-html="organizationIcon"></span>
            </span>
            <span>Organizations</span>
          </button>
          <button type="button" class="menu-popover__item" role="menuitem" @click="openAnalytics">
            <span class="menu-popover__icon" aria-hidden="true">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-chart-column preview-icon"><path d="M3 3v16a2 2 0 0 0 2 2h16"/><path d="M18 17V9"/><path d="M13 17V5"/><path d="M8 17v-3"/></svg>
            </span>
            <span>Analytics</span>
          </button>
          <button type="button" class="menu-popover__item" role="menuitem" @click="openNotifications">
            <span class="menu-popover__icon" aria-hidden="true" v-html="bellIcon"></span>
            <span>Notifications</span>
            <span v-if="unreadCount > 0" class="menu-popover__count">{{ badgeLabel }}</span>
          </button>
          <button type="button" class="menu-popover__item" role="menuitem" @click="openSettings">
            <span class="menu-popover__icon" aria-hidden="true">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-settings preview-icon"><path d="M9.671 4.136a2.34 2.34 0 0 1 4.659 0 2.34 2.34 0 0 0 3.319 1.915 2.34 2.34 0 0 1 2.33 4.033 2.34 2.34 0 0 0 0 3.831 2.34 2.34 0 0 1-2.33 4.033 2.34 2.34 0 0 0-3.319 1.915 2.34 2.34 0 0 1-4.659 0 2.34 2.34 0 0 0-3.32-1.915 2.34 2.34 0 0 1-2.33-4.033 2.34 2.34 0 0 0 0-3.831A2.34 2.34 0 0 1 6.35 6.051a2.34 2.34 0 0 0 3.319-1.915"/><circle cx="12" cy="12" r="3"/></svg>
            </span>
            <span>Settings</span>
          </button>
          <template v-if="user">
            <div class="menu-popover__divider" role="separator"></div>
            <button type="button" class="menu-popover__item" role="menuitem" @click="openAccountBubble">
              <span class="menu-popover__icon" aria-hidden="true">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-arrow-left-right preview-icon"><path d="M8 3 4 7l4 4"/><path d="M4 7h16"/><path d="m16 21 4-4-4-4"/><path d="M20 17H4"/></svg>
              </span>
              <span>Switch account</span>
            </button>
            <button
              type="button"
              class="menu-popover__item menu-popover__item--danger"
              role="menuitem"
              @click="requestLogout"
            >
              <span class="menu-popover__icon" aria-hidden="true">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-log-out preview-icon"><path d="m16 17 5-5-5-5"/><path d="M21 12H9"/><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/></svg>
              </span>
              <span>Log out</span>
            </button>
          </template>
        </div>
      </div>
    </Transition>
  </Teleport>

  <Teleport to="body">
    <Transition name="pop">
      <div v-if="accountBubbleOpen" class="menu-overlay" @click.self="accountBubbleOpen = false">
        <div class="menu-popover account-bubble" role="menu" aria-label="Switch account">
          <div class="account-bubble__header">
            <button
              type="button"
              class="account-bubble__back"
              aria-label="Back to menu"
              @click="backToMenu"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-arrow-left preview-icon"><path d="m12 19-7-7 7-7"/><path d="M19 12H5"/></svg>
            </button>
            <span class="account-bubble__title">Switch account</span>
          </div>

          <div v-if="currentAccount" class="account-bubble__account is-active" role="menuitem">
            <img
              v-if="currentAccount.avatar_url"
              class="account-bubble__avatar"
              :src="currentAccount.avatar_url"
              alt=""
            />
            <span v-else class="account-bubble__avatar account-bubble__avatar--fallback">
              {{ currentAccount.username.charAt(0).toUpperCase() }}
            </span>
            <span class="account-bubble__info">
              <span class="account-bubble__name">{{ currentAccount.username }}</span>
              <span class="account-bubble__label">Signed in</span>
            </span>
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" class="account-bubble__check lucide lucide-check preview-icon"><path d="M20 6 9 17l-5-5"/></svg>
          </div>
          <p v-else class="account-bubble__empty">Not signed in</p>

          <button
            v-for="account in otherAccounts"
            :key="account.id"
            type="button"
            class="account-bubble__account"
            role="menuitem"
            @click="chooseAccount(account.id)"
          >
            <img
              v-if="account.avatar_url"
              class="account-bubble__avatar"
              :src="account.avatar_url"
              alt=""
            />
            <span v-else class="account-bubble__avatar account-bubble__avatar--fallback">
              {{ account.username.charAt(0).toUpperCase() }}
            </span>
            <span class="account-bubble__info">
              <span class="account-bubble__name">{{ account.username }}</span>
              <span class="account-bubble__label">Saved account</span>
            </span>
          </button>

          <div class="menu-popover__divider" role="separator"></div>
          <button type="button" class="account-bubble__add" role="menuitem" @click="addAccount">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-plus preview-icon"><path d="M5 12h14"/><path d="M12 5v14"/></svg>
            <span>Add account</span>
          </button>
        </div>
      </div>
    </Transition>
  </Teleport>

  <Teleport to="body">
    <div v-if="logoutConfirmOpen" class="overlay confirm-overlay" @click.self="closeLogoutConfirm">
      <div class="confirm-dialog card" role="dialog" aria-modal="true" aria-labelledby="logout-dialog-title">
        <h2 id="logout-dialog-title" class="confirm-dialog__title">Log out?</h2>
        <p class="confirm-dialog__text">
          This removes this account from the device. If you have another saved account, you'll switch to it.
        </p>
        <div class="confirm-dialog__actions">
          <button type="button" class="confirm-dialog__cancel" @click="closeLogoutConfirm">
            Cancel
          </button>
          <button type="button" class="confirm-dialog__confirm" @click="confirmLogout">
            Log out
          </button>
        </div>
      </div>
    </div>
  </Teleport>
</template>
