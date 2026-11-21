import babric from '../assets/loader-icons/babric.svg?raw'
import btaBabric from '../assets/loader-icons/bta-babric.svg?raw'
import bukkit from '../assets/loader-icons/bukkit.svg?raw'
import bungeecord from '../assets/loader-icons/bungeecord.svg?raw'
import canvas from '../assets/loader-icons/canvas.svg?raw'
import fabric from '../assets/loader-icons/fabric.svg?raw'
import folia from '../assets/loader-icons/folia.svg?raw'
import forge from '../assets/loader-icons/forge.svg?raw'
import geyser from '../assets/loader-icons/geyser.svg?raw'
import iris from '../assets/loader-icons/iris.svg?raw'
import legacyFabric from '../assets/loader-icons/legacy-fabric.svg?raw'
import liteloader from '../assets/loader-icons/liteloader.svg?raw'
import modloader from '../assets/loader-icons/modloader.svg?raw'
import neoforge from '../assets/loader-icons/neoforge.svg?raw'
import nilloader from '../assets/loader-icons/nilloader.svg?raw'
import optifine from '../assets/loader-icons/optifine.svg?raw'
import ornithe from '../assets/loader-icons/ornithe.svg?raw'
import paper from '../assets/loader-icons/paper.svg?raw'
import purpur from '../assets/loader-icons/purpur.svg?raw'
import quilt from '../assets/loader-icons/quilt.svg?raw'
import rift from '../assets/loader-icons/rift.svg?raw'
import spigot from '../assets/loader-icons/spigot.svg?raw'
import sponge from '../assets/loader-icons/sponge.svg?raw'
import vanilla from '../assets/loader-icons/vanilla.svg?raw'
import velocity from '../assets/loader-icons/velocity.svg?raw'
import waterfall from '../assets/loader-icons/waterfall.svg?raw'

const icons: Record<string, string> = {
  babric,
  'bta-babric': btaBabric,
  bukkit,
  bungeecord,
  canvas,
  fabric,
  folia,
  forge,
  geyser,
  iris,
  'legacy-fabric': legacyFabric,
  liteloader,
  modloader,
  neoforge,
  nilloader,
  optifine,
  ornithe,
  paper,
  purpur,
  quilt,
  rift,
  spigot,
  sponge,
  vanilla,
  velocity,
  waterfall,
}

const labelKeys: Record<string, string> = {
  Fabric: 'fabric',
  Forge: 'forge',
  NeoForge: 'neoforge',
  Quilt: 'quilt',
  Babric: 'babric',
  'BTA (Babric)': 'bta-babric',
  'Legacy Fabric': 'legacy-fabric',
  LiteLoader: 'liteloader',
  ModLoader: 'modloader',
  NilLoader: 'nilloader',
  Ornithe: 'ornithe',
  Rift: 'rift',
  "Risugami's ModLoader": 'modloader',
  Canvas: 'canvas',
  Iris: 'iris',
  OptiFine: 'optifine',
  'Vanilla Shader': 'vanilla',
  Paper: 'paper',
  Spigot: 'spigot',
  Bukkit: 'bukkit',
  Folia: 'folia',
  Purpur: 'purpur',
  Sponge: 'sponge',
  BungeeCord: 'bungeecord',
  'Geyser Extension': 'geyser',
  Velocity: 'velocity',
  Waterfall: 'waterfall',
}

export function loaderIconSvg(label: string): string {
  const key = labelKeys[label] ?? label.toLowerCase().replace(/\s+/g, '-')
  return icons[key] ?? ''
}
