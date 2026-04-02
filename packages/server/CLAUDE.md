# @paget/server

## Overview

NestJS backend service — handles LLM management, agent orchestration, prompt management, in-memory session state, and WebSocket communication.

## Rules

- All comments: bilingual (中文 / English)
- Module structure (current): `module.ts` + `service.ts` + `gateway.ts`; `agent` includes `chain/` and `tools/`
- Model-specific LLM request overrides should live in `src/modules/llm/llm-model.config.ts`, not inline inside `LLMService`
- Business logic in services/chains, gateway handles protocol I/O and connection lifecycle
- Use class-validator where needed for request/config validation, and Zod for agent tool schemas
- WebSocket gateway: use event constants from `@paget/shared`, no magic strings
- LangChain integration lives in `modules/agent/chain/`
- Agent tools extend `BaseTool` and register via `ToolRegistry`
- Session state lives in process memory (no external database layer in current architecture)
- Never log or expose LLM API keys in responses
