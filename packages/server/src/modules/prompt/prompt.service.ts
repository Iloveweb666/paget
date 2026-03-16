/**
 * 提示词服务 — 从本地 .md 文件加载系统提示词
 * Prompt service — loads system prompt from local .md file
 */
import { Injectable, Logger } from '@nestjs/common';
import { readFileSync } from 'fs';
import { join } from 'path';

@Injectable()
export class PromptService {
  private readonly logger = new Logger(PromptService.name);
  // 缓存加载的系统提示词 / Cached system prompt
  private systemPromptCache: string | null = null;

  /**
   * 渲染模板 — 将 {{variable}} 占位符替换为实际值
   * Render a template by replacing {{variable}} placeholders with values.
   */
  render(template: string, variables: Record<string, string>): string {
    return template.replace(/\{\{(\w+)\}\}/g, (_, name) => {
      return variables[name] ?? `{{${name}}}`;
    });
  }

  /**
   * 获取系统提示词（优先从 .md 文件加载，失败时使用内置默认值）
   * Get system prompt (loads from .md file first, falls back to built-in default)
   */
  async getSystemPrompt(variables: Record<string, string> = {}): Promise<string> {
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
  private loadFromFile(): string {
    try {
      const filePath = join(__dirname, 'templates', 'system_prompt.md');
      return readFileSync(filePath, 'utf-8');
    } catch {
      this.logger.warn('Failed to load system_prompt.md, using built-in default');
      return DEFAULT_SYSTEM_PROMPT;
    }
  }
}

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
