import { getAuthToken } from './client'

const ARCHON_BASE_URL = 'https://archon.modrinth.com'
const USER_AGENT = 'Minirynth/0.5.7-dev (Unofficial mobile client for Modrinth)'

export class ArchonError extends Error {
  status: number

  constructor(message: string, status: number) {
    super(message)
    this.name = 'ArchonError'
    this.status = status
  }
}

export interface ArchonWorld {
  id: string
  name: string
  update_channel: 'release' | 'beta' | 'alpha'
  created_at: string
  is_active: boolean
  content: {
    modloader: string
    modloader_version: string
    game_version: string
    java_version: number | null
    requires_restart: boolean
    shared_instance_id: string | null
  } | null
}

export interface ArchonServer {
  id: string
  name: string
  subdomain: string
  specs: {
    cpu: number
    memory_mb: number
    storage_mb: number
    swap_mb: number
  }
  location:
    | {
        status: 'assigned'
        location_metadata: {
          region: string
          hostname: string
          url_host: string
          is_decommissioned_node: boolean
        }
      }
    | { status: 'unassigned' }
  tags: string[]
  auto_restart_on_crash: boolean
  drop_client_mods: boolean
  worlds: ArchonWorld[]
}

type PowerAction = 'Start' | 'Stop' | 'Restart' | 'Kill'

async function archonFetch<T>(
  path: string,
  options: { version?: string; method?: string; body?: unknown } = {},
): Promise<T> {
  const token = getAuthToken()
  if (!token) throw new ArchonError('Sign in to Modrinth to see your servers.', 401)

  const { version = 'v1', method = 'GET', body } = options
  const response = await fetch(`${ARCHON_BASE_URL}/${version}${path}`, {
    method,
    headers: {
      Accept: 'application/json',
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
      'User-Agent': USER_AGENT,
      'X-Panel-Version': '1',
    },
    ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
  })

  if (!response.ok) {
    let message = `Modrinth Hosting returned ${response.status}.`
    try {
      const data = (await response.json()) as { message?: string; error?: string; description?: string }
      message = data.description || data.message || data.error || message
    } catch {
      void 0
    }
    throw new ArchonError(message, response.status)
  }

  if (response.status === 204) return undefined as T
  return (await response.json()) as T
}

export function listServers(): Promise<ArchonServer[]> {
  return archonFetch<ArchonServer[]>('/servers')
}

export function getServer(id: string): Promise<ArchonServer> {
  return archonFetch<ArchonServer>(`/servers/${encodeURIComponent(id)}`)
}

export async function sendPower(id: string, action: PowerAction): Promise<void> {
  await archonFetch<void>(`/servers/${encodeURIComponent(id)}/power`, {
    version: 'modrinth/v0',
    method: 'POST',
    body: { action },
  })
}

export type AddonKind = 'mod' | 'plugin' | 'datapack' | 'shader' | 'resourcepack'

export interface ArchonAddon {
  id: string
  filename: string
  filesize: number
  disabled: boolean
  disabled_server: boolean
  disabled_player: boolean
  has_update: string | null
  name: string | null
  project_id: string | null
  kind: AddonKind
  status: 'pending' | 'installed' | { failed: { error: string } }
  manifest: {
    name: string | null
    version: string | null
    platform: string
    environment: string | null
  } | null
  icon_url: string | null
}

export interface ArchonAddons {
  modloader: string | null
  modloader_version: string | null
  game_version: string | null
  update_channel: 'release' | 'beta' | 'alpha'
  modpack: { name?: string; version?: string } | null
  installing?: 'loader' | 'modpack'
  error?: { message: string }
  addons: ArchonAddon[] | null
}

export interface ArchonBackup {
  id: string
  name: string
  created_at: string
  status: string
  locked: boolean
  automated: boolean
}

export interface ArchonBackups {
  backups: ArchonBackup[]
  active_operations: unknown[]
}

export interface ArchonProperties {
  known: Record<string, string | null>
  custom?: Record<string, string>
}

function worldPath(serverId: string, worldId: string) {
  return `/servers/${encodeURIComponent(serverId)}/worlds/${encodeURIComponent(worldId)}`
}

export function getAddons(serverId: string, worldId: string): Promise<ArchonAddons> {
  return archonFetch<ArchonAddons>(`${worldPath(serverId, worldId)}/addons`)
}

export function addAddon(
  serverId: string,
  worldId: string,
  request: { project_id: string; version_id?: string; kind?: AddonKind },
): Promise<void> {
  return archonFetch<void>(`${worldPath(serverId, worldId)}/addons`, {
    method: 'POST',
    body: request,
  })
}

function addonRequest(addon: ArchonAddon) {
  return { kind: addon.kind, filename: addon.filename }
}

export function enableAddon(serverId: string, worldId: string, addon: ArchonAddon): Promise<void> {
  return archonFetch<void>(`${worldPath(serverId, worldId)}/addons/enable`, {
    method: 'POST',
    body: addonRequest(addon),
  })
}

export function disableAddon(serverId: string, worldId: string, addon: ArchonAddon): Promise<void> {
  return archonFetch<void>(`${worldPath(serverId, worldId)}/addons/disable`, {
    method: 'POST',
    body: addonRequest(addon),
  })
}

export function removeAddon(serverId: string, worldId: string, addon: ArchonAddon): Promise<void> {
  return archonFetch<void>(`${worldPath(serverId, worldId)}/addons/delete`, {
    method: 'POST',
    body: addonRequest(addon),
  })
}

export function listBackups(serverId: string, worldId: string): Promise<ArchonBackups> {
  return archonFetch<ArchonBackups>(`${worldPath(serverId, worldId)}/backups-queue`)
}

export function createBackup(serverId: string, worldId: string, name: string): Promise<void> {
  return archonFetch<void>(`${worldPath(serverId, worldId)}/backups-queue`, {
    method: 'POST',
    body: { name },
  })
}

export function restoreBackup(serverId: string, worldId: string, backupId: string): Promise<void> {
  return archonFetch<void>(
    `${worldPath(serverId, worldId)}/backups-queue/${encodeURIComponent(backupId)}/restore`,
    { method: 'POST', body: {} },
  )
}

export function deleteBackup(serverId: string, worldId: string, backupId: string): Promise<void> {
  return archonFetch<void>(
    `${worldPath(serverId, worldId)}/backups-queue/${encodeURIComponent(backupId)}`,
    { method: 'DELETE' },
  )
}

export function getProperties(serverId: string, worldId: string): Promise<ArchonProperties> {
  return archonFetch<ArchonProperties>(`${worldPath(serverId, worldId)}/properties`)
}

export function patchProperties(
  serverId: string,
  worldId: string,
  known: Record<string, string | null>,
): Promise<ArchonProperties> {
  return archonFetch<ArchonProperties>(`${worldPath(serverId, worldId)}/properties`, {
    method: 'PATCH',
    body: { known },
  })
}
