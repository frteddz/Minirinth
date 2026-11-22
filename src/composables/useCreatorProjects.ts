import { ref } from 'vue'
import { clearApiCache, getUserProjects, type Project } from '../api/client'
import { useAuth } from './useAuth'

const projects = ref<Project[]>([])
const loading = ref(false)
const error = ref('')
let loadedFor = ''

export function useCreatorProjects() {
  const { user, restore } = useAuth()

  async function load(force = false) {
    if (!user.value) await restore()
    if (!user.value) return
    if (!force && loadedFor === user.value.id) return

    loading.value = true
    error.value = ''
    try {
      projects.value = await getUserProjects(user.value.id)
      loadedFor = user.value.id
    } catch (cause) {
      projects.value = []
      error.value = cause instanceof Error ? cause.message : 'Could not load projects.'
    } finally {
      loading.value = false
    }
  }

  async function refresh() {
    clearApiCache()
    loadedFor = ''
    await load(true)
  }

  return { projects, loading, error, load, refresh }
}
