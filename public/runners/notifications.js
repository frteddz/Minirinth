var KV_TOKEN = 'minirynth.background.token'
var KV_USER = 'minirynth.background.user'
var KV_EXPIRY = 'minirynth.background.expiry'
var KV_KNOWN = 'minirynth.background.known'
var KV_CHANNELS = 'minirynth.background.channels'
var KV_SILENT = 'minirynth.background.silent'

function notificationId(value) {
  var hash = 0
  for (var i = 0; i < value.length; i += 1) {
    hash = (hash * 31 + value.charCodeAt(i)) | 0
  }
  return Math.abs(hash % 2000000000)
}

function stored(key) {
  return CapacitorKV.get(key).value || ''
}

function channelForNotification(item, channels, silent) {
  var map = channels || {}
  var text = ((item.title || '') + ' ' + (item.text || '')).toLowerCase()
  var key = 'general'

  if (item.type === 'team_invite') {
    key = 'teamInvite'
  } else if (item.type === 'moderator_message') {
    key = 'moderatorMessage'
  } else if (item.type === 'status_change') {
    if (/approv|accept|public/.test(text)) key = 'projectApproved'
    else if (/reject|denied|unapprov/.test(text)) key = 'projectRejected'
  } else if (item.type === 'project_update') {
    if ((item.link || '').indexOf('/version/') !== -1 || /version|released|published/.test(text)) {
      key = 'versionReleased'
    } else {
      key = 'projectUpdated'
    }
  }

  return map[key] || silent
}

addEventListener('checkNotifications', function (resolve, reject, args) {
  try {
    if (args && args.clear) {
      CapacitorKV.set(KV_TOKEN, '')
      CapacitorKV.set(KV_USER, '')
      CapacitorKV.remove(KV_KNOWN)
      resolve({ cleared: true })
      return
    }

    if (args && args.channels) {
      CapacitorKV.set(KV_CHANNELS, JSON.stringify(args.channels))
      CapacitorKV.set(KV_SILENT, String(args.silent || 'minirynth_silent'))
      resolve({ channels: true })
      return
    }

    if (args && args.token) {
      CapacitorKV.set(KV_TOKEN, String(args.token))
      CapacitorKV.set(KV_USER, String(args.user || ''))
      CapacitorKV.set(KV_EXPIRY, String(args.expiresAt || 0))
      if (args.reset) CapacitorKV.remove(KV_KNOWN)
    }

    var token = stored(KV_TOKEN)
    var user = stored(KV_USER)
    var expiry = Number(stored(KV_EXPIRY) || 0)
    var channelsRaw = stored(KV_CHANNELS)
    var channels = channelsRaw ? JSON.parse(channelsRaw) : {}
    var silent = stored(KV_SILENT) || 'minirynth_silent'

    if (!token || !user || (expiry && Date.now() > expiry)) {
      resolve({ skipped: true })
      return
    }

    var knownRaw = stored(KV_KNOWN)
    var known = knownRaw ? JSON.parse(knownRaw) : []
    var firstRun = !knownRaw

    fetch('https://api.modrinth.com/v2/user/' + encodeURIComponent(user) + '/notifications', {
      method: 'GET',
      headers: {
        Authorization: token,
        'User-Agent': 'Minirynth/0.5.4-dev (Unofficial mobile client for Modrinth)',
      },
    })
      .then(function (response) {
        if (!response.ok) return resolve({ skipped: true, status: response.status })
        return response.json().then(function (items) {
          var ids = items.map(function (item) {
            return item.id
          })
          if (firstRun) {
            CapacitorKV.set(KV_KNOWN, JSON.stringify(ids.slice(0, 200)))
            resolve({ initialized: true })
            return
          }

          var fresh = items.filter(function (item) {
            return !item.read && known.indexOf(item.id) === -1
          })

          fresh.slice(0, 5).forEach(function (item) {
            CapacitorNotifications.schedule([
              {
                id: notificationId(item.id),
                title: 'Minirynth',
                body: item.title || 'New notification from Modrinth',
                channelId: channelForNotification(item, channels, silent),
                autoCancel: true,
              },
            ])
          })

          var merged = known.concat(ids)
          var unique = []
          merged.forEach(function (id) {
            if (unique.indexOf(id) === -1) unique.push(id)
          })
          CapacitorKV.set(KV_KNOWN, JSON.stringify(unique.slice(-200)))
          resolve({ sent: fresh.length })
        })
      })
      .catch(function (error) {
        reject(String(error))
      })
  } catch (error) {
    reject(String(error))
  }
})
