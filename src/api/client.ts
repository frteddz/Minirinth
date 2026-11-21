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
