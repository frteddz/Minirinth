<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import Card from '../ui/components/Card.vue'
import Button from '../ui/components/buttons/Button.vue'
import { useAuth } from '../composables/useAuth'

const router = useRouter()
const { user, error, signIn } = useAuth()
const token = ref('')

async function submit() {
  await signIn(token.value)
  if (user.value) {
    token.value = ''
    router.push('/profile')
  }
}
</script>

<template>
  <section class="page login">
    <Card>
      <template #header>
        <h1 class="page__title">Sign in</h1>
      </template>

      <p class="login__intro">
        Minirinth uses a Modrinth personal access token to read your account. It never asks for your password.
      </p>

      <div class="login__section">
        <h2>What it uses the token for</h2>
        <ul class="login__list">
          <li>Showing your username, avatar and bio.</li>
          <li>Loading the projects you have published on Modrinth.</li>
          <li>Letting you sign out and forget the token on this device.</li>
        </ul>
      </div>

      <div class="login__section">
        <h2>What it will not do</h2>
        <ul class="login__list">
          <li>No installing or launching Minecraft.</li>
          <li>No publishing, editing or deleting your projects.</li>
          <li>No reading your email or private messages.</li>
          <li>No sending your token anywhere except the Modrinth API.</li>
        </ul>
      </div>

      <div class="login__section">
        <h2>Keeping it safe</h2>
        <p class="login__text">
          The token is stored on this device only. You can revoke it any time in your Modrinth settings, and signing out removes it from the app.
        </p>
      </div>

      <div class="login__form">
        <p class="login__label">Create a token with the Read user data scope, then paste it here.</p>
        <input
          v-model="token"
          type="password"
          class="profile__input"
          placeholder="Personal access token"
          aria-label="Personal access token"
          autocomplete="off"
          @keyup.enter="submit"
        />
        <p v-if="error" class="profile__error">{{ error }}</p>
        <div class="profile__actions">
          <Button type="colored" color="green" :disabled="token.length === 0" @click="submit">
            Sign in
          </Button>
        </div>
        <a
          class="profile__link"
          href="https://modrinth.com/settings/account"
          target="_blank"
          rel="noopener"
        >
          Open Modrinth token settings
        </a>
      </div>
    </Card>

    <div class="profile__actions">
      <Button type="quiet" @click="router.push('/profile')">Back to profile</Button>
    </div>
  </section>
</template>
