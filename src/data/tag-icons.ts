import { loaderIconSvg } from './loader-icons'

import clientEnv from '../assets/environment/client.svg?raw'
import advertisements from '../assets/icons/exclusions/advertisements.svg?raw'
import aiGenerated from '../assets/icons/exclusions/ai-generated.svg?raw'
import archived from '../assets/icons/exclusions/archived.svg?raw'
import dataPacks from '../assets/icons/exclusions/data-packs.svg?raw'
import externalSystems from '../assets/icons/exclusions/external-systems.svg?raw'
import generativeAi from '../assets/icons/exclusions/generative-ai.svg?raw'
import paidFeatures from '../assets/icons/exclusions/paid-features.svg?raw'
import photosensitivity from '../assets/icons/exclusions/photosensitivity.svg?raw'
import plugins from '../assets/icons/exclusions/plugins.svg?raw'
import telemetry from '../assets/icons/exclusions/telemetry.svg?raw'
import license from '../assets/icons/license.svg?raw'
import serverEnv from '../assets/environment/server.svg?raw'
import minecraft from '../assets/simple-icons/minecraft.svg?raw'

import adventure from '../assets/tag-icons/adventure.svg?raw'
import audio from '../assets/tag-icons/audio.svg?raw'
import blocks from '../assets/tag-icons/blocks.svg?raw'
import coreShaders from '../assets/tag-icons/core-shaders.svg?raw'
import entities from '../assets/tag-icons/entities.svg?raw'
import environmentCategory from '../assets/tag-icons/environment.svg?raw'
import fonts from '../assets/tag-icons/fonts.svg?raw'
import gui from '../assets/tag-icons/gui.svg?raw'
import items from '../assets/tag-icons/items.svg?raw'
import locale from '../assets/tag-icons/locale.svg?raw'
import models from '../assets/tag-icons/models.svg?raw'
import atmosphere from '../assets/tag-icons/atmosphere.svg?raw'
import bloom from '../assets/tag-icons/bloom.svg?raw'
import cartoon from '../assets/tag-icons/cartoon.svg?raw'
import challenging from '../assets/tag-icons/challenging.svg?raw'
import coloredLighting from '../assets/tag-icons/colored-lighting.svg?raw'
import combat from '../assets/tag-icons/combat.svg?raw'
import cursed from '../assets/tag-icons/cursed.svg?raw'
import decoration from '../assets/tag-icons/decoration.svg?raw'
import economy from '../assets/tag-icons/economy.svg?raw'
import equipment from '../assets/tag-icons/equipment.svg?raw'
import fantasy from '../assets/tag-icons/fantasy.svg?raw'
import foliage from '../assets/tag-icons/foliage.svg?raw'
import food from '../assets/tag-icons/food.svg?raw'
import gameMechanics from '../assets/tag-icons/game-mechanics.svg?raw'
import high from '../assets/tag-icons/high.svg?raw'
import kitchenSink from '../assets/tag-icons/kitchen-sink.svg?raw'
import library from '../assets/tag-icons/library.svg?raw'
import lightweight from '../assets/tag-icons/lightweight.svg?raw'
import low from '../assets/tag-icons/low.svg?raw'
import magic from '../assets/tag-icons/magic.svg?raw'
import management from '../assets/tag-icons/management.svg?raw'
import medium from '../assets/tag-icons/medium.svg?raw'
import minigame from '../assets/tag-icons/minigame.svg?raw'
import mobs from '../assets/tag-icons/mobs.svg?raw'
import modded from '../assets/tag-icons/modded.svg?raw'
import multiplayer from '../assets/tag-icons/multiplayer.svg?raw'
import optimization from '../assets/tag-icons/optimization.svg?raw'
import pbr from '../assets/tag-icons/pbr.svg?raw'
import pathTracing from '../assets/tag-icons/path-tracing.svg?raw'
import potato from '../assets/tag-icons/potato.svg?raw'
import quests from '../assets/tag-icons/quests.svg?raw'
import realistic from '../assets/tag-icons/realistic.svg?raw'
import reflections from '../assets/tag-icons/reflections.svg?raw'
import screenshot from '../assets/tag-icons/screenshot.svg?raw'
import semiRealistic from '../assets/tag-icons/semi-realistic.svg?raw'
import shadows from '../assets/tag-icons/shadows.svg?raw'
import simplistic from '../assets/tag-icons/simplistic.svg?raw'
import social from '../assets/tag-icons/social.svg?raw'
import storage from '../assets/tag-icons/storage.svg?raw'
import technology from '../assets/tag-icons/technology.svg?raw'
import themed from '../assets/tag-icons/themed.svg?raw'
import transportation from '../assets/tag-icons/transportation.svg?raw'
import tweaks from '../assets/tag-icons/tweaks.svg?raw'
import utility from '../assets/tag-icons/utility.svg?raw'
import vanillaLike from '../assets/tag-icons/vanilla-like.svg?raw'
import worldgen from '../assets/tag-icons/worldgen.svg?raw'

const icons: Record<string, string> = {
  adventure,
  audio,
  atmosphere,
  blocks,
  'core-shaders': coreShaders,
  entities,
  environment: environmentCategory,
  fonts,
  gui,
  items,
  locale,
  models,
  bloom,
  cartoon,
  challenging,
  'colored-lighting': coloredLighting,
  combat,
  cursed,
  decoration,
  economy,
  equipment,
  fantasy,
  foliage,
  food,
  'game-mechanics': gameMechanics,
  high,
  'kitchen-sink': kitchenSink,
  library,
  lightweight,
  low,
  magic,
  management,
  medium,
  minigame,
  mobs,
  modded,
  multiplayer,
  optimization,
  pbr,
  'path-tracing': pathTracing,
  potato,
  quests,
  realistic,
  reflections,
  screenshot,
  'semi-realistic': semiRealistic,
  shadows,
  simplistic,
  social,
  storage,
  technology,
  themed,
  transportation,
  tweaks,
  utility,
  'vanilla-like': vanillaLike,
  worldgen,
}

const labelKeys: Record<string, string> = {
  Adventure: 'adventure',
  Atmosphere: 'atmosphere',
  Bloom: 'bloom',
  Cartoon: 'cartoon',
  Challenging: 'challenging',
  'Colored Lighting': 'colored-lighting',
  Combat: 'combat',
  Cursed: 'cursed',
  Decoration: 'decoration',
  Economy: 'economy',
  Equipment: 'equipment',
  Fantasy: 'fantasy',
  Foliage: 'foliage',
  Food: 'food',
  'Game Mechanics': 'game-mechanics',
  High: 'high',
  'Kitchen Sink': 'kitchen-sink',
  Library: 'library',
  Lightweight: 'lightweight',
  Low: 'low',
  Magic: 'magic',
  Management: 'management',
  Medium: 'medium',
  Minigame: 'minigame',
  Mobs: 'mobs',
  Modded: 'modded',
  Multiplayer: 'multiplayer',
  Optimization: 'optimization',
  PBR: 'pbr',
  'Path Tracing': 'path-tracing',
  Potato: 'potato',
  Quests: 'quests',
  Realistic: 'realistic',
  Reflections: 'reflections',
  Screenshot: 'screenshot',
  'Semi-realistic': 'semi-realistic',
  Shadows: 'shadows',
  Simplistic: 'simplistic',
  Social: 'social',
  Storage: 'storage',
  Technology: 'technology',
  Themed: 'themed',
  Transportation: 'transportation',
  Tweaks: 'tweaks',
  Utility: 'utility',
  'Vanilla-like': 'vanilla-like',
  'World Generation': 'worldgen',
}

const simpleIcons: Record<string, string> = {
  minecraft,
  'open-source-license': license,
  'client-env': clientEnv,
  'server-env': serverEnv,
  advertisements,
  'ai-generated': aiGenerated,
  archived,
  'data-packs': dataPacks,
  'external-systems': externalSystems,
  'generative-ai': generativeAi,
  'paid-features': paidFeatures,
  photosensitivity,
  plugins,
  telemetry,
}

const simpleKeys: Record<string, string> = {
  '8x or lower': 'minecraft',
  '16x': 'minecraft',
  '32x': 'minecraft',
  '48x': 'minecraft',
  '64x': 'minecraft',
  '128x': 'minecraft',
  '256x': 'minecraft',
  '512x or higher': 'minecraft',
  'Open source': 'open-source-license',
  Client: 'client-env',
  Server: 'server-env',
  Advertisements: 'advertisements',
  'AI-generated content': 'ai-generated',
  Archived: 'archived',
  'Data Packs': 'data-packs',
  'External system interactions': 'external-systems',
  'Generative AI functionality': 'generative-ai',
  'Paid features': 'paid-features',
  'Photosensitivity triggers': 'photosensitivity',
  Plugins: 'plugins',
  Telemetry: 'telemetry',
}

export function tagSlug(label: string): string {
  return labelKeys[label] ?? label.toLowerCase().replace(/\s+/g, '-')
}

export function tagIconSvg(label: string): string {
  const key = labelKeys[label] ?? label.toLowerCase().replace(/\s+/g, '-')
  const simpleKey = simpleKeys[label]
  const match = icons[key] ?? (simpleKey ? simpleIcons[simpleKey] : '')
  return match || loaderIconSvg(label)
}
