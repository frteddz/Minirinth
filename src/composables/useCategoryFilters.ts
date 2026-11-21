import { reactive, ref, watch } from 'vue'

const STORAGE_KEY = 'minirynth.advanced-exclusions'

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

function loadExclusions(): string[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? (JSON.parse(raw) as string[]) : []
  } catch {
    return []
  }
}

const filterOpen = ref(false)

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
  function clearAll() {
    const groups: SelectionGroup[] = [
      'categories', 'features', 'performance', 'resolution',
      'loaders', 'platforms', 'dependencies', 'environments',
    ]
    groups.forEach((group) => {
      state[group] = []
      state.excluded[group] = []
    })
    state.showAllLoaders = false
    state.versionQuery = ''
    state.showAllVersions = false
    state.versions = []
    state.openSourceOnly = false
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
    clearAll,
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
