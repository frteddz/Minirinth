<script setup lang="ts">
import { Check } from '@lucide/vue'
import { onUnmounted, ref } from 'vue'
import ChevronIcon from './ChevronIcon.vue'

const props = defineProps<{
  modelValue: string | number
  options: (string | number)[]
  prefix: string
}>()

const emit = defineEmits<{ 'update:modelValue': [value: string | number] }>()

const open = ref(false)
const button = ref<HTMLElement | null>(null)
const popover = ref<HTMLElement | null>(null)
const position = ref({ top: 0, left: 0, width: 0 })

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
  open.value = true
  window.addEventListener('pointerdown', onOutside, true)
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
      <span>{{ props.prefix }}: {{ props.modelValue }}</span>
      <ChevronIcon :open="open" />
    </button>

    <Teleport to="body">
      <div
        v-if="open"
        ref="popover"
        class="select-menu__popover"
        :style="{ top: `${position.top}px`, left: `${position.left}px`, width: `${position.width}px` }"
      >
        <button
          v-for="option in props.options"
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
