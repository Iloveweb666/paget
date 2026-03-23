# @paget/server

## Overview

NestJS backend service — handles LLM management, agent orchestration, prompt management, in-memory session state, and WebSocket communication.

## Rules

- All comments: bilingual (中文 / English)
- Module structure: `module.ts` + `service.ts` + `controller.ts` + `dto/`
- Business logic in services, controllers are thin wrappers
- Use class-validator for DTO validation, Zod for agent tool schemas
- WebSocket gateway: use event constants from `@paget/shared`, no magic strings
- LangChain integration lives in `modules/agent/chain/`
- Agent tools extend `BaseTool` and register via `ToolRegistry`
- Session state lives in process memory (no external database layer in current architecture)
- Never log or expose LLM API keys in responses
