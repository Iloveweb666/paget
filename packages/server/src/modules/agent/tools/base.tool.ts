/**
 * 智能体工具基类 — 定义所有工具的通用接口
 * Agent tool base class — defines the common interface for all tools
 * 镜像了 page-agent 的 PageAgentTool 模式
 * Mirrors page-agent's PageAgentTool pattern.
 */
import { z } from 'zod';

export abstract class BaseTool {
  /**
   * 工具唯一名称
   * Unique tool name
   */
  abstract readonly name: string;

  /**
   * 供 LLM 理解的工具描述
   * Human-readable description for LLM
   */
  abstract readonly description: string;

  /**
   * 工具参数的 Zod 验证模式
   * Zod schema for tool parameters
   */
  abstract readonly schema: z.ZodType;

  /**
   * 使用已验证的参数执行工具，返回描述结果的字符串
   * Execute the tool with validated parameters. Returns a string output describing the result.
   */
  abstract execute(params: unknown): Promise<string>;
}
