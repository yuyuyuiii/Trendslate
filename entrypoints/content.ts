import { extractDescriptions } from '../utils/dom'

function handlePage() {
  const descriptions = extractDescriptions()
  console.log('Trendslate extracted descriptions:', descriptions)
}

export default defineContentScript({
  matches: ['https://github.com/trending*'],
  main() {
    document.addEventListener('turbo:load', handlePage)
  },
})
