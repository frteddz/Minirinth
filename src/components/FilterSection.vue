<script setup lang="ts">
import ChevronIcon from './ChevronIcon.vue'

defineProps<{ title: string }>()
</script>

<template>
  <section class="filter-accordion is-open">
    <div class="filter-accordion__head">
      <span>{{ title }}</span>
      <ChevronIcon :open="true" />
    </div>
    <div class="filter-accordion__body">
      <slot />
    </div>
  </section>
</template>
