# @paget/shared

**共享类型与常量 / Shared types & constants**

前后端共用的 TypeScript 类型定义和常量，不包含任何运行时副作用代码。

Shared TypeScript type definitions and constants used by both frontend and backend. Contains no runtime code with side effects.

## 导出内容 / Exports

### 常量 / Constants

- **`WS_EVENTS`** — WebSocket 事件名称（task:submit, agent:status, page:action 等）
- **`AgentStatus`** — Agent 生命周期状态枚举（IDLE, RUNNING, COMPLETED, ERROR）
- **事件名称** — EVENT_STATUS_CHANGE, EVENT_HISTORY_CHANGE, EVENT_ACTIVITY, EVENT_DISPOSE

### 类型 / Types

- **`AgentAction`** — 原子操作（click, input, select, scroll, wait, done, ask_user 等）
- **`ActionResult`** / **`BatchResult`** — 操作执行结果
- **`MacroToolOutput`** — LLM 输出结构（反思 + 批量操作）
- **`HistoryEvent`** — 历史事件联合类型（step / observation / error）
- **`ActivityPayload`** — 瞬态活动反馈（thinking / executing / executed）
- **`ChatMessage`** — 聊天消息
- **`TaskSubmitPayload`** / **`PageStatePayload`** — WebSocket 载荷

## 规则 / Rules

- 仅包含类型定义，无运行时副作用代码 / Types only, no runtime side effects
- 不依赖其他 workspace 包 / No dependencies on other workspace packages
- 所有内容从 `src/index.ts` 统一导出 / Export everything from `src/index.ts`
- 枚举值使用 UPPER_SNAKE_CASE / Enum values in UPPER_SNAKE_CASE
- 接口命名不加 `I` 前缀 / No `I` prefix for interfaces

## 构建 / Build

```bash
pnpm --filter @paget/shared build
```
