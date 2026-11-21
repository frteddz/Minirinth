import DOMPurify from 'dompurify'
import MarkdownIt from 'markdown-it'

const markdown = new MarkdownIt({
  html: false,
  linkify: true,
  breaks: true,
})

const defaultLinkOpen = markdown.renderer.rules.link_open

markdown.renderer.rules.link_open = (tokens, index, options, env, self) => {
  const token = tokens[index]
  token.attrSet('rel', 'noopener nofollow ugc')
  token.attrSet('target', '_blank')
  if (defaultLinkOpen) return defaultLinkOpen(tokens, index, options, env, self)
  return self.renderToken(tokens, index, options)
}

export function renderMarkdown(source: string): string {
  return DOMPurify.sanitize(markdown.render(source))
}
