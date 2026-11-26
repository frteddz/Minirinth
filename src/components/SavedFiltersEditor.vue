<script setup lang="ts">
import { Ban, Check, ChevronDown, ChevronRight, ChevronUp, X } from '@lucide/vue'
import { computed, onMounted, onUnmounted, ref, watch } from 'vue'
import {
  allCategories,
  modpackCategories,
  packCategories,
  packFeatures,
  packResolutions,
  pluginDependencies,
  pluginMoreLoaders,
  pluginPlatforms,
  pluginPrimaryLoaders,
  primaryLoaders,
  releases,
  shaderCategories,
  shaderFeatures,
  shaderLoaders,
  shaderPerformance,
  specialVersions,
} from '../data/categories'
import { getGameVersions, type GameVersionTag } from '../api/client'
import {
  createEmptyFilters,
  useCategoryFilters,
  type SavedFilterState,
  type SelectionGroup,
  type SelectionKind,
} from '../composables/useCategoryFilters'

interface OptionSection {
  title: string
  group: SelectionGroup
  values: string[]
}

const targets = [
  { path: '/mods', label: 'Mods' },
  { path: '/shaders', label: 'Shaders' },
  { path: '/resource-packs', label: 'Resource packs' },
  { path: '/data-packs', label: 'Data packs' },
  { path: '/modpacks', label: 'Modpacks' },
  { path: '/plugins', label: 'Plugins' },
]

const { savedDefaults, getDefaults, saveDefaults, clearDefaults } = useCategoryFilters()

function clone(value: SavedFilterState): SavedFilterState {
  return JSON.parse(JSON.stringify(value)) as SavedFilterState
}

const selected = ref(targets[0].path)
const draft = ref<SavedFilterState>(clone(getDefaults(selected.value)))
const savedMessage = ref(false)

const sections = computed<OptionSection[]>(() => {
  switch (selected.value) {
    case '/shaders':
      return [
        { title: 'Category', group: 'categories', values: shaderCategories },
        { title: 'Loader', group: 'loaders', values: shaderLoaders },
        { title: 'Feature', group: 'features', values: shaderFeatures },
        { title: 'Performance impact', group: 'performance', values: shaderPerformance },
      ]
    case '/resource-packs':
      return [
        { title: 'Category', group: 'categories', values: packCategories },
        { title: 'Feature', group: 'features', values: packFeatures },
        { title: 'Resolution', group: 'resolution', values: packResolutions },
      ]
    case '/data-packs':
      return [{ title: 'Category', group: 'categories', values: allCategories }]
    case '/modpacks':
      return [
        { title: 'Category', group: 'categories', values: modpackCategories },
        { title: 'Loader', group: 'loaders', values: primaryLoaders },
      ]
    case '/plugins':
      return [
        { title: 'Loader', group: 'loaders', values: [...pluginPrimaryLoaders, ...pluginMoreLoaders] },
        { title: 'Platform', group: 'platforms', values: pluginPlatforms },
        { title: 'Depends on', group: 'dependencies', values: pluginDependencies },
      ]
    default:
      return [
        { title: 'Category', group: 'categories', values: allCategories },
        { title: 'Loader', group: 'loaders', values: primaryLoaders },
        { title: 'Environment', group: 'environments', values: ['Client', 'Server'] },
      ]
  }
})

const expanded = ref<Record<string, boolean>>({})

function resetExpanded() {
  expanded.value = {}
  const first = sections.value[0]
  if (first) expanded.value[first.group] = true
}

resetExpanded()

watch(selected, (path) => {
  draft.value = clone(getDefaults(path))
  savedMessage.value = false
  versionsOpen.value = false
  resetExpanded()
})

const versionsOpen = ref(false)
const versionQuery = ref('')
const showAllVersions = ref(false)
const gameVersionTags = ref<GameVersionTag[]>([])
const isDataPack = computed(() => selected.value === '/data-packs')

onMounted(() => {
  void getGameVersions()
    .then((tags) => {
      gameVersionTags.value = tags
    })
    .catch(() => {
      void 0
    })
})

onUnmounted(() => {
  document.body.style.overflow = ''
})

watch(versionsOpen, (open) => {
  document.body.style.overflow = open ? 'hidden' : ''
})

function isDataPackVersion(version: string) {
  const match = /^(\d+)\.(\d+)/.exec(version)
  if (!match) return false
  const major = Number(match[1])
  const minor = Number(match[2])
  return major > 1 || (major === 1 && minor >= 13)
}

const visibleVersions = computed(() => {
  const term = versionQuery.value.trim().toLowerCase()
  let base: string[]
  let extras: string[]

  if (gameVersionTags.value.length) {
    base = gameVersionTags.value
      .filter((tag) => tag.version_type === 'release')
      .map((tag) => tag.version)
    extras = gameVersionTags.value
      .filter((tag) => tag.version_type !== 'release')
      .map((tag) => tag.version)
  } else {
    base = releases
    extras = specialVersions
  }

  if (isDataPack.value) {
    base = base.filter(isDataPackVersion)
    extras = extras.filter(isDataPackVersion)
  }

  const list = showAllVersions.value ? [...base, ...extras] : base
  return list.filter((version) => version.toLowerCase().includes(term))
})

const hasSaved = computed(() => Boolean(savedDefaults.value[selected.value]))
const currentLabel = computed(
  () => targets.find((target) => target.path === selected.value)?.label ?? 'category',
)

const summary = computed(() => {
  const included = sections.value.reduce((total, section) => total + draft.value[section.group].length, 0)
  const hidden = sections.value.reduce((total, section) => total + draft.value.excluded[section.group].length, 0)
  const parts: string[] = []
  if (included) parts.push(`${included} included`)
  if (hidden) parts.push(`${hidden} hidden`)
  if (draft.value.versions.length) parts.push(`${draft.value.versions.length} versions`)
  if (draft.value.openSourceOnly) parts.push('open source only')
  return parts.length ? parts.join(', ') : 'Nothing set for this category yet'
})

function hasSavedFor(path: string) {
  return Boolean(savedDefaults.value[path])
}

function countFor(group: SelectionGroup, kind: SelectionKind) {
  return kind === 'include' ? draft.value[group].length : draft.value.excluded[group].length
}

function removeValue(list: string[], value: string) {
  const index = list.indexOf(value)
  if (index !== -1) list.splice(index, 1)
}

function selection(group: SelectionGroup, value: string): SelectionKind | null {
  if (draft.value[group].includes(value)) return 'include'
  if (draft.value.excluded[group].includes(value)) return 'exclude'
  return null
}

function toggle(group: SelectionGroup, value: string, kind: SelectionKind) {
  const active = kind === 'include' ? draft.value[group] : draft.value.excluded[group]
  const opposite = kind === 'include' ? draft.value.excluded[group] : draft.value[group]

  removeValue(opposite, value)
  if (active.includes(value)) removeValue(active, value)
  else active.push(value)
}

function toggleVersion(value: string) {
  if (draft.value.versions.includes(value)) removeValue(draft.value.versions, value)
  else draft.value.versions.push(value)
}

function clearDraft() {
  draft.value = createEmptyFilters()
  savedMessage.value = false
}

function save() {
  saveDefaults(selected.value, draft.value)
  savedMessage.value = true
}

function reset() {
  clearDefaults(selected.value)
  draft.value = clone(getDefaults(selected.value))
  savedMessage.value = false
}
</script>

<template>
  <div class="settings__defaults">
    <p class="settings__hint">
      Pick what loads by default when you browse each category. Saved on this device.
    </p>

    <div class="settings__default-tabs">
      <button
        v-for="target in targets"
        :key="target.path"
        type="button"
        class="settings__default-tab"
        :class="{
          'is-active': selected === target.path,
          'has-saved': hasSavedFor(target.path),
        }"
        :aria-pressed="selected === target.path"
        @click="selected = target.path"
      >
        {{ target.label }}
      </button>
    </div>

    <p class="settings__default-summary">{{ summary }}</p>

    <button type="button" class="settings__default-version-open" @click="versionsOpen = true">
      <span class="settings__default-label">Game versions</span>
      <ChevronRight :size="18" :stroke-width="2" aria-hidden="true" />
    </button>

    <div v-for="section in sections" :key="section.group" class="settings__default-group">
      <button
        type="button"
        class="settings__default-group-head"
        :aria-expanded="expanded[section.group]"
        @click="expanded[section.group] = !expanded[section.group]"
      >
        <span class="settings__default-label">{{ section.title }}</span>
        <span class="settings__default-group-count">
          {{ countFor(section.group, 'include') + countFor(section.group, 'exclude') }}
        </span>
        <ChevronUp v-if="expanded[section.group]" :size="16" :stroke-width="2" aria-hidden="true" />
        <ChevronDown v-else :size="16" :stroke-width="2" aria-hidden="true" />
      </button>

      <div v-if="expanded[section.group]" class="settings__default-options">
        <div v-for="value in section.values" :key="value" class="settings__default-option">
          <span class="settings__default-option-name">{{ value }}</span>
          <button
            type="button"
            class="settings__default-option-btn"
            :class="{ 'is-included': selection(section.group, value) === 'include' }"
            :aria-label="`Include ${value}`"
            @click="toggle(section.group, value, 'include')"
          >
            <Check :size="15" :stroke-width="2.5" />
          </button>
          <button
            type="button"
            class="settings__default-option-btn"
            :class="{ 'is-excluded': selection(section.group, value) === 'exclude' }"
            :aria-label="`Hide ${value}`"
            @click="toggle(section.group, value, 'exclude')"
          >
            <Ban :size="15" :stroke-width="2.5" />
          </button>
        </div>
      </div>
    </div>

    <div class="settings__default-flag">
      <span>Open source licenses only</span>
      <button
        type="button"
        class="settings__default-option-btn"
        :class="{ 'is-included': draft.openSourceOnly }"
        :aria-pressed="draft.openSourceOnly"
        @click="draft.openSourceOnly = !draft.openSourceOnly"
      >
        <Check :size="15" :stroke-width="2.5" />
      </button>
    </div>

    <div class="settings__default-actions">
      <button type="button" class="settings__enable" @click="save">
        Save {{ currentLabel }} filters
      </button>
      <button type="button" class="settings__reset" @click="clearDraft">Clear</button>
      <button v-if="hasSaved" type="button" class="settings__reset" @click="reset">
        Remove saved filters
      </button>
      <span v-if="savedMessage" class="settings__default-saved">
        <Check :size="14" :stroke-width="2.5" aria-hidden="true" />
        Saved
      </span>
    </div>

    <Transition name="pop">
      <div v-if="versionsOpen" class="overlay overlay--filter" @click.self="versionsOpen = false">
        <div
          class="filter-sheet card filter-sheet--versions"
          role="dialog"
          aria-modal="true"
          aria-label="Default game versions"
        >
          <header class="filter-sheet__header">
            <h2>Game versions</h2>
            <button type="button" aria-label="Close game versions" @click="versionsOpen = false">
              <X :size="20" :stroke-width="2" />
            </button>
          </header>

          <div class="filter-sheet__body">
            <input
              v-model="versionQuery"
              type="search"
              class="filter-search"
              placeholder="Search..."
              aria-label="Search game versions"
            />
            <div class="filter-version-list">
              <button
                v-for="version in visibleVersions"
                :key="version"
                type="button"
                class="settings__version-option"
                :class="{ 'is-included': draft.versions.includes(version) }"
                :aria-pressed="draft.versions.includes(version)"
                @click="toggleVersion(version)"
              >
                <span>{{ version }}</span>
                <Check :size="16" :stroke-width="2" aria-hidden="true" />
              </button>
            </div>
            <label class="filter-check filter-check--toggle">
              <input v-model="showAllVersions" type="checkbox" />
              Show all versions
            </label>
          </div>

          <footer class="settings__default-version-footer">
            <button type="button" class="settings__enable" @click="versionsOpen = false">
              Done
            </button>
          </footer>
        </div>
      </div>
    </Transition>
  </div>
</template>
