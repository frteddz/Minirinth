import { devlog, roadmap } from './devlog.js'

function renderInline(text, target) {
  for (const part of text.split(/(`[^`]+`)/g)) {
    if (!part) continue
    if (part.startsWith('`') && part.endsWith('`')) {
      const code = document.createElement('code')
      code.textContent = part.slice(1, -1)
      target.appendChild(code)
    } else {
      target.appendChild(document.createTextNode(part))
    }
  }
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

let activeFilter = 'All'

function renderDevlog() {
  const host = document.getElementById('devlog-list')
  if (!host) return

  const search = document.getElementById('devlog-search')?.value.trim().toLowerCase() ?? ''
  host.replaceChildren()

  let shown = 0
  for (const entry of devlog) {
    if (search && !entryText(entry).includes(search)) continue
    if (activeFilter !== 'All') {
      const { update } = splitVersion(entry.version)
      const groupName = update || 'Other'
      if (groupName !== activeFilter) continue
    }
    shown += 1
  }

  if (shown === 0) {
    const empty = document.createElement('p')
    empty.className = 'devlog-empty'
    empty.textContent = 'Nothing matches that search.'
    host.appendChild(empty)
    return
  }

  const groups = new Map()
  for (const entry of devlog) {
    if (search && !entryText(entry).includes(search)) continue
    const { update } = splitVersion(entry.version)
    const name = update || 'Other'
    if (activeFilter !== 'All' && name !== activeFilter) continue
    if (!groups.has(name)) groups.set(name, [])
    groups.get(name).push(entry)
  }

  for (const [name, entries] of groups) {
    const wrapper = document.createElement('div')
    wrapper.className = name === 'Other' ? 'devlog-group devlog-group--plain' : 'devlog-group'

    if (name !== 'Other') {
      const bracket = document.createElement('div')
      bracket.className = 'devlog-group__bracket'
      bracket.setAttribute('aria-hidden', 'true')

      const side = document.createElement('div')
      side.className = 'devlog-group__side'
      side.appendChild(bracket)

      wrapper.appendChild(side)
    }

    const list = document.createElement('div')
    list.className = 'devlog-group__entries'

    for (const entry of entries) {
      const article = document.createElement('article')
      article.className = 'entry'

      const head = document.createElement('div')
      head.className = 'entry-head'

      const title = document.createElement('h3')
      title.textContent = entry.version
      head.appendChild(title)

      if (entry.date) {
        const time = document.createElement('time')
        time.textContent = entry.date
        head.appendChild(time)
      }

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
          renderInline(itemText, item)
          items.appendChild(item)
        }
        section.appendChild(items)
        article.appendChild(section)
      }

      list.appendChild(article)
    }

    wrapper.appendChild(list)
    host.appendChild(wrapper)
  }
}

function renderRoadmap() {
  const host = document.getElementById('roadmap-list')
  if (!host) return

  host.replaceChildren()

  for (const itemText of roadmap) {
    const item = document.createElement('li')
    renderInline(itemText, item)
    host.appendChild(item)
  }
}

function setupDevlogTools() {
  const search = document.getElementById('devlog-search')
  const button = document.getElementById('devlog-filter-button')
  const label = document.getElementById('devlog-filter-label')
  const menu = document.getElementById('devlog-filter-menu')
  if (!search || !button || !label || !menu) return

  search.addEventListener('input', renderDevlog)

  const options = ['All', ...new Set(devlog.map((entry) => splitVersion(entry.version).update || 'Other'))]
  for (const option of options) {
    const item = document.createElement('button')
    item.type = 'button'
    item.className = 'devlog-filter__option'
    item.textContent = option
    item.addEventListener('click', () => {
      activeFilter = option
      label.textContent = option
      menu.hidden = true
      button.setAttribute('aria-expanded', 'false')
      renderDevlog()
    })
    menu.appendChild(item)
  }

  button.addEventListener('click', () => {
    menu.hidden = !menu.hidden
    button.setAttribute('aria-expanded', String(!menu.hidden))
  })

  document.addEventListener('click', (event) => {
    if (!menu.hidden && !menu.contains(event.target) && event.target !== button) {
      menu.hidden = true
      button.setAttribute('aria-expanded', 'false')
    }
  })
}

setupDevlogTools()
renderDevlog()
renderRoadmap()
