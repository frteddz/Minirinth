import { devlog, roadmap, apks, stats } from './devlog.js'
import { bugs } from './bugs.js'

const params = new URLSearchParams(location.search)
const search = document.getElementById('search')
const sortButton = document.getElementById('devlog-sort')
const chipsHost = document.getElementById('devlog-chips')
const summary = document.getElementById('devlog-summary')
const listHost = document.getElementById('devlog-list')
const roadmapHost = document.getElementById('roadmap-list')

const state = {
  query: params.get('q') ?? '',
  update: params.get('update') ?? 'All',
  categories: new Set((params.get('cat') ?? '').split(',').filter(Boolean)),
  sort: params.get('sort') === 'oldest' ? 'oldest' : 'newest',
}

function splitVersion(version) {
  const match = /^(\S+)\s+(.+)$/.exec(version)
  return match ? { number: match[1], update: match[2] } : { number: version, update: '' }
}

function entryText(entry) {
  return [entry.version, entry.date, ...entry.groups.flatMap((group) => [group.title, ...group.items])]
    .join(' ')
    .toLowerCase()
}

function appendHighlighted(target, text, query) {
  if (!query) {
    target.appendChild(document.createTextNode(text))
    return
  }

  const lower = text.toLowerCase()
  const needle = query.toLowerCase()
  let index = 0

  while (index < text.length) {
    const found = lower.indexOf(needle, index)
    if (found === -1) {
      target.appendChild(document.createTextNode(text.slice(index)))
      break
    }
    if (found > index) target.appendChild(document.createTextNode(text.slice(index, found)))
    const mark = document.createElement('mark')
    mark.textContent = text.slice(found, found + needle.length)
    target.appendChild(mark)
    index = found + needle.length
  }
}

function renderInline(text, target, query) {
  for (const part of text.split(/(`[^`]+`)/g)) {
    if (!part) continue
    if (part.startsWith('`') && part.endsWith('`')) {
      const code = document.createElement('code')
      code.textContent = part.slice(1, -1)
      target.appendChild(code)
    } else {
      appendHighlighted(target, part, query)
    }
  }
}

function syncUrl() {
  const next = new URLSearchParams()
  if (state.query) next.set('q', state.query)
  if (state.update !== 'All') next.set('update', state.update)
  if (state.categories.size) next.set('cat', [...state.categories].join(','))
  if (state.sort !== 'newest') next.set('sort', state.sort)
  const query = next.toString()
  history.replaceState(null, '', `${location.pathname}${query ? `?${query}` : ''}${location.hash}`)
}

function matchesEntry(entry) {
  if (state.query && !entryText(entry).includes(state.query.toLowerCase())) return false
  if (state.update !== 'All' && splitVersion(entry.version).update !== state.update) return false
  if (state.categories.size && !entry.categories.some((category) => state.categories.has(category))) {
    return false
  }
  return true
}

function makeChip(label, count, active, onClick) {
  const button = document.createElement('button')
  button.type = 'button'
  button.className = 'chip'
  button.setAttribute('aria-pressed', String(active))
  button.appendChild(document.createTextNode(label))

  const badge = document.createElement('span')
  badge.className = 'chip__count'
  badge.textContent = String(count)
  button.appendChild(badge)

  button.addEventListener('click', () => {
    onClick()
    syncUrl()
    renderAll()
  })
  return button
}

function renderChips() {
  chipsHost.replaceChildren()

  const updates = ['All', ...new Set(devlog.map((entry) => splitVersion(entry.version).update || 'Other'))]
  for (const update of updates) {
    const count =
      update === 'All'
        ? devlog.length
        : devlog.filter((entry) => (splitVersion(entry.version).update || 'Other') === update).length
    chipsHost.appendChild(
      makeChip(update, count, state.update === update, () => {
        state.update = update
      }),
    )
  }

  const divider = document.createElement('span')
  divider.className = 'chip-divider'
  divider.setAttribute('aria-hidden', 'true')
  chipsHost.appendChild(divider)

  const categories = [...new Set(devlog.flatMap((entry) => entry.categories))].sort()
  for (const category of categories) {
    const count = devlog.filter((entry) => entry.categories.includes(category)).length
    chipsHost.appendChild(
      makeChip(category, count, state.categories.has(category), () => {
        if (state.categories.has(category)) state.categories.delete(category)
        else state.categories.add(category)
      }),
    )
  }
}

function renderStats() {
  const host = document.getElementById('stats-list')
  host.replaceChildren()

  const items = [
    ['Releases', String(stats.releases)],
    ['Builds', String(stats.apks)],
    ['Latest', stats.latest.replace(/^v/, '')],
  ]

  for (const [label, value] of items) {
    const item = document.createElement('div')
    item.className = 'stat'
    const strong = document.createElement('strong')
    strong.textContent = value
    const span = document.createElement('span')
    span.textContent = label
    item.append(strong, span)
    host.appendChild(item)
  }
}

function renderEntry(entry) {
  const article = document.createElement('article')
  article.className = 'entry'
  article.id = `release-${entry.id}`

  const head = document.createElement('div')
  head.className = 'entry-head'

  const heading = document.createElement('h3')
  appendHighlighted(heading, entry.version, state.query)
  head.appendChild(heading)

  const meta = document.createElement('div')
  meta.className = 'entry-meta'

  if (entry.date) {
    const time = document.createElement('time')
    time.textContent = entry.date
    meta.appendChild(time)
  }

  const copy = document.createElement('button')
  copy.type = 'button'
  copy.className = 'entry-copy'
  copy.dataset.copy = `${location.origin}${location.pathname}#release-${entry.id}`
  copy.textContent = 'Copy link'
  meta.appendChild(copy)

  head.appendChild(meta)
  article.appendChild(head)

  for (const group of entry.groups) {
    const section = document.createElement('div')
    section.className = 'entry-group'

    const heading = document.createElement('h4')
    heading.textContent = group.title
    section.appendChild(heading)

    const items = document.createElement('ul')
    for (const itemText of group.items) {
      const item = document.createElement('li')
      renderInline(itemText, item, state.query)
      items.appendChild(item)
    }
    section.appendChild(items)
    article.appendChild(section)
  }

  return article
}

function monthLabel(date) {
  const parsed = new Date(`${date}T00:00:00`)
  if (Number.isNaN(parsed.getTime())) return date
  return parsed.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
}

function renderDevlog() {
  const shown = devlog.filter(matchesEntry)
  summary.textContent = `Showing ${shown.length} of ${devlog.length} releases`

  listHost.replaceChildren()

  if (!shown.length) {
    const empty = document.createElement('p')
    empty.className = 'devlog-empty'
    empty.textContent = 'Nothing matches those filters.'
    listHost.appendChild(empty)
    return
  }

  const sorted = [...shown].sort((a, b) =>
    state.sort === 'newest' ? b.date.localeCompare(a.date) : a.date.localeCompare(b.date),
  )

  const months = new Map()
  for (const entry of sorted) {
    const label = monthLabel(entry.date)
    if (!months.has(label)) months.set(label, [])
    months.get(label).push(entry)
  }

  for (const [label, entries] of months) {
    const group = document.createElement('div')
    group.className = 'date-group'

    const heading = document.createElement('h3')
    heading.className = 'date-group__label'
    heading.textContent = label
    group.appendChild(heading)

    for (const entry of entries) group.appendChild(renderEntry(entry))
    listHost.appendChild(group)
  }
}

function renderRoadmap() {
  roadmapHost.replaceChildren()

  const shown = state.query
    ? roadmap.filter((item) => item.toLowerCase().includes(state.query.toLowerCase()))
    : roadmap

  if (!shown.length) {
    const empty = document.createElement('li')
    empty.className = 'roadmap-empty'
    empty.textContent = 'Nothing matches that search.'
    roadmapHost.appendChild(empty)
    return
  }

  for (const itemText of shown) {
    const item = document.createElement('li')
    renderInline(itemText, item, state.query)
    roadmapHost.appendChild(item)
  }
}

function formatSize(bytes) {
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

function renderApks() {
  const host = document.getElementById('apk-list')
  host.replaceChildren()

  const head = document.createElement('div')
  head.className = 'apk-row apk-row--head'
  for (const label of ['Build', 'Date', 'Size']) {
    const cell = document.createElement('span')
    cell.textContent = label
    head.appendChild(cell)
  }
  host.appendChild(head)

  for (const apk of apks) {
    const row = document.createElement('div')
    row.className = 'apk-row'

    const build = document.createElement('span')
    build.className = 'apk-build'
    const link = document.createElement('a')
    link.href = apk.url
    link.target = '_blank'
    link.rel = 'noreferrer'
    link.textContent = `v${apk.version}`
    build.appendChild(link)
    if (apk.variant) {
      const variant = document.createElement('span')
      variant.className = 'apk-variant'
      variant.textContent = apk.variant.replace(/-/g, ' ')
      build.appendChild(variant)
    }
    row.appendChild(build)

    const date = document.createElement('span')
    date.textContent = apk.date
    row.appendChild(date)

    const size = document.createElement('span')
    size.textContent = formatSize(apk.size)
    row.appendChild(size)

    host.appendChild(row)
  }
}

function renderBugs() {
  const host = document.getElementById('bug-list')
  if (!host) return
  host.replaceChildren()

  if (!bugs.length) {
    const empty = document.createElement('p')
    empty.className = 'bug-empty'
    empty.textContent = 'No open bugs right now.'
    host.appendChild(empty)
    return
  }

  for (const bug of bugs) {
    const row = document.createElement('a')
    row.className = 'bug-row'
    row.href = bug.url
    row.target = '_blank'
    row.rel = 'noreferrer'

    const number = document.createElement('span')
    number.className = 'bug-number'
    number.textContent = `#${bug.number}`
    row.appendChild(number)

    const title = document.createElement('span')
    title.className = 'bug-title'
    title.textContent = bug.title
    row.appendChild(title)

    const meta = []
    if (bug.labels.length) meta.push(bug.labels.join(', '))
    if (bug.comments) meta.push(`${bug.comments} comments`)
    if (meta.length) {
      const metaSpan = document.createElement('span')
      metaSpan.className = 'bug-meta'
      metaSpan.textContent = meta.join(' | ')
      row.appendChild(metaSpan)
    }

    host.appendChild(row)
  }
}

function renderAll() {
  renderChips()
  renderDevlog()
  renderRoadmap()
}

function setupTools() {
  if (search) {
    search.value = state.query
    search.addEventListener('input', () => {
      state.query = search.value.trim()
      syncUrl()
      renderAll()
    })
  }

  if (sortButton) {
    const updateLabel = () => {
      sortButton.textContent = state.sort === 'newest' ? 'Newest first' : 'Oldest first'
    }
    updateLabel()
    sortButton.addEventListener('click', () => {
      state.sort = state.sort === 'newest' ? 'oldest' : 'newest'
      updateLabel()
      syncUrl()
      renderDevlog()
    })
  }

  document.addEventListener('keydown', (event) => {
    const tag = document.activeElement?.tagName
    const typing = tag === 'INPUT' || tag === 'TEXTAREA'
    if (event.key === '/' && !typing && search) {
      event.preventDefault()
      search.focus()
    }
    if (event.key === 'Escape' && document.activeElement === search) {
      state.query = ''
      search.value = ''
      syncUrl()
      renderAll()
      search.blur()
    }
  })

  document.addEventListener('click', async (event) => {
    const button = event.target.closest('[data-copy]')
    if (!button) return
    try {
      await navigator.clipboard.writeText(button.dataset.copy)
      button.textContent = 'Copied'
    } catch {
      button.textContent = 'Copy failed'
    }
    setTimeout(() => {
      button.textContent = 'Copy link'
    }, 1500)
  })
}

renderStats()
renderApks()
renderBugs()
setupTools()
renderAll()
