<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ArrowLeft, ExternalLink, Trash } from '@lucide/vue'
import Card from '../ui/components/Card.vue'
import OrganizationEditDialog from '../components/OrganizationEditDialog.vue'
import organizationIcon from '../assets/icons/organization.svg?raw'
import { useAuth } from '../composables/useAuth'
import {
  addProjectToOrganization,
  addTeamMember,
  getOrganization,
  getOrganizationProjects,
  getUserById,
  joinTeam,
  leaveTeam,
  modifyTeamMember,
  removeProjectFromOrganization,
  transferTeamOwnership,
  type Organization,
  type Project,
} from '../api/client'
import { projectPath } from '../utils/project-path'

const route = useRoute()
const router = useRouter()
const { user } = useAuth()

const organization = ref<Organization | null>(null)
const projects = ref<Project[]>([])
const loading = ref(false)
const error = ref('')
const editOpen = ref(false)
const inviteQuery = ref('')
const inviting = ref(false)
const projectQuery = ref('')
const addingProject = ref(false)
const projectOwners = ref<Record<string, string>>({})
const memberRoles = ref<Record<string, string>>({})
const confirmState = ref<{
  title: string
  text: string
  action: () => Promise<void>
} | null>(null)
const confirming = ref(false)

const myMembership = computed(() =>
  organization.value?.members.find((member) => member.user.id === user.value?.id) ?? null,
)
const hasInvite = computed(() => !!myMembership.value && !myMembership.value.accepted)
const isMember = computed(() => !!myMembership.value && myMembership.value.accepted)
const canManage = computed(
  () => isMember.value && !!myMembership.value && myMembership.value.organization_permissions > 0,
)

function slug() {
  return String(route.params.slug ?? '')
}

async function load() {
  if (!slug()) return
  loading.value = true
  error.value = ''
  organization.value = null
  projects.value = []
  try {
    organization.value = await getOrganization(slug())
    projects.value = await getOrganizationProjects(slug()).catch(() => [])
    memberRoles.value = Object.fromEntries(
      organization.value.members.map((member) => [member.user.id, member.role]),
    )
  } catch (cause) {
    error.value = cause instanceof Error ? cause.message : 'Could not load this organization.'
  } finally {
    loading.value = false
  }
}

async function acceptInvite() {
  if (!organization.value) return
  try {
    await joinTeam(organization.value.team_id)
    await load()
  } catch (cause) {
    error.value = cause instanceof Error ? cause.message : 'Could not join this organization.'
  }
}

function askConfirm(title: string, text: string, action: () => Promise<void>) {
  confirmState.value = { title, text, action }
}

async function runConfirm() {
  const state = confirmState.value
  if (!state) return
  confirming.value = true
  error.value = ''
  try {
    await state.action()
    confirmState.value = null
    await load()
  } catch (cause) {
    error.value = cause instanceof Error ? cause.message : 'Could not complete that action.'
  } finally {
    confirming.value = false
  }
}

function closeConfirm() {
  if (!confirming.value) confirmState.value = null
}

function requestLeave() {
  if (!organization.value || !user.value) return
  const teamId = organization.value.team_id
  const userId = user.value.id
  askConfirm('Leave organization?', 'You will lose access to this organization.', async () => {
    await leaveTeam(teamId, userId)
    router.push('/organizations')
  })
}

function requestRemoveMember(username: string, userId: string) {
  if (!organization.value) return
  const teamId = organization.value.team_id
  askConfirm(`Remove ${username}?`, 'They will lose access to this organization.', async () => {
    await leaveTeam(teamId, userId)
  })
}

async function invite() {
  if (!organization.value) return
  const query = inviteQuery.value.trim()
  if (!query) return
  inviting.value = true
  error.value = ''
  try {
    const found = await getUserById(query)
    await addTeamMember(organization.value.team_id, found.id)
    inviteQuery.value = ''
    await load()
  } catch (cause) {
    error.value = cause instanceof Error ? cause.message : 'Could not invite that user.'
  } finally {
    inviting.value = false
  }
}

async function addProject() {
  if (!organization.value) return
  const query = projectQuery.value.trim()
  if (!query) return
  addingProject.value = true
  error.value = ''
  try {
    await addProjectToOrganization(organization.value.id, query)
    projectQuery.value = ''
    await load()
  } catch (cause) {
    error.value = cause instanceof Error ? cause.message : 'Could not add that project.'
  } finally {
    addingProject.value = false
  }
}

function requestRemoveProject(project: Project) {
  if (!organization.value || !user.value) return
  const newOwner = projectOwners.value[project.id] || user.value.id
  askConfirm(
    `Remove ${project.title}?`,
    'The project will go back to the selected owner.',
    async () => {
      if (!organization.value) return
      await removeProjectFromOrganization(organization.value.id, project.id, newOwner)
    },
  )
}

async function saveRole(userId: string) {
  if (!organization.value) return
  const role = memberRoles.value[userId]
  if (!role) return
  error.value = ''
  try {
    await modifyTeamMember(organization.value.team_id, userId, { role })
    await load()
  } catch (cause) {
    error.value = cause instanceof Error ? cause.message : 'Could not save that role.'
  }
}

function requestTransferOwnership(userId: string, username: string) {
  if (!organization.value) return
  const teamId = organization.value.team_id
  askConfirm(
    `Make ${username} owner?`,
    'You will lose ownership of this organization.',
    async () => {
      await transferTeamOwnership(teamId, userId)
    },
  )
}

function onSaved(newSlug: string) {
  editOpen.value = false
  if (newSlug && newSlug !== slug()) router.replace(`/organization/${newSlug}`)
  else load()
}

onMounted(load)
</script>

<template>
  <section class="page organization-page">
    <button type="button" class="project-page__back" @click="router.back()">
      <ArrowLeft :size="24" :stroke-width="2.5" />
      <span>Back</span>
    </button>

    <p v-if="loading" class="organizations__message">Loading organization...</p>
    <p v-else-if="error" class="organizations__error">{{ error }}</p>

    <template v-else-if="organization">
      <header class="organization-page__header">
        <img
          v-if="organization.icon_url"
          class="organization-page__icon"
          :src="organization.icon_url"
          alt=""
        />
        <span
          v-else
          class="organization-page__icon organization-page__icon--fallback"
          aria-hidden="true"
          v-html="organizationIcon"
        ></span>
        <div class="organization-page__identity">
          <h1 class="organization-page__title">{{ organization.name }}</h1>
          <p class="organization-page__description">{{ organization.description }}</p>
        </div>
      </header>

      <div class="organization-page__actions">
        <button v-if="hasInvite" type="button" class="org-action org-action--accent" @click="acceptInvite">
          Accept invitation
        </button>
        <button
          v-if="hasInvite"
          type="button"
          class="org-action"
          @click="() => organization && user && requestRemoveMember(user.username, user.id)"
        >
          Decline
        </button>
        <button v-if="isMember" type="button" class="org-action org-action--danger" @click="requestLeave">
          Leave
        </button>
        <button v-if="canManage" type="button" class="org-action" @click="editOpen = true">
          Edit
        </button>
      </div>

      <Card class="organization-section">
        <template #header>
          <div class="organization-section__head">
            <h2>Projects</h2>
            <span class="organization-section__count">{{ projects.length }}</span>
          </div>
        </template>
        <div v-if="canManage" class="org-inline-form">
          <input
            v-model="projectQuery"
            type="text"
            placeholder="Project slug or ID"
            aria-label="Project to add"
          />
          <button type="button" :disabled="addingProject" @click="addProject">
            {{ addingProject ? 'Adding...' : 'Add' }}
          </button>
        </div>
      <p v-if="projects.length === 0" class="organizations__message">No projects yet.</p>
      <div v-for="item in projects" :key="item.id" class="organization-row">
        <img v-if="item.icon_url" class="organization-row__icon" :src="item.icon_url" alt="" />
        <span v-else class="organization-row__icon organization-row__icon--fallback">
          {{ item.title.charAt(0).toUpperCase() }}
        </span>
        <button type="button" class="organization-row__copy" @click="router.push(projectPath(item.project_type, item.slug))">
          <span class="organization-row__name">{{ item.title }}</span>
          <span class="organization-row__description">{{ item.description }}</span>
        </button>
        <div v-if="canManage" class="organization-row__manage">
          <select v-model="projectOwners[item.id]" aria-label="New project owner">
            <option
              v-for="member in organization.members.filter((entry) => entry.accepted)"
              :key="member.user.id"
              :value="member.user.id"
            >
              {{ member.user.username }}
            </option>
          </select>
          <button
            type="button"
            :aria-label="`Remove ${item.title}`"
            @click="requestRemoveProject(item)"
          >
            <Trash :size="18" :stroke-width="2.2" />
          </button>
        </div>
        <ExternalLink v-else :size="16" :stroke-width="2" />
      </div>
      </Card>

      <Card class="organization-section">
        <template #header>
          <div class="organization-section__head">
            <h2>Members</h2>
            <span class="organization-section__count">{{ organization.members.length }}</span>
          </div>
        </template>
        <p v-if="organization.members.length === 0" class="organizations__message">
          No members listed.
        </p>
      <div v-for="member in organization.members" :key="member.user.id" class="organization-member">
        <img
          v-if="member.user.avatar_url"
          class="organization-member__avatar"
          :src="member.user.avatar_url"
          alt=""
        />
        <span v-else class="organization-member__avatar organization-member__avatar--fallback">
          {{ member.user.username.charAt(0).toUpperCase() }}
        </span>
        <span class="organization-member__copy">
          <span class="organization-member__name">{{ member.user.username }}</span>
          <input
            v-if="canManage"
            v-model="memberRoles[member.user.id]"
            class="organization-member__role-input"
            type="text"
            :aria-label="`Role for ${member.user.username}`"
          />
          <span v-else class="organization-member__role">
            {{ member.role }}{{ member.accepted ? '' : ' (invited)' }}
          </span>
        </span>
        <button
          v-if="canManage"
          type="button"
          class="organization-member__action"
          @click="saveRole(member.user.id)"
        >
          Save
        </button>
        <button
          v-if="canManage && member.user.id !== user?.id"
          type="button"
          class="organization-member__action"
          @click="requestTransferOwnership(member.user.id, member.user.username)"
        >
          Make owner
        </button>
        <button
          v-if="canManage && member.user.id !== user?.id"
          type="button"
          class="organization-member__remove"
          :aria-label="`Remove ${member.user.username}`"
          @click="requestRemoveMember(member.user.username, member.user.id)"
        >
          <Trash :size="18" :stroke-width="2.2" />
        </button>
      </div>

        <div v-if="canManage" class="org-inline-form">
          <input
            v-model="inviteQuery"
            type="text"
            placeholder="Username or user ID"
            aria-label="Username or user ID to invite"
          />
          <button type="button" :disabled="inviting" @click="invite">
            {{ inviting ? 'Inviting...' : 'Invite' }}
          </button>
        </div>
      </Card>
    </template>

    <OrganizationEditDialog
      v-if="editOpen && organization"
      :organization="organization"
      @close="editOpen = false"
      @saved="onSaved"
    />

    <Teleport to="body">
      <div v-if="confirmState" class="overlay confirm-overlay" @click.self="closeConfirm">
        <div class="confirm-card" role="dialog" aria-modal="true" aria-label="Confirm action">
          <h2 class="confirm-card__title">{{ confirmState.title }}</h2>
          <p class="confirm-card__text">{{ confirmState.text }}</p>
          <div class="confirm-card__actions">
            <button type="button" class="confirm-card__cancel" :disabled="confirming" @click="closeConfirm">
              Cancel
            </button>
            <button type="button" class="confirm-card__confirm" :disabled="confirming" @click="runConfirm">
              {{ confirming ? 'Working...' : 'Confirm' }}
            </button>
          </div>
        </div>
      </div>
    </Teleport>
  </section>
</template>
