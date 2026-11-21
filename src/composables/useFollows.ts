import { ref } from 'vue'
import {
  followProject,
  getFollowedProjects,
  unfollowProject,
  type Project,
} from '../api/client'

const followed = ref<Project[]>([])
const writeError = ref(false)

function isScopeError(cause: unknown) {
  return cause instanceof Error && cause.message.includes('401')
}

export function useFollows() {
  async function load(userId: string) {
    try {
      followed.value = await getFollowedProjects(userId)
    } catch {
      followed.value = []
    }
  }

  function isFollowing(id: string) {
    return followed.value.some((project) => project.id === id)
  }

  async function toggle(id: string) {
    try {
      if (isFollowing(id)) {
        await unfollowProject(id)
        followed.value = followed.value.filter((project) => project.id !== id)
      } else {
        await followProject(id)
        // The endpoint returns no body, so add a placeholder until the next load.
        followed.value = [...followed.value, { id } as Project]
      }
      writeError.value = false
    } catch (cause) {
      writeError.value = isScopeError(cause)
    }
  }

  function clear() {
    followed.value = []
    writeError.value = false
  }

  return { followed, writeError, load, isFollowing, toggle, clear }
}
