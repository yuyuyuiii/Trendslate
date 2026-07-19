const CJK_RE = /[\u4e00-\u9fff\u3400-\u4dbf]/

export function isChinese(text: string): boolean {
  return CJK_RE.test(text)
}

export async function translateText(text: string): Promise<string | null> {
  if (isChinese(text)) return text

  const result: { translated?: string; error?: string } =
    await browser.runtime.sendMessage({ type: 'TRANSLATE', text })

  if (result.error) throw new Error(result.error)
  return result.translated ?? null
}
