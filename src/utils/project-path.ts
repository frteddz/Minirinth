const typeSegments: Record<string, string> = {
  mod: 'mod',
  shader: 'shader',
  resourcepack: 'resource-pack',
  datapack: 'data-pack',
  modpack: 'modpack',
  plugin: 'plugin',
}

export function projectPath(type: string, slug: string): string {
  const segment = typeSegments[type] ?? 'mod'
  return `/${segment}/${slug}`
}
