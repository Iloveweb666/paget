# @paget/page-controller

**浏览器端 DOM 控制器 / Browser-side DOM controller**

运行在浏览器环境中，负责提取页面状态和执行元素交互操作。注入到目标网页中使用，不运行在服务端。

Runs in the browser context, responsible for extracting page state and executing element interactions. Injected into target web pages, does NOT run on the server.

## 核心功能 / Core Features

### DOM 提取 / DOM Extraction

- **`getBrowserState()`** — 提取当前页面的可交互元素树，生成简化 HTML 供 LLM 理解
- **`getFlatTree()`** — 扁平化 DOM 树，为每个可交互元素分配索引
- **`getSelectorMap()`** — 建立索引到 DOM 元素的映射

### 操作执行 / Action Execution

- **`executeAction(action)`** — 执行单个操作
- **`executeBatch(actions, onProgress?)`** — 批量顺序执行，遇错即停

支持的操作 / Supported actions:

| 操作 / Action | 说明 / Description |
|---|---|
| `click` | 模拟点击（支持 `blur` 参数控制是否在动作后失焦）|
| `input` | 输入文本（默认完成后失焦，支持 `blur` 覆盖）|
| `select` | 选择下拉选项（默认完成后失焦，支持 `blur` 覆盖） |
| `scroll` | 垂直滚动 |
| `scroll_horizontally` | 水平滚动 |
| `wait` | 等待指定毫秒数 |
| `done` | 完成当前任务（透传完成消息） |
| `ask_user` | 向用户提问（当前仅透传，不阻塞流程） |
| `execute_javascript` | 执行任意 JavaScript |

### 框架适配 / Framework Patches

- **Vue.js** (`patches/vue.ts`) — 处理 v-model 响应式更新
- **Element Plus** (`patches/element-plus.ts`) — 处理自定义组件（Select、DatePicker）

### 视觉反馈 / Visual Feedback

- **SimulatorMask** — 全屏遮罩层（z-index 99998），阻止用户操作
- **元素高亮** — 执行操作时高亮目标元素（z-index 99999）

## 规则 / Rules

- 纯 TypeScript，核心代码无框架依赖 / Pure TypeScript, no framework dependency in core
- 无 Node.js API，仅浏览器环境 / No Node.js APIs, browser context only
- 批量执行默认遇错即停，未知工具会自动跳过 / Batch execution fails fast by default, unknown tools are skipped
- DOM 提取性能 < 100ms / DOM extraction < 100ms for typical pages
- 兼容 Chrome 90+、Firefox 90+、Safari 15+ / Compatible with modern browsers

## 构建 / Build

```bash
pnpm --filter @paget/page-controller build
```
