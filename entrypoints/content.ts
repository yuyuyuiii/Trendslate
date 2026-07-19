import { extractDescriptions } from '../utils/dom'
import { translateText } from '../utils/translator'
import { getCachedTranslation, setCachedTranslation } from '../utils/cache'

function applyTranslation(element: HTMLElement, original: string, translated: string) {
  element.setAttribute('data-trendslate-original', original)
  element.setAttribute('data-trendslate-translated', '')
  element.textContent = translated
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
  },
})
