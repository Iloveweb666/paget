# paget 架构设计文档

## 一、项目概述

**项目名称**: paget
**项目定位**: 基于 page-agent 架构优化的 AI 页面操作 agent，支持批量操作和意图分流对话
**技术栈**: pnpm monorepo + Vue 3 + NestJS + Socket.IO + LangChain

---

## 二、Monorepo 结构

```
paget/
├── packages/
│   ├── shared/           # @paget/shared
│   ├── page-controller/  # @paget/page-controller
│   ├── llm/              # @paget/llm
│   ├── server/           # @paget/server
│   ├── ui/               # @paget/ui
│   └── website/          # @paget/website
│
├── pnpm-workspace.yaml
├── package.json
├── tsconfig.base.json
└── README.md
```

---

## 三、各包详细设计

### 3.1 shared (@paget/shared)

**职责**: 存放所有包共享的类型、常量、事件定义

```
packages/shared/
├── src/
│   ├── constants/
│   │   ├── index.ts
│   │   ├── status.ts      # AgentStatus 枚举
│   │   ├── events.ts      # WebSocket 事件名常量
│   │   └── intent.ts      # IntentType 枚举
│   │
│   ├── types/
│   │   ├── index.ts
│   │   ├── agent.ts       # AgentStatus, HistoryEvent, ActivityPayload 等
│   │   ├── message.ts     # ChatMessage, MessageRole 等
│   │   ├── intent.ts      # IntentType, IntentResult 等
│   │   ├── llm.ts         # LLMConfig, InvokeOptions 等
│   │   └── page-controller.ts  # BrowserState, ActionResult 等
│   │
│   └── index.ts
│
└── package.json
```

**核心类型**:

```typescript
// status.ts
export enum AgentStatus {
  IDLE = "idle",
  RUNNING = "running",
  STREAMING = "streaming",
  COMPLETED = "completed",
  ERROR = "error",
}

// events.ts
export const WS_EVENTS = {
  STATUS_CHANGE: "statuschange",
  HISTORY_CHANGE: "historychange",
  ACTIVITY: "activity",
  BROWSER_STATE: "browser_state",
  EXECUTE_ACTION: "execute_action",
  AGENT_MESSAGE: "agent_message",
} as const;

// intent.ts
export enum IntentType {
  PAGE_OPERATION = "page_operation",
  CONVERSATION = "conversation",
  UNKNOWN = "unknown",
}

export interface IntentResult {
  type: IntentType;
  confidence: number;
  reasoning?: string;
}
```

---

### 3.2 page-controller (@paget/page-controller)

**职责**: DOM 提取与清洗、页面元素操作（完全复刻 page-agent）

```
packages/page-controller/
├── src/
│   ├── PageController.ts      # 核心类
│   ├── actions.ts             # click/input/scroll 等操作实现
│   │
│   ├── dom/
│   │   ├── index.ts
│   │   ├── getPageInfo.ts     # 页面信息（viewport, scroll position 等）
│   │   └── dom_tree/
│   │       ├── index.ts       # FlatDomTree, getSelectorMap 等
│   │       ├── types.ts       # InteractiveElementDomNode 等类型
│   │       ├── core.js        # DOM 遍历核心逻辑
│   │       └── browser-use.js # 辅助函数
│   │
│   ├── mask/
│   │   ├── SimulatorMask.ts   # 视觉遮挡层
│   │   ├── SimulatorMask.module.css
│   │   ├── cursor-border.svg
│   │   └── cursor-fill.svg
│   │
│   ├── patches/               # 框架适配
│   │   ├── index.ts
│   │   ├── react.ts
│   │   ├── vue.ts
│   │   └── element-plus.ts
│   │
│   ├── utils/
│   │   └── index.ts
│   │
│   └── index.ts
│
└── package.json
```

**PageController 核心接口**:

```typescript
export interface PageControllerConfig extends DomConfig {
  enableMask?: boolean;
}

export interface BrowserState {
  url: string;
  title: string;
  header: string;
  content: string;
  footer: string;
}

export interface ActionResult {
  success: boolean;
  message: string;
}

// 批量操作新增
export interface BatchExecuteOptions {
  failStrategy: "stop" | "continue";
  stepDelay?: number;
  observeAfterEach?: boolean;
}

export interface BatchActionResult {
  results: ActionResult[];
  successCount: number;
  failureCount: number;
  totalDuration: number;
}

export class PageController extends EventTarget {
  // 状态查询
  getCurrentUrl(): Promise<string>;
  getBrowserState(): Promise<BrowserState>;
  getLastUpdateTime(): Promise<number>;

  // DOM 操作
  updateTree(): Promise<string>;
  cleanUpHighlights(): Promise<void>;

  // 元素操作
  clickElement(index: number): Promise<ActionResult>;
  inputText(index: number, text: string): Promise<ActionResult>;
  selectOption(index: number, optionText: string): Promise<ActionResult>;
  scroll(options: ScrollOptions): Promise<ActionResult>;
  scrollHorizontally(options: HorizontalScrollOptions): Promise<ActionResult>;
  executeJavascript(script: string): Promise<ActionResult>;

  // 批量操作（新增）
  executeBatch(
    actions: BatchAction[],
    options?: BatchExecuteOptions,
  ): Promise<BatchActionResult>;

  // Mask 控制
  showMask(): Promise<void>;
  hideMask(): Promise<void>;
  dispose(): void;
}
```

---

### 3.3 llm (@paget/llm)

**职责**: LLM 调用封装、提示词管理、Tool 定义与执行（参考 page-agent）

```
packages/llm/
├── src/
│   ├── LLM.ts               # LLM 客户端类
│   ├── OpenAIClient.ts      # OpenAI 兼容客户端
│   ├── constants.ts
│   ├── errors.ts            # InvokeError, InvokeErrorType
│   │
│   ├── prompts/
│   │   └── system_prompt.md  # 系统提示词模板
│   │
│   ├── tools/
│   │   ├── index.ts         # 工具注册表
│   │   ├── tool.interface.ts # 工具接口定义
│   │   └── tool.schemas.ts  # Zod schemas
│   │
│   ├── types.ts             # MacroToolInput, AgentBrain, Message 等
│   │
│   └── index.ts
│
└── package.json
```

**核心类型**:

```typescript
// types.ts
export interface LLMConfig {
  baseURL: string;
  model: string;
  apiKey?: string;
  temperature?: number;
  maxRetries?: number;
  disableNamedToolChoice?: boolean;
  customFetch?: typeof fetch;
}

export interface Message {
  role: "system" | "user" | "assistant" | "tool";
  content: string;
}

export interface Tool<TInput = any, TOutput = any> {
  description: string;
  inputSchema: z.ZodType<TInput>;
  execute: (input: TInput) => Promise<TOutput>;
}

export interface MacroToolInput {
  evaluation_previous_goal?: string;
  memory?: string;
  next_goal?: string;
  action: Record<string, any>;
}

export interface MacroToolResult {
  input: MacroToolInput;
  output: string;
}

export interface InvokeOptions {
  toolChoiceName?: string;
  normalizeResponse?: (res: any, tools: Map<string, Tool>) => any;
}

export interface InvokeResult {
  content: string;
  toolResult?: MacroToolResult;
  usage?: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
  rawResponse: any;
  rawRequest: any;
}
```

**LLM 类核心方法**:

```typescript
export class LLM extends EventTarget {
  config: Required<LLMConfig>;
  client: LLMClient;

  constructor(config: LLMConfig);

  // 单次调用 + 单次工具执行
  invoke(
    messages: Message[],
    tools: Record<string, Tool>,
    abortSignal: AbortSignal,
    options?: InvokeOptions,
  ): Promise<InvokeResult>;

  // 事件
  // 'retry' - 重试时触发
  // 'error' - 错误时触发
}
```

---

### 3.4 server (@paget/server)

**职责**: WebSocket 服务、Agent 生命周期管理、LLM 调用编排、意图分流

```
packages/server/
├── src/
│   ├── main.ts                    # NestJS 入口
│   ├── app.module.ts               # 根模块
│   │
│   ├── common/
│   │   ├── exceptions/
│   │   │   └── business.exception.ts
│   │   └── constants/
│   │       └── business-code.ts
│   │
│   ├── config/
│   │   ├── config.module.ts
│   │   └── config.service.ts       # 读取环境变量
│   │
│   ├── gateway/
│   │   ├── gateway.module.ts
│   │   ├── agent.gateway.ts         # WebSocket 网关
│   │   └── gateway.types.ts
│   │
│   ├── agent/
│   │   ├── agent.module.ts
│   │   ├── agent.service.ts         # Agent 核心编排
│   │   ├── agent.types.ts           # Agent 相关类型
│   │   │
│   │   ├── tools/
│   │   │   ├── tool.registry.ts     # 工具注册表
│   │   │   ├── click-element.tool.ts
│   │   │   ├── input-text.tool.ts
│   │   │   ├── scroll.tool.ts
│   │   │   └── done.tool.ts
│   │   │
│   │   └── chain/
│   │       └── agent.chain.ts       # LangChain 集成
│   │
│   ├── intent/
│   │   ├── intent.module.ts
│   │   └── intent-router.service.ts # 意图分流
│   │
│   ├── llm/
│   │   ├── llm.module.ts
│   │   └── llm.service.ts           # 调用 @paget/llm
│   │
│   ├── prompt/
│   │   ├── prompt.module.ts
│   │   └── prompt.service.ts        # 提示词组装
│   │
│   └── session/
│       ├── session.module.ts
│       └── session.service.ts       # 会话状态管理（内存）
│
└── package.json
```

**AgentService 核心逻辑**:

```typescript
// agent.service.ts
@Injectable()
export class AgentService {
  private agents = new Map<string, AgentContext>();

  async createAgent(sessionId: string, config: AgentConfig): Promise<void>;
  async executeTask(sessionId: string, task: string): Promise<void>;
  async stopAgent(sessionId: string): Promise<void>;
  async disposeAgent(sessionId: string): Promise<void>;
}

// agent.types.ts
interface AgentContext {
  id: string;
  sessionId: string;
  status: AgentStatus;
  history: HistoryEvent[];
  llm: LLM;
  pageController: PageController; // 实际在客户端，这里只存状态
}
```

**IntentRouter 核心逻辑**:

```typescript
// intent-router.service.ts
@Injectable()
export class IntentRouterService {
  private llm: LLM;

  // 快速判断意图（不进入完整 Agent 循环）
  async classifyIntent(userMessage: string): Promise<IntentResult>;

  // 意图引导
  async route(
    intent: IntentResult,
    context: AgentContext,
  ): Promise<RouteResult>;
}

// 路由结果
interface RouteResult {
  routeTo: "agent_loop" | "direct_chat" | "ask_user";
  // routeTo = 'agent_loop': 走完整 Agent 执行流程
  // routeTo = 'direct_chat': 直接 LLM 回复（对话模式）
  // routeTo = 'ask_user': 询问用户确认
  response?: string;
}
```

**Gateway 事件处理**:

```typescript
// agent.gateway.ts
@WebSocketGateway()
export class AgentGateway {
  // 客户端 → 服务端
  @SubscribeMessage('execute_task')
  async onExecuteTask(@MessageBody() data: { sessionId: string; task: string })

  @SubscribeMessage('stop_task')
  async onStopTask(@MessageBody() data: { sessionId: string })

  @SubscribeMessage('browser_state')
  async onBrowserState(@MessageBody() data: { sessionId: string; state: BrowserState })

  @SubscribeMessage('action_result')
  async onActionResult(@MessageBody() data: { sessionId: string; result: ActionResult })

  // 服务端 → 客户端（通过 Gatewayemit）
  // 'statuschange' - 状态变更
  // 'historychange' - 历史记录更新
  // 'activity' - 活动状态（thinking, executing）
  // 'agent_message' - Agent 消息
  // 'intent_prompt' - 意图确认提示
}
```

---

### 3.5 ui (@paget/ui)

**职责**: Vue 3 悬浮 UI、对话面板、配置面板（保留原 paget 独立部分）

```
packages/ui/
├── src/
│   ├── main.ts
│   ├── App.vue
│   ├── router/
│   │   └── index.ts
│   │
│   ├── components/
│   │   ├── FloatingButton.vue      # 悬浮图标
│   │   │
│   │   ├── ChatPanel/
│   │   │   ├── ChatPanel.vue        # 主对话面板
│   │   │   ├── ChatHeader.vue
│   │   │   ├── ChatFooter.vue
│   │   │   ├── BrowserStatePanel.vue
│   │   │   └── WSLogPanel.vue
│   │   │
│   │   ├── MessageList/
│   │   │   ├── MessageList.vue
│   │   │   ├── MessageItem.vue
│   │   │   ├── StepCard.vue
│   │   │   ├── StepPanel.vue
│   │   │   └── ActivityIndicator.vue
│   │   │
│   │   ├── ConfigPanel/
│   │   │   └── ConfigPanel.vue
│   │   │
│   │   └── common/
│   │       ├── MarkdownRenderer.vue
│   │       ├── CodeBlock.vue
│   │       └── StatusBadge.vue
│   │
│   ├── composables/
│   │   ├── useAgent.ts              # Agent 事件流状态
│   │   ├── useChat.ts                # 聊天状态
│   │   ├── useWebSocket.ts           # WebSocket 连接
│   │   ├── usePageController.ts     # PageController 封装
│   │   ├── useConfig.ts
│   │   ├── useDrag.ts
│   │   └── useWSLogger.ts
│   │
│   ├── stores/
│   │   ├── chat.ts                  # Pinia store
│   │   └── config.ts
│   │
│   ├── views/
│   │   ├── WidgetView.vue            # 悬浮小部件入口
│   │   └── BookmarkletView.vue       # Bookmarklet 入口
│   │
│   ├── styles/
│   │   ├── variables.css             # CSS 变量
│   │   └── global.css
│   │
│   ├── i18n/
│   │   ├── index.ts
│   │   ├── zh-CN.ts
│   │   └── en-US.ts
│   │
│   └── asset/
│       ├── image/
│       └── gif/
│
├── vite.config.ts
├── vite.iife.config.ts               # Bookmarklet 构建
├── package.json
└── tsconfig.json
```

---

### 3.6 website (@paget/website)

**职责**: 官网 + Demo 页面

```
packages/website/
├── src/
│   ├── main.tsx
│   ├── App.tsx
│   ├── router.tsx
│   │
│   ├── pages/
│   │   ├── home/
│   │   │   ├── index.tsx             # 首页
│   │   │   ├── HeroSection.tsx       # 英雄区（炫酷设计）
│   │   │   ├── FeaturesSection.tsx
│   │   │   ├── ScenariosSection.tsx
│   │   │   └── OneMoreThingSection.tsx
│   │   │
│   │   ├── demo/
│   │   │   └── index.tsx             # Demo 演示页
│   │   │
│   │   └── docs/
│   │       └── ...
│   │
│   ├── components/
│   │   ├── Header.tsx
│   │   ├── Footer.tsx
│   │   └── ui/                       # 设计系统组件
│   │       ├── button.tsx
│   │       ├── badge.tsx
│   │       └── ...
│   │
│   └── styles/
│       └── ...
│
├── index.html
├── package.json
└── vite.config.ts
```

---

## 四、数据流设计

### 4.1 页面操作流程

```
用户输入 "帮我点击登录按钮"
           ↓
    IntentRouter.classifyIntent()
           ↓
    type = PAGE_OPERATION
           ↓
    AgentGateway.emit('statuschange', { status: RUNNING })
           ↓
    AgentService.executeTask()
           ↓
    ┌─────────────────────────────────────┐
    │          Agent Loop                 │
    │                                     │
    │  1. LLM.invoke(prompt)              │
    │  2. 解析 MacroToolInput             │
    │  3. ToolRegistry.execute(action)    │
    │     ↓                               │
    │  Gateway.emit('activity', {...})   │
    │  Gateway.emit('historychange', {...})│
    │  4. 等待客户端执行结果              │
    │  5. observe (获取新 BrowserState)   │
    │  6. 循环直到 done                    │
    └─────────────────────────────────────┘
           ↓
    Gateway.emit('statuschange', { status: COMPLETED })
```

### 4.2 意图分流流程

```
用户输入 "今天天气怎么样？"
           ↓
    IntentRouter.classifyIntent()
           ↓
    ┌──────────────────────────────────┐
    │  轻量级 LLM 调用（系统提示词     │
    │  仅用于判断意图，不执行 Agent）   │
    └──────────────────────────────────┘
           ↓
    type = CONVERSATION (置信度 > 0.8)
           ↓
    直接 LLM 对话回复，不经过 Agent 循环
           ↓
    Gateway.emit('agent_message', { content: "今天天气晴朗..." })
```

### 4.3 批量操作流程

```
用户输入 "依次点击这三个按钮"
           ↓
    Agent 解析为批量 action
           ↓
    page-controller.executeBatch([
      { type: 'click', index: 5 },
      { type: 'click', index: 8 },
      { type: 'click', index: 12 }
    ], { failStrategy: 'continue' })
           ↓
    依次执行，每步后 emit activity
           ↓
    统一 observe，返回所有结果
```

---

## 五、包依赖关系

```
@paget/shared
    ↑ (无依赖)

@paget/page-controller
    → @paget/shared

@paget/llm
    → @paget/shared

@paget/server
    → @paget/shared
    → @paget/llm

@paget/ui
    → @paget/shared
    → @paget/page-controller

@paget/website
    → @paget/shared
```

---

## 六、开发命令

```bash
# 安装依赖
pnpm install

# 开发
pnpm dev:ui        # 启动 ui 包 (Vite, port 5173)
pnpm dev:server    # 启动 server 包 (NestJS watch, port 3000)
pnpm dev:website   # 启动 website 包
pnpm dev           # 并行启动所有

# 构建
pnpm build         # 构建所有包
pnpm build:shared  # 仅构建 shared
pnpm build:llm     # 仅构建 llm
# ...

# 代码质量
pnpm lint          # ESLint
pnpm typecheck     # TypeScript 检查
```

---

## 七、环境变量

```bash
# .env (server)
DEFAULT_LLM_BASE_URL=https://api.openai.com/v1
DEFAULT_LLM_API_KEY=your-api-key
DEFAULT_LLM_MODEL=gpt-4
DEFAULT_LLM_TEMPERATURE=0.7
DEFAULT_LLM_MAX_TOKENS=4096

WS_PORT=3000
```

---

## 八、关键设计决策

### 8.1 page-controller 批量操作

**原问题**: page-agent 一次操作观察一次结果，效率低

**解决方案**: 新增 `executeBatch` 方法，支持：

- `failStrategy`: 遇错停止(`stop`)或继续(`continue`)
- `observeAfterEach`: 是否每步后都观察
- 统一返回所有操作结果

### 8.2 意图分流

**原问题**: UI 有对话能力，但服务端统一走 Agent 循环

**解决方案**: 新增 IntentRouter 模块：

- 通过轻量级 LLM 调用快速判断意图
- `PAGE_OPERATION`: 走完整 Agent 执行流程
- `CONVERSATION`: 直接 LLM 对话回复
- `UNKNOWN`: 询问用户确认

### 8.3 DOM 提取优化

**原问题**: paget DOM 提取清洗失败率高

**解决方案**: page-controller 完全复刻 page-agent，保持：

- FlatDomTree 结构
- 元素索引机制
- 框架适配 patches (React/Vue/Antd)
