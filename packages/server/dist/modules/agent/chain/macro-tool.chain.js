"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.buildMacroToolSchema = buildMacroToolSchema;
exports.macroToolToOpenAIFunction = macroToolToOpenAIFunction;
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
const zod_1 = require("zod");
const zod_to_json_schema_1 = require("zod-to-json-schema");
/**
 * 构建宏工具 Zod 模式 — 将所有注册工具的参数模式合并为联合类型
 * Build the MacroTool Zod schema — combines all registered tool parameter schemas into a union type
 */
function buildMacroToolSchema(registry) {
    // 获取所有已注册的工具 / Get all registered tools
    const tools = registry.getAll();
    // 为每个工具构建操作模式（工具名 + 参数） / Build action schema for each tool (tool name + params)
    const actionSchemas = tools.map((tool) => zod_1.z.object({
        tool: zod_1.z.literal(tool.name),
        params: tool.schema,
    }));
    // 如果有多个工具，使用可辨识联合类型；否则直接使用单个模式 / Use discriminated union for multiple tools; single schema otherwise
    const actionUnion = actionSchemas.length > 1
        ? zod_1.z.discriminatedUnion('tool', actionSchemas)
        : actionSchemas[0];
    // 返回完整的宏工具模式 / Return the complete macro tool schema
    return zod_1.z.object({
        evaluation_previous_goal: zod_1.z
            .string()
            .describe('Evaluate how well the previous goal was achieved. Be specific.'),
        memory: zod_1.z
            .string()
            .describe('Key information to remember for future steps (URLs, values found, progress).'),
        next_goal: zod_1.z
            .string()
            .describe('The next goal to achieve. Be specific and actionable.'),
        actions: zod_1.z
            .array(actionUnion)
            .min(1)
            .describe('Actions to execute. Use multiple actions when they can be performed without re-observing the page (e.g., filling multiple form fields).'),
    });
}
/**
 * 将宏工具模式转换为 OpenAI 函数调用格式
 * Convert the MacroTool schema to OpenAI function calling format
 */
function macroToolToOpenAIFunction(registry) {
    const schema = buildMacroToolSchema(registry);
    return {
        type: 'function',
        function: {
            name: 'agent_step',
            description: 'Execute one agent step: reflect on the previous goal, then perform one or more actions.',
            // eslint-disable-next-line @typescript-eslint/no-explicit-any -- zod 与 zod-to-json-schema 版本间类型不兼容 / type incompatibility between zod and zod-to-json-schema versions
            parameters: (0, zod_to_json_schema_1.zodToJsonSchema)(schema),
        },
    };
}
//# sourceMappingURL=macro-tool.chain.js.map