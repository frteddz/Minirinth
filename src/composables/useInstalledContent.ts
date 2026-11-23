import { ref, watch } from 'vue'
import type { ContentFolder } from '../utils/launcher-folders'

export interface InstalledContent {
  id: string
  instanceId: string
  folder: ContentFolder
  filename: string
  projectId: string
  projectSlug: string
  projectTitle: string
  projectType: string
  iconUrl: string | null
  versionId: string
  versionName: string
  installedAt: number
}

const STORAGE_KEY = 'minirynth.installed-content'

function load(): InstalledContent[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw) as InstalledContent[]
    if (!Array.isArray(parsed)) return []
    return parsed
      .filter((item) => item && typeof item.id === 'string')
      .map((item) => ({ ...item, iconUrl: item.iconUrl ?? null }))
  } catch {
    return []
  }
}

const records = ref<InstalledContent[]>(load())

watch(
  records,
  () => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(records.value))
    } catch {
      void 0
    }
  },
  { deep: true },
)

export function useInstalledContent() {
  function recordInstall(data: Omit<InstalledContent, 'id' | 'installedAt'>) {
    records.value = [
      ...records.value.filter(
        (item) =>
          !(
            item.instanceId === data.instanceId &&
            item.folder === data.folder &&
            item.filename === data.filename
          ),
      ),
      { ...data, id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`, installedAt: Date.now() },
    ]
  }

  function forget(instanceId: string, folder: ContentFolder, filename: string) {
    records.value = records.value.filter(
      (item) =>
        !(item.instanceId === instanceId && item.folder === folder && item.filename === filename),
    )
  }

  function find(instanceId: string, folder: ContentFolder, filename: string) {
    return records.value.find(
      (item) => item.instanceId === instanceId && item.folder === folder && item.filename === filename,
    )
  }

  return { records, recordInstall, forget, find }
}
