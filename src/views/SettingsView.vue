<script setup lang="ts">
import Card from '../ui/components/Card.vue'
import packageInfo from '../../package.json'
import { useTheme } from '../composables/useTheme'
import { useNotificationSettings } from '../composables/useNotificationSettings'
import type { NotificationSoundId } from '../utils/notification-sound'

const { themes, theme, setTheme } = useTheme()
const version = `${packageInfo.version}-dev The Creators Update`
const {
  settings: soundSettings,
  soundOptions,
  setEnabled,
  setVolume,
  volumePercent,
  testing,
  playTest,
  reset: resetSounds,
} = useNotificationSettings()

function onVolumeInput(id: NotificationSoundId, event: Event) {
  setVolume(id, Number((event.target as HTMLInputElement).value))
}
</script>

<template>
  <section class="page settings">
    <Card>
      <template #header>
        <h1 class="page__title">Settings</h1>
      </template>

      <div class="settings__section">
        <h2 class="settings__heading">Themes</h2>
        <p class="settings__hint">Pick how Minirynth looks on this device.</p>

        <div class="settings__themes">
          <button
            v-for="option in themes"
            :key="option.id"
            type="button"
            class="settings__theme"
            :class="{ 'is-active': theme === option.id }"
            :aria-pressed="theme === option.id"
            @click="setTheme(option.id)"
          >
            <span class="settings__swatch" :style="{ backgroundColor: option.bg }">
              <span class="settings__swatch-accent" :style="{ backgroundColor: option.accent }"></span>
            </span>
            <span class="settings__theme-copy">
              <span class="settings__theme-name">{{ option.name }}</span>
              <span class="settings__theme-description">{{ option.description }}</span>
            </span>
            <svg
              v-if="theme === option.id"
              class="settings__check"
              xmlns="http://www.w3.org/2000/svg"
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2.5"
              stroke-linecap="round"
              stroke-linejoin="round"
              aria-hidden="true"
            >
              <path d="M20 6 9 17l-5-5" />
            </svg>
          </button>
        </div>
      </div>

      <div class="settings__section">
        <h2 class="settings__heading">Notifications</h2>
        <p class="settings__hint">Turn sounds on or off and set how loud each one plays.</p>

        <div class="settings__sounds">
          <div v-for="option in soundOptions" :key="option.id" class="settings__sound">
            <div class="settings__sound-head">
              <span class="settings__sound-copy">
                <span class="settings__sound-name">{{ option.name }}</span>
                <span class="settings__sound-description">{{ option.description }}</span>
              </span>
              <button
                type="button"
                class="settings__switch"
                :class="{ 'is-on': soundSettings[option.id].enabled }"
                role="switch"
                :aria-checked="soundSettings[option.id].enabled"
                :aria-label="`Enable ${option.name} sound`"
                @click="setEnabled(option.id, !soundSettings[option.id].enabled)"
              >
                <span class="settings__switch-thumb"></span>
              </button>
            </div>
            <div
              class="settings__sound-controls"
              :class="{ 'is-disabled': !soundSettings[option.id].enabled }"
            >
              <input
                class="settings__volume"
                type="range"
                min="0"
                max="1"
                step="0.05"
                :value="soundSettings[option.id].volume"
                :style="{ '--value': soundSettings[option.id].volume }"
                :aria-label="`${option.name} volume`"
                :disabled="!soundSettings[option.id].enabled"
                @input="onVolumeInput(option.id, $event)"
              />
              <span class="settings__volume-value">{{ volumePercent(option.id) }}%</span>
              <button
                type="button"
                class="settings__test"
                :disabled="!soundSettings[option.id].enabled || testing[option.id]"
                @click="playTest(option.id)"
              >
                {{ testing[option.id] ? 'Wait' : 'Test' }}
              </button>
            </div>
          </div>
        </div>

        <button type="button" class="settings__reset" @click="resetSounds">Reset sounds</button>
      </div>

      <div class="settings__section">
        <h2 class="settings__heading">About</h2>
        <div class="settings__about">
          <div class="settings__about-row">
            <span>Minirynth</span>
            <span>Unofficial mobile port for Modrinth</span>
          </div>
          <div class="settings__about-row">
            <span>Version</span>
            <span>{{ version }}</span>
          </div>
          <a class="settings__link" href="https://modrinth.com" target="_blank" rel="noopener">
            Powered by the Modrinth API
          </a>
          <a
            class="settings__link"
            href="https://github.com/frteddz/Minirynth"
            target="_blank"
            rel="noopener"
          >
            GitHub repository
          </a>
          <p class="settings__note">
            GPLv3. Base styles and components from Modrinth stay GPLv3.
          </p>
          <p class="settings__note">Formerly Minirinth.</p>
        </div>
      </div>
    </Card>

    <RouterLink to="/credits" class="settings__credits-link">Credits</RouterLink>
  </section>
</template>
