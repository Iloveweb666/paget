/**
 * 宏工具链 — 构建"先反思后行动"的结构化输出模式
 * Macro tool chain — builds the reflection-before-action structured output schema
 *
 * LLM 必须输出 / The LLM must output:
 * 1. evaluation_previous_goal — 上一步的执行评估 / how well did the last step work
 * 2. memory — 需要记住的关键信息 / key info to remember
 * 3. next_goal — 下一步目标 / what to do next
 * 4. actions[] — 待执行的操作（默认仅 1 个，显式启用批量时允许多个）/ actions to execute (1 by default, multiple when batch enabled)
 */
import { z } from 'zod';
import { zodToJsonSchema } from 'zod-to-json-schema';
import { ToolRegistry } from '../tools/tool.registry';

/**
 * 宏工具构建选项 / MacroTool build options
 */
export interface MacroToolOptions {
  /**
   * 允许批量执行的工具名列表。为空或不传则每步只能 1 个 action。
   * List of tool names allowed for batch execution. Empty or omitted = exactly 1 action per step.
   */
  batchableTools?: string[];
}

/**
 * 构建宏工具 Zod 模式 — 将所有注册工具的参数模式合并为联合类型
 * Build the MacroTool Zod schema — combines all registered tool parameter schemas into a union type
 */
export function buildMacroToolSchema(registry: ToolRegistry, options?: MacroToolOptions) {
  // 获取所有已注册的工具 / Get all registered tools
  const tools = registry.getAll();
  const batchableTools = options?.batchableTools ?? [];
  const batchEnabled = batchableTools.length > 0;

  // 为每个工具构建操作模式（工具名 + 参数） / Build action schema for each tool (tool name + params)
  const actionSchemas = tools.map((tool) =>
    z.object({
      tool: z.literal(tool.name),
      params: tool.schema,
    }),
  );

  // 如果有多个工具，使用可辨识联合类型；否则直接使用单个模式 / Use discriminated union for multiple tools; single schema otherwise
  const actionUnion =
    actionSchemas.length > 1
      // eslint-disable-next-line @typescript-eslint/no-explicit-any -- zod discriminatedUnion 要求至少两个成员的元组类型 / zod discriminatedUnion requires tuple type with at least two members
      ? z.discriminatedUnion('tool', actionSchemas as any)
      : actionSchemas[0];

  // 根据是否启用批量来约束 actions 数组 / Constrain actions array based on batch mode
  const actionsSchema = batchEnabled
    ? z
        .array(actionUnion)
        .min(1)
        .describe(
          `Actions to execute. You may batch multiple actions for: ${batchableTools.join(', ')}. For other tools, use one action per step.`,
        )
    : z
        .array(actionUnion)
        .length(1)
        .describe('Exactly one action to execute per step.');

  // 返回完整的宏工具模式 / Return the complete macro tool schema
  return z.object({
    evaluation_previous_goal: z
      .string()
      .describe('Evaluate how well the previous goal was achieved. Be specific.'),
    memory: z
      .string()
      .describe('Key information to remember for future steps (URLs, values found, progress).'),
    next_goal: z
      .string()
      .describe('The next goal to achieve. Be specific and actionable.'),
    actions: actionsSchema,
  });
}

/**
 * 将宏工具模式转换为 OpenAI 函数调用格式
 * Convert the MacroTool schema to OpenAI function calling format
 */
export function macroToolToOpenAIFunction(registry: ToolRegistry, options?: MacroToolOptions) {
  const batchEnabled = (options?.batchableTools ?? []).length > 0;
  const schema = buildMacroToolSchema(registry, options);

  return {
    type: 'function' as const,
    function: {
      name: 'agent_step',
      description: batchEnabled
        ? 'Execute one agent step: reflect on the previous goal, then perform one or more actions.'
        : 'Execute one agent step: reflect on the previous goal, then perform exactly one action.',
      // eslint-disable-next-line @typescript-eslint/no-explicit-any -- zod 与 zod-to-json-schema 版本间类型不兼容 / type incompatibility between zod and zod-to-json-schema versions
      parameters: zodToJsonSchema(schema as any),
    },
  };
}
