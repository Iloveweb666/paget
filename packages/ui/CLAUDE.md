# @paget/ui

## Overview

Vue 3 chat UI — the entry point and user-facing module of Paget. This package will be embedded into production systems, so it must follow design specifications strictly.

## Rules

- Composition API + `<script setup>` only
- All comments: bilingual (中文 / English)
- CSS uses `--paget-*` custom properties from `styles/variables.css`
- No third-party UI library (no Element Plus, no Ant Design) — this package IS the UI
- i18n: add both zh-CN and en-US entries for every user-visible string
- Components are organized by feature: `ChatPanel/`, `MessageList/`, `ConfigPanel/`
- Composables (`useXxx`) encapsulate stateful logic; keep components focused on rendering
- API calls go in `api/` directory, not inside components
- Pinia stores are minimal — prefer composables for component-scoped state
