# @paget/ui

**Vue 3 聊天界面 / Vue 3 Chat UI**

Paget 的用户入口模块，提供悬浮按钮（FAB）、聊天对话框、设置面板等交互界面。该包将嵌入到生产系统中，需严格遵循设计规范。

The user-facing entry module of Paget. Provides floating action button (FAB), chat dialog, settings panel and other interactive UI. This package is embedded into production systems, so it must follow design specifications strictly.

## 功能 / Features

### 悬浮按钮（FAB）/ Floating Action Button

- 可拖拽、fixed 定位 / Draggable with fixed positioning
- 贴边吸附（靠近窗口边缘时半隐藏）/ Edge snapping (half-hidden when near viewport edge)
- 点击展开对话框，位置感知（自动选择展开方向）/ Click to expand dialog with position-aware expansion
- AI 运行时切换为动态图标 / Animated icon when AI is processing

### 聊天对话框 / Chat Dialog

- 消息历史列表（支持 Markdown 渲染）/ Message history with Markdown rendering
- 工具栏（附件、设置）/ Toolbar (attachment, settings)
- 输入框 + 发送/停止按钮 / Input field + send/stop buttons
- 活动指示器（思考中动画、执行状态）/ Activity indicator (typing animation, execution status)

### 设置面板 / Settings Panel

- 语言切换（zh-CN / en-US）/ Language toggle
- 遮罩层、暗色模式、通知、自动翻译等开关 / Mask, dark mode, notification, auto-translate toggles
- 草稿-保存模式（编辑临时副本，保存时应用）/ Draft-then-save pattern

## 组件结构 / Component Structure

```
src/
├── components/
│   ├── FloatingButton.vue        # FAB 悬浮按钮
│   ├── ChatPanel/                # 聊天对话框
│   │   ├── ChatPanel.vue         # 主组件（整合 WS、Agent、Chat）
│   │   ├── ChatHeader.vue        # 头部
│   │   └── ChatFooter.vue        # 底部（工具栏 + 输入框）
│   ├── MessageList/              # 消息列表
│   │   ├── MessageList.vue       # 列表容器
│   │   ├── MessageItem.vue       # 单条消息
│   │   └── ActivityIndicator.vue # 活动指示器
│   └── ConfigPanel/              # 设置面板
│       └── ConfigPanel.vue       # 设置弹窗
├── composables/                  # 组合式函数
│   ├── useWebSocket.ts           # WebSocket 通信
│   ├── useAgent.ts               # Agent 状态管理
│   ├── useChat.ts                # 聊天消息
│   ├── useConfig.ts              # 用户配置
│   └── useDrag.ts                # 拖拽行为
├── stores/                       # Pinia 状态
├── styles/                       # CSS 设计令牌
└── i18n/                         # 国际化
```

## 规则 / Rules

- Composition API + `<script setup>` only
- CSS 使用 `--paget-*` 自定义属性 / CSS uses `--paget-*` custom properties
- 不使用第三方 UI 库 / No third-party UI library
- 所有用户可见文本需添加 i18n 条目 / All user-visible strings need i18n entries
- Composable 封装有状态逻辑，组件专注渲染 / Composables for stateful logic, components for rendering

## 开发 / Development

```bash
pnpm --filter @paget/ui dev       # Vite dev server (port 5173)
pnpm --filter @paget/ui build     # Production build
```
