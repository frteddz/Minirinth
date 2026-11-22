<script setup lang="ts">
import Card from '../ui/components/Card.vue'
</script>

<template>
  <section class="page credits">
    <Card>
      <template #header>
        <h1 class="page__title">Credits</h1>
      </template>

      <p class="credits__intro">
        Minirynth stands on work from a few places. Here is where it comes from.
      </p>

      <div class="credits__section">
        <h2 class="credits__heading">Base UI</h2>
        <div class="credits__item">
          <span class="credits__name">Modrinth UI</span>
          <span class="credits__detail">
            Styles and components from the Modrinth monorepo, used under GPLv3.
          </span>
          <a class="credits__link" href="https://github.com/modrinth/code" target="_blank" rel="noopener">
            Source
          </a>
        </div>
        <div class="credits__item">
          <span class="credits__name">Modrinth API</span>
          <span class="credits__detail">Project data, search, versions and notifications.</span>
          <a class="credits__link" href="https://docs.modrinth.com" target="_blank" rel="noopener">
            Docs
          </a>
        </div>
      </div>

      <div class="credits__section">
        <h2 class="credits__heading">Icons and type</h2>
        <div class="credits__item">
          <span class="credits__name">Lucide</span>
          <span class="credits__detail">Compass needle shape in the logo, ISC license.</span>
          <a class="credits__link" href="https://lucide.dev" target="_blank" rel="noopener">Site</a>
        </div>
        <div class="credits__item">
          <span class="credits__name">Inter</span>
          <span class="credits__detail">App font, SIL Open Font License.</span>
          <a class="credits__link" href="https://rsms.me/inter/" target="_blank" rel="noopener">Site</a>
        </div>
        <div class="credits__item">
          <span class="credits__name">Simple Icons</span>
          <span class="credits__detail">A few filler icons, CC0 1.0.</span>
          <a class="credits__link" href="https://simpleicons.org" target="_blank" rel="noopener">Site</a>
        </div>
        <div class="credits__item">
          <span class="credits__name">Modrinth tag icons</span>
          <span class="credits__detail">Loader and category icons from Modrinth.</span>
          <a class="credits__link" href="https://modrinth.com" target="_blank" rel="noopener">Site</a>
        </div>
      </div>

      <div class="credits__section">
        <h2 class="credits__heading">Notification sounds</h2>
        <div class="credits__item">
          <span class="credits__name">Kagateni</span>
          <span class="credits__detail">Project approved sound.</span>
          <a
            class="credits__link"
            href="https://freesound.org/people/Kagateni/"
            target="_blank"
            rel="noopener"
          >
            Freesound
          </a>
        </div>
        <div class="credits__item">
          <span class="credits__name">heyheytheree</span>
          <span class="credits__detail">Project rejected sound.</span>
          <a
            class="credits__link"
            href="https://freesound.org/people/heyheytheree/"
            target="_blank"
            rel="noopener"
          >
            Freesound
          </a>
        </div>
        <div class="credits__item">
          <span class="credits__name">zenosounds</span>
          <span class="credits__detail">Team invitation and moderator message sounds.</span>
          <a
            class="credits__link"
            href="https://freesound.org/people/zenosounds/"
            target="_blank"
            rel="noopener"
          >
            Freesound
          </a>
        </div>
        <div class="credits__item">
          <span class="credits__name">SelectDetail57</span>
          <span class="credits__detail">Project updated sound.</span>
          <a
            class="credits__link"
            href="https://freesound.org/people/SelectDetail57/"
            target="_blank"
            rel="noopener"
          >
            Freesound
          </a>
        </div>
        <div class="credits__item">
          <span class="credits__name">yfjesse</span>
          <span class="credits__detail">Version released sound.</span>
          <a
            class="credits__link"
            href="https://freesound.org/people/yfjesse/"
            target="_blank"
            rel="noopener"
          >
            Freesound
          </a>
        </div>
        <div class="credits__item">
          <span class="credits__name">Graham Makes</span>
          <span class="credits__detail">General notification sound.</span>
          <a
            class="credits__link"
            href="https://freesound.org/people/graham_makes/"
            target="_blank"
            rel="noopener"
          >
            Freesound
          </a>
        </div>
      </div>

      <div class="credits__section">
        <h2 class="credits__heading">Tools</h2>
        <div class="credits__item">
          <span class="credits__name">Vue and Vite</span>
          <span class="credits__detail">The app itself.</span>
          <a class="credits__link" href="https://vuejs.org" target="_blank" rel="noopener">Site</a>
        </div>
        <div class="credits__item">
          <span class="credits__name">Capacitor</span>
          <span class="credits__detail">Android wrapper.</span>
          <a class="credits__link" href="https://capacitorjs.com" target="_blank" rel="noopener">Site</a>
        </div>
      </div>
    </Card>
  </section>
</template>
