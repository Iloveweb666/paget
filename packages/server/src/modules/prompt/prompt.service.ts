/**
 * 提示词服务 — 管理提示词模板的 CRUD 操作，并提供模板渲染功能
 * Prompt service — manages CRUD operations for prompt templates and provides template rendering
 */
import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PromptTemplateEntity } from './prompt.entity';

@Injectable()
export class PromptService {
  constructor(
    @InjectRepository(PromptTemplateEntity)
    private readonly promptRepo: Repository<PromptTemplateEntity>,
  ) {}

  // 查询所有提示词模板，按更新时间降序 / Find all prompt templates, ordered by update time descending
  async findAll(): Promise<PromptTemplateEntity[]> {
    return this.promptRepo.find({ order: { updatedAt: 'DESC' } });
  }

  // 根据 ID 查询单个模板，不存在则抛出异常 / Find a single template by ID, throw if not found
  async findOne(id: string): Promise<PromptTemplateEntity> {
    const template = await this.promptRepo.findOneBy({ id });
    if (!template) throw new NotFoundException(`Prompt template ${id} not found`);
    return template;
  }

  // 根据类型查找当前激活的模板 / Find the active template by type
  async findActiveByType(type: 'system' | 'instruction' | 'page'): Promise<PromptTemplateEntity | null> {
    return this.promptRepo.findOneBy({ type, isActive: true });
  }

  // 创建新的提示词模板 / Create a new prompt template
  async create(data: Partial<PromptTemplateEntity>): Promise<PromptTemplateEntity> {
    const entity = this.promptRepo.create(data);
    return this.promptRepo.save(entity);
  }

  // 更新指定 ID 的模板 / Update a template by ID
  async update(id: string, data: Partial<PromptTemplateEntity>): Promise<PromptTemplateEntity> {
    const template = await this.findOne(id);
    Object.assign(template, data);
    return this.promptRepo.save(template);
  }

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
   * 获取组装后的系统提示词（变量已填充）
   * Get the assembled system prompt with variables filled in.
   */
  async getSystemPrompt(variables: Record<string, string> = {}): Promise<string> {
    const template = await this.findActiveByType('system');
    if (!template) {
      // 无自定义模板时使用默认系统提示词 / Fall back to default system prompt when no custom template exists
      return DEFAULT_SYSTEM_PROMPT;
    }
    return this.render(template.content, variables);
  }
}

// 默认系统提示词 — 当数据库中无激活的系统模板时使用 / Default system prompt — used when no active system template exists in the database
const DEFAULT_SYSTEM_PROMPT = `You are a web page automation agent. You can interact with web page elements to complete tasks.

## Core Principles
1. **Reflection-Before-Action**: Before every action, reflect on what happened previously, what you remember, and what your next goal is.
2. **Batch Operations**: When multiple actions can be performed without needing to re-observe the page (e.g., filling multiple form fields), combine them into a single actions array.
3. **Minimal Actions**: Use the fewest actions necessary. Only separate into different steps when you need to observe the page state after an action.

## Available Tools
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
