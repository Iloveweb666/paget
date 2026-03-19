"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var PromptService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.PromptService = void 0;
/**
 * 提示词服务 — 从本地 .md 文件加载系统提示词
 * Prompt service — loads system prompt from local .md file
 */
const common_1 = require("@nestjs/common");
const fs_1 = require("fs");
const path_1 = require("path");
let PromptService = PromptService_1 = class PromptService {
    logger = new common_1.Logger(PromptService_1.name);
    // 缓存加载的系统提示词 / Cached system prompt
    systemPromptCache = null;
    /**
     * 渲染模板 — 将 {{variable}} 占位符替换为实际值
     * Render a template by replacing {{variable}} placeholders with values.
     */
    render(template, variables) {
        return template.replace(/\{\{(\w+)\}\}/g, (_, name) => {
            return variables[name] ?? `{{${name}}}`;
        });
    }
    /**
     * 获取系统提示词（优先从 .md 文件加载，失败时使用内置默认值）
     * Get system prompt (loads from .md file first, falls back to built-in default)
     */
    async getSystemPrompt(variables = {}) {
        if (!this.systemPromptCache) {
            this.systemPromptCache = this.loadFromFile();
        }
        return Object.keys(variables).length > 0
            ? this.render(this.systemPromptCache, variables)
            : this.systemPromptCache;
    }
    /**
     * 从文件加载系统提示词 / Load system prompt from file
     */
    loadFromFile() {
        try {
            const filePath = (0, path_1.join)(__dirname, 'templates', 'system_prompt.md');
            return (0, fs_1.readFileSync)(filePath, 'utf-8');
        }
        catch {
            this.logger.warn('Failed to load system_prompt.md, using built-in default');
            return DEFAULT_SYSTEM_PROMPT;
        }
    }
};
exports.PromptService = PromptService;
exports.PromptService = PromptService = PromptService_1 = __decorate([
    (0, common_1.Injectable)()
], PromptService);
// 内置默认系统提示词 — 当 .md 文件不可用时使用 / Built-in default — used when .md file is unavailable
const DEFAULT_SYSTEM_PROMPT = `You are a web page automation agent. You can interact with web page elements to complete tasks.

## Core Principles
1. **Reflection-Before-Action**: Before every action, reflect on what happened previously, what you remember, and what your next goal is.
2. **Batch Operations**: When multiple actions can be performed without needing to re-observe the page, combine them into a single actions array.
3. **Minimal Actions**: Use the fewest actions necessary. Only separate into different steps when you need to observe the page state after an action.

## Available Actions
- click(index): Click an element by its index
- input(index, text): Input text into a field
- select(index, value): Select a dropdown option
- scroll(direction, amount?): Scroll the page
- wait(ms): Wait for a specified time
- done(message): Complete the task
- ask_user(question): Ask the user for clarification
- execute_javascript(code): Execute JavaScript (use sparingly)

## Output Format
For each step, output:
- evaluation_previous_goal: How well did the previous action achieve its goal?
- memory: Key information to remember for future steps
- next_goal: What is the next goal to achieve?
- actions: Array of actions to execute (1 or more)
`;
//# sourceMappingURL=prompt.service.js.map