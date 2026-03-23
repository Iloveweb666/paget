/**
 * 工具注册表 — 管理所有可用的智能体工具，支持动态注册自定义工具
 * Tool registry — manages all available agent tools, supports dynamic registration of custom tools
 */
import { Injectable } from '@nestjs/common';
import { BaseTool } from './base.tool';
import { ClickTool } from './builtin/click.tool';
import { InputTool } from './builtin/input.tool';
import { SelectTool } from './builtin/select.tool';
import { ScrollTool } from './builtin/scroll.tool';
import { ScrollHorizontallyTool } from './builtin/scroll-horizontally.tool';
import { WaitTool } from './builtin/wait.tool';
import { DoneTool } from './builtin/done.tool';
import { AskUserTool } from './builtin/ask-user.tool';
import { ExecuteJavascriptTool } from './builtin/execute-javascript.tool';

@Injectable()
export class ToolRegistry {
  // 工具映射表，以工具名称为键 / Tool map, keyed by tool name
  private tools = new Map<string, BaseTool>();

  constructor() {
    // 初始化时注册内置工具 / Register built-in tools on initialization
    this.registerBuiltinTools();
  }

  // 注册内置工具（与系统提示词能力对齐） / Register built-in tools (aligned with system prompt capabilities)
  private registerBuiltinTools(): void {
    const builtins = [
      new ClickTool(),
      new InputTool(),
      new SelectTool(),
      new ScrollTool(),
      new ScrollHorizontallyTool(),
      new WaitTool(),
      new DoneTool(),
      new AskUserTool(),
      new ExecuteJavascriptTool(),
    ];
    for (const tool of builtins) {
      this.register(tool);
    }
  }

  // 注册一个新工具 / Register a new tool
  register(tool: BaseTool): void {
    this.tools.set(tool.name, tool);
  }

  // 按名称获取工具实例 / Get a tool instance by name
  get(name: string): BaseTool | undefined {
    return this.tools.get(name);
  }

  // 获取所有已注册的工具 / Get all registered tools
  getAll(): BaseTool[] {
    return Array.from(this.tools.values());
  }

  /**
   * 获取工具描述信息列表，用于构建 LLM 上下文
   * Get tool descriptions for LLM context
   */
  getToolDescriptions(): Array<{ name: string; description: string; schema: unknown }> {
    return this.getAll().map((tool) => ({
      name: tool.name,
      description: tool.description,
      schema: tool.schema,
    }));
  }
}
