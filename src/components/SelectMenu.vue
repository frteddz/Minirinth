<script setup lang="ts">
import { Check, Search } from '@lucide/vue'
import { computed, onUnmounted, ref } from 'vue'
import ChevronIcon from './ChevronIcon.vue'

const props = defineProps<{
  modelValue: string | number
  options: (string | number)[]
  prefix: string
  searchable?: boolean
  showAllToggle?: boolean
  toggleLabel?: string
}>()

const emit = defineEmits<{ 'update:modelValue': [value: string | number] }>()

const open = ref(false)
const button = ref<HTMLElement | null>(null)
const popover = ref<HTMLElement | null>(null)
const position = ref({ top: 0, left: 0, width: 0 })
const query = ref('')
const searchInput = ref<HTMLInputElement | null>(null)
const showAll = ref(false)

const filteredOptions = computed(() => {
  let result = props.options
  if (props.showAllToggle && !showAll.value) {
    result = result.filter((option) => {
      const value = String(option)
      return !value.includes('-') && !/^\d+w\d/.test(value)
    })
  }
  const term = query.value.trim().toLowerCase()
  if (!term) return result
  return result.filter((option) => String(option).toLowerCase().includes(term))
})

function onOutside(event: PointerEvent) {
  const target = event.target as Node
  if (button.value?.contains(target) || popover.value?.contains(target)) return
  close()
}

function close() {
  open.value = false
  window.removeEventListener('pointerdown', onOutside, true)
}

function toggle() {
  if (open.value) {
    close()
    return
  }
  const rect = button.value?.getBoundingClientRect()
  if (!rect) return
  position.value = { top: rect.bottom + 4, left: rect.left, width: rect.width }
  query.value = ''
  open.value = true
  window.addEventListener('pointerdown', onOutside, true)
}

function onSearchEnter() {
  searchInput.value?.blur()
}

function choose(option: string | number) {
  emit('update:modelValue', option)
  close()
}

onUnmounted(close)
</script>

<template>
  <div class="select-menu">
    <button
      ref="button"
      type="button"
      class="category__select select-menu__button"
      :aria-expanded="open"
      @click="toggle"
    >
      <span class="select-menu__button-text">
        <span class="select-menu__label">{{ props.prefix }}</span>
        <span class="select-menu__value">{{ props.modelValue }}</span>
      </span>
      <ChevronIcon :open="open" />
    </button>

    <Teleport to="body">
      <div
        v-if="open"
        ref="popover"
        class="select-menu__popover"
        :style="{ top: `${position.top}px`, left: `${position.left}px`, width: `${position.width}px` }"
      >
        <label v-if="searchable" class="select-menu__search">
          <Search :size="16" :stroke-width="2" aria-hidden="true" />
          <input
            ref="searchInput"
            v-model="query"
            type="search"
            placeholder="Search..."
            aria-label="Search options"
            enterkeyhint="done"
            @keydown.enter.prevent="onSearchEnter"
          />
        </label>
        <button
          v-if="showAllToggle"
          type="button"
          class="select-menu__toggle"
          :class="{ 'is-active': showAll }"
          :aria-pressed="showAll"
          @click="showAll = !showAll"
        >
          <Check v-if="showAll" :size="14" :stroke-width="2.5" />
          {{ props.toggleLabel ?? 'Show all' }}
        </button>
        <p v-if="filteredOptions.length === 0" class="select-menu__empty">No matches</p>
        <button
          v-for="option in filteredOptions"
          :key="option"
          type="button"
          class="select-menu__option"
          :class="{ 'is-selected': option === props.modelValue }"
          @click="choose(option)"
        >
          <span>{{ option }}</span>
          <Check v-if="option === props.modelValue" :size="16" :stroke-width="2.5" />
        </button>
      </div>
    </Teleport>
  </div>
</template>
