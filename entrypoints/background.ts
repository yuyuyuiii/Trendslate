const DEEPL_API_URL = 'https://api-free.deepl.com/v2/translate'

async function translateText(text: string) {
  const apiKey = import.meta.env.VITE_DEEPL_API_KEY
  if (!apiKey) throw new Error('DeepL API key not found')

  const res = await fetch(DEEPL_API_URL, {
    method: 'POST',
    headers: {
      'Authorization': `DeepL-Auth-Key ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      text: [text],
      target_lang: 'ZH',
      source_lang: 'EN',
    }),
  })

  if (!res.ok) {
    const body = await res.text().catch(() => '')
    throw new Error(`DeepL API ${res.status}${body ? `: ${body.slice(0, 200)}` : ''}`)
  }

  const data = await res.json()
  return { translated: data.translations?.[0]?.text ?? null }
}

export default defineBackground(() => {
  browser.runtime.onMessage.addListener((message, _sender, sendResponse) => {
    if (message.type === 'TRANSLATE') {
      translateText(message.text as string)
        .then(sendResponse)
        .catch((err: Error) => sendResponse({ error: err.message }))
      return true
    }
  })
})
