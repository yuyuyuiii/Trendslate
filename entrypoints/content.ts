import { extractDescriptions } from '../utils/dom'
import { translateText } from '../utils/translator'
import { getCachedTranslation, setCachedTranslation } from '../utils/cache'

const ORIGINAL_ATTR = 'data-trendslate-original'
const TRANSLATED_ATTR = 'data-trendslate-translated'

function showError(msg: string) {
  const existing = document.getElementById('trendslate-toast')
  if (existing) existing.remove()

  const toast = document.createElement('div')
  toast.id = 'trendslate-toast'
  toast.textContent = `[Trendslate] ${msg}`
  Object.assign(toast.style, {
    position: 'fixed',
    top: '16px',
    right: '16px',
    zIndex: 999999,
    maxWidth: '480px',
    padding: '12px 16px',
    background: '#fef2f2',
    color: '#991b1b',
    border: '1px solid #fecaca',
    borderRadius: '8px',
    fontSize: '13px',
    fontFamily: 'monospace',
    whiteSpace: 'pre-wrap',
    wordBreak: 'break-all',
    boxShadow: '0 4px 12px rgba(0,0,0,.15)',
    cursor: 'pointer',
  })
  toast.addEventListener('click', () => toast.remove())
  document.body.appendChild(toast)
}

function applyTranslation(element: HTMLElement, original: string, translated: string) {
  element.setAttribute(ORIGINAL_ATTR, original)
  element.setAttribute(TRANSLATED_ATTR, translated)
  element.textContent = translated
}

function toggleShowOriginal(showOriginal: boolean) {
  for (const el of document.querySelectorAll<HTMLElement>(`[${TRANSLATED_ATTR}]`)) {
    if (showOriginal) {
      const original = el.getAttribute(ORIGINAL_ATTR)
      if (original !== null) el.textContent = original
    } else {
      const translated = el.getAttribute(TRANSLATED_ATTR)
      if (translated !== null) el.textContent = translated
    }
  }
}

async function translateAndReplace() {
  const descriptions = extractDescriptions()
  if (descriptions.length === 0) return

  const toTranslate: { repo: string; element: HTMLElement; text: string }[] = []

  for (const desc of descriptions) {
    const cached = await getCachedTranslation(desc.repo)
    if (cached && cached.original === desc.text) {
      applyTranslation(desc.element, desc.text, cached.translated)
    } else {
      toTranslate.push({ repo: desc.repo, element: desc.element, text: desc.text })
    }
  }

  if (toTranslate.length === 0) return

  const results = await Promise.allSettled(
    toTranslate.map(d => translateText(d.text))
  )

  for (let i = 0; i < toTranslate.length; i++) {
    const { repo, element, text } = toTranslate[i]
    const result = results[i]

    if (result.status === 'fulfilled' && result.value) {
      applyTranslation(element, text, result.value)
      await setCachedTranslation(repo, text, result.value)
    } else if (result.status === 'rejected') {
      showError(result.reason.message ?? String(result.reason))
    }
  }
}

function handlePage() {
  translateAndReplace()
}

export default defineContentScript({
  matches: ['https://github.com/trending*'],
  main() {
    document.addEventListener('turbo:load', handlePage)

    browser.storage.onChanged.addListener((changes) => {
      if (changes.showOriginal !== undefined) {
        toggleShowOriginal(changes.showOriginal.newValue as boolean)
      }
    })
  },
})
