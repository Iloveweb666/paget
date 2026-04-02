/**
 * 智能体推理链 — 组装消息、调用 LLM 并解析结构化输出
 * Agent chain — assembles messages, calls LLM, and parses structured output
 */
import { ChatOpenAI } from "@langchain/openai";
import {
  HumanMessage,
  SystemMessage,
  AIMessage,
} from "@langchain/core/messages";
import { ToolRegistry } from "../tools/tool.registry";
import { macroToolToOpenAIFunction } from "./macro-tool.chain";

/**
 * 智能体推理链的输入参数
 * Input parameters for the agent chain
 */
export interface AgentChainInput {
  systemPrompt: string; // 系统提示词 / System prompt
  browserState: {
    // 当前浏览器页面状态 / Current browser page state
    header: string; // 页面头部信息 / Page header info
    content: string; // 页面主要内容 / Page main content
    footer: string; // 页面底部信息 / Page footer info
  };
  history: Array<{
    // 之前步骤的历史记录 / History of previous steps
    reflection: {
      evaluation_previous_goal: string;
      memory: string;
      next_goal: string;
    };
    actions: Array<{ tool: string; params: Record<string, unknown> }>;
    results: Array<{ success: boolean; output?: string; error?: string }>;
  }>;
  task: string; // 用户任务描述 / User task description
  stepNumber: number; // 当前步骤编号 / Current step number
  maxSteps: number; // 最大步骤数 / Maximum step count
}

/**
 * 智能体推理链的输出结果
 * Output result of the agent chain
 */
export interface AgentChainOutput {
  evaluation_previous_goal: string; // 上一步执行评估 / Evaluation of the previous step
  memory: string; // 需要记住的关键信息 / Key information to remember
  next_goal: string; // 下一步目标 / Next goal
  actions: Array<{ tool: string; params: Record<string, unknown> }>; // 待执行的操作列表 / Actions to execute
  usage?: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  }; // Token 使用统计 / Token usage statistics
}

function shouldRetryWithoutToolChoice(error: unknown): boolean {
  if (!(error instanceof Error)) {
    return false;
  }
  const message = error.message.toLowerCase();
  return (
    message.includes("tool_choice") &&
    (message.includes("required") || message.includes("object")) &&
    message.includes("thinking mode")
  );
}

/**
 * 执行一步智能体推理
 * Execute one agent step:
 * 1. 组装消息（系统提示词 + 历史 + 当前状态） / Assemble messages (system prompt + history + current state)
 * 2. 使用 MacroTool 函数调用方式调用 LLM / Call LLM with MacroTool function calling
 * 3. 解析并返回结构化输出 / Parse and return structured output
 */
export async function executeAgentStep(
  model: ChatOpenAI,
  registry: ToolRegistry,
  input: AgentChainInput,
): Promise<AgentChainOutput> {
  // 构建 OpenAI 函数调用格式的宏工具 / Build macro tool in OpenAI function calling format
  const macroTool = macroToolToOpenAIFunction(registry);

  // 组装消息列表 / Assemble message list
  const messages = [
    new SystemMessage(input.systemPrompt), // 系统提示词 / System prompt
  ];

  // 添加历史步骤上下文 / Add history context from previous steps
  for (const step of input.history) {
    const reflection = [
      `evaluation: ${step.reflection.evaluation_previous_goal}`,
      `memory: ${step.reflection.memory}`,
      `goal: ${step.reflection.next_goal}`,
      `actions: ${JSON.stringify(step.actions)}`,
      `results: ${step.results.map((r) => (r.success ? r.output : `ERROR: ${r.error}`)).join("; ")}`,
    ].join("\n");
    messages.push(new AIMessage(reflection)); // 将历史步骤作为 AI 消息注入 / Inject historical steps as AI messages
  }

  // 构建当前页面状态的用户消息 / Build user message with current page state
  const userPrompt = [
    `## Current Task`,
    input.task,
    "",
    `## Step ${input.stepNumber}/${input.maxSteps}`,
    "",
    `## Current Page State`,
    input.browserState.header,
    "",
    "```",
    input.browserState.content,
    "```",
    "",
    input.browserState.footer,
  ].join("\n");

  messages.push(new HumanMessage(userPrompt));

  let response: Awaited<ReturnType<ChatOpenAI["invoke"]>>;
  try {
    response = await model.invoke(messages, {
      tools: [macroTool],
      tool_choice: "required",
    });
  } catch (error) {
    if (!shouldRetryWithoutToolChoice(error)) {
      throw error;
    }
    response = await model.invoke(messages, {
      tools: [macroTool],
    });
  }

  // 从响应中解析工具调用结果 / Parse tool call result from response
  const toolCalls = response.tool_calls;
  if (!toolCalls || toolCalls.length === 0) {
    throw new Error("LLM did not return a tool call");
  }
  if (toolCalls[0].name !== "agent_step") {
    throw new Error(`LLM returned unexpected tool call: ${toolCalls[0].name}`);
  }

  const args = toolCalls[0].args as AgentChainOutput;

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
