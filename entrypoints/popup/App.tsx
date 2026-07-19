import { useEffect, useState } from 'react'
import { clearAllCache } from '../../utils/cache'
import './App.css'

const STORAGE_KEY = 'showOriginal'

function App() {
  const [showOriginal, setShowOriginal] = useState(false)
  const [cacheCleared, setCacheCleared] = useState(false)

  useEffect(() => {
    browser.storage.local.get(STORAGE_KEY).then((result) => {
      if (result[STORAGE_KEY] !== undefined) {
        setShowOriginal(result[STORAGE_KEY] as boolean)
      }
    })
  }, [])

  function handleToggle() {
    const newValue = !showOriginal
    setShowOriginal(newValue)
    browser.storage.local.set({ [STORAGE_KEY]: newValue })
  }

  async function handleClearCache() {
    await clearAllCache()
    setCacheCleared(true)
    setTimeout(() => setCacheCleared(false), 2000)
  }

  return (
    <div className="popup">
      <h1 className="title">Trendslate</h1>

      <label className="toggle-row">
        <span className="toggle-label">
          {showOriginal ? '显示原文' : '显示译文'}
        </span>
        <input
          type="checkbox"
          checked={showOriginal}
          onChange={handleToggle}
        />
      </label>

      <button className="clear-btn" onClick={handleClearCache}>
        {cacheCleared ? '已清除 ✓' : '清空翻译缓存'}
      </button>
    </div>
  )
}

export default App
