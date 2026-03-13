# Paget

**AI-Powered Page Agent — 基于反思-行动架构的智能页面代理**

Paget 是一个 AI 驱动的 Web 页面自动化与交互代理。它通过 WebSocket 连接浏览器与后端，利用 LLM 观察页面状态、反思执行结果、规划下一步操作，以批量方式执行 DOM 交互。除了页面自动化，Paget 也支持纯对话场景——当嵌入含有操作手册或业务资料的页面时，用户可以直接向 AI 咨询页面业务逻辑。

Paget is an AI-powered web page automation and interaction agent. It connects browser and backend via WebSocket, using LLMs to observe page state, reflect on execution results, plan next steps, and execute DOM interactions in batches. Beyond page automation, Paget also supports pure conversation — when embedded in pages with operation manuals or business documents, users can directly ask the AI about page business logic.

## 架构 / Architecture

```
┌─────────────────────────────────────┐     ┌──────────────────────────────────┐
│           Browser 浏览器             │     │          Server 服务端            │
│                                     │     │                                  │
│  ┌───────────┐  ┌────────────────┐  │     │  ┌─────────┐  ┌──────────────┐  │
│  │  UI 界面   │  │ PageController │  │ WS  │  │  Agent  │  │   LLM 模型    │  │
│  │  (Vue 3)  │  │  (DOM 操控)     │ ←───→ │  │ (NestJS)│  │  (LangChain) │  │
│  └───────────┘  └────────────────┘  │     │  └─────────┘  └──────────────┘  │
│                                     │     │       │                          │
│  Chat UI / 操作遮罩 / 元素高亮       │     │  Session / Prompt / MySQL       │
└─────────────────────────────────────┘     └──────────────────────────────────┘
```

### 核心循环 / Core Loop

每个 Agent 步骤输出：
Each agent step outputs:

1. **evaluation_previous_goal** — 评估上一步目标完成度 / Assess previous goal completion
2. **memory** — 需要记住的关键信息 / Key information to carry forward
3. **next_goal** — 下一步要达成的目标 / Next objective to achieve
4. **actions[]** — 待执行的批量操作 / Batch actions to execute

### 事件模型 / Event Model

| 类型 / Type | 用途 / Purpose | 持久化 / Persisted |
|---|---|---|
| `statuschange` | Agent 生命周期：idle → running → completed/error | Yes |
| `historychange` | 步骤、观察、错误记录（作为 LLM 上下文）| Yes |
| `activity` | 瞬态 UI 反馈：thinking / executing / executed | No |

## 技术栈 / Tech Stack

| 层级 / Layer | 技术 / Technology |
|---|---|
| 前端 / Frontend | Vue 3 + TypeScript + Vite + Pinia |
| 后端 / Backend | NestJS + TypeORM + LangChain.js |
| 数据库 / Database | MySQL |
| 实时通信 / Realtime | Socket.IO (WebSocket) |
| 包管理 / Monorepo | pnpm workspace |

## 项目结构 / Project Structure

```
paget/
├── packages/
│   ├── shared/              # 共享类型与常量 / Shared types & constants
│   ├── page-controller/     # DOM 提取与元素交互 / DOM extraction & interaction
│   ├── ui/                  # Vue 3 聊天界面 / Vue 3 chat UI
│   └── server/              # NestJS 后端服务 / NestJS backend service
├── package.json
├── pnpm-workspace.yaml
├── tsconfig.base.json
└── .env.example
```

### 包依赖关系 / Package Dependencies

```
@paget/ui ──→ @paget/shared
           ──→ @paget/page-controller

@paget/page-controller ──→ @paget/shared

@paget/server ──→ @paget/shared
```

## 快速开始 / Quick Start

### 环境要求 / Prerequisites

- Node.js >= 18.0.0
- pnpm >= 8.0.0
- MySQL 8.0+

### 安装 / Install

```bash
git clone https://github.com/user/paget.git
cd paget
pnpm install
```

### 配置 / Configuration

```bash
cp .env.example .env
# 编辑 .env 填写数据库连接和 LLM API Key
# Edit .env with your database connection and LLM API key
```

`.env` 配置项 / Configuration options:

| 变量 / Variable | 说明 / Description | 默认值 / Default |
|---|---|---|
| `DB_HOST` | MySQL 主机 / MySQL host | `localhost` |
| `DB_PORT` | MySQL 端口 / MySQL port | `3306` |
| `DB_DATABASE` | 数据库名 / Database name | `paget` |
| `DB_USERNAME` | 数据库用户 / Database user | `root` |
| `DB_PASSWORD` | 数据库密码 / Database password | — |
| `SERVER_PORT` | 后端端口 / Server port | `3000` |
| `WS_PORT` | WebSocket 端口 / WebSocket port | `3001` |
| `DEFAULT_LLM_BASE_URL` | LLM API 地址 / LLM API URL | `https://api.openai.com/v1` |
| `DEFAULT_LLM_API_KEY` | LLM API 密钥 / LLM API key | — |
| `DEFAULT_LLM_MODEL` | 默认模型 / Default model | `gpt-4o` |

### 开发 / Development

```bash
# 构建共享包（首次必须）/ Build shared package (required first time)
pnpm build:shared

# 启动前端开发服务器 / Start frontend dev server
pnpm dev:ui

# 启动后端开发服务器 / Start backend dev server
pnpm dev:server

# 同时启动前后端 / Start both
pnpm dev
```

### 构建 / Build

```bash
# 构建所有包 / Build all packages
pnpm build

# 构建单个包 / Build individual package
pnpm build:shared
pnpm build:page-controller
pnpm build:ui
pnpm build:server
```

## 编码规范 / Coding Conventions

- **双语注释** — 所有代码注释必须中英文双语，中文在前
  **Bilingual comments** — All code comments must be in both Chinese and English
- **TypeScript 严格模式** — 全包启用 strict mode
  **TypeScript strict mode** — Enabled across all packages
- **CSS 设计令牌** — 使用 `--paget-*` 前缀的 CSS 自定义属性，不使用 Tailwind
  **CSS design tokens** — Use `--paget-*` prefixed custom properties, no Tailwind
- **无循环依赖** — 包之间禁止循环引用
  **No circular deps** — Circular dependencies between packages are forbidden

## License

MIT
