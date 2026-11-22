import approved from '../../assets/notification-sfx/404358__kagateni__success.wav?url'
import rejected from '../../assets/notification-sfx/873104__heyheytheree__save-failed-psx-ui-sfx-free.wav?url'
import teamInvite from '../../assets/notification-sfx/878435__zenosounds__elegant-double-chime.wav?url'
import moderatorMessage from '../../assets/notification-sfx/878434__zenosounds__soft-message-pop.wav?url'
import versionReleased from '../../assets/notification-sfx/235911__yfjesse__notification-sound.wav?url'
import projectUpdated from '../../assets/notification-sfx/748073__selectdetail57__system-upgrade.wav?url'
import general from '../../assets/notification-sfx/457518__graham_makes__chord-alert-notification.wav?url'

import type { Notification } from '../api/client'

export const soundUrls = {
  projectApproved: approved,
  projectRejected: rejected,
  teamInvite,
  moderatorMessage,
  projectUpdated,
  versionReleased,
  general,
}

export type NotificationSoundId = keyof typeof soundUrls

export function soundKeyForNotification(notification: Notification): NotificationSoundId {
  const text = `${notification.title} ${notification.text}`.toLowerCase()

  if (notification.type === 'team_invite') return 'teamInvite'
  if (notification.type === 'moderator_message') return 'moderatorMessage'

  if (notification.type === 'status_change') {
    if (/approv|accept|public/.test(text)) return 'projectApproved'
    if (/reject|denied|unapprov/.test(text)) return 'projectRejected'
    return 'general'
  }

  if (notification.type === 'project_update') {
    if (notification.link.includes('/version/') || /version|released|published/.test(text)) {
      return 'versionReleased'
    }
    return 'projectUpdated'
  }

  return 'general'
}

export function soundForNotification(notification: Notification) {
  return soundUrls[soundKeyForNotification(notification)]
}
