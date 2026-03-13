# @paget/shared

## Overview

Shared types and constants used by both frontend and backend packages.

## Rules

- All comments: bilingual (中文 / English)
- Types only — no runtime code with side effects
- No dependencies on other workspace packages
- Export everything from `src/index.ts`
- Enum values: UPPER_SNAKE_CASE
- Interface naming: no `I` prefix (use `AgentAction` not `IAgentAction`)
