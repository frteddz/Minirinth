const API_BASE_URL = 'https://api.modrinth.com/v2'
const USER_AGENT = 'Minirinth/0.1.2 (Unofficial mobile port for Modrinth)'

let authToken: string | null = null

export function setAuthToken(token: string | null) {
  authToken = token
}

export function getAuthToken() {
  return authToken
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

  return response.json() as Promise<T>
}

export interface ModrinthUser {
  id: string
  username: string
  avatar_url: string | null
  bio?: string
  created: string
}

export function getCurrentUser(): Promise<ModrinthUser> {
  return apiFetch<ModrinthUser>('/user')
}

export interface Project {
  id: string
  slug: string
  title: string
  description: string
  project_type: string
  downloads: number
  follows: number | null
  icon_url: string | null
  categories: string[]
  status: string
}

export function getUserProjects(userId: string): Promise<Project[]> {
  return apiFetch<Project[]>(`/user/${userId}/projects`)
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
}

export function getProject(slugOrId: string): Promise<ProjectDetail> {
  return apiFetch<ProjectDetail>(`/project/${slugOrId}`)
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
  return apiFetch<ProjectMember[]>(`/project/${slugOrId}/members`)
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
  return apiFetch<ProjectVersion[]>(`/project/${slugOrId}/version?limit=${limit}`)
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
  return apiFetch<SearchResponse>(`/search?${search.toString()}`)
}
