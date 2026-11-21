import issues from '../assets/icons/links/issues.svg?raw'
import source from '../assets/icons/links/source.svg?raw'
import wiki from '../assets/icons/links/wiki.svg?raw'
import fallback from '../assets/icons/links/link.svg?raw'
import buymeacoffee from '../assets/icons/social-media/buymeacoffee.svg?raw'
import discord from '../assets/icons/social-media/discord.svg?raw'
import githubsponsors from '../assets/icons/social-media/githubsponsors.svg?raw'
import kofi from '../assets/icons/social-media/kofi.svg?raw'
import patreon from '../assets/icons/social-media/patreon.svg?raw'
import paypal from '../assets/icons/social-media/paypal.svg?raw'

const icons: Record<string, string> = {
  issues,
  source,
  wiki,
  discord,
  'buy me a coffee': buymeacoffee,
  buymeacoffee: buymeacoffee,
  bmac: buymeacoffee,
  'github sponsors': githubsponsors,
  githubsponsors: githubsponsors,
  kofi,
  'ko-fi': kofi,
  'ko fi': kofi,
  patreon,
  paypal,
}

export function linkIcon(label: string): string {
  return icons[label.trim().toLowerCase()] ?? fallback
}
