<script setup lang="ts">
import { reactive, ref } from 'vue'
import { X } from '@lucide/vue'
import type { ScheduleInput } from '../api/client'

const props = defineProps<{ title: string; saving?: boolean; error?: string }>()
const emit = defineEmits<{ close: []; scheduled: [input: ScheduleInput] }>()

const statuses = ['approved', 'unlisted', 'private', 'draft', 'archived'] as const
const validationError = ref('')

function localDateTime(date: Date) {
  const offset = date.getTimezoneOffset() * 60_000
  return new Date(date.getTime() - offset).toISOString().slice(0, 16)
}

const form = reactive({
  time: localDateTime(new Date(Date.now() + 60 * 60 * 1000)),
  status: 'approved' as (typeof statuses)[number],
})

function close() {
  if (!props.saving) emit('close')
}

function submit() {
  const time = new Date(form.time)
  if (Number.isNaN(time.getTime())) {
    validationError.value = 'Pick a date and time.'
    return
  }
  if (time.getTime() <= Date.now()) {
    validationError.value = 'Pick a time in the future.'
    return
  }
  validationError.value = ''
  emit('scheduled', {
    time: time.toISOString(),
    requested_status: form.status,
  })
}
</script>

<template>
  <Teleport to="body">
    <Transition name="pop">
      <div class="download-overlay edit-overlay" @click.self="close">
        <div
          class="download-dialog edit-dialog"
          role="dialog"
          aria-modal="true"
          :aria-label="props.title"
        >
          <header class="download-dialog__header">
            <h2>{{ props.title }}</h2>
            <button type="button" aria-label="Close schedule dialog" @click="close">
              <X :size="24" :stroke-width="2.5" />
            </button>
          </header>

          <div class="edit-dialog__body">
            <label class="edit-field">
              <span>Date and time</span>
              <input v-model="form.time" type="datetime-local" />
            </label>
            <label class="edit-field">
              <span>Status after release</span>
              <select v-model="form.status">
                <option v-for="status in statuses" :key="status" :value="status">
                  {{ status }}
                </option>
              </select>
            </label>
            <p class="schedule-dialog__note">Times are in your local timezone.</p>
            <p v-if="props.error || validationError" class="edit-dialog__error">
              {{ props.error || validationError }}
            </p>

            <div class="edit-dialog__actions">
              <button type="button" class="edit-dialog__cancel" :disabled="props.saving" @click="close">
                Cancel
              </button>
              <button type="button" class="edit-dialog__save" :disabled="props.saving" @click="submit">
                {{ props.saving ? 'Scheduling...' : 'Schedule' }}
              </button>
            </div>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>
