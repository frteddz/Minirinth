const API_BASE_URL = 'https://api.modrinth.com/v2'
const API_V3_BASE_URL = 'https://api.modrinth.com/v3'
const USER_AGENT = 'Minirynth/0.3.0 (Unofficial mobile port for Modrinth)'
const CACHE_PREFIX = 'minirynth.cache.'
const CACHE_TTL = 10 * 60 * 1000

let authToken: string | null = null

export function setAuthToken(token: string | null) {
  authToken = token
}

export function getAuthToken() {
  return authToken
}

async function cached<T>(key: string, load: () => Promise<T>): Promise<T> {
  const storageKey = CACHE_PREFIX + key
  try {
    const raw = localStorage.getItem(storageKey)
    if (raw) {
      const entry = JSON.parse(raw) as { savedAt: number; value: T }
      if (Date.now() - entry.savedAt < CACHE_TTL) return entry.value
    }
  } catch {
    void 0
  }

  const value = await load()
  try {
    localStorage.setItem(storageKey, JSON.stringify({ savedAt: Date.now(), value }))
  } catch {
    void 0
  }
  return value
}

export function clearApiCache() {
  try {
    const keys = Object.keys(localStorage).filter((key) => key.startsWith(CACHE_PREFIX))
    keys.forEach((key) => localStorage.removeItem(key))
  } catch {
    void 0
  }
}

// The WebView ignores a User-Agent set from JS, so MainActivity appends the same
// string to the native WebView agent. This header still covers non-WebView hosts.
export async function apiFetch<T>(path: string, init: RequestInit = {}): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...init,
    headers: {
      Accept: 'application/json',
      'User-Agent': USER_AGENT,
      ...(authToken ? { Authorization: authToken } : {}),
      ...init.headers,
    },
  })

  if (!response.ok) {
    throw new Error(`Modrinth API returned ${response.status} for ${path}`)
  }

  if (response.status === 204) return undefined as T

  return response.json() as Promise<T>
}

export async function apiFetchV3<T>(path: string, init: RequestInit = {}): Promise<T> {
  const response = await fetch(`${API_V3_BASE_URL}${path}`, {
    ...init,
    headers: {
      Accept: 'application/json',
      'User-Agent': USER_AGENT,
      ...(authToken ? { Authorization: authToken } : {}),
      ...init.headers,
    },
  })

  if (!response.ok) {
    throw new Error(`Modrinth API returned ${response.status} for ${path}`)
  }

  return response.json() as Promise<T>
}

export interface ModrinthUser {
  id: string
  username: string
  avatar_url: string | null
  bio?: string
  created: string
  role?: string
}

export function getCurrentUser(): Promise<ModrinthUser> {
  return apiFetch<ModrinthUser>('/user')
}

export function getUser(idOrUsername: string): Promise<ModrinthUser> {
  return cached(`user:${idOrUsername}`, () =>
    apiFetch<ModrinthUser>(`/user/${encodeURIComponent(idOrUsername)}`),
  )
}

export interface Project {
  id: string
  slug: string
  title: string
  description: string
  project_type: string
  downloads: number
  follows: number | null
  followers?: number
  icon_url: string | null
  categories: string[]
  status: string
}

export function getUserProjects(userId: string): Promise<Project[]> {
  return apiFetch<Project[]>(`/user/${userId}/projects`)
}

export function getFollowedProjects(userId: string): Promise<Project[]> {
  return apiFetch<Project[]>(`/user/${userId}/follows`)
}

export function followProject(id: string): Promise<void> {
  return apiFetch<void>(`/project/${id}/follow`, { method: 'POST' })
}

export function unfollowProject(id: string): Promise<void> {
  return apiFetch<void>(`/project/${id}/follow`, { method: 'DELETE' })
}

export interface GalleryImage {
  url: string
  title: string | null
  description: string | null
  featured: boolean
  created: string
}

export interface ProjectDetail extends Project {
  body: string
  additional_categories: string[]
  client_side: string
  server_side: string
  source_url: string | null
  issues_url: string | null
  wiki_url: string | null
  discord_url: string | null
  donation_urls: { id: string; platform: string; url: string }[]
  gallery: GalleryImage[]
  game_versions: string[]
  loaders: string[]
  versions: string[]
  followers: number
  published: string
  updated: string
  color: number | null
  license?: { id: string; name: string; url: string }
}

export function getProject(slugOrId: string): Promise<ProjectDetail> {
  return cached(`project:${slugOrId}`, () => apiFetch<ProjectDetail>(`/project/${slugOrId}`))
}

export interface ProjectMember {
  role: string
  accepted: boolean
  user: {
    id: string
    username: string
    avatar_url: string | null
  }
}

export function getProjectMembers(slugOrId: string): Promise<ProjectMember[]> {
  return cached(`project:${slugOrId}:members`, () =>
    apiFetch<ProjectMember[]>(`/project/${slugOrId}/members`),
  )
}

export interface ProjectVersion {
  id: string
  name: string
  version_number: string
  version_type: string
  date_published: string
  downloads: number
  game_versions: string[]
  loaders: string[]
  changelog: string | null
  files: { name: string; filename: string; url: string; size: number }[]
}

export function getProjectVersions(
  slugOrId: string,
  limit = 5,
): Promise<ProjectVersion[]> {
  return cached(`project:${slugOrId}:versions:${limit}`, () =>
    apiFetch<ProjectVersion[]>(`/project/${slugOrId}/version?limit=${limit}`),
  )
}

export interface Notification {
  id: string
  user_id: string
  type: 'project_update' | 'team_invite' | 'status_change' | 'moderator_message' | null
  title: string
  text: string
  link: string
  read: boolean
  created: string
}

export function getUserNotifications(userId: string): Promise<Notification[]> {
  return apiFetch<Notification[]>(`/user/${userId}/notifications`)
}

export function markNotificationRead(id: string): Promise<void> {
  return apiFetch<void>(`/notification/${id}`, { method: 'PATCH' })
}

export function markNotificationsRead(ids: string[]): Promise<void> {
  const search = new URLSearchParams()
  search.set('ids', JSON.stringify(ids))
  return apiFetch<void>(`/notifications?${search.toString()}`, { method: 'PATCH' })
}

export interface SearchHit {
  project_id: string
  slug: string
  title: string
  description: string
  categories: string[]
  versions: string[]
  project_type: string
  downloads: number
  follows: number
  icon_url: string | null
  author: string
  license: string
  date_modified: string
}

export interface SearchResponse {
  hits: SearchHit[]
  limit: number
  offset: number
  total_hits: number
}

export interface SearchParams {
  query?: string
  index?: string
  facets?: string
  limit?: number
  offset?: number
}

export function searchProjects(params: SearchParams): Promise<SearchResponse> {
  const search = new URLSearchParams()
  if (params.query) search.set('query', params.query)
  if (params.index) search.set('index', params.index)
  if (params.facets) search.set('facets', params.facets)
  if (params.limit !== undefined) search.set('limit', String(params.limit))
  if (params.offset !== undefined) search.set('offset', String(params.offset))
  return cached(`search:${search.toString()}`, () =>
    apiFetch<SearchResponse>(`/search?${search.toString()}`),
  )
}

export interface AnalyticsMetrics {
  bucket_by?: string[]
  filter_by?: Record<string, string[] | boolean[]>
}

export interface AnalyticsRequest {
  time_range: {
    start: string
    end: string
    resolution: { slices: number }
  }
  return_metrics: {
    project_views?: AnalyticsMetrics
    project_downloads?: AnalyticsMetrics
    project_playtime?: AnalyticsMetrics
  }
  project_ids?: string[]
}

export interface AnalyticsEntry {
  source_project: string
  metric_kind: 'views' | 'downloads' | 'playtime' | 'revenue'
  views?: number
  downloads?: number
  seconds?: number
  revenue?: string
}

export interface AnalyticsProject {
  id: string
  slug: string
  name: string
  icon_url: string | null
}

export interface AnalyticsResponse {
  metrics: AnalyticsEntry[][]
  projects: Record<string, AnalyticsProject>
}

export function getAnalytics(request: AnalyticsRequest): Promise<AnalyticsResponse> {
  return apiFetchV3<AnalyticsResponse>('/analytics', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(request),
  })
}
