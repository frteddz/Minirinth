<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import Card from '../ui/components/Card.vue'
import SelectMenu from '../components/SelectMenu.vue'
import { useAuth } from '../composables/useAuth'
import { useCreatorProjects } from '../composables/useCreatorProjects'
import {
  getAnalytics,
  type AnalyticsEntry,
  type AnalyticsRequest,
  type AnalyticsResponse,
} from '../api/client'
import { projectPath } from '../utils/project-path'

type MetricKind = 'views' | 'downloads' | 'playtime'

interface BreakdownRow {
  id: string
  name: string
  views: number
  downloads: number
  playtime: number
}

interface Series {
  id: string
  name: string
  values: number[]
  color: string
}

const ranges = [
  { days: 7, label: 'Last 7 days' },
  { days: 30, label: 'Last 30 days' },
  { days: 90, label: 'Last 90 days' },
]
const metricTabs: { id: MetricKind; label: string }[] = [
  { id: 'views', label: 'Views' },
  { id: 'downloads', label: 'Downloads' },
  { id: 'playtime', label: 'Playtime' },
]
const palette = ['#1bd964', '#f97316', '#60a5fa', '#e879f9', '#facc15', '#f87171', '#22d3ee']

const router = useRouter()
const { user } = useAuth()
const { projects, loading: projectsLoading, error: projectsError, load: loadProjects, refresh: refreshProjects } = useCreatorProjects()
const selectedProjectId = ref('all')
const range = ref(30)
const activeMetric = ref<MetricKind>('views')
const sort = ref('Views')
const sortOptions = ['Views', 'Downloads', 'Playtime', 'Name']
const search = ref('')
const analytics = ref<AnalyticsResponse | null>(null)
const analyticsLoading = ref(false)
const analyticsError = ref('')

function metricValue(entry: AnalyticsEntry, kind: MetricKind) {
  if (kind === 'views') return entry.views ?? 0
  if (kind === 'downloads') return entry.downloads ?? 0
  return entry.seconds ?? 0
}

function sumMetric(kind: MetricKind) {
  let total = 0
  for (const slice of analytics.value?.metrics ?? []) {
    for (const entry of slice) {
      if (entry.metric_kind === kind) total += metricValue(entry, kind)
    }
  }
  return total
}

const totals = computed(() => ({
  views: sumMetric('views'),
  downloads: sumMetric('downloads'),
  playtime: sumMetric('playtime'),
}))

const breakdown = computed<BreakdownRow[]>(() => {
  const rows = new Map<string, BreakdownRow>()
  const response = analytics.value
  if (!response) return []

  for (const slice of response.metrics) {
    for (const entry of slice) {
      const id = entry.source_project || 'other'
      let row = rows.get(id)
      if (!row) {
        row = {
          id,
          name: response.projects[id]?.name ?? (id === 'other' ? 'Other' : id.slice(0, 8)),
          views: 0,
          downloads: 0,
          playtime: 0,
        }
        rows.set(id, row)
      }
      if (entry.metric_kind === 'views') row.views += entry.views ?? 0
      if (entry.metric_kind === 'downloads') row.downloads += entry.downloads ?? 0
      if (entry.metric_kind === 'playtime') row.playtime += entry.seconds ?? 0
    }
  }

  const query = search.value.trim().toLowerCase()
  return [...rows.values()]
    .filter((row) => row.name.toLowerCase().includes(query))
    .sort(compareRows)
})

const series = computed<Series[]>(() => {
  const response = analytics.value
  if (!response) return []

  const sliceCount = response.metrics.length
  const buckets = new Map<string, number[]>()
  response.metrics.forEach((slice, index) => {
    const perProject = new Map<string, number>()
    for (const entry of slice) {
      if (entry.metric_kind !== activeMetric.value) continue
      const id = entry.source_project || 'other'
      perProject.set(id, (perProject.get(id) ?? 0) + metricValue(entry, activeMetric.value))
    }
    for (const [id, value] of perProject) {
      if (!buckets.has(id)) buckets.set(id, new Array<number>(sliceCount).fill(0))
      buckets.get(id)![index] = value
    }
  })

  const order = new Map(breakdown.value.map((row, index) => [row.id, index]))
  return [...buckets.entries()]
    .sort((a, b) => (order.get(a[0]) ?? 999) - (order.get(b[0]) ?? 999))
    .map(([id, values], index) => ({
      id,
      name: response.projects[id]?.name ?? (id === 'other' ? 'Other' : id.slice(0, 8)),
      values,
      color: palette[index % palette.length],
    }))
})

const maxValue = computed(() =>
  Math.max(...series.value.flatMap((item) => item.values), 1),
)
const chartTitle = computed(
  () => `${metricTabs.find((tab) => tab.id === activeMetric.value)?.label ?? 'Views'} Over Time`,
)

function formatNumber(value: number) {
  return new Intl.NumberFormat('en-US').format(Math.round(value))
}

function sortValue(row: BreakdownRow) {
  if (sort.value === 'Downloads') return row.downloads
  if (sort.value === 'Playtime') return row.playtime
  return row.views
}

function compareRows(a: BreakdownRow, b: BreakdownRow) {
  if (sort.value === 'Name') return a.name.localeCompare(b.name)
  return sortValue(b) - sortValue(a)
}

function formatPlaytime(seconds: number) {
  return `${(seconds / 3600).toFixed(1)} hrs`
}

function points(values: number[]) {
  const width = 600
  const height = 140
  const last = Math.max(values.length - 1, 1)
  return values
    .map((value, index) => {
      const x = (index / last) * width
      const y = height - (value / maxValue.value) * 128 - 6
      return `${x.toFixed(1)},${y.toFixed(1)}`
    })
    .join(' ')
}

function buildRequest(): AnalyticsRequest {
  const days = Number(range.value)
  const end = new Date()
  const start = new Date(end.getTime() - days * 86_400_000)
  const bucket = { bucket_by: ['project_id'] }

  return {
    time_range: {
      start: start.toISOString(),
      end: end.toISOString(),
      resolution: { slices: days },
    },
    return_metrics: {
      project_views: bucket,
      project_downloads: bucket,
      project_playtime: bucket,
    },
    project_ids: selectedProjectId.value === 'all' ? [] : [selectedProjectId.value],
  }
}

async function loadAnalytics() {
  if (!user.value) return
  analyticsLoading.value = true
  analyticsError.value = ''
  try {
    analytics.value = await getAnalytics(buildRequest())
  } catch (cause) {
    analytics.value = null
    analyticsError.value = cause instanceof Error ? cause.message : 'Could not load analytics.'
  } finally {
    analyticsLoading.value = false
  }
}

async function refreshAll() {
  await refreshProjects()
  await loadAnalytics()
}

watch([selectedProjectId, range], () => {
  void loadAnalytics()
})

onMounted(async () => {
  await loadProjects()
  await loadAnalytics()
})
</script>

<template>
  <section class="page creator">
    <Card>
      <template #header>
        <h1 class="page__title">Analytics</h1>
      </template>

      <div v-if="!user" class="creator__signed-out">
        <p>Sign in to see analytics for your projects.</p>
      </div>

      <div v-else>
        <div class="creator__intro-row">
          <p class="creator__intro">Views, downloads and playtime from your projects.</p>
          <button type="button" class="creator__action" @click="refreshAll">Refresh</button>
        </div>

        <p class="creator__note">
          Revenue is not shown because it needs a separate payouts scope. These numbers come from
          Modrinth's analytics API.
        </p>

        <div class="creator__filters">
          <label class="creator__select">
            <span>Project</span>
            <select v-model="selectedProjectId">
              <option value="all">All projects</option>
              <option v-for="item in projects" :key="item.id" :value="item.id">
                {{ item.title }}
              </option>
            </select>
          </label>
          <label class="creator__select">
            <span>Timeframe</span>
            <select v-model.number="range">
              <option v-for="option in ranges" :key="option.days" :value="option.days">
                {{ option.label }}
              </option>
            </select>
          </label>
          <SelectMenu v-model="sort" :options="sortOptions" prefix="Sort by" />
          <div class="creator__chips">
            <span class="creator__chip">Grouped by project</span>
          </div>
        </div>

        <p v-if="projectsLoading || analyticsLoading" class="creator__message">
          Loading analytics...
        </p>
        <p v-else-if="projectsError || analyticsError" class="creator__error">
          {{ analyticsError || projectsError }}
        </p>

        <div class="creator__stats">
          <div class="creator__stat">
            <span class="creator__stat-value">{{ formatNumber(totals.views) }}</span>
            <span class="creator__stat-label">Views</span>
          </div>
          <div class="creator__stat">
            <span class="creator__stat-value">{{ formatNumber(totals.downloads) }}</span>
            <span class="creator__stat-label">Downloads</span>
          </div>
          <div class="creator__stat">
            <span class="creator__stat-value">{{ formatNumber(totals.playtime) }} s</span>
            <span class="creator__stat-label">Playtime</span>
          </div>
          <div class="creator__stat">
            <span class="creator__stat-value">{{ formatNumber(breakdown.length) }}</span>
            <span class="creator__stat-label">Projects</span>
          </div>
        </div>

        <div class="creator__chart">
          <div class="creator__chart-head">
            <h2 class="creator__section-title">{{ chartTitle }}</h2>
            <div class="creator__metric-tabs">
              <button
                v-for="tab in metricTabs"
                :key="tab.id"
                type="button"
                class="creator__metric-tab"
                :class="{ 'is-active': activeMetric === tab.id }"
                @click="activeMetric = tab.id"
              >
                {{ tab.label }}
              </button>
            </div>
          </div>

          <svg
            class="creator__chart-svg"
            viewBox="0 0 600 140"
            preserveAspectRatio="none"
            role="img"
            :aria-label="`${chartTitle} chart`"
          >
            <line v-for="line in [12, 42, 72, 102, 132]" :key="line" x1="0" :y1="line" x2="600" :y2="line" class="creator__grid-line" />
            <polyline
              v-for="item in series"
              :key="item.id"
              :points="points(item.values)"
              :stroke="item.color"
              class="creator__chart-line"
            />
          </svg>

          <div class="creator__legend">
            <span v-for="item in series" :key="item.id" class="creator__legend-item">
              <span class="creator__legend-dot" :style="{ backgroundColor: item.color }"></span>
              {{ item.name }}
            </span>
          </div>
        </div>

        <div class="creator__table-section">
          <div class="creator__table-head">
            <h2 class="creator__section-title">Breakdown</h2>
            <input
              v-model="search"
              class="creator__search"
              type="search"
              placeholder="Search projects"
              aria-label="Search projects"
            />
          </div>
          <p v-if="breakdown.length === 0" class="creator__message">No analytics yet.</p>
          <div v-else class="creator__table">
            <div class="creator__table-row creator__table-row--head">
              <span>Project</span>
              <span>Views</span>
              <span>Downloads</span>
              <span>Playtime</span>
            </div>
            <button
              v-for="row in breakdown"
              :key="row.id"
              type="button"
              class="creator__table-row"
              @click="row.id !== 'other' && router.push(projectPath(projects.find((item) => item.id === row.id)?.project_type ?? 'mod', projects.find((item) => item.id === row.id)?.slug ?? row.id))"
            >
              <span class="creator__table-project">
                <span class="creator__table-name">{{ row.name }}</span>
              </span>
              <span>{{ formatNumber(row.views) }}</span>
              <span>{{ formatNumber(row.downloads) }}</span>
              <span>{{ formatPlaytime(row.playtime) }}</span>
            </button>
          </div>
        </div>
      </div>
    </Card>
  </section>
</template>
