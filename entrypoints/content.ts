import { extractDescriptions } from '../utils/dom'
import { translateText } from '../utils/translator'

function applyTranslation(element: HTMLElement, original: string, translated: string) {
  element.setAttribute('data-trendslate-original', original)
  element.setAttribute('data-trendslate-translated', '')
  element.textContent = translated
}

async function translateAndReplace() {
  const descriptions = extractDescriptions()
  if (descriptions.length === 0) return

  const results = await Promise.allSettled(
    descriptions.map(d => translateText(d.text))
  )

  for (let i = 0; i < descriptions.length; i++) {
    const desc = descriptions[i]
    const result = results[i]

    if (result.status === 'fulfilled' && result.value) {
      applyTranslation(desc.element, desc.text, result.value)
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
