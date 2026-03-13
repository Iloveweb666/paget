/**
 * 宏工具链 — 构建"先反思后行动"的结构化输出模式，支持批量操作
 * Macro tool chain — builds the reflection-before-action structured output schema with batch support
 *
 * LLM 必须输出 / The LLM must output:
 * 1. evaluation_previous_goal — 上一步的执行评估 / how well did the last step work
 * 2. memory — 需要记住的关键信息 / key info to remember
 * 3. next_goal — 下一步目标 / what to do next
 * 4. actions[] — 一个或多个待执行的操作 / one or more actions to execute
 */
import { z } from 'zod';
import { zodToJsonSchema } from 'zod-to-json-schema';
import { ToolRegistry } from '../tools/tool.registry';

/**
 * 构建宏工具 Zod 模式 — 将所有注册工具的参数模式合并为联合类型
 * Build the MacroTool Zod schema — combines all registered tool parameter schemas into a union type
 */
export function buildMacroToolSchema(registry: ToolRegistry) {
  // 获取所有已注册的工具 / Get all registered tools
  const tools = registry.getAll();

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
      ? z.discriminatedUnion('tool', actionSchemas as any)
      : actionSchemas[0];

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
    actions: z
      .array(actionUnion)
      .min(1)
      .describe(
        'Actions to execute. Use multiple actions when they can be performed without re-observing the page (e.g., filling multiple form fields).',
      ),
  });
}

/**
 * 将宏工具模式转换为 OpenAI 函数调用格式
 * Convert the MacroTool schema to OpenAI function calling format
 */
export function macroToolToOpenAIFunction(registry: ToolRegistry) {
  const schema = buildMacroToolSchema(registry);

  return {
    type: 'function' as const,
    function: {
      name: 'agent_step',
      description:
        'Execute one agent step: reflect on the previous goal, then perform one or more actions.',
      parameters: zodToJsonSchema(schema), // Zod 模式转 JSON Schema / Convert Zod schema to JSON Schema
    },
  };
}
