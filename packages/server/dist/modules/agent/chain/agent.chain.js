"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.executeAgentStep = executeAgentStep;
const messages_1 = require("@langchain/core/messages");
const macro_tool_chain_1 = require("./macro-tool.chain");
/**
 * 执行一步智能体推理
 * Execute one agent step:
 * 1. 组装消息（系统提示词 + 历史 + 当前状态） / Assemble messages (system prompt + history + current state)
 * 2. 使用 MacroTool 函数调用方式调用 LLM / Call LLM with MacroTool function calling
 * 3. 解析并返回结构化输出 / Parse and return structured output
 */
async function executeAgentStep(model, registry, input) {
    // 构建 OpenAI 函数调用格式的宏工具 / Build macro tool in OpenAI function calling format
    const macroTool = (0, macro_tool_chain_1.macroToolToOpenAIFunction)(registry);
    // 组装消息列表 / Assemble message list
    const messages = [
        new messages_1.SystemMessage(input.systemPrompt), // 系统提示词 / System prompt
    ];
    // 添加历史步骤上下文 / Add history context from previous steps
    for (const step of input.history) {
        const reflection = [
            `evaluation: ${step.reflection.evaluation_previous_goal}`,
            `memory: ${step.reflection.memory}`,
            `goal: ${step.reflection.next_goal}`,
            `actions: ${JSON.stringify(step.actions)}`,
            `results: ${step.results.map((r) => r.success ? r.output : `ERROR: ${r.error}`).join('; ')}`,
        ].join('\n');
        messages.push(new messages_1.AIMessage(reflection)); // 将历史步骤作为 AI 消息注入 / Inject historical steps as AI messages
    }
    // 构建当前页面状态的用户消息 / Build user message with current page state
    const userPrompt = [
        `## Current Task`,
        input.task,
        '',
        `## Step ${input.stepNumber}/${input.maxSteps}`,
        '',
        `## Current Page State`,
        input.browserState.header,
        '',
        '```',
        input.browserState.content,
        '```',
        '',
        input.browserState.footer,
    ].join('\n');
    messages.push(new messages_1.HumanMessage(userPrompt));
    // 调用 LLM，强制使用 agent_step 函数调用 / Call LLM, force using agent_step function call
    const response = await model.invoke(messages, {
        tools: [macroTool],
        tool_choice: { type: 'function', function: { name: 'agent_step' } },
    });
    // 从响应中解析工具调用结果 / Parse tool call result from response
    const toolCalls = response.tool_calls;
    if (!toolCalls || toolCalls.length === 0) {
        throw new Error('LLM did not return a tool call');
    }
    const args = toolCalls[0].args;
    // 提取 token 使用量统计 / Extract token usage statistics
    const usage = response.usage_metadata
        ? {
            promptTokens: response.usage_metadata.input_tokens,
            completionTokens: response.usage_metadata.output_tokens,
            totalTokens: response.usage_metadata.total_tokens,
        }
        : undefined;
    return { ...args, usage };
}
//# sourceMappingURL=agent.chain.js.map