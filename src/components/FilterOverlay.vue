<script setup lang="ts">
import { Ban, Check, X } from '@lucide/vue'
import { computed, onMounted, onUnmounted, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import FilterOptionRow from './FilterOptionRow.vue'
import FilterSection from './FilterSection.vue'
import {
  advancedExclusions,
  allCategories,
  allLoaders,
  dataPackReleases,
  dataPackSpecialVersions,
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
import { useCategoryFilters } from '../composables/useCategoryFilters'
import { getGameVersions, type GameVersionTag } from '../api/client'
import { tagIconSvg } from '../data/tag-icons'
import infoIcon from '../assets/icons/info.svg?raw'

const {
  state,
  filterOpen,
  closeFilter,
  toggleVersion,
  toggleExclusion,
} = useCategoryFilters()

watch(filterOpen, (open) => {
  document.body.style.overflow = open ? 'hidden' : ''
})

onUnmounted(() => {
  document.body.style.overflow = ''
})

const route = useRoute()
const isShader = computed(() => route.path === '/shaders')
const isPack = computed(() => route.path === '/resource-packs')
const isDataPack = computed(() => route.path === '/data-packs')
const isModpack = computed(() => route.path === '/modpacks')
const isPlugin = computed(() => route.path === '/plugins')

const categoryOptions = computed(() => {
  if (isShader.value) return shaderCategories
  if (isPack.value) return packCategories
  if (isModpack.value) return modpackCategories
  return allCategories
})

const featureOptions = computed(() => (isShader.value ? shaderFeatures : packFeatures))

const visibleLoaders = computed(() => {
  if (isShader.value) return shaderLoaders
  if (isModpack.value) return primaryLoaders
  if (isPlugin.value) {
    return state.showAllLoaders ? [...pluginPrimaryLoaders, ...pluginMoreLoaders] : pluginPrimaryLoaders
  }
  return state.showAllLoaders ? allLoaders : primaryLoaders
})

const gameVersionTags = ref<GameVersionTag[]>([])

onMounted(() => {
  void getGameVersions()
    .then((tags) => {
      gameVersionTags.value = tags
    })
    .catch(() => {
      void 0
    })
})

function isDataPackVersion(version: string) {
  const match = /^(\d+)\.(\d+)/.exec(version)
  if (!match) return false
  const major = Number(match[1])
  const minor = Number(match[2])
  return major > 1 || (major === 1 && minor >= 13)
}

const visibleVersions = computed(() => {
  const term = state.versionQuery.trim().toLowerCase()
  let base: string[]
  let extras: string[]

  if (gameVersionTags.value.length) {
    const releaseVersions = gameVersionTags.value
      .filter((tag) => tag.version_type === 'release')
      .map((tag) => tag.version)
    const otherVersions = gameVersionTags.value
      .filter((tag) => tag.version_type !== 'release')
      .map((tag) => tag.version)
    base = isDataPack.value ? releaseVersions.filter(isDataPackVersion) : releaseVersions
    extras = isDataPack.value ? otherVersions.filter(isDataPackVersion) : otherVersions
  } else {
    base = isDataPack.value ? dataPackReleases : releases
    extras = isDataPack.value ? dataPackSpecialVersions : specialVersions
  }

  const list = state.showAllVersions ? [...base, ...extras] : base
  return list.filter((version) => version.toLowerCase().includes(term))
})

const dependencyQuery = ref('')
const visibleDependencies = computed(() => {
  const term = dependencyQuery.value.trim().toLowerCase()
  return pluginDependencies.filter((item) => item.toLowerCase().includes(term))
})
</script>

<template>
  <Transition name="pop">
    <div v-if="filterOpen" class="overlay overlay--filter" @click.self="closeFilter">
      <div class="filter-sheet card" role="dialog" aria-modal="true" aria-label="Filters">
        <header class="filter-sheet__header">
          <h2>Filters</h2>
          <button type="button" aria-label="Close filters" @click="closeFilter">
            <X :size="20" :stroke-width="2" />
          </button>
        </header>

        <div class="filter-sheet__body">
          <FilterSection
            title="Game version"
          >
            <input
              v-model="state.versionQuery"
              type="search"
              class="filter-search"
              placeholder="Search..."
              aria-label="Search game versions"
            />
            <div class="filter-version-list">
              <div v-for="version in visibleVersions" :key="version" class="filter-option">
                <span class="filter-option__label">{{ version }}</span>
                <button
                  type="button"
                  class="filter-option__action"
                  :class="{ 'is-included': state.versions.includes(version) }"
                  :aria-label="`Select ${version}`"
                  @click="toggleVersion(version)"
                >
                  <Check :size="16" :stroke-width="2" />
                </button>
              </div>
            </div>
            <label class="filter-check filter-check--toggle">
              <input v-model="state.showAllVersions" type="checkbox" />
              Show all versions
            </label>
          </FilterSection>

          <FilterSection
            v-if="!isPack && !isDataPack"
            title="Loader"
          >
            <FilterOptionRow
              v-for="item in visibleLoaders"
              :key="item"
              group="loaders"
              :value="item"
              :icon="item"
            />
            <button
              v-if="!isShader && !isModpack"
              type="button"
              class="filter-show-more"
              @click="state.showAllLoaders = !state.showAllLoaders"
            >
              {{ isPlugin
                ? state.showAllLoaders ? 'Show fewer' : 'Show more'
                : state.showAllLoaders ? 'Show fewer' : 'Show all loaders' }}
            </button>
          </FilterSection>

          <FilterSection
            v-if="isShader || isPack"
            title="Feature"
          >
            <FilterOptionRow
              v-for="item in featureOptions"
              :key="item"
              group="features"
              :value="item"
              :icon="item"
            />
          </FilterSection>

          <FilterSection
            v-if="isShader"
            title="Performance Impact"
          >
            <FilterOptionRow
              v-for="item in shaderPerformance"
              :key="item"
              group="performance"
              :value="item"
              :icon="item"
            />
          </FilterSection>

          <FilterSection
            v-if="isPack"
            title="Resolution"
          >
            <FilterOptionRow
              v-for="item in packResolutions"
              :key="item"
              group="resolution"
              :value="item"
              bold-prefix
            />
          </FilterSection>

          <FilterSection
            title="Category"
          >
            <FilterOptionRow
              v-for="item in categoryOptions"
              :key="item"
              group="categories"
              :value="item"
              :icon="item"
            />
          </FilterSection>

          <FilterSection
            v-if="isPlugin"
            title="Platform"
          >
            <FilterOptionRow
              v-for="item in pluginPlatforms"
              :key="item"
              group="platforms"
              :value="item"
              :icon="item"
            />
          </FilterSection>

          <FilterSection
            v-if="isPlugin"
            title="Depends on"
          >
            <input
              v-model="dependencyQuery"
              type="search"
              class="filter-search"
              placeholder="Search for a project..."
              aria-label="Search dependencies"
            />
            <FilterOptionRow
              v-for="item in visibleDependencies"
              :key="item"
              group="dependencies"
              :value="item"
            />
          </FilterSection>

          <FilterSection
            v-if="!isShader && !isPack && !isDataPack && !isPlugin"
            title="Environment"
          >
            <FilterOptionRow
              v-for="item in ['Client', 'Server']"
              :key="item"
              group="environments"
              :value="item"
              :icon="item"
              :allow-exclude="false"
            />
          </FilterSection>

          <FilterSection
            title="License"
          >
            <div class="filter-option">
              <span
                class="filter-option__icon filter-option__icon--large"
                aria-hidden="true"
                v-html="tagIconSvg('Open source')"
              ></span>
              <span class="filter-option__label">Open source</span>
              <button
                type="button"
                class="filter-option__action"
                :class="{ 'is-included': state.openSourceOnly }"
                aria-label="Open source licenses only"
                @click="state.openSourceOnly = !state.openSourceOnly"
              >
                <Check :size="16" :stroke-width="2" />
              </button>
            </div>
          </FilterSection>

          <FilterSection
            title="Advanced exclusions"
          >
            <p class="filter-note">
              <span class="filter-note__icon" aria-hidden="true" v-html="infoIcon"></span>
              <span>Saved on this device. Anything you hide stays hidden until you turn it back on.</span>
            </p>
            <div v-for="item in advancedExclusions" :key="item" class="filter-option">
              <span
                class="filter-option__icon"
                aria-hidden="true"
                v-html="tagIconSvg(item)"
              ></span>
              <span class="filter-option__label">{{ item }}</span>
              <button
                type="button"
                class="filter-option__action"
                :class="{ 'is-excluded': state.exclusions.includes(item) }"
                :aria-label="`Exclude ${item}`"
                @click="toggleExclusion(item)"
              >
                <Ban :size="16" :stroke-width="2" />
              </button>
            </div>
          </FilterSection>
        </div>
      </div>
    </div>
  </Transition>
</template>
