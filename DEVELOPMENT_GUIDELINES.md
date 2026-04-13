# paget 开发规范

## 一、通用规范

### 1.1 语言规范

| 场景                      | 语言要求                          |
| ------------------------- | --------------------------------- |
| 用户界面文字 (UI/Website) | 中文单语                          |
| 代码注释                  | 中文 + 英文（中文在前，英文在后） |
| 变量/函数/类名            | 英文                              |
| Git 提交信息              | 英文                              |
| 文档文件 (.md)            | 中文（英文可接受）                |

**代码注释格式**:

```typescript
// 单行注释：中文说明 / English explanation

/**
 * 多行注释：
 * 第一行中文说明
 * First line English explanation
 * 第二行中文说明
 * Second line English explanation
 */
```

### 1.2 文件命名

| 类型                 | 命名规范                        | 示例                                |
| -------------------- | ------------------------------- | ----------------------------------- |
| Vue/React 组件       | PascalCase.vue / PascalCase.tsx | `ChatPanel.vue`, `HeroSection.tsx`  |
| TypeScript 类型/接口 | camelCase.ts                    | `agent.ts`, `message.ts`            |
| NestJS 模块/服务     | kebab-case.\*.ts                | `agent.service.ts`, `llm.module.ts` |
| Composables/Hooks    | camelCase.ts                    | `useAgent.ts`, `useWebSocket.ts`    |
| Store (Pinia)        | camelCase.ts                    | `chat.ts`, `config.ts`              |
| CSS/SCSS             | kebab-case.css                  | `variables.css`, `global.css`       |
| 常量文件             | camelCase.ts                    | `status.ts`, `events.ts`            |

### 1.3 目录命名

- 所有目录名使用 **kebab-case**
- 组件目录与组件文件同名（如 `ChatPanel/` 下有 `ChatPanel.vue`）

---

## 二、包结构规范

### 2.1 包内目录结构

每个包内部遵循统一结构：

```
packages/{package-name}/
├── src/
│   ├── {module}/              # 功能模块（按业务划分）
│   │   ├── {module}.service.ts
│   │   ├── {module}.controller.ts  # 如有
│   │   ├── {module}.gateway.ts      # WebSocket gateway
│   │   ├── {module}.module.ts       # NestJS module
│   │   │
│   │   ├── types/            # 模块专属类型
│   │   │   └── index.ts       # 统一导出
│   │   │
│   │   ├── dto/              # Data Transfer Objects（NestJS）
│   │   │   └── *.dto.ts
│   │   │
│   │   └── {sub-module}/     # 子模块（如有）
│   │       └── ...
│   │
│   ├── common/               # 公共工具
│   │   ├── constants/
│   │   ├── exceptions/
│   │   └── utils/
│   │
│   ├── main.ts               # 包入口（如需）
│   └── index.ts               # 包导出
│
├── package.json
├── tsconfig.json
└── README.md
```

### 2.2 类型文件管理

**规则**: 每个 `.ts` / `.vue` / `.tsx` 文件需要使用或定义类型时，类型应定义在同级的 `types/` 目录下，或在 `types/` 下建立子模块。

```
src/
├── components/
│   ├── ChatPanel/
│   │   ├── ChatPanel.vue
│   │   └── types/
│   │       └── index.ts      # ChatPanel 组件相关类型
│   │
│   └── FloatingButton/
│       ├── FloatingButton.vue
│       └── types/
│           └── index.ts
│
├── composables/
│   ├── useAgent.ts
│   └── types/                 # composable 相关类型
│       └── index.ts
│
└── types/                     # 全局类型（模块间共享）
    ├── agent.ts
    ├── message.ts
    └── index.ts               # types 目录统一导出
```

**types/index.ts 导出规范**:

```typescript
// types/index.ts

// 导出所有子模块类型
export * from "./agent";
export * from "./message";
export * from "./intent";

// 导出模块内共享类型
export interface AgentContext {
  // ...
}
```

---

## 三、共享规范

### 3.1 何时放入 shared

以下内容**必须**放入 `@paget/shared` 包：

| 类型                 | 示例                                 |
| -------------------- | ------------------------------------ |
| WebSocket 事件名常量 | `WS_EVENTS.STATUS_CHANGE`            |
| 状态枚举             | `AgentStatus.IDLE`                   |
| 意图类型枚举         | `IntentType.PAGE_OPERATION`          |
| 跨包使用的接口/类型  | `BrowserState`, `ActionResult`       |
| 业务错误码           | `BusinessCode.LLM_CONFIG_NOT_FOUND`  |
| 共享常量             | `MAX_RETRY_COUNT`, `DEFAULT_TIMEOUT` |

**判断条件**: 如果一个类型或常量被 **2个或以上** 的包使用，则必须放入 shared。

### 3.2 shared 包结构

```
packages/shared/
├── src/
│   ├── constants/
│   │   ├── index.ts
│   │   ├── status.ts        # AgentStatus, SessionStatus 等
│   │   ├── events.ts        # WS_EVENTS 常量
│   │   ├── intent.ts        # IntentType 枚举
│   │   └── business-code.ts # 业务错误码
│   │
│   ├── types/
│   │   ├── index.ts
│   │   ├── agent.ts         # Agent 相关类型
│   │   ├── message.ts       # 消息类型
│   │   ├── intent.ts        # 意图相关类型
│   │   ├── llm.ts          # LLM 配置类型
│   │   └── page-controller.ts  # 页面控制器类型
│   │
│   └── index.ts
│
└── package.json
```

### 3.3 包依赖原则

```
@paget/shared        ← 无任何依赖

@paget/page-controller  ← @paget/shared

@paget/llm           ← @paget/shared

@paget/server        ← @paget/shared
                     ← @paget/llm

@paget/ui            ← @paget/shared
                     ← @paget/page-controller

@paget/website       ← @paget/shared
```

**禁止**:

- 逆向依赖（如 `shared` 依赖 `server`）
- 跨级依赖（如 `server` 直接依赖 `page-controller`）
- 循环依赖

---

## 四、代码规范

### 4.1 TypeScript

- 启用 **strict 模式**
- 使用 `interface` 定义数据形状，使用 `type` 定义联合类型/交叉类型
- 优先使用 `unknown`，避免使用 `any`（如必须使用，需添加注释说明原因）
- 枚举值使用 **UPPER_SNAKE_CASE**
- 禁止 default export（Vue SFC 除外）

```typescript
// ✅ 正确
export interface AgentConfig {
  maxSteps: number;
  language: "zh-CN" | "en-US";
}

// ❌ 错误
export default class Agent {}

// ✅ 正确
export class Agent {}
```

### 4.2 Vue 3 (packages/ui)

- 仅使用 **Composition API** + `<script setup lang="ts">`
- Props 使用 `defineProps<T>()` + TypeScript interface
- Emits 使用 `defineEmits<T>()` + 类型化事件
- 状态管理：Pinia stores 放在 `stores/`，composables 放在 `composables/`
- 默认使用 `<style scoped>`
- CSS 变量前缀：`--paget-`
- 禁止使用 Tailwind CSS

```vue
<script setup lang="ts">
import { ref, computed } from "vue";
import type { MessageItemProps } from "./types";

interface Props {
  message: MessageItemProps;
}

const props = defineProps<Props>();

const emit = defineEmits<{
  retry: [messageId: string];
  delete: [messageId: string];
}>();

const isPending = ref(false);
</script>

<template>
  <div class="message-item">
    <!-- ... -->
  </div>
</template>

<style scoped>
.message-item {
  --paget-primary-color: #1890ff;
}
</style>
```

### 4.3 React (packages/website)

- 使用 **函数组件** + Hooks
- TypeScript 类型紧邻组件定义
- 样式使用 Tailwind CSS（website 包允许）

### 4.4 NestJS (packages/server)

- 模块结构：`module.ts` + `service.ts` + `gateway.ts`（如需）
- 业务逻辑放在 Services，Controllers/Gateways 仅做协议 I/O
- DTOs 使用 `class-validator` 装饰器
- WebSocket 事件名使用 `@paget/shared` 中的常量
- 使用构造器注入，优先避免 `@Inject()`

```typescript
@Injectable()
export class AgentService {
  constructor(
    private readonly llmService: LLMService,
    private readonly sessionService: SessionService,
  ) {}

  // ...
}
```

### 4.5 函数/方法注释规范

```typescript
/**
 * 执行 Agent 任务循环
 * Execute the agent task loop
 *
 * @param sessionId - 会话 ID / Session ID
 * @param task - 用户任务描述 / User task description
 * @returns 执行结果 / Execution result
 *
 * @throws {BusinessException} LLM 配置缺失时抛出 / Throws when LLM config is missing
 */
async executeTask(sessionId: string, task: string): Promise<ExecutionResult> {
  // 实现
}

/**
 * 点击页面元素
 * Click page element by index
 *
 * @param index - 元素索引（从 DOM 树提取）/ Element index (from DOM tree extraction)
 * @returns 操作结果，包含成功状态和消息 / Operation result with success status and message
 *
 * @example
 * // 点击第 5 个元素
 * // Click element at index 5
 * const result = await pageController.clickElement(5)
 */
async clickElement(index: number): Promise<ActionResult> {
  // 实现
}
```

---

## 五、UI/Website 界面规范

### 5.1 界面语言

- **UI 包（悬浮面板）**: 纯中文界面
- **Website 包**: 纯中文界面
- 所有用户可见文本（按钮文字、提示信息、标签等）使用中文
- 后续通过 i18n 模块实现多语言切换

### 5.2 i18n 规范

```typescript
// i18n/zh-CN.ts
export default {
  // 组件相关
  "chat.input.placeholder": "输入消息...",
  "chat.button.send": "发送",
  "chat.button.stop": "停止",

  // 状态相关
  "status.idle": "空闲",
  "status.running": "执行中",
  "status.completed": "已完成",

  // 错误相关
  "error.llm.config": "LLM 配置缺失，请检查环境变量",
};

// i18n/en-US.ts
export default {
  "chat.input.placeholder": "Type a message...",
  "chat.button.send": "Send",
  "chat.button.stop": "Stop",
  "status.idle": "Idle",
  "status.running": "Running",
  "status.completed": "Completed",
  "error.llm.config": "LLM config missing, please check environment variables",
};
```

### 5.3 设计系统（Website）

Website 使用 Tailwind CSS

---

## 六、Git 规范

### 6.1 分支命名

```
feature/{feature-name}      # 新功能
fix/{bug-description}       # Bug 修复
refactor/{module-name}      # 重构
docs/{doc-type}             # 文档更新
```

### 6.2 提交信息

```
{type}: {subject}

{body}

{footer}
```

**Type**:

- `feat`: 新功能
- `fix`: Bug 修复
- `docs`: 文档
- `style`: 格式（不影响代码）
- `refactor`: 重构
- `perf`: 性能优化
- `test`: 测试
- `chore`: 构建/工具

**示例**:

```
feat(agent): 添加意图分流功能

- 新增 IntentRouter 模块
- 支持 PAGE_OPERATION 和 CONVERSATION 两种意图识别
- 通过轻量级 LLM 调用快速判断用户意图

Closes #123
```

---

## 七、测试规范

### 7.1 测试文件位置

- 单元测试：与源文件同目录，命名为 `*.spec.ts`
- E2E 测试：包根目录下的 `tests/` 目录

```
packages/
├── server/
│   ├── src/
│   │   └── agent/
│   │       ├── agent.service.ts
│   │       └── agent.service.spec.ts  # 单元测试
│   │
│   └── tests/
│       └── agent.e2e-spec.ts          # E2E 测试
```

### 7.2 测试要求

- 测试 WebSocket 和 LLM 调用时使用 Mock
- 不调用真实 API
- 每个公共方法应至少有一个测试用例

---

## 八、构建与发布

### 8.1 包构建顺序

```
1. shared      # 无依赖，最先构建
2. page-controller
3. llm
4. server      # 依赖 shared + llm
5. ui          # 依赖 shared + page-controller
6. website     # 依赖 shared
```

### 8.2 环境变量

```bash
# .env.example (复制为 .env 使用)
DEFAULT_LLM_BASE_URL=https://api.openai.com/v1
DEFAULT_LLM_API_KEY=your-api-key-here
DEFAULT_LLM_MODEL=gpt-4
DEFAULT_LLM_TEMPERATURE=0.7
DEFAULT_LLM_MAX_TOKENS=4096

WS_PORT=3000
NODE_ENV=development
```

---

## 九、IDE 配置

### 9.1 VSCode 推荐插件

- Volar (Vue)
- ESList
- Prettier
- Tailwind CSS IntelliSense
- TypeScript Vue Plugin

### 9.2 设置 (.vscode/settings.json)

```json
{
  "editor.formatOnSave": true,
  "editor.defaultFormatter": "esbenp.prettier-vscode",
  "typescript.preferences.importModuleSpecifier": "relative",
  "[typescript]": {
    "editor.defaultFormatter": "esbenp.prettier-vscode"
  },
  "[vue]": {
    "editor.defaultFormatter": "Vue.volar"
  }
}
```

---

## 十、文档规范

### 10.1 README 要求

每个包必须包含 README.md：

````markdown
# @paget/{package-name}

## 简介

简要说明包的职责和作用。

## 安装

```bash
pnpm add @paget/{package-name}
```
````

## 使用

简要代码示例。

## API

导出列表及说明。

## 相关文档

- 详细开发文档 (CLAUDE.md)
- 架构设计文档 (ARCHITECTURE.md)

```

### 10.2 CLAUDE.md

复杂包可添加 CLAUDE.md 提供额外开发指导：

```

packages/
├── server/
│ └── CLAUDE.md # NestJS 相关开发指导
├── ui/
│ └── CLAUDE.md # Vue 组件开发指导

```

---

## 十一、违规处理

违反以下规范将导致 **PR 被拒绝**：

1. `any` 类型使用且无注释说明
2. 跨包共享类型未放入 shared
3. 代码无中文注释
4. 提交信息不符合规范
5. 引入循环依赖
6. UI/Website 使用非中文界面

---

## 附录：检查清单

### 新增类型时
- [ ] 类型是否被多个包使用？
- [ ] 是否已放入 shared？
- [ ] 是否已添加到 types/index.ts 导出？

### 新增组件时
- [ ] 组件名是否 PascalCase？
- [ ] 是否有 types/index.ts？
- [ ] 用户可见文字是否中文？

### 新增模块时
- [ ] 是否遵循目录结构规范？
- [ ] 是否有详细的注释？
- [ ] 是否添加了 README 说明？

### 提交代码时
- [ ] 提交信息是否符合规范？
- [ ] 是否有测试覆盖？
- [ ] 是否运行了 lint/typecheck？
```
