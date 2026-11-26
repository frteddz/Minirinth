import { ref, watch } from 'vue'

export type DisplayMode = 'cards' | 'showcase'

const STORAGE_KEY = 'minirynth.display-mode'

function loadMode(): DisplayMode {
  try {
    return localStorage.getItem(STORAGE_KEY) === 'showcase' ? 'showcase' : 'cards'
  } catch {
    return 'cards'
  }
}

const mode = ref<DisplayMode>(loadMode())

watch(mode, (value) => {
  try {
    localStorage.setItem(STORAGE_KEY, value)
  } catch {
    void 0
  }
})

export function useDisplayMode() {
  function cycle() {
    mode.value = mode.value === 'cards' ? 'showcase' : 'cards'
  }

  return { mode, cycle }
}
