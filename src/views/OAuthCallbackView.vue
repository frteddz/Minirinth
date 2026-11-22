<script setup lang="ts">
import { onMounted, ref } from 'vue'
import Card from '../ui/components/Card.vue'
import { useOAuth } from '../composables/useOAuth'

const { handleCallback, error } = useOAuth()
const message = ref('Signing you in...')

onMounted(async () => {
  const token = new URL(window.location.href).searchParams.get('token')
  if (!token) {
    message.value = 'No sign in token was returned. Try signing in again.'
    return
  }
  const signedIn = await handleCallback(window.location.href)
  if (!signedIn && error.value) message.value = error.value
})
</script>

<template>
  <section class="page oauth-callback">
    <Card>
      <template #header>
        <h1 class="page__title">Sign in</h1>
      </template>
      <p class="oauth-callback__message">{{ message }}</p>
    </Card>
  </section>
</template>
