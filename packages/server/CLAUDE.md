# @paget/server

## Overview

NestJS backend service — handles LLM management, agent orchestration, prompt management, session persistence, and WebSocket communication.

## Rules

- All comments: bilingual (中文 / English)
- Module structure: `module.ts` + `service.ts` + `controller.ts` + `entity.ts` + `dto/`
- Business logic in services, controllers are thin wrappers
- Use class-validator for DTO validation, Zod for agent tool schemas
- WebSocket gateway: use event constants from `@paget/shared`, no magic strings
- LangChain integration lives in `modules/agent/chain/`
- Agent tools extend `BaseTool` and register via `ToolRegistry`
- Database: TypeORM entities with `synchronize: true` in dev, migrations in prod
- Never log or expose LLM API keys in responses
