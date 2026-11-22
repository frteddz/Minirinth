const API_BASE_URL = 'https://api.modrinth.com/v2'
const API_V3_BASE_URL = 'https://api.modrinth.com/v3'
const USER_AGENT = 'Minirynth/0.4.7 (Unofficial mobile port for Modrinth)'
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

function clearCachePrefix(prefix: string) {
  try {
    const keys = Object.keys(localStorage).filter((key) => key.startsWith(CACHE_PREFIX + prefix))
    keys.forEach((key) => localStorage.removeItem(key))
  } catch {
    void 0
  }
}

export function clearProjectCache(slugOrId: string) {
  clearCachePrefix(`project:${slugOrId}`)
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
    let description = ''
    try {
      const body = (await response.json()) as { description?: string; error?: string }
      description = body.description || body.error || ''
    } catch {
      void 0
    }
    throw new Error(
      description
        ? `Modrinth API returned ${response.status}: ${description}`
        : `Modrinth API returned ${response.status} for ${path}`,
    )
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
    let description = ''
    try {
      const body = (await response.json()) as { description?: string; error?: string }
      description = body.description || body.error || ''
    } catch {
      void 0
    }
    throw new Error(
      description
        ? `Modrinth API returned ${response.status}: ${description}`
        : `Modrinth API returned ${response.status} for ${path}`,
    )
  }

  if (response.status === 204) return undefined as T

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
  ordering?: number
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

export interface ProjectEditPayload {
  title?: string
  description?: string
  body?: string
  categories?: string[]
  additional_categories?: string[]
  client_side?: string
  server_side?: string
  requested_status?: string | null
  issues_url?: string | null
  source_url?: string | null
  wiki_url?: string | null
  discord_url?: string | null
  license_id?: string
  license_url?: string | null
  donation_urls?: { id: string; platform: string; url: string }[]
}

export async function modifyProject(slugOrId: string, payload: ProjectEditPayload): Promise<void> {
  await apiFetch<void>(`/project/${slugOrId}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })
  clearProjectCache(slugOrId)
}

export interface CreateProjectInput {
  title: string
  slug?: string
  description: string
  body: string
  project_type: string
  categories: string[]
  additional_categories: string[]
  license_id?: string
  license_url?: string | null
  issues_url?: string | null
  source_url?: string | null
  wiki_url?: string | null
  discord_url?: string | null
  client_side: string
  server_side: string
  requested_status?: string
  is_draft: boolean
  icon?: File | null
}

export interface CreatedProject {
  id: string
  slug?: string | null
  title: string
  project_type: string
}

export async function createProject(input: CreateProjectInput): Promise<CreatedProject> {
  const { icon, ...data } = input
  const form = new FormData()
  form.append('data', JSON.stringify(data))
  if (icon) form.append('icon', icon, icon.name)
  const created = await apiFetch<CreatedProject>('/project', { method: 'POST', body: form })
  clearProjectCache(created.id)
  return created
}

export interface GalleryUploadOptions {
  ext: string
  featured: boolean
  title?: string
  description?: string
  ordering?: number
}

export async function addGalleryImage(
  slugOrId: string,
  file: File,
  options: GalleryUploadOptions,
): Promise<void> {
  const params = new URLSearchParams()
  params.set('ext', options.ext)
  params.set('featured', String(options.featured))
  if (options.title) params.set('title', options.title)
  if (options.description) params.set('description', options.description)
  if (options.ordering !== undefined) params.set('ordering', String(options.ordering))
  await apiFetch<void>(`/project/${slugOrId}/gallery?${params.toString()}`, {
    method: 'POST',
    headers: { 'Content-Type': file.type || `image/${options.ext}` },
    body: file,
  })
  clearProjectCache(slugOrId)
}

export async function deleteGalleryImage(slugOrId: string, url: string): Promise<void> {
  const params = new URLSearchParams()
  params.set('url', url)
  await apiFetch<void>(`/project/${slugOrId}/gallery?${params.toString()}`, { method: 'DELETE' })
  clearProjectCache(slugOrId)
}

export interface OrganizationMember {
  team_id: string
  user: {
    id: string
    username: string
    avatar_url: string | null
  }
  role: string
  permissions: number
  organization_permissions: number
  accepted: boolean
}

export interface Organization {
  id: string
  slug: string
  name: string
  description: string
  team_id: string
  icon_url: string | null
  raw_icon_url?: string | null
  color: number | null
  members: OrganizationMember[]
}

export interface OrganizationEditPayload {
  name?: string
  slug?: string
  description?: string
}

export function getUserOrganizations(userId: string): Promise<Organization[]> {
  return apiFetchV3(`/user/${encodeURIComponent(userId)}/organizations`)
}

export function getOrganization(idOrSlug: string): Promise<Organization> {
  return apiFetchV3(`/organization/${encodeURIComponent(idOrSlug)}`)
}

export function getOrganizationProjects(idOrSlug: string): Promise<Project[]> {
  return apiFetchV3(`/organization/${encodeURIComponent(idOrSlug)}/projects`)
}

export async function createOrganization(input: OrganizationEditPayload): Promise<Organization> {
  const created = await apiFetchV3<Organization>('/organization', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  })
  clearApiCache()
  return created
}

export async function modifyOrganization(
  idOrSlug: string,
  payload: OrganizationEditPayload,
): Promise<void> {
  await apiFetchV3<void>(`/organization/${encodeURIComponent(idOrSlug)}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })
  clearApiCache()
}

export async function changeOrganizationIcon(idOrSlug: string, file: File): Promise<void> {
  const ext = file.name.split('.').pop()?.toLowerCase() ?? 'png'
  await apiFetchV3<void>(
    `/organization/${encodeURIComponent(idOrSlug)}/icon?ext=${encodeURIComponent(ext)}`,
    {
      method: 'PATCH',
      headers: { 'Content-Type': file.type || `image/${ext}` },
      body: file,
    },
  )
  clearApiCache()
}

export async function deleteOrganizationIcon(idOrSlug: string): Promise<void> {
  await apiFetchV3<void>(`/organization/${encodeURIComponent(idOrSlug)}/icon`, {
    method: 'DELETE',
  })
  clearApiCache()
}

export function joinTeam(teamId: string): Promise<void> {
  return apiFetch<void>(`/team/${encodeURIComponent(teamId)}/join`, { method: 'POST' })
}

export function leaveTeam(teamId: string, userId: string): Promise<void> {
  return apiFetch<void>(`/team/${encodeURIComponent(teamId)}/members/${encodeURIComponent(userId)}`, {
    method: 'DELETE',
  })
}

export function addTeamMember(teamId: string, userId: string): Promise<void> {
  return apiFetch<void>(`/team/${encodeURIComponent(teamId)}/members`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ user_id: userId }),
  })
}

export function getUserById(idOrUsername: string): Promise<ModrinthUser> {
  return apiFetch<ModrinthUser>(`/user/${encodeURIComponent(idOrUsername)}`)
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
  files: {
    name: string
    filename: string
    url: string
    size: number
    hashes?: Record<string, string>
  }[]
}

export function getProjectVersions(
  slugOrId: string,
  limit = 5,
): Promise<ProjectVersion[]> {
  return cached(`project:${slugOrId}:versions:${limit}`, () =>
    apiFetch<ProjectVersion[]>(`/project/${slugOrId}/version?limit=${limit}`),
  )
}

export interface CreateVersionInput {
  project_id: string
  name: string
  version_number: string
  changelog?: string
  game_versions: string[]
  loaders: string[]
  version_type: string
  featured: boolean
  status?: string
  environment?: string
  files: File[]
}

export async function createVersion(input: CreateVersionInput): Promise<ProjectVersion> {
  const { files, ...metadata } = input
  const form = new FormData()
  form.append(
    'data',
    JSON.stringify({
      ...metadata,
      file_parts: files.map((_, index) => `file${index}`),
      primary_file: 'file0',
    }),
  )
  files.forEach((file, index) => form.append(`file${index}`, file, file.name))
  const version = await apiFetch<ProjectVersion>('/version', { method: 'POST', body: form })
  clearProjectCache(input.project_id)
  return version
}

export interface VersionEditPayload {
  name?: string
  version_number?: string
  changelog?: string | null
  game_versions?: string[]
  version_type?: string
  loaders?: string[]
  featured?: boolean
  status?: string
  requested_status?: string | null
  dependencies?: {
    version_id?: string | null
    project_id?: string | null
    file_name?: string | null
    dependency_type: 'required' | 'optional' | 'incompatible' | 'embedded'
  }[]
}

export async function modifyVersion(id: string, payload: VersionEditPayload): Promise<void> {
  await apiFetch<void>(`/version/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })
  clearApiCache()
}

export async function deleteVersion(id: string): Promise<void> {
  await apiFetch<void>(`/version/${id}`, { method: 'DELETE' })
  clearApiCache()
}

export async function deleteProject(idOrSlug: string): Promise<void> {
  await apiFetch<void>(`/project/${encodeURIComponent(idOrSlug)}`, { method: 'DELETE' })
  clearApiCache()
}

export async function changeProjectIcon(idOrSlug: string, file: File): Promise<void> {
  const ext = file.name.split('.').pop()?.toLowerCase() ?? 'png'
  await apiFetch<void>(`/project/${encodeURIComponent(idOrSlug)}/icon?ext=${encodeURIComponent(ext)}`, {
    method: 'PATCH',
    headers: { 'Content-Type': file.type || `image/${ext}` },
    body: file,
  })
  clearProjectCache(idOrSlug)
}

export async function deleteProjectIcon(idOrSlug: string): Promise<void> {
  await apiFetch<void>(`/project/${encodeURIComponent(idOrSlug)}/icon`, { method: 'DELETE' })
  clearProjectCache(idOrSlug)
}

export interface GalleryEditOptions {
  url: string
  featured?: boolean
  title?: string
  description?: string
  ordering?: number
}

export async function modifyGalleryImage(
  idOrSlug: string,
  options: GalleryEditOptions,
): Promise<void> {
  const params = new URLSearchParams()
  params.set('url', options.url)
  if (options.featured !== undefined) params.set('featured', String(options.featured))
  if (options.title !== undefined) params.set('title', options.title)
  if (options.description !== undefined) params.set('description', options.description)
  if (options.ordering !== undefined) params.set('ordering', String(options.ordering))
  await apiFetch<void>(`/project/${encodeURIComponent(idOrSlug)}/gallery?${params.toString()}`, {
    method: 'PATCH',
  })
  clearProjectCache(idOrSlug)
}

export async function addVersionFiles(versionId: string, files: File[]): Promise<void> {
  const form = new FormData()
  form.append(
    'data',
    JSON.stringify({ file_parts: files.map((_, index) => `file${index}`) }),
  )
  files.forEach((file, index) => form.append(`file${index}`, file, file.name))
  await apiFetch<void>(`/version/${encodeURIComponent(versionId)}/file`, {
    method: 'POST',
    body: form,
  })
  clearApiCache()
}

export async function deleteVersionFile(
  hash: string,
  versionId: string,
  algorithm: 'sha1' | 'sha512' = 'sha1',
): Promise<void> {
  const params = new URLSearchParams()
  params.set('algorithm', algorithm)
  params.set('version_id', versionId)
  await apiFetch<void>(`/version_file/${encodeURIComponent(hash)}?${params.toString()}`, {
    method: 'DELETE',
  })
  clearApiCache()
}

export interface TeamMemberEditPayload {
  role?: string
  permissions?: number
  payouts_split?: number
  ordering?: number
}

export function modifyTeamMember(
  teamId: string,
  userId: string,
  payload: TeamMemberEditPayload,
): Promise<void> {
  return apiFetch<void>(`/team/${encodeURIComponent(teamId)}/members/${encodeURIComponent(userId)}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })
}

export function transferTeamOwnership(teamId: string, userId: string): Promise<void> {
  return apiFetch<void>(`/team/${encodeURIComponent(teamId)}/owner`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ user_id: userId }),
  })
}

export function addProjectToOrganization(orgId: string, projectId: string): Promise<void> {
  return apiFetchV3<void>(`/organization/${encodeURIComponent(orgId)}/projects`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ project_id: projectId }),
  })
}

export async function removeProjectFromOrganization(
  orgId: string,
  projectId: string,
  newOwnerId: string,
): Promise<void> {
  await apiFetchV3<void>(
    `/organization/${encodeURIComponent(orgId)}/projects/${encodeURIComponent(projectId)}`,
    {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ new_owner: newOwnerId }),
    },
  )
  clearApiCache()
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
