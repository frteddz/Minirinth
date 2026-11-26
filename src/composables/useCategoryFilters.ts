import { reactive, ref, watch } from 'vue'

const STORAGE_KEY = 'minirynth.advanced-exclusions'
const DEFAULTS_STORAGE_KEY = 'minirynth.default-filters'

export type SelectionGroup =
  | 'categories'
  | 'features'
  | 'performance'
  | 'resolution'
  | 'loaders'
  | 'platforms'
  | 'dependencies'
  | 'environments'

export type SelectionKind = 'include' | 'exclude'

interface ExcludedSelections {
  categories: string[]
  features: string[]
  performance: string[]
  resolution: string[]
  loaders: string[]
  platforms: string[]
  dependencies: string[]
  environments: string[]
}

export interface FilterState {
  categories: string[]
  features: string[]
  performance: string[]
  resolution: string[]
  loaders: string[]
  platforms: string[]
  dependencies: string[]
  environments: string[]
  excluded: ExcludedSelections
  showAllLoaders: boolean
  versionQuery: string
  showAllVersions: boolean
  versions: string[]
  openSourceOnly: boolean
  exclusions: string[]
}

export type SavedFilterState = Omit<FilterState, 'exclusions' | 'versionQuery'>

export function createEmptyFilters(): SavedFilterState {
  return {
    categories: [],
    features: [],
    performance: [],
    resolution: [],
    loaders: [],
    platforms: [],
    dependencies: [],
    environments: [],
    excluded: {
      categories: [],
      features: [],
      performance: [],
      resolution: [],
      loaders: [],
      platforms: [],
      dependencies: [],
      environments: [],
    },
    showAllLoaders: false,
    showAllVersions: false,
    versions: [],
    openSourceOnly: false,
  }
}

function normalizeSaved(value: SavedFilterState | undefined): SavedFilterState {
  const base = createEmptyFilters()
  if (!value) return base
  return {
    ...base,
    ...value,
    excluded: { ...base.excluded, ...value.excluded },
  }
}

function loadDefaults(): Record<string, SavedFilterState> {
  try {
    const raw = localStorage.getItem(DEFAULTS_STORAGE_KEY)
    return raw ? (JSON.parse(raw) as Record<string, SavedFilterState>) : {}
  } catch {
    return {}
  }
}

function loadExclusions(): string[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? (JSON.parse(raw) as string[]) : []
  } catch {
    return []
  }
}

const filterOpen = ref(false)
const savedDefaults = ref<Record<string, SavedFilterState>>(loadDefaults())

const state = reactive<FilterState>({
  categories: [],
  features: [],
  performance: [],
  resolution: [],
  loaders: [],
  platforms: [],
  dependencies: [],
  environments: [],
  excluded: {
    categories: [],
    features: [],
    performance: [],
    resolution: [],
    loaders: [],
    platforms: [],
    dependencies: [],
    environments: [],
  },
  showAllLoaders: false,
  versionQuery: '',
  showAllVersions: false,
  versions: [],
  openSourceOnly: false,
  exclusions: loadExclusions(),
})

watch(
  () => state.exclusions,
  (value) => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(value))
  },
  { deep: true },
)

function removeValue(list: string[], value: string) {
  const index = list.indexOf(value)
  if (index !== -1) list.splice(index, 1)
}

export function useCategoryFilters() {
  function getDefaults(path: string): SavedFilterState {
    return normalizeSaved(savedDefaults.value[path])
  }

  function persistDefaults() {
    localStorage.setItem(DEFAULTS_STORAGE_KEY, JSON.stringify(savedDefaults.value))
  }

  function saveDefaults(path: string, value: SavedFilterState) {
    savedDefaults.value = { ...savedDefaults.value, [path]: normalizeSaved(value) }
    persistDefaults()
  }

  function clearDefaults(path: string) {
    const next = { ...savedDefaults.value }
    delete next[path]
    savedDefaults.value = next
    persistDefaults()
  }

  function applyDefaults(path: string) {
    const saved = getDefaults(path)
    state.categories = [...saved.categories]
    state.features = [...saved.features]
    state.performance = [...saved.performance]
    state.resolution = [...saved.resolution]
    state.loaders = [...saved.loaders]
    state.platforms = [...saved.platforms]
    state.dependencies = [...saved.dependencies]
    state.environments = [...saved.environments]
    state.excluded = {
      categories: [...saved.excluded.categories],
      features: [...saved.excluded.features],
      performance: [...saved.excluded.performance],
      resolution: [...saved.excluded.resolution],
      loaders: [...saved.excluded.loaders],
      platforms: [...saved.excluded.platforms],
      dependencies: [...saved.excluded.dependencies],
      environments: [...saved.excluded.environments],
    }
    state.showAllLoaders = saved.showAllLoaders
    state.versionQuery = ''
    state.showAllVersions = saved.showAllVersions
    state.versions = [...saved.versions]
    state.openSourceOnly = saved.openSourceOnly
  }

  function toggleSelection(group: SelectionGroup, value: string, kind: SelectionKind) {
    const includeList = state[group]
    const excludeList = state.excluded[group]
    const active = kind === 'include' ? includeList : excludeList
    const opposite = kind === 'include' ? excludeList : includeList

    removeValue(opposite, value)
    if (active.includes(value)) removeValue(active, value)
    else active.push(value)
  }

  function selectionOf(group: SelectionGroup, value: string): SelectionKind | null {
    if (state[group].includes(value)) return 'include'
    if (state.excluded[group].includes(value)) return 'exclude'
    return null
  }

  function toggleVersion(value: string) {
    if (state.versions.includes(value)) removeValue(state.versions, value)
    else state.versions.push(value)
  }

  function toggleExclusion(value: string) {
    if (state.exclusions.includes(value)) removeValue(state.exclusions, value)
    else state.exclusions.push(value)
  }

  return {
    state,
    filterOpen,
    savedDefaults,
    getDefaults,
    saveDefaults,
    clearDefaults,
    applyDefaults,
    toggleSelection,
    selectionOf,
    toggleVersion,
    toggleExclusion,
    openFilter: () => {
      filterOpen.value = true
    },
    closeFilter: () => {
      filterOpen.value = false
    },
  }
}
