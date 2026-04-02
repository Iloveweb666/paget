# @paget/server

**NestJS 后端服务 / NestJS Backend Service**

处理 LLM 管理、Agent 编排、Prompt 管理、内存会话状态和 WebSocket 通信。

Handles LLM management, agent orchestration, prompt management, in-memory session state, and WebSocket communication.

## 模块 / Modules

| 模块 / Module | 职责 / Responsibility |
|---|---|
| `llm` | LLM 配置管理（环境变量基础配置 + `llm-model.config.ts` 模型覆盖项）/ LLM config management |
| `agent` | Agent 编排（反思-行动循环、工具注册）/ Agent orchestration (reflection loop, tool registry) |
| `prompt` | 系统 Prompt 管理 / System prompt management |
| `session` | 会话状态与历史记录管理 / Session state & history management |

## Agent 执行流程 / Agent Execution Flow

```

## 模型自定义配置 / Model Overrides

`llm` 模块现在将模型专属参数集中维护在 [src/modules/llm/llm-model.config.ts](D:/adminWorkspace/paget/packages/server/src/modules/llm/llm-model.config.ts)。`LLMService` 只负责读取基础环境变量并合并这些覆盖项。

The `llm` module now centralizes model-specific parameters in [src/modules/llm/llm-model.config.ts](D:/adminWorkspace/paget/packages/server/src/modules/llm/llm-model.config.ts). `LLMService` only reads the baseline environment config and merges those overrides.

当前内置规则 / Current built-in rule:

- `qwen*` 自动注入 `modelKwargs.enable_thinking = false`
task:submit (WebSocket)
  │
  ▼
┌─────────────────────────────────────────┐
│  Agent Loop (每轮 / per step)            │
│                                         │
│  1. OBSERVE  — 请求页面状态              │
│  2. THINK    — 调用 LLM，输出反思+操作   │
│  3. ACT      — 发送批量操作到客户端       │
│  4. RECORD   — 写入会话内存状态          │
│  5. CHECK    — 判断是否完成或继续         │
└─────────────────────────────────────────┘
```

## 内置工具 / Built-in Tools

Agent 通过 `ToolRegistry` 注册工具，LLM 以 function calling 方式调用：

| 工具 / Tool | 说明 / Description |
|---|---|
| `click` | 点击页面元素（支持 `blur` 参数） / Click an element (supports `blur`) |
| `input` | 输入文本（支持 `blur` 参数） / Type text into an input (supports `blur`) |
| `select` | 选择下拉项（支持 `blur` 参数） / Select an option (supports `blur`) |
| `scroll` | 垂直滚动 / Scroll vertically |
| `scroll_horizontally` | 水平滚动 / Scroll horizontally |
| `wait` | 等待一段时间 / Wait for a duration |
| `done` | 标记任务完成 / Mark task as completed |
| `ask_user` | 向用户提问 / Ask user for clarification |
| `execute_javascript` | 执行 JavaScript / Execute JavaScript |

工具通过继承 `BaseTool` 扩展，自动注册到 LangChain function calling schema。

## WebSocket 事件 / WebSocket Events

| 事件 / Event | 方向 / Direction | 说明 / Description |
|---|---|---|
| `task:submit` | Client → Server | 提交任务 |
| `task:cancel` | Client → Server | 取消任务 |
| `agent:status` | Server → Client | Agent 状态变更 |
| `agent:history` | Server → Client | 历史事件追加 |
| `agent:activity` | Server → Client | 瞬态活动反馈 |
| `agent:stream` | Server → Client | 纯对话模式下的流式文本输出 |
| `page:action` | Server → Client | 请求页面操作 |
| `page:state` | Client → Server | 上报页面状态 |
| `page:batch_action` | Server → Client | 请求批量操作 |
| `page:batch_result` | Client → Server | 批量操作结果 |

## 规则 / Rules

- 当前模块结构以 `module.ts` + `service.ts` + `gateway.ts` 为主，`agent` 模块含 `chain/` 与 `tools/` 子层
- 业务逻辑在 Service/Chain，Gateway 负责协议收发与连接生命周期管理
- 会话状态保存在进程内存中，无需外部存储层 / Session state lives in process memory, with no external storage layer
- 入参与配置可使用 class-validator；Agent 工具 schema 使用 Zod
- WebSocket 事件名使用 `@paget/shared` 常量 / Use event constants from shared package
- 禁止日志或响应中暴露 API Key / Never expose API keys in logs or responses

## 开发 / Development

```bash
pnpm --filter @paget/server dev        # NestJS watch mode
pnpm --filter @paget/server build      # Production build
pnpm --filter @paget/server start:prod # Start production
```
