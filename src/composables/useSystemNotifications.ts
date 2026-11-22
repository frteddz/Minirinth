import { Capacitor } from '@capacitor/core'
import { BackgroundRunner } from '@capacitor/background-runner'
import { LocalNotifications } from '@capacitor/local-notifications'
import { soundOptions } from './useNotificationSettings'
import {
  silentChannelId,
  soundChannelFiles,
  soundChannelIds,
  type NotificationSoundId,
} from '../utils/notification-sound'

const RUNNER_LABEL = 'com.minirynth.app.notifications'
const RUNNER_EVENT = 'checkNotifications'

function canUseNativeNotifications() {
  return Capacitor.isNativePlatform()
}

async function havePermission() {
  if (!canUseNativeNotifications()) return false
  const status = await LocalNotifications.checkPermissions()
  if (status.display === 'granted') return true
  const next = await LocalNotifications.requestPermissions()
  return next.display === 'granted'
}

export async function setupNotificationChannels() {
  if (!canUseNativeNotifications()) return
  const status = await LocalNotifications.checkPermissions()
  if (status.display !== 'granted') return

  for (const option of soundOptions) {
    try {
      await LocalNotifications.createChannel({
        id: soundChannelIds[option.id],
        name: option.name,
        description: option.description,
        sound: soundChannelFiles[option.id],
        importance: 3,
        vibration: true,
        visibility: 1,
      })
    } catch {
      void 0
    }
  }

  try {
    await LocalNotifications.createChannel({
      id: silentChannelId,
      name: 'Silent',
      description: 'Notifications without a sound',
      importance: 3,
      vibration: false,
      visibility: 1,
    })
  } catch {
    void 0
  }
}

export function useSystemNotifications() {
  async function requestPermission() {
    if (!canUseNativeNotifications()) return false
    try {
      await BackgroundRunner.requestPermissions({ apis: ['notifications'] })
    } catch {
      void 0
    }
    const granted = await havePermission()
    if (granted) await setupNotificationChannels()
    return granted
  }

  async function sendNotification(id: number, title: string, body: string, channelId?: string) {
    if (!canUseNativeNotifications()) return
    if (!(await havePermission())) return
    try {
      await LocalNotifications.schedule({
        notifications: [
          {
            id,
            title,
            body,
            channelId,
            schedule: { at: new Date(Date.now() + 400) },
            isExactNotification: false,
            autoCancel: true,
          },
        ],
      })
    } catch {
      void 0
    }
  }

  function sendTest() {
    return sendNotification(1, 'Minirynth', 'This is a test notification.', soundChannelIds.general)
  }

  async function sendDelayedTest() {
    if (!canUseNativeNotifications()) return
    if (!(await havePermission())) return
    try {
      await LocalNotifications.schedule({
        notifications: [
          {
            id: 2,
            title: 'Minirynth',
            body: 'Timed test notification',
            channelId: soundChannelIds.general,
            schedule: { at: new Date(Date.now() + 5000) },
            isExactNotification: false,
            foreground: true,
            autoCancel: true,
          },
        ],
      })
    } catch {
      void 0
    }
  }

  function sendIncoming(title: string, body: string, channelId?: string) {
    return sendNotification(
      Math.floor(Math.random() * 1000000) + 3,
      'Minirynth',
      `${title}\n${body}`,
      channelId,
    )
  }

  function syncBackgroundAuth(token: string, userId: string, expiresAt?: number, reset = false) {
    if (!canUseNativeNotifications()) return
    void BackgroundRunner.dispatchEvent({
      label: RUNNER_LABEL,
      event: RUNNER_EVENT,
      details: {
        token,
        user: userId,
        expiresAt: expiresAt || 0,
        reset,
      },
    }).catch(() => {})
  }

  function syncBackgroundChannels(channels: Record<NotificationSoundId, string>) {
    if (!canUseNativeNotifications()) return
    void BackgroundRunner.dispatchEvent({
      label: RUNNER_LABEL,
      event: RUNNER_EVENT,
      details: { channels, silent: silentChannelId },
    }).catch(() => {})
  }

  function clearBackgroundAuth() {
    if (!canUseNativeNotifications()) return
    void BackgroundRunner.dispatchEvent({
      label: RUNNER_LABEL,
      event: RUNNER_EVENT,
      details: { clear: true },
    }).catch(() => {})
  }

  return {
    requestPermission,
    setupNotificationChannels,
    sendTest,
    sendDelayedTest,
    sendIncoming,
    syncBackgroundAuth,
    syncBackgroundChannels,
    clearBackgroundAuth,
  }
}
