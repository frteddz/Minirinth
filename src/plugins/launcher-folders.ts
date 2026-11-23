import { Capacitor, registerPlugin } from '@capacitor/core'

export interface NativePickedFolder {
  uri: string
  name: string
  children: string[]
}

export interface NativeWriteResult {
  uri: string
  filename: string
}

export interface NativeFile {
  name: string
  size: number
  modified: number
}

interface LauncherFoldersPlugin {
  pickFolder(): Promise<NativePickedFolder>
  writeFile(options: {
    uri: string
    folder: string
    filename: string
    url: string
  }): Promise<NativeWriteResult>
  listFiles(options: { uri: string; folder: string }): Promise<{ files: NativeFile[] }>
  deleteFile(options: { uri: string; folder: string; name: string }): Promise<void>
}

const plugin = registerPlugin<LauncherFoldersPlugin>('LauncherFolders')

export function isNativeLauncherFolders() {
  return Capacitor.isNativePlatform()
}

export function pickFolderNative() {
  return plugin.pickFolder()
}

export function writeFileNative(options: {
  uri: string
  folder: string
  filename: string
  url: string
}) {
  return plugin.writeFile(options)
}

export function listFilesNative(uri: string, folder: string) {
  return plugin.listFiles({ uri, folder })
}

export function deleteFileNative(uri: string, folder: string, name: string) {
  return plugin.deleteFile({ uri, folder, name })
}
