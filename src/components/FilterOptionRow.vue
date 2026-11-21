<script setup lang="ts">
import { Ban, Check } from '@lucide/vue'
import { useCategoryFilters, type SelectionGroup } from '../composables/useCategoryFilters'
import { tagIconSvg } from '../data/tag-icons'

const props = withDefaults(
  defineProps<{
    group: SelectionGroup
    value: string
    allowExclude?: boolean
    icon?: string
  }>(),
  { allowExclude: true, icon: undefined },
)

const { toggleSelection, selectionOf } = useCategoryFilters()
</script>

<template>
  <div class="filter-option">
    <span
      v-if="props.icon"
      class="filter-option__icon"
      aria-hidden="true"
      v-html="tagIconSvg(props.icon)"
    ></span>
    <span class="filter-option__label">{{ props.value }}</span>
    <button
      type="button"
      class="filter-option__action"
      :class="{ 'is-included': selectionOf(props.group, props.value) === 'include' }"
      :aria-label="`Include ${props.value}`"
      @click="toggleSelection(props.group, props.value, 'include')"
    >
      <Check :size="16" :stroke-width="2" />
    </button>
    <button
      v-if="props.allowExclude"
      type="button"
      class="filter-option__action"
      :class="{ 'is-excluded': selectionOf(props.group, props.value) === 'exclude' }"
      :aria-label="`Exclude ${props.value}`"
      @click="toggleSelection(props.group, props.value, 'exclude')"
    >
      <Ban :size="16" :stroke-width="2" />
    </button>
  </div>
</template>
