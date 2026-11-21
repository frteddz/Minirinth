<script setup lang="ts">
import { nextTick, onMounted, onUnmounted, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import Button from '../ui/components/buttons/Button.vue'
import logo from '../assets/logo/minirynth-lockup.svg'

const router = useRouter()

const words = ['mods', 'shaders', 'resource packs', 'data packs', 'modpacks', 'plugins']
const wordPaths = [
  '/mods',
  '/shaders',
  '/resource-packs',
  '/data-packs',
  '/modpacks',
  '/plugins',
]
const index = ref(0)
const previousIndex = ref(0)
const wordRefs = ref<HTMLElement[]>([])
const rollWidth = ref(0)
const ready = ref(false)

let timer: ReturnType<typeof setInterval> | undefined

async function measure() {
  await nextTick()
  const element = wordRefs.value[index.value]
  if (element) rollWidth.value = element.offsetWidth
}

watch(index, (_next, prev) => {
  previousIndex.value = prev
  measure()
})

onMounted(() => {
  measure().then(() => {
    ready.value = true
  })
  timer = setInterval(() => {
    index.value = (index.value + 1) % words.length
  }, 1800)
})

onUnmounted(() => {
  if (timer) clearInterval(timer)
})

function discover() {
  router.push(wordPaths[index.value])
}
</script>

<template>
  <section class="page home">
    <img class="home-lockup" :src="logo" alt="Minirynth" />
    <p class="page__lead">Your favourite Minecraft content, wherever you go.</p>
    <p class="home-subtitle">Browse mods, shaders, resource packs and more.</p>

    <div class="page__actions">
      <Button type="colored" color="green" @click="discover">
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-compass preview-icon"><circle cx="12" cy="12" r="10"/><path d="m16.24 7.76-1.804 5.411a2 2 0 0 1-1.265 1.265L7.76 16.24l1.804-5.411a2 2 0 0 1 1.265-1.265z"/></svg>
        Discover
        <span class="word-roll" :class="{ 'is-ready': ready }" :style="{ width: `${rollWidth}px` }">
          <span
            v-for="(word, i) in words"
            :key="word"
            :ref="(el) => { if (el) wordRefs[i] = el as HTMLElement }"
            class="word-roll__word"
            :class="{ 'is-current': i === index, 'is-leaving': i === previousIndex && i !== index }"
            :aria-hidden="i !== index"
          >
            {{ word }}
          </span>
        </span>
      </Button>
    </div>
  </section>
</template>
