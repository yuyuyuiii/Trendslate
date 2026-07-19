# Trendslate — 技术规格说明书

## 1. 概述

**Trendslate** 是一个 Chrome 浏览器扩展，自动翻译 GitHub Trending 页面（`github.com/trending`）中仓库的描述（description）为中文，帮助中文开发者快速了解热门项目。

- Manifest V3
- 仅 Chrome 浏览器
- 个人使用，不发布到 Chrome Web Store

---

## 2. 功能需求

| ID  | 功能          | 说明                                                    |
| --- | ------------- | ------------------------------------------------------- |
| F1  | 读取描述      | 页面加载后自动获取所有仓库 description 文本             |
| F2  | 翻译描述      | 调用 DeepL API 将英文描述翻译为中文                     |
| F3  | 替换显示      | 将页面上的描述文本替换为翻译后的中文                    |
| F4  | 原文/译文切换 | 通过浏览器工具栏 popup 中的 toggle 开关切换             |
| F5  | 缓存          | 以 `owner/repo` 为 key 缓存翻译结果，仓库变更时自动失效 |
| F6  | 清空缓存      | Popup 中提供清除所有缓存的按钮                          |
| F7  | 静默失败      | API 出错时不展示错误，保留原文                          |

---

## 3. 非功能需求

- 翻译仅针对 description 字段，不翻译 repo 名称、星标数、语言标签等
- 仅页面中存在描述文本时才发起翻译请求
- 不发送任何用户数据，仅向 DeepL API 发送待翻译文本

---

## 4. 技术架构

```
┌─────────────────────────────────────────────┐
│                Chrome Browser               │
│  ┌─────────────────────────────────────┐    │
│  │       GitHub Trending Page          │    │
│  │  ┌──────────────────────────────┐   │    │
│  │  │   Content Script (trendslate)│   │    │
│  │  │  - 读取 DOM 提取 description │   │    │
│  │  │  - 查询缓存 (chrome.storage) │   │    │
│  │  │  - 调用 DeepL API 翻译       │   │    │
│  │  │  - 替换 DOM 文本             │   │    │
│  │  └──────────────────────────────┘   │    │
│  └─────────────────────────────────────┘    │
│  ┌─────────────────────────────────────┐    │
│  │      Popup (Service Worker)         │    │
│  │   - Toggle 开关（原文/译文）        │    │
│  │   - 清空缓存按钮                    │    │
│  └─────────────────────────────────────┘    │
└─────────────────────────────────────────────┘
```

### 4.1 组件

| 组件           | 技术                   | 职责                                                       |
| -------------- | ---------------------- | ---------------------------------------------------------- |
| Content Script | TypeScript             | 注入 github.com/trending 页面，操作 DOM                    |
| Popup          | HTML + React/Vue       | 浏览器工具栏中的控制界面                                   |
| Service Worker | TypeScript             | 可选，用于消息中转（当前架构由 content script 直接调 API） |
| Storage        | `chrome.storage.local` | 缓存翻译结果、用户设置                                     |

### 4.2 CSS 选择器

```css
/* 描述元素 */
article.Box-row > p.col-9.color-fg-muted.my-1

/* 仓库全名（h2 > a 内 span.text-normal 之后的部分） */
article.Box-row h2 a
```

---

## 5. 数据流

```
页面加载
  ↓
Content Script 扫描 DOM，提取所有描述文本 + 对应 repo 名
  ↓
查询 chrome.storage.local 缓存
  ├─ 命中 → 直接替换 DOM（跳过翻译）
  └─ 未命中 → 批量调用 DeepL API
       ↓
      收到翻译结果 → 写入缓存 → 替换 DOM
  ↓
用户点击 Popup Toggle
  ↓
Content Script 监听到 storage 变化 → 切换原文/译文显示
  ↓
用户点击"清空缓存"
  ↓
清除 chrome.storage.local 中所有翻译缓存
```

---

## 6. DeepL API

- **端点**: `POST https://api-free.deepl.com/v2/translate`
- **认证**: `Authorization: DeepL-Auth-Key <API_KEY>`
- **参数**:
  - `text`: 待翻译文本
  - `target_lang`: `ZH`
  - `source_lang`: `EN`
- **限制**: 免费版 50 万字/月，每分钟有速率限制
- **API Key**: 通过 `.env` 文件在构建时注入，不硬编码

---

## 7. 缓存策略

| 字段     | 值                                                            |
| -------- | ------------------------------------------------------------- |
| Key      | `cache:{owner/repo}`                                          |
| Value    | `{ translated: string, original: string, timestamp: number }` |
| 失效条件 | 仓库名变更（页面重新加载时自动判断）                          |
| 清除     | Popup 提供手动清除按钮                                        |

---

## 8. 开发工具链

- **构建工具**: WXT (https://wxt.dev)
- **语言**: TypeScript
- **UI**: React（WXT 默认支持）
- **包管理**: npm / pnpm
- **测试**: 手动加载到 Chrome 验证
