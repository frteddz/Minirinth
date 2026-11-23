import { copyFileSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'

const root = new URL('..', import.meta.url)
const out = new URL('site/', root)
const read = (path) => readFileSync(new URL(path, root), 'utf8')

mkdirSync(out, { recursive: true })

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

      return {
        version: version.trim(),
        date: dateParts.join(' - ').trim(),
        groups,
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

const devlog = parseDevlog(read('CHANGELOG.md'))
const roadmap = parseRoadmap(read('README.md'))

writeFileSync(
  new URL('devlog.js', out),
  `export const devlog = ${JSON.stringify(devlog, null, 2)}\n\nexport const roadmap = ${JSON.stringify(roadmap, null, 2)}\n`
)

copyFileSync(new URL('assets/minirynth/svg/minirynth-lockup.svg', root), new URL('logo.svg', out))
copyFileSync(new URL('assets/minirynth/svg/minirynth-icon.svg', root), new URL('icon.svg', out))

console.log(`Wrote ${devlog.length} devlog entries and ${roadmap.length} roadmap items to site/`)
