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
import { ToolRegistry } from '../tools/tool.registry';
/**
 * 构建宏工具 Zod 模式 — 将所有注册工具的参数模式合并为联合类型
 * Build the MacroTool Zod schema — combines all registered tool parameter schemas into a union type
 */
export declare function buildMacroToolSchema(registry: ToolRegistry): z.ZodObject<{
    evaluation_previous_goal: z.ZodString;
    memory: z.ZodString;
    next_goal: z.ZodString;
    actions: z.ZodArray<z.ZodObject<{
        tool: z.ZodLiteral<string>;
        params: z.ZodType<any, z.ZodTypeDef, any>;
    }, "strip", z.ZodTypeAny, {
        tool: string;
        params?: any;
    }, {
        tool: string;
        params?: any;
    }> | z.ZodDiscriminatedUnion<"tool", any>, "many">;
}, "strip", z.ZodTypeAny, {
    evaluation_previous_goal: string;
    memory: string;
    next_goal: string;
    actions: any[];
}, {
    evaluation_previous_goal: string;
    memory: string;
    next_goal: string;
    actions: any[];
}>;
/**
 * 将宏工具模式转换为 OpenAI 函数调用格式
 * Convert the MacroTool schema to OpenAI function calling format
 */
export declare function macroToolToOpenAIFunction(registry: ToolRegistry): {
    type: "function";
    function: {
        name: string;
        description: string;
        parameters: import("zod-to-json-schema").JsonSchema7Type & {
            $schema?: string | undefined;
            definitions?: {
                [key: string]: import("zod-to-json-schema").JsonSchema7Type;
            } | undefined;
        };
    };
};
//# sourceMappingURL=macro-tool.chain.d.ts.map