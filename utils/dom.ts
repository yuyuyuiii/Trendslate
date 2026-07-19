import type { RepoDescription } from '../types'

const SELECTOR_DESCRIPTION = 'article.Box-row p.col-9.color-fg-muted.my-1'
const SELECTOR_REPO_LINK = 'h2 a'
const TRANSLATED_MARKER = 'data-trendslate-translated'

export function extractDescriptions(): RepoDescription[] {
  const rows = document.querySelectorAll('article.Box-row')
  const results: RepoDescription[] = []

  for (const row of rows) {
    const descEl = row.querySelector<HTMLElement>(SELECTOR_DESCRIPTION)
    if (!descEl) continue

    if (descEl.hasAttribute(TRANSLATED_MARKER)) continue

    const text = descEl.textContent?.trim() || ''
    if (!text) continue

    const repo = extractRepoName(row)
    if (!repo) continue

    results.push({ repo, element: descEl, text })
  }

  return results
}

function extractRepoName(row: Element): string | null {
  const link = row.querySelector<HTMLAnchorElement>(SELECTOR_REPO_LINK)
  if (!link) return null

  const href = link.getAttribute('href')
  if (!href) return null

  return href.replace(/^\//, '')
}
