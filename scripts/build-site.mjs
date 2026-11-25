import { copyFileSync, mkdirSync, readFileSync, readdirSync, statSync, writeFileSync } from 'node:fs'

const root = new URL('..', import.meta.url)
const out = new URL('site/', root)
const read = (path) => readFileSync(new URL(path, root), 'utf8')

mkdirSync(out, { recursive: true })

function slugify(text) {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
}

function parseDevlog(markdown) {
  return markdown
    .split(/^## /m)
    .slice(1)
    .map((block) => {
      const [heading = '', ...lines] = block.trim().split('\n')
      const [version = '', ...dateParts] = heading.split(' - ')
      const groups = []
      const looseItems = []
      let current = null

      for (const line of lines) {
        const trimmed = line.trim()
        if (trimmed.startsWith('### ')) {
          current = { title: trimmed.slice(4).trim(), items: [] }
          groups.push(current)
        } else if (trimmed.startsWith('- ')) {
          const text = trimmed.slice(2).trim()
          if (current) current.items.push(text)
          else looseItems.push(text)
        }
      }

      if (looseItems.length) groups.push({ title: 'Added', items: looseItems })

      const visible = groups.filter((group) => group.title.toLowerCase() !== 'note')

      return {
        id: slugify(version),
        version: version.trim(),
        date: dateParts.join(' - ').trim(),
        categories: visible.map((group) => group.title),
        groups: visible,
      }
    })
    .filter((entry) => entry.version && entry.groups.length)
}

function parseRoadmap(markdown) {
  const section = markdown.split(/^## Coming soon\s*$/m)[1]?.split(/^## /m)[0] ?? ''
  return section
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line.startsWith('- '))
    .map((line) => line.slice(2).trim())
}

function versionParts(version) {
  const match = /(\d+)\.(\d+)\.(\d+)/.exec(version)
  return match ? match.slice(1).map(Number) : [0, 0, 0]
}

function parseApks() {
  const dir = new URL('builds/', root)
  let files = []
  try {
    files = readdirSync(dir)
  } catch {
    return []
  }

  return files
    .filter((name) => name.endsWith('.apk'))
    .map((name) => {
      const versionMatch = /v(\d+\.\d+\.\d+(?:-[a-z]+)?)/i.exec(name)
      const version = versionMatch ? versionMatch[1] : 'unknown'
      const variant = name
        .replace(/^Minirynth-v?/i, '')
        .replace(/\.apk$/, '')
        .replace(/^\d+\.\d+\.\d+(?:-[a-z]+)?/i, '')
        .replace(/^-+/, '')
        .trim()
      const stat = statSync(new URL(name, dir))
      const tag = version === 'unknown' ? '' : `v${version}`

      return {
        name,
        version,
        variant,
        size: stat.size,
        date: stat.mtime.toISOString().slice(0, 10),
        url: tag
          ? `https://github.com/frteddz/Minirynth/releases/download/${tag}/${name}`
          : 'https://github.com/frteddz/Minirynth/releases',
        tagUrl: tag
          ? `https://github.com/frteddz/Minirynth/releases/tag/${tag}`
          : 'https://github.com/frteddz/Minirynth/releases',
      }
    })
    .sort((a, b) => {
      const av = versionParts(a.version)
      const bv = versionParts(b.version)
      for (let i = 0; i < 3; i += 1) {
        if (bv[i] !== av[i]) return bv[i] - av[i]
      }
      return a.name.localeCompare(b.name)
    })
}

async function fetchBugs() {
  const response = await fetch(
    'https://api.github.com/repos/frteddz/Minirynth/issues?state=open&per_page=30&sort=created&direction=desc',
    {
      headers: {
        Accept: 'application/vnd.github+json',
        'User-Agent': 'Minirynth-site-builder (Unofficial mobile client for Modrinth)',
      },
    },
  )
  if (!response.ok) throw new Error(`GitHub API returned ${response.status}`)
  const data = await response.json()
  return data
    .filter((issue) => !issue.pull_request)
    .map((issue) => ({
      number: issue.number,
      title: issue.title,
      url: issue.html_url,
      labels: issue.labels.map((label) => label.name),
      comments: issue.comments,
      date: issue.created_at.slice(0, 10),
    }))
}

const devlog = parseDevlog(read('CHANGELOG.md'))
const roadmap = parseRoadmap(read('README.md'))
const apks = parseApks()
const pkg = JSON.parse(read('package.json'))

try {
  const bugs = await fetchBugs()
  writeFileSync(new URL('bugs.js', out), `export const bugs = ${JSON.stringify(bugs, null, 2)}\n`)
} catch (error) {
  try {
    readFileSync(new URL('bugs.js', out))
  } catch {
    writeFileSync(new URL('bugs.js', out), 'export const bugs = []\n')
  }
  console.warn(`Could not refresh open bugs: ${error.message}`)
}

const stats = {
  releases: devlog.length,
  latest: devlog[0]?.version ?? '',
  categories: [...new Set(devlog.flatMap((entry) => entry.categories))].sort(),
  apks: apks.length,
}

writeFileSync(
  new URL('devlog.js', out),
  `export const devlog = ${JSON.stringify(devlog, null, 2)}\n\n` +
    `export const roadmap = ${JSON.stringify(roadmap, null, 2)}\n\n` +
    `export const apks = ${JSON.stringify(apks, null, 2)}\n\n` +
    `export const stats = ${JSON.stringify(stats, null, 2)}\n`,
)

writeFileSync(
  new URL('index.html', out),
  read('site/index.html').replace(
    /(<p class="build">Current build: <strong>)[^<]+(<\/strong><\/p>)/,
    `$1${pkg.displayVersion}$2`,
  ),
)

copyFileSync(new URL('assets/minirynth/svg/minirynth-lockup.svg', root), new URL('logo.svg', out))
copyFileSync(new URL('assets/minirynth/svg/minirynth-icon.svg', root), new URL('icon.svg', out))

console.log(
  `Wrote ${devlog.length} devlog entries, ${roadmap.length} roadmap items and ${apks.length} APKs to site/`,
)

