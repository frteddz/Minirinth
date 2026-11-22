import { ref } from 'vue'

export const themes = [
  { id: 'mint', name: 'Mint', description: 'Dark gray with green', bg: '#1b1b1b', accent: '#1bd964' },
  { id: 'pitch', name: 'Pitch', description: 'Pure black OLED', bg: '#000000', accent: '#1bd964' },
  { id: 'paper', name: 'Paper', description: 'Warm off-white', bg: '#f7f3ea', accent: '#15803d' },
  { id: 'matcha', name: 'Matcha', description: 'Muted sage green', bg: '#1f2a22', accent: '#a3c98b' },
  { id: 'cobalt', name: 'Cobalt', description: 'Rich navy blue', bg: '#0f1a32', accent: '#6e9bff' },
  { id: 'espresso', name: 'Espresso', description: 'Warm deep brown', bg: '#221913', accent: '#d7a26b' },
  { id: 'terracotta', name: 'Terracotta', description: 'Earthy clay rust', bg: '#2a1d19', accent: '#e0815c' },
  { id: 'plum', name: 'Plum', description: 'Deep muted purple', bg: '#211a2b', accent: '#b98be0' },
] as const

export type ThemeId = (typeof themes)[number]['id']

const THEME_KEY = 'minirynth.theme'

function isThemeId(value: string | null): value is ThemeId {
  return themes.some((item) => item.id === value)
}

export function storedTheme(): ThemeId {
  try {
    const value = localStorage.getItem(THEME_KEY)
    if (isThemeId(value)) return value
  } catch {
    void 0
  }
  return 'mint'
}

const theme = ref<ThemeId>(storedTheme())

export function applyTheme(id: ThemeId) {
  const selected = themes.find((item) => item.id === id) ?? themes[0]
  theme.value = selected.id
  document.documentElement.dataset.theme = selected.id
  document.querySelector('meta[name="theme-color"]')?.setAttribute('content', selected.bg)
  try {
    localStorage.setItem(THEME_KEY, selected.id)
  } catch {
    void 0
  }
}

export function useTheme() {
  return { themes, theme, setTheme: applyTheme }
}
