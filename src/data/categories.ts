export interface SampleProject {
  title: string
  author: string
  slug: string
  description: string
  downloads: string
  downloadCount: number
  likes: string
  likeCount: number
  updatedDays: number
  newestDays: number
  version: string
  environment: 'Client' | 'Server' | 'Client and server' | 'Client or server'
  license: string
  categories: string[]
  loaders: string[]
  exclusions: string[]
  tags: string[]
  accent: string
  features: string[]
  performance: string
  resolution: string
  platforms: string[]
  dependencies: string[]
}

export interface Category {
  path: string
  label: string
  title: string
  projects: SampleProject[]
}

export const allCategories = [
  'Adventure', 'Cursed', 'Decoration', 'Economy', 'Equipment', 'Food', 'Game Mechanics',
  'Library', 'Magic', 'Management', 'Minigame', 'Mobs', 'Optimization', 'Social',
  'Storage', 'Technology', 'Transportation', 'Utility', 'World Generation',
]

export const primaryLoaders = ['Fabric', 'Forge', 'NeoForge', 'Quilt']
export const allLoaders = [
  ...primaryLoaders,
  'Babric', 'BTA (Babric)', 'Legacy Fabric', 'LiteLoader', 'ModLoader',
  'NilLoader', 'Ornithe', 'Rift', "Risugami's ModLoader",
]

export const releases = [
  '26.4', '26.3', '26.2', '26.1', '1.21.4', '1.21.3', '1.21.1', '1.20.6',
  '1.20.4', '1.20.1', '1.19.4', '1.19.2', '1.18.2', '1.17.1', '1.16.5',
  '1.15.2', '1.14.4', '1.13.2', '1.12.2', '1.11.2', '1.10.2', '1.9.4',
  '1.8.9', '1.7.10', '1.6.4', '1.5.2', '1.4.7', '1.3.2', '1.2.5', '1.1.10', '1.0',
]

export const specialVersions = [
  '26.4 snapshot 1', '1.21.5-rc1', '1.21.5-pre1', '1.21.4-beta2', '1.8.9-beta', 'b1.7.3', 'a1.0.15',
]

export const dataPackReleases = releases.slice(0, releases.indexOf('1.13.2') + 1)

export const dataPackSpecialVersions = [
  '26.4 snapshot 1', '1.21.5-rc1', '1.21.5-pre1', '1.21.4-rc1',
]

export const shaderCategories = [
  'Cartoon', 'Cursed', 'Fantasy', 'Realistic', 'Semi-realistic', 'Vanilla-like',
]

export const shaderFeatures = [
  'Atmosphere', 'Bloom', 'Colored Lighting', 'Foliage', 'Path Tracing',
  'PBR', 'Reflections', 'Shadows',
]

export const shaderPerformance = [
  'Low', 'Medium', 'High', 'Potato', 'Screenshot',
]

export const shaderLoaders = ['Canvas', 'Iris', 'OptiFine', 'Vanilla Shader']

export const packCategories = [
  'Combat', 'Cursed', 'Decoration', 'Modded', 'Realistic',
  'Simplistic', 'Themed', 'Tweaks', 'Utility', 'Vanilla-like',
]

export const packFeatures = [
  'Audio', 'Blocks', 'Core Shaders', 'Entities', 'Environment',
  'Equipment', 'Fonts', 'GUI', 'Items', 'Locale', 'Models',
]

export const packResolutions = [
  '8x or lower', '16x', '32x', '48x', '64x', '128x', '256x', '512x or higher',
]

export const modpackCategories = [
  'Adventure', 'Challenging', 'Combat', 'Kitchen Sink', 'Lightweight',
  'Magic', 'Multiplayer', 'Optimization', 'Quests', 'Technology',
]

export const pluginPrimaryLoaders = ['Paper', 'Spigot']
export const pluginMoreLoaders = ['Bukkit', 'Folia', 'Purpur', 'Sponge']
export const pluginPlatforms = ['BungeeCord', 'Geyser Extension', 'Velocity', 'Waterfall']
export const pluginDependencies = [
  'LuckPerms', 'PlaceholderAPI', 'ProtocolLib', 'Vault', 'WorldEdit',
  'WorldGuard', 'EssentialsX', 'Citizens', 'DecentHolograms',
]

export const advancedExclusions = [
  'AI-generated content', 'Generative AI functionality', 'Advertisements',
  'Photosensitivity triggers', 'External system interactions', 'Telemetry',
  'Paid features', 'Archived', 'Plugins', 'Data Packs',
]

const accents = [
  'linear-gradient(135deg, #1bd964, #0f9e4a)',
  'linear-gradient(135deg, #7fd0ff, #3f8cff)',
  'linear-gradient(135deg, #4db5ff, #1f6be6)',
  'linear-gradient(135deg, #9f4dff, #6d28d9)',
  'linear-gradient(135deg, #e7a038, #a4440f)',
  'linear-gradient(135deg, #ed4661, #9a1739)',
]

const authors = ['modmuss50', 'CaffeineMC', 'coderbot', 'NeoForge', 'FabricMC', 'shedaniel']
const environments: SampleProject['environment'][] = [
  'Client and server', 'Client', 'Client or server', 'Server', 'Client and server', 'Client',
]

const entries = [
  { label: 'one', downloads: '289.94M', downloadCount: 289940000, likes: '38K', likeCount: 38000, updatedDays: 0 },
  { label: 'two', downloads: '254.36M', downloadCount: 254360000, likes: '42.9K', likeCount: 42900, updatedDays: 7 },
  { label: 'three', downloads: '36.1M', downloadCount: 36100000, likes: '6.2K', likeCount: 6200, updatedDays: 14 },
  { label: 'four', downloads: '12.8M', downloadCount: 12800000, likes: '3.1K', likeCount: 3100, updatedDays: 30 },
  { label: 'five', downloads: '4.7M', downloadCount: 4700000, likes: '980', likeCount: 980, updatedDays: 60 },
  { label: 'six', downloads: '812K', downloadCount: 812000, likes: '214', likeCount: 214, updatedDays: 90 },
]

function samples(prefix: string, tags: string[]): SampleProject[] {
  return entries.map((entry, i) => {
    const slug = `${prefix}-${entry.label}`.toLowerCase().replace(/\s+/g, '-')
    return {
      title: `${prefix} ${entry.label}`,
      author: authors[i % authors.length],
      slug,
      description: 'A short sample description for this mobile layout, cut off after two lines.',
      downloads: entry.downloads,
      downloadCount: entry.downloadCount,
      likes: entry.likes,
      likeCount: entry.likeCount,
      updatedDays: entry.updatedDays,
      newestDays: i,
      version: releases[i % 8],
      environment: environments[i % environments.length],
      license: i === 2 || i === 5 ? 'All Rights Reserved' : ['MIT', 'GPL-3.0', 'Apache-2.0'][i % 3],
      categories: [tags[i % tags.length], tags[(i + 1) % tags.length] ?? 'Utility'],
      loaders: i % 2 === 0 ? ['Fabric'] : ['Forge'],
      exclusions: i === 4 ? ['Telemetry'] : i === 5 ? ['AI-generated content', 'Archived'] : [],
      tags: tags.slice(0, i < 4 ? 2 : 1),
      accent: accents[i % accents.length],
      features: [],
      performance: 'Medium',
      resolution: '16x',
      platforms: [],
      dependencies: [],
    }
  })
}

export const categories: Category[] = [
  {
    path: '/mods', label: 'Mod', title: 'Mods',
    projects: samples('Mod', ['Adventure', 'Game Mechanics', 'Library']),
  },
  {
    path: '/shaders', label: 'Shader', title: 'Shaders',
    projects: samples('Shader', ['Optimization', 'Decoration', 'Utility']),
  },
  {
    path: '/resource-packs', label: 'Pack', title: 'Resource Packs',
    projects: samples('Pack', ['Decoration', 'Food', 'Utility']),
  },
  {
    path: '/data-packs', label: 'Data pack', title: 'Data Packs',
    projects: samples('Data pack', ['Game Mechanics', 'Utility', 'World Generation']),
  },
  {
    path: '/modpacks', label: 'Modpack', title: 'Modpacks',
    projects: samples('Modpack', ['Adventure', 'Technology', 'Storage']),
  },
  {
    path: '/plugins', label: 'Plugin', title: 'Plugins',
    projects: samples('Plugin', ['Management', 'Social', 'Utility']),
  },
]

const shaderCategory = categories.find((item) => item.path === '/shaders')!

shaderCategory.projects = shaderCategory.projects.map((project, i) => ({
  ...project,
  categories: [
    shaderCategories[i % shaderCategories.length],
    shaderCategories[(i + 1) % shaderCategories.length],
  ],
  loaders: [shaderLoaders[i % shaderLoaders.length]],
  features: [
    shaderFeatures[i % shaderFeatures.length],
    shaderFeatures[(i + 3) % shaderFeatures.length],
  ],
  performance: shaderPerformance[i % shaderPerformance.length],
}))

const packCategory = categories.find((item) => item.path === '/resource-packs')!

packCategory.projects = packCategory.projects.map((project, i) => ({
  ...project,
  categories: [
    packCategories[i % packCategories.length],
    packCategories[(i + 1) % packCategories.length],
  ],
  features: [
    packFeatures[i % packFeatures.length],
    packFeatures[(i + 4) % packFeatures.length],
  ],
  resolution: packResolutions[i % packResolutions.length],
  loaders: [],
}))

const modpackCategory = categories.find((item) => item.path === '/modpacks')!

modpackCategory.projects = modpackCategory.projects.map((project, i) => ({
  ...project,
  categories: [
    modpackCategories[i % modpackCategories.length],
    modpackCategories[(i + 1) % modpackCategories.length],
  ],
  loaders: [primaryLoaders[i % primaryLoaders.length]],
}))

const pluginCategory = categories.find((item) => item.path === '/plugins')!
const allPluginLoaders = [...pluginPrimaryLoaders, ...pluginMoreLoaders]

pluginCategory.projects = pluginCategory.projects.map((project, i) => ({
  ...project,
  loaders: [allPluginLoaders[i % allPluginLoaders.length]],
  platforms: [pluginPlatforms[i % pluginPlatforms.length]],
  dependencies: [
    pluginDependencies[i % pluginDependencies.length],
    pluginDependencies[(i + 2) % pluginDependencies.length],
  ],
}))
