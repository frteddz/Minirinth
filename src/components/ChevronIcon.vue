<script setup lang="ts">
import chevron from '../assets/icons/chevron-down.svg?raw'

withDefaults(defineProps<{ open?: boolean }>(), { open: false })
</script>

<template>
  <span class="chevron-icon" :class="{ 'is-open': open }" aria-hidden="true" v-html="chevron"></span>
</template>
