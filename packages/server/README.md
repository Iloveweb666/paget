# @paget/server

**NestJS 后端服务 / NestJS Backend Service**

处理 LLM 管理、Agent 编排、Prompt 管理、会话持久化和 WebSocket 通信。

Handles LLM management, agent orchestration, prompt management, session persistence, and WebSocket communication.

## 模块 / Modules

| 模块 / Module | 职责 / Responsibility |
|---|---|
| `llm` | LLM 配置管理（多模型、API Key 存储于 MySQL）/ LLM config management |
| `agent` | Agent 编排（反思-行动循环、工具注册）/ Agent orchestration (reflection loop, tool registry) |
| `prompt` | 系统 Prompt 管理 / System prompt management |
| `session` | 会话与历史持久化 / Session & history persistence |

## Agent 执行流程 / Agent Execution Flow

```
task:submit (WebSocket)
  │
  ▼
┌─────────────────────────────────────────┐
│  Agent Loop (每轮 / per step)            │
│                                         │
│  1. OBSERVE  — 请求页面状态              │
│  2. THINK    — 调用 LLM，输出反思+操作   │
│  3. ACT      — 发送批量操作到客户端       │
│  4. RECORD   — 持久化到 MySQL            │
│  5. CHECK    — 判断是否完成或继续         │
└─────────────────────────────────────────┘
```

## 内置工具 / Built-in Tools

Agent 通过 `ToolRegistry` 注册工具，LLM 以 function calling 方式调用：

| 工具 / Tool | 说明 / Description |
|---|---|
| `click` | 点击页面元素 / Click an element |
| `input` | 输入文本 / Type text into an input |
| `done` | 标记任务完成 / Mark task as completed |

工具通过继承 `BaseTool` 扩展，自动注册到 LangChain function calling schema。

## WebSocket 事件 / WebSocket Events

| 事件 / Event | 方向 / Direction | 说明 / Description |
|---|---|---|
| `task:submit` | Client → Server | 提交任务 |
| `task:cancel` | Client → Server | 取消任务 |
| `agent:status` | Server → Client | Agent 状态变更 |
| `agent:history` | Server → Client | 历史事件追加 |
| `agent:activity` | Server → Client | 瞬态活动反馈 |
| `page:action` | Server → Client | 请求页面操作 |
| `page:state` | Client → Server | 上报页面状态 |
| `page:batch_action` | Server → Client | 请求批量操作 |
| `page:batch_result` | Client → Server | 批量操作结果 |

## 规则 / Rules

- 模块结构：`module.ts` + `service.ts` + `controller.ts` + `entity.ts` + `dto/`
- 业务逻辑在 Service，Controller 只做薄封装 / Business logic in services, thin controllers
- DTO 用 class-validator 校验，Agent 工具用 Zod / class-validator for DTOs, Zod for agent tools
- WebSocket 事件名使用 `@paget/shared` 常量 / Use event constants from shared package
- 禁止日志或响应中暴露 API Key / Never expose API keys in logs or responses

## 开发 / Development

```bash
pnpm --filter @paget/server dev        # NestJS watch mode
pnpm --filter @paget/server build      # Production build
pnpm --filter @paget/server start:prod # Start production
```
