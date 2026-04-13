# paget 项目规范

> **注意**: 当前文件夹名为 `paget2` 是为了与同目录下的原 `paget` 项目区分。项目重构完成后将重命名为 `paget` 并推送到原 `paget` 的 git 仓库。
> 
> **所有代码、注释、文档中涉及的项目名称必须使用 `paget`，禁止使用 `paget2`**。

## 必须遵循的文档

- [ARCHITECTURE.md](./ARCHITECTURE.md) - 架构设计
- [DEVELOPMENT_GUIDELINES.md](./DEVELOPMENT_GUIDELINES.md) - 开发规范

## 关键规范摘要

### 代码规范

1. **注释格式**: 所有代码注释必须为 `中文 | 英文` 形式
2. **禁止 any 类型**: 必须使用具体类型，如需使用必须添加注释说明原因
3. **禁止 default export**: 除 Vue SFC 外禁止使用 default export
4. **strict 模式**: TypeScript 严格模式

### 类型管理

5. **跨包类型必须放入 @paget/shared**: 如果类型被 2 个或以上包使用，必须放入 shared
6. **每个模块/组件必须有 types/index.ts**: 统一管理模块内类型

### 界面规范

7. **UI/Website 用户界面**: 纯中文，不允许混合英文
8. **CSS 变量前缀**: 使用 `--paget-`

### 包结构

9. **遵循包依赖原则**:
   - shared 无依赖
   - page-controller → shared
   - llm → shared
   - server → shared + llm
   - ui → shared + page-controller
   - website → shared
10. **禁止逆向/循环依赖**

### Vue 组件 (packages/ui)

11. **仅使用 Composition API**: `<script setup lang="ts">`
12. **禁止 Tailwind CSS**: 使用纯 CSS + CSS 变量
13. **组件文件命名**: PascalCase.vue

### NestJS (packages/server)

14. **模块结构**: module.ts + service.ts + gateway.ts
15. **业务逻辑放 Services**: Controllers/Gateways 仅做协议 I/O
16. **使用 @paget/shared 常量**: WebSocket 事件名必须使用 shared 中定义

### Git 提交

17. **提交信息格式**: `type: subject` (feat, fix, docs, refactor 等)

## 开发命令

```bash
pnpm dev:ui        # 启动 ui 包
pnpm dev:server    # 启动 server 包
pnpm dev:website   # 启动 website 包
pnpm build         # 构建所有包
pnpm lint          # ESLint 检查
pnpm typecheck     # TypeScript 检查
```

## 目录结构

```
paget/
├── packages/
│   ├── shared/           # @paget/shared - 共享类型/常量/事件
│   ├── page-controller/  # @paget/page-controller - DOM 操作
│   ├── llm/             # @paget/llm - LLM 调用
│   ├── server/          # @paget/server - NestJS 服务
│   ├── ui/              # @paget/ui - Vue 悬浮 UI
│   └── website/          # @paget/website - 官网
├── ARCHITECTURE.md       # 详细架构设计
└── DEVELOPMENT_GUIDELINES.md  # 完整开发规范
```
