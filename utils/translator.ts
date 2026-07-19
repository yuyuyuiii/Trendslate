const DEEPL_API_URL = 'https://api-free.deepl.com/v2/translate'

const CJK_RE = /[\u4e00-\u9fff\u3400-\u4dbf]/

export function isChinese(text: string): boolean {
  return CJK_RE.test(text)
}

export async function translateText(text: string): Promise<string | null> {
  const apiKey = import.meta.env.VITE_DEEPL_API_KEY
  if (!apiKey) {
    console.warn('[Trendslate] DeepL API key not found')
    return null
  }

  if (isChinese(text)) {
    return text
  }

  try {
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
      console.warn(`[Trendslate] DeepL API error: ${res.status}`)
      return null
    }

    const data = await res.json()
    return data.translations?.[0]?.text ?? null
  } catch (err) {
    console.warn('[Trendslate] DeepL API request failed:', err)
    return null
  }
}
