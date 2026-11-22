import { App } from '@capacitor/app'
import { Browser } from '@capacitor/browser'
import { Capacitor } from '@capacitor/core'
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuth } from './useAuth'

export const AUTH_WORKER_URL = 'https://minirynth-auth.erver-ay.workers.dev/start'

export function useOAuth() {
  const router = useRouter()
  const { user, signIn } = useAuth()
  const busy = ref(false)
  const error = ref('')

  async function handleCallback(url: string) {
    error.value = ''
    const callback = new URL(url)
    const isNativeCallback =
      callback.protocol === 'minirynth:' &&
      callback.host === 'oauth' &&
      callback.pathname === '/callback'
    const isWebCallback = callback.pathname === '/oauth/callback'
    if (!isNativeCallback && !isWebCallback) return false

    const token = callback.searchParams.get('token')
    const expiresIn = Number(callback.searchParams.get('expires_in') ?? 0)
    if (!token) {
      error.value = 'No sign in token was returned. Try signing in again.'
      return false
    }

    try {
      if (Capacitor.isNativePlatform()) await Browser.close()
      const expiresAt = expiresIn > 0 ? Date.now() + expiresIn * 1000 : undefined
      await signIn(token, expiresAt)
      if (!user.value) {
        error.value = 'Could not sign in with that token.'
        return false
      }
      router.push('/profile')
      return true
    } catch (cause) {
      error.value = cause instanceof Error ? cause.message : 'Could not finish signing in.'
      return false
    }
  }

  function listenForCallback() {
    if (!Capacitor.isNativePlatform()) return () => {}
    const handle = App.addListener('appUrlOpen', ({ url }) => {
      void handleCallback(url)
    })
    return () => {
      void handle.then((listener) => listener.remove())
    }
  }

  async function start() {
    busy.value = true
    error.value = ''
    try {
      if (Capacitor.isNativePlatform()) {
        await Browser.open({ url: AUTH_WORKER_URL, presentationStyle: 'fullscreen' })
      } else {
        window.location.href = `${AUTH_WORKER_URL}?web=1`
      }
    } catch (cause) {
      error.value = cause instanceof Error ? cause.message : 'Could not open Modrinth sign in.'
    } finally {
      busy.value = false
    }
  }

  return { busy, error, start, listenForCallback, handleCallback }
}
