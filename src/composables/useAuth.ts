import { Preferences } from '@capacitor/preferences'
import { computed, ref } from 'vue'
import { getCurrentUser, setAuthToken, type ModrinthUser } from '../api/client'

const TOKEN_KEY = 'minirynth.pat'
const EXPIRY_KEY = 'minirynth.oauth.expires'
const ACCOUNTS_KEY = 'minirynth.accounts'

export interface SavedAccount {
  id: string
  username: string
  avatar_url: string | null
  token: string
  expiresAt?: number
}

const user = ref<ModrinthUser | null>(null)
const loading = ref(false)
const error = ref('')

function loadAccounts(): SavedAccount[] {
  try {
    const raw = localStorage.getItem(ACCOUNTS_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw) as SavedAccount[]
    return Array.isArray(parsed) ? parsed : []
  } catch {
    void 0
  }
  return []
}

const accounts = ref<SavedAccount[]>(loadAccounts())

function saveAccounts() {
  try {
    localStorage.setItem(ACCOUNTS_KEY, JSON.stringify(accounts.value))
  } catch {
    void 0
  }
}

function rememberAccount(account: SavedAccount) {
  accounts.value = [account, ...accounts.value.filter((item) => item.id !== account.id)]
  saveAccounts()
}

function forgetAccount(id: string) {
  accounts.value = accounts.value.filter((item) => item.id !== id)
  saveAccounts()
}

async function clearToken() {
  await Preferences.remove({ key: TOKEN_KEY })
  await Preferences.remove({ key: EXPIRY_KEY })
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
  const currentAccount = computed(() =>
    user.value ? accounts.value.find((item) => item.id === user.value?.id) ?? null : null,
  )

  async function restore() {
    const { value: expiry } = await Preferences.get({ key: EXPIRY_KEY })
    if (expiry && Date.now() > Number(expiry)) {
      await clearToken()
      error.value = 'Session expired. Sign in again.'
      return
    }

    const { value } = await Preferences.get({ key: TOKEN_KEY })
    if (!value) return
    setAuthToken(value)
    await loadUser()
  }

  async function signIn(token: string, expiresAt?: number) {
    const clean = token.trim()
    if (!clean) {
      error.value = 'Enter a personal access token.'
      return
    }
    if (expiresAt) {
      await Preferences.set({ key: EXPIRY_KEY, value: String(expiresAt) })
    } else {
      await Preferences.remove({ key: EXPIRY_KEY })
    }
    await Preferences.set({ key: TOKEN_KEY, value: clean })
    setAuthToken(clean)
    await loadUser()
    if (user.value) {
      rememberAccount({
        id: user.value.id,
        username: user.value.username,
        avatar_url: user.value.avatar_url,
        token: clean,
        expiresAt,
      })
    }
  }

  async function switchAccount(id: string) {
    const account = accounts.value.find((item) => item.id === id)
    if (!account) return
    if (account.expiresAt && Date.now() > account.expiresAt) {
      error.value = 'That session expired. Sign in again.'
      forgetAccount(account.id)
      return
    }

    if (account.expiresAt) {
      await Preferences.set({ key: EXPIRY_KEY, value: String(account.expiresAt) })
    } else {
      await Preferences.remove({ key: EXPIRY_KEY })
    }
    await Preferences.set({ key: TOKEN_KEY, value: account.token })
    setAuthToken(account.token)
    await loadUser()
  }

  async function signOut() {
    const id = user.value?.id
    await clearToken()
    if (id) forgetAccount(id)
    error.value = ''
  }

  return { user, loading, error, accounts, currentAccount, restore, signIn, switchAccount, signOut }
}
