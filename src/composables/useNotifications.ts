import { computed, ref } from 'vue'
import {
  getUserNotifications,
  markNotificationRead,
  markNotificationsRead,
  type Notification,
} from '../api/client'
import { useNotificationSettings } from './useNotificationSettings'
import { useSystemNotifications } from './useSystemNotifications'
import {
  silentChannelId,
  soundChannelIds,
  soundKeyForNotification,
} from '../utils/notification-sound'

const { settings: soundSettings, playForNotification } = useNotificationSettings()
const { sendIncoming } = useSystemNotifications()

const notifications = ref<Notification[]>([])
const scopeError = ref(false)
const loading = ref(false)
const writeError = ref(false)
const knownIds = new Set<string>()
let hasLoaded = false
let pollTimer: number | null = null

const unreadCount = computed(() => notifications.value.filter((item) => !item.read).length)

function isScopeError(cause: unknown) {
  return cause instanceof Error && cause.message.includes('401')
}

function newestByDate(items: Notification[]) {
  return [...items].sort((a, b) => Date.parse(b.created) - Date.parse(a.created))[0]
}

export function useNotifications() {
  async function load(userId: string) {
    if (loading.value) return
    loading.value = true
    scopeError.value = false
    writeError.value = false
    try {
      const next = await getUserNotifications(userId)
      const fresh = hasLoaded
        ? next.filter((item) => !item.read && !knownIds.has(item.id))
        : []
      notifications.value = next
      next.forEach((item) => knownIds.add(item.id))
      hasLoaded = true
      if (fresh.length > 0) {
        const newest = newestByDate(fresh)
        playForNotification(newest)
        const key = soundKeyForNotification(newest)
        const channelId = soundSettings.value[key].enabled
          ? soundChannelIds[key]
          : silentChannelId
        void sendIncoming(newest.title, newest.text, channelId)
      }
    } catch (cause) {
      notifications.value = []
      scopeError.value = isScopeError(cause)
      hasLoaded = true
    } finally {
      loading.value = false
    }
  }

  function start(userId: string) {
    stop()
    load(userId)
    pollTimer = window.setInterval(() => {
      if (document.visibilityState === 'visible') load(userId)
    }, 60_000)
  }

  function stop() {
    if (pollTimer !== null) window.clearInterval(pollTimer)
    pollTimer = null
  }

  async function markRead(id: string) {
    try {
      await markNotificationRead(id)
      const item = notifications.value.find((entry) => entry.id === id)
      if (item) item.read = true
      writeError.value = false
    } catch {
      writeError.value = true
    }
  }

  async function markAllRead() {
    const ids = notifications.value.filter((item) => !item.read).map((item) => item.id)
    if (ids.length === 0) return
    try {
      await markNotificationsRead(ids)
      notifications.value.forEach((item) => {
        item.read = true
      })
      writeError.value = false
    } catch {
      writeError.value = true
    }
  }

  function clear() {
    stop()
    notifications.value = []
    scopeError.value = false
    writeError.value = false
    loading.value = false
    knownIds.clear()
    hasLoaded = false
  }

  return {
    notifications,
    unreadCount,
    scopeError,
    writeError,
    loading,
    load,
    start,
    stop,
    markRead,
    markAllRead,
    clear,
  }
}
