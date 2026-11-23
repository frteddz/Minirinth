import {
  deleteFileNative,
  isNativeLauncherFolders,
  listFilesNative,
  pickFolderNative,
  type NativeFile,
} from '../plugins/launcher-folders'

export const CONTENT_FOLDERS = ['mods', 'resourcepacks', 'shaders', 'datapacks'] as const
export type ContentFolder = (typeof CONTENT_FOLDERS)[number]

export interface PickedFolder {
  name: string
  uri: string
  children: string[]
}

export type InstanceFile = NativeFile

interface EntryLike {
  name: string
  kind: string
}

interface DirectoryHandleLike {
  name: string
  values(): AsyncIterable<EntryLike>
}

type DirectoryPicker = () => Promise<DirectoryHandleLike>

function getPicker(): DirectoryPicker | undefined {
  const w = window as unknown as { showDirectoryPicker?: DirectoryPicker }
  return w.showDirectoryPicker
}

export async function pickLauncherFolder(): Promise<PickedFolder> {
  if (isNativeLauncherFolders()) {
    const result = await pickFolderNative()
    return { name: result.name, uri: result.uri, children: result.children ?? [] }
  }

  const choose = getPicker()
  if (!choose) {
    throw new Error('Folder picking is not available here. Type the folders manually instead.')
  }

  const handle = await choose()
  const children: string[] = []
  for await (const entry of handle.values()) {
    if (entry.kind === 'directory') children.push(entry.name)
  }

  return { name: handle.name, uri: '', children }
}

export async function listInstanceFiles(uri: string, folder: string): Promise<InstanceFile[]> {
  if (!uri) return []
  const result = await listFilesNative(uri, folder)
  return result.files ?? []
}

export function deleteInstanceFile(uri: string, folder: string, name: string) {
  return deleteFileNative(uri, folder, name)
}
