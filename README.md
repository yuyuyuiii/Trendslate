# Trendslate

GitHub Trending 页面仓库描述自动翻译为中文的 Chrome 扩展。

## 功能

- 自动识别 GitHub Trending 页面的英文描述并翻译为中文
- 浏览器工具栏 Popup 切换原文/译文
- 翻译结果本地缓存（`cache:{owner/repo}`），仓库内容变更自动失效
- 清空缓存按钮
- 静默失败：API 出错时保留原文，页面右上角显示错误详情
- 支持 `?since=weekly`、`?since=monthly`、`/javascript` 等子页面

## 使用方式

### 安装

```bash
git clone https://github.com/yuyuyuiii/Trendslate.git
cd Trendslate
npm install
```

### 配置 API Key

创建 `.env` 文件：

```
VITE_DEEPL_API_KEY=你的DeepL_API密钥
```

免费 Key 在 [DeepL API](https://www.deepl.com/your-account/keys) 申请。

### 构建 & 加载

```bash
npm run build
```

Chrome → `chrome://extensions` → 开启开发者模式 → "加载已解压的扩展" → 选择 `.output/chrome-mv3/`

## 架构

```
┌──────────────────────────────────────┐
│ Content Script (github.com/trending) │
│  - 提取 DOM 描述文本                 │
│  - 查缓存 (browser.storage.local)    │
│  - 发消息给 Background 请求翻译      │
│  - 替换 DOM 文本                     │
│  - 监听 storage 变化切换原文/译文    │
└────────────┬─────────────────────────┘
             │ runtime.sendMessage
┌────────────▼─────────────────────────┐
│ Background Service Worker            │
│  - 接收 TRANSLATE 消息               │
│  - 调 DeepL API (fetch)              │
│  - 返回翻译结果                      │
└──────────────────────────────────────┘
┌──────────────────────────────────────┐
│ Popup (浏览器工具栏)                  │
│  - Toggle 原文/译文                   │
│  - 清空缓存按钮                       │
└──────────────────────────────────────┘
```

## 技术栈

- **框架**: [WXT](https://wxt.dev) (Vite + TypeScript)
- **UI**: React
- **翻译**: DeepL API (Free)
- **存储**: `browser.storage.local`
- **目标**: Chrome MV3
