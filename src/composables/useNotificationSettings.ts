import { ref, watch } from 'vue'
import { soundUrls, soundKeyForNotification, type NotificationSoundId } from '../utils/notification-sound'
import type { Notification } from '../api/client'

export const soundOptions: {
  id: NotificationSoundId
  name: string
  description: string
}[] = [
  { id: 'projectApproved', name: 'Project approved', description: 'When a project is accepted' },
  { id: 'projectRejected', name: 'Project rejected', description: 'When a project is rejected' },
  { id: 'teamInvite', name: 'Team invitation', description: 'When you are invited to a team' },
  { id: 'moderatorMessage', name: 'Moderator message', description: 'When staff messages you' },
  { id: 'projectUpdated', name: 'Project updated', description: 'When a followed project changes' },
  { id: 'versionReleased', name: 'Version released', description: 'When a new version ships' },
  { id: 'general', name: 'General', description: 'Everything else' },
]

const soundOrder = soundOptions.map((item) => item.id)
const SETTINGS_KEY = 'minirynth.notification-sounds'
const DEFAULT_VOLUME = 0.85

export interface SoundSetting {
  enabled: boolean
  volume: number
}

type SoundSettings = Record<NotificationSoundId, SoundSetting>

function defaultSettings(): SoundSettings {
  return Object.fromEntries(
    soundOrder.map((id) => [id, { enabled: true, volume: DEFAULT_VOLUME }]),
  ) as SoundSettings
}

function clampVolume(value: number) {
  if (!Number.isFinite(value)) return DEFAULT_VOLUME
  return Math.min(1, Math.max(0, value))
}

function loadSettings(): SoundSettings {
  const result = defaultSettings()
  try {
    const raw = localStorage.getItem(SETTINGS_KEY)
    if (!raw) return result
    const parsed = JSON.parse(raw) as Partial<SoundSettings>
    for (const id of soundOrder) {
      const item = parsed[id]
      if (!item) continue
      result[id] = {
        enabled: typeof item.enabled === 'boolean' ? item.enabled : result[id].enabled,
        volume: clampVolume(Number(item.volume)),
      }
    }
  } catch {
    void 0
  }
  return result
}

const settings = ref<SoundSettings>(loadSettings())
const testing = ref<Record<NotificationSoundId, boolean>>(
  Object.fromEntries(soundOrder.map((id) => [id, false])) as Record<NotificationSoundId, boolean>,
)

watch(
  settings,
  () => {
    try {
      localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings.value))
    } catch {
      void 0
    }
  },
  { deep: true },
)

function playSound(id: NotificationSoundId, volume: number) {
  const audio = new Audio(soundUrls[id])
  audio.volume = clampVolume(volume)
  void audio.play().catch(() => {})
}

export function useNotificationSettings() {
  function setEnabled(id: NotificationSoundId, enabled: boolean) {
    settings.value[id].enabled = enabled
  }

  function setVolume(id: NotificationSoundId, volume: number) {
    settings.value[id].volume = clampVolume(volume)
  }

  function volumePercent(id: NotificationSoundId) {
    return Math.round(settings.value[id].volume * 100)
  }

  function playTest(id: NotificationSoundId) {
    if (!settings.value[id].enabled || testing.value[id]) return
    testing.value[id] = true
    playSound(id, settings.value[id].volume)
    window.setTimeout(() => {
      testing.value[id] = false
    }, 900)
  }

  function reset() {
    settings.value = defaultSettings()
  }

  function playForNotification(notification: Notification) {
    const id = soundKeyForNotification(notification)
    const item = settings.value[id]
    if (!item.enabled) return
    playSound(id, item.volume)
  }

  return {
    settings,
    soundOptions,
    setEnabled,
    setVolume,
    volumePercent,
    testing,
    playTest,
    reset,
    playForNotification,
  }
}
