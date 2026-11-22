<script setup lang="ts">
import { onMounted, reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import Card from '../ui/components/Card.vue'
import organizationIcon from '../assets/icons/organization.svg?raw'
import { useAuth } from '../composables/useAuth'
import { createOrganization, getUserOrganizations, type Organization } from '../api/client'

const router = useRouter()
const { user } = useAuth()
const organizations = ref<Organization[]>([])
const loading = ref(false)
const error = ref('')
const creating = ref(false)
const form = reactive({ name: '', slug: '', description: '' })

async function load() {
  if (!user.value) return
  loading.value = true
  error.value = ''
  try {
    organizations.value = await getUserOrganizations(user.value.id)
  } catch (cause) {
    error.value = cause instanceof Error ? cause.message : 'Could not load organizations.'
  } finally {
    loading.value = false
  }
}

async function create() {
  creating.value = true
  error.value = ''
  try {
    const org = await createOrganization({
      name: form.name.trim(),
      slug: form.slug.trim(),
      description: form.description.trim(),
    })
    form.name = ''
    form.slug = ''
    form.description = ''
    await load()
    router.push(`/organization/${org.slug}`)
  } catch (cause) {
    error.value = cause instanceof Error ? cause.message : 'Could not create this organization.'
  } finally {
    creating.value = false
  }
}

onMounted(load)
</script>

<template>
  <section class="page organizations">
    <Card>
      <template #header>
        <h1 class="organizations__title">Organizations</h1>
      </template>

      <p v-if="!user" class="organizations__message">Sign in to see your organizations.</p>

      <template v-else>
        <div class="organizations__create">
          <input v-model="form.name" type="text" placeholder="Organization name" />
          <input v-model="form.slug" type="text" placeholder="slug" />
          <input v-model="form.description" type="text" placeholder="Description" />
          <button type="button" :disabled="creating" @click="create">
            {{ creating ? 'Creating...' : 'Create organization' }}
          </button>
        </div>

        <p v-if="error" class="organizations__error">{{ error }}</p>
        <p v-else-if="loading" class="organizations__message">Loading organizations...</p>
        <p v-else-if="organizations.length === 0" class="organizations__message">
          You are not in any organizations yet.
        </p>

        <div class="organizations__list">
          <button
            v-for="org in organizations"
            :key="org.id"
            type="button"
            class="organization-row"
            @click="router.push(`/organization/${org.slug}`)"
          >
            <img v-if="org.icon_url" class="organization-row__icon" :src="org.icon_url" alt="" />
            <span
              v-else
              class="organization-row__icon organization-row__icon--fallback"
              aria-hidden="true"
              v-html="organizationIcon"
            ></span>
            <span class="organization-row__copy">
              <span class="organization-row__name">{{ org.name }}</span>
              <span class="organization-row__description">{{ org.description }}</span>
            </span>
          </button>
        </div>
      </template>
    </Card>
  </section>
</template>
