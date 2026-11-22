<script setup lang="ts">
import { Bell, Check, ExternalLink } from '@lucide/vue'
import { computed, onMounted, ref, watch } from 'vue'
import Card from '../ui/components/Card.vue'
import { useAuth } from '../composables/useAuth'
import { useNotifications } from '../composables/useNotifications'
import checkCheckIcon from '../assets/icons/notifications/check-check.svg?raw'

const { user, restore } = useAuth()
const {
  notifications,
  unreadCount,
  scopeError,
  writeError,
  loading,
  start,
  markRead,
  markAllRead,
  clear,
} = useNotifications()

const showAllNotifications = ref(false)
const confirmMarkAll = ref(false)
const notificationCountLabel = computed(() =>
  unreadCount.value > 99 ? '99+' : String(unreadCount.value),
)
const notificationCountTone = computed(() => {
  if (unreadCount.value <= 9) return 'normal'
  if (unreadCount.value <= 49) return 'warning'
  return 'danger'
})
const visibleNotifications = computed(() =>
  showAllNotifications.value ? notifications.value : notifications.value.slice(0, 8),
)

function notificationDate(value: string) {
  return new Date(value).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
}

function notificationLink(link: string) {
  return `https://modrinth.com/${link}`
}

async function confirmMarkAllRead() {
  await markAllRead()
  confirmMarkAll.value = false
}

watch(user, (value) => {
  showAllNotifications.value = false
  if (value) start(value.id)
  else clear()
})

onMounted(restore)
</script>

<template>
  <section class="page notifications-page">
    <Card v-if="user" class="notifications-card">
      <template #header>
        <div class="notifications-card__header">
          <div class="notifications-card__heading">
            <h1 class="page__title notifications-card__title">
              <Bell :size="16" :stroke-width="2.5" aria-hidden="true" />
              Notifications
            </h1>
            <span
              v-if="unreadCount > 0"
              class="notifications-card__count"
              :class="`is-${notificationCountTone}`"
            >
              {{ notificationCountLabel }}
            </span>
          </div>

          <button
            v-if="unreadCount > 0"
            type="button"
            class="notifications-card__mark-all"
            @click="confirmMarkAll = true"
          >
            <span class="notifications-card__mark-icon" aria-hidden="true" v-html="checkCheckIcon"></span>
            Mark all as read
          </button>
        </div>
      </template>

      <p v-if="writeError" class="profile__message">
        This token can't mark notifications as read. Add the Write notifications scope and sign in again.
      </p>

      <p v-if="loading" class="profile__message">Loading notifications...</p>
      <p v-else-if="scopeError" class="profile__message">
        This token can't read notifications. Add the Read notifications scope in Modrinth, then sign in again.
      </p>
      <p v-else-if="notifications.length === 0" class="profile__message">No notifications yet.</p>

      <div
        v-for="item in visibleNotifications"
        :key="item.id"
        class="notification"
        :class="{ 'is-unread': !item.read }"
      >
        <div class="notification__head">
          <span class="notification__title">{{ item.title }}</span>
          <span class="notification__date">{{ notificationDate(item.created) }}</span>
        </div>
        <p class="notification__text">{{ item.text }}</p>
        <div class="notification__actions">
          <a :href="notificationLink(item.link)" target="_blank" rel="noopener">
            Open
            <ExternalLink :size="14" :stroke-width="2" />
          </a>
          <button
            v-if="!item.read"
            type="button"
            class="notification__read"
            @click="markRead(item.id)"
          >
            <Check :size="14" :stroke-width="2" />
            Mark read
          </button>
        </div>
      </div>

      <button
        v-if="notifications.length > 8"
        type="button"
        class="notification__more"
        @click="showAllNotifications = !showAllNotifications"
      >
        {{ showAllNotifications ? 'Show less' : `Show ${notifications.length - 8} more` }}
      </button>
    </Card>

    <Card v-else>
      <template #header>
        <h1 class="page__title">Notifications</h1>
      </template>
      <p class="profile__message">Sign in to see your notifications.</p>
    </Card>

    <Teleport to="body">
      <Transition name="pop">
        <div v-if="confirmMarkAll" class="confirm-overlay" @click.self="confirmMarkAll = false">
          <div class="confirm-card" role="dialog" aria-modal="true" aria-label="Mark all as read">
            <h2 class="confirm-card__title">Mark all as read?</h2>
            <p class="confirm-card__text">
              This will mark all {{ unreadCount }} unread notifications as read. You can't undo this.
            </p>
            <div class="confirm-card__actions">
              <button type="button" class="confirm-card__cancel" @click="confirmMarkAll = false">
                Cancel
              </button>
              <button type="button" class="confirm-card__confirm" @click="confirmMarkAllRead">
                Mark all as read
              </button>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>
  </section>
</template>
