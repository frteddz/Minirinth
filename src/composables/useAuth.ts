import { Preferences } from '@capacitor/preferences'
import { ref } from 'vue'
import { getCurrentUser, setAuthToken, type ModrinthUser } from '../api/client'

const TOKEN_KEY = 'minirynth.pat'

const user = ref<ModrinthUser | null>(null)
const loading = ref(false)
const error = ref('')

async function clearToken() {
  await Preferences.remove({ key: TOKEN_KEY })
  setAuthToken(null)
  user.value = null
}

async function loadUser() {
  loading.value = true
  error.value = ''
  try {
    user.value = await getCurrentUser()
  } catch (cause) {
    await clearToken()
    error.value = cause instanceof Error ? cause.message : 'Could not sign in.'
  } finally {
    loading.value = false
  }
}

export function useAuth() {
  async function restore() {
    const { value } = await Preferences.get({ key: TOKEN_KEY })
    if (!value) return
    setAuthToken(value)
    await loadUser()
  }

  async function signIn(token: string) {
    const clean = token.trim()
    if (!clean) {
      error.value = 'Enter a personal access token.'
      return
    }
    await Preferences.set({ key: TOKEN_KEY, value: clean })
    setAuthToken(clean)
    await loadUser()
  }

  async function signOut() {
    await clearToken()
    error.value = ''
  }

  return { user, loading, error, restore, signIn, signOut }
}
