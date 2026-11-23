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

function renderDevlog() {
  const host = document.getElementById('devlog-list')
  if (!host) return

  host.replaceChildren()

  for (const entry of devlog) {
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

      const label = document.createElement('h4')
      label.textContent = group.title
      section.appendChild(label)

      const list = document.createElement('ul')
      for (const itemText of group.items) {
        const item = document.createElement('li')
        renderInline(itemText, item)
        list.appendChild(item)
      }
      section.appendChild(list)
      article.appendChild(section)
    }

    host.appendChild(article)
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

renderDevlog()
renderRoadmap()
