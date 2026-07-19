import type { Translation } from '../types'

const CACHE_PREFIX = 'cache:'

export async function getCachedTranslation(repo: string): Promise<Translation | null> {
  const key = `${CACHE_PREFIX}${repo}`
  const result: Record<string, unknown> = await browser.storage.local.get(key)
  const entry = result[key] as Translation | undefined
  return entry ?? null
}

export async function setCachedTranslation(repo: string, original: string, translated: string): Promise<void> {
  const key = `${CACHE_PREFIX}${repo}`
  const entry: Translation = { original, translated, timestamp: Date.now() }
  await browser.storage.local.set({ [key]: entry })
}

export async function clearAllCache(): Promise<void> {
  const all: Record<string, unknown> = await browser.storage.local.get(null)
  const keysToRemove = Object.keys(all).filter(k => k.startsWith(CACHE_PREFIX))
  if (keysToRemove.length > 0) {
    await browser.storage.local.remove(keysToRemove)
  }
}
