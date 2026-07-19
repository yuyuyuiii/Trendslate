# Trendslate — 开发计划

## 阶段总览

| 阶段     | 内容                      | 预估工时 |
| -------- | ------------------------- | -------- |
| 1        | 项目初始化 & 脚手架搭建   | 30min    |
| 2        | Content Script — 读取描述 | 30min    |
| 3        | DeepL 翻译集成            | 1h       |
| 4        | 替换 & 显示               | 30min    |
| 5        | 缓存层                    | 1h       |
| 6        | Popup & Toggle 控制       | 1h       |
| 7        | 联调 & 验证               | 30min    |
| **总计** |                           | **4h**   |

---

## 详细 Task 列表

### Phase 1: 项目初始化

- [x] **1.1 确认环境** - 确认 Node.js ≥ 18 - 确认 Chrome 已安装
- [x] **1.2 用 WXT 初始化项目** - 执行 `npx wxt@latest init`，选择 TypeScript + React 模板 - 项目名 `trendslate` - 确认目录结构
- [x] **1.3 配置 manifest** - `manifest.json` 设置: - `name`: "Trendslate" - `permissions`: `["storage", "activeTab"]` - `host_permissions`: `["https://github.com/trending*", "https://api-free.deepl.com/*"]` - `content_scripts`: 匹配 `https://github.com/trending*`
- [x] **1.4 配置环境变量** - 创建 `.env` 文件，添加 `DEEPL_API_KEY=xxx` - 在 `wxt.config.ts` 中配置 `vite.env` 注入
- [x] **1.5 加载并验证** - `npm run dev` 启动 - Chrome 加载 `output/` 下的未打包扩展 - 打开 `github.com/trending` 确认 content script 注入成功（console.log）

### Phase 2: 读取描述

- [x] **2.1 实现描述提取函数** - 通过 `document.querySelectorAll('article.Box-row p')` 遍历 - 过滤出包含 `.col-9.color-fg-muted.my-1` 类的元素 - 提取文本内容
- [x] **2.2 实现 repo 名称提取** - 从同一个 `article.Box-row` 内的 `h2 a` 元素提取 `owner/repo` - 用于后续缓存的 key
- [x] **2.3 组合数据结构** - 输出 `Array<{ repo: string, element: HTMLElement, text: string }>` - 验证: 控制台输出提取到的描述列表
- [x] **2.4 边界处理** - 跳过已有翻译标记的元素 - 跳过无描述内容的仓库（description 元素存在但为空）- 页面使用 Turbo（GitHub 使用 Turbo Drive），监听 `turbo:load` 事件而非 `DOMContentLoaded`

### Phase 3: DeepL 翻译集成

- [x] **3.1 封装翻译 API 调用** - 函数 `translateText(text: string): Promise<string>` - POST `https://api-free.deepl.com/v2/translate` - Header: `Authorization: DeepL-Auth-Key ${key}` - Body: `{ text: [text], target_lang: "ZH", source_lang: "EN" }` - 解析响应，返回翻译文本
- [x] **3.2 批量翻译逻辑** - 收集未缓存的描述文本数组 - 逐个并行调用 `translateText`（`Promise.all`）- 处理单个失败（不中断整体流程，失败项跳过）
- [x] **3.3 错误处理** - 网络错误 / 4xx / 5xx → 静默失败，保留原文 - console.warn 记录错误（仅开发期可见）- 不展示错误 UI

### Phase 4: 替换 & 显示

- [x] **4.1 实现文本替换** - 将元素的 `textContent` 替换为翻译后的中文 - 在元素上设置 `data-trendslate-original` 属性保存原文 - 在元素上设置 `data-trendslate-translated` 标记
- [x] **4.2 原始数据保存** - 翻译前将原文存入 `data-trendslate-original` 属性 - 供 toggle 切换时恢复原文使用

### Phase 5: 缓存层

- [x] **5.1 实现缓存读写** - `getCachedTranslation(repo: string): Translation | null` - `setCachedTranslation(repo: string, original: string, translated: string): void` - 使用 `chrome.storage.local`
- [x] **5.2 缓存命中判断** - 以 `cache:{repo}` 为 key 存储 - 命中条件: key 存在且 `original` 字段与当前原文一致（仓库内容变更时重新翻译）- 未命中则调用翻译 API
- [x] **5.3 清空缓存** - `clearAllCache(): Promise<void>` - 遍历 `chrome.storage.local` 删除所有 `cache:` 前缀的 key - 暴露函数供 Popup 调用

### Phase 6: Popup & Toggle

- [ ] **6.1 创建 Popup HTML** - WXT 默认 `entrypoints/popup/` 目录 - 简单 React 组件: toggle 开关 + 清空缓存按钮
- [ ] **6.2 Toggle 状态管理** - 状态值存入 `chrome.storage.local` key: `showOriginal` - 默认 `false`（显示译文）
- [ ] **6.3 Toggle 与 Content Script 通信** - Content Script 监听 `chrome.storage.onChanged` - 当 `showOriginal` 变化时: - `true` → 遍历所有标记过 `data-trendslate-translated` 的元素，恢复 `data-trendslate-original` 原文 - `false` → 恢复为翻译文本
- [ ] **6.4 Popup 清空缓存按钮** - 调用 `clearAllCache()` - 显示"已清除"反馈（简单文字变化）
- [ ] **6.5 Popup 样式** - 简洁 UI，宽度 200px - 标题: "Trendslate" - Toggle 开关: "显示原文" / "显示译文" - 按钮: "清空翻译缓存"

### Phase 7: 联调 & 验证

- [ ] **7.1 端到端测试** - 打开 `github.com/trending` - 确认描述被翻译为中文 - 点击 Popup Toggle → 切换回原文 - 再次点击 → 恢复译文 - 点击"清空缓存" → 确认缓存清除 - 刷新页面 → 已缓存的直接展示，无 API 调用
- [ ] **7.2 错误场景验证** - 断网打开页面 → 正常展示原文，无报错 - 修改 `.env` 为无效 Key → 正常展示原文
- [ ] **7.3 多页面验证** - `github.com/trending?since=weekly` - `github.com/trending?since=monthly` - `github.com/trending/javascript`
- [ ] **7.4 边界验证** - 描述包含 HTML 实体（`&amp;` `&#39;`）→ 正确处理 - 描述为空 → 跳过 - 描述为中文 → 跳过（不调用 API）- 长描述 → 正常显示

---

## 文件结构（预计）

```
trendslate/
├── .env                      # DeepL API Key
├── wxt.config.ts             # WXT 配置
├── package.json
├── tsconfig.json
├── entrypoints/
│   ├── content.ts            # Content Script（读取/翻译/替换 DOM）
│   ├── popup/
│   │   ├── index.html
│   │   ├── main.tsx
│   │   └── App.tsx           # Popup 组件（toggle + 清空缓存）
│   └── background.ts         # Service Worker（可选，当前架构可能不需要）
├── utils/
│   ├── translator.ts         # DeepL API 调用
│   ├── cache.ts              # chrome.storage 缓存操作
│   └── dom.ts                # DOM 选择器 & 文本提取
└── types/
    └── index.ts              # 类型定义
```
