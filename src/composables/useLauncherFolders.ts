import { ref, watch } from 'vue'
import type { ContentFolder } from '../utils/launcher-folders'

export interface LauncherInstance {
  id: string
  name: string
  root: string
  uri: string
  folders: Record<ContentFolder, string>
  folderUris: Record<ContentFolder, string>
}

const STORAGE_KEY = 'minirynth.launcher-folders'

function emptyFolders(): Record<ContentFolder, string> {
  return { mods: '', resourcepacks: '', shaders: '', datapacks: '' }
}

function load(): LauncherInstance[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw) as LauncherInstance[]
    if (!Array.isArray(parsed)) return []
    return parsed
      .filter((item) => item && typeof item.id === 'string')
      .map((item) => ({
        id: item.id,
        name: typeof item.name === 'string' ? item.name : 'Instance',
        root: typeof item.root === 'string' ? item.root : '',
        uri: typeof item.uri === 'string' ? item.uri : '',
        folders: {
          mods: typeof item.folders?.mods === 'string' ? item.folders.mods : '',
          resourcepacks:
            typeof item.folders?.resourcepacks === 'string' ? item.folders.resourcepacks : '',
          shaders: typeof item.folders?.shaders === 'string' ? item.folders.shaders : '',
          datapacks: typeof item.folders?.datapacks === 'string' ? item.folders.datapacks : '',
        },
        folderUris: {
          mods: typeof item.folderUris?.mods === 'string' ? item.folderUris.mods : '',
          resourcepacks:
            typeof item.folderUris?.resourcepacks === 'string'
              ? item.folderUris.resourcepacks
              : '',
          shaders: typeof item.folderUris?.shaders === 'string' ? item.folderUris.shaders : '',
          datapacks:
            typeof item.folderUris?.datapacks === 'string' ? item.folderUris.datapacks : '',
        },
      }))
  } catch {
    return []
  }
}

const instances = ref<LauncherInstance[]>(load())

watch(
  instances,
  () => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(instances.value))
    } catch {
      void 0
    }
  },
  { deep: true },
)

export function useLauncherFolders() {
  function addInstance() {
    const name = `Instance ${instances.value.length + 1}`
    instances.value = [
      ...instances.value,
      {
        id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        name,
        root: '',
        uri: '',
        folders: emptyFolders(),
        folderUris: emptyFolders(),
      },
    ]
  }

  function removeInstance(id: string) {
    instances.value = instances.value.filter((item) => item.id !== id)
  }

  return { instances, addInstance, removeInstance }
}
