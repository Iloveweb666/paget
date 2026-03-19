/**
 * 智能体推理链 — 组装消息、调用 LLM 并解析结构化输出
 * Agent chain — assembles messages, calls LLM, and parses structured output
 */
import { ChatOpenAI } from '@langchain/openai';
import { ToolRegistry } from '../tools/tool.registry';
/**
 * 智能体推理链的输入参数
 * Input parameters for the agent chain
 */
export interface AgentChainInput {
    systemPrompt: string;
    browserState: {
        header: string;
        content: string;
        footer: string;
    };
    history: Array<{
        reflection: {
            evaluation_previous_goal: string;
            memory: string;
            next_goal: string;
        };
        actions: Array<{
            tool: string;
            params: Record<string, unknown>;
        }>;
        results: Array<{
            success: boolean;
            output?: string;
            error?: string;
        }>;
    }>;
    task: string;
    stepNumber: number;
    maxSteps: number;
}
/**
 * 智能体推理链的输出结果
 * Output result of the agent chain
 */
export interface AgentChainOutput {
    evaluation_previous_goal: string;
    memory: string;
    next_goal: string;
    actions: Array<{
        tool: string;
        params: Record<string, unknown>;
    }>;
    usage?: {
        promptTokens: number;
        completionTokens: number;
        totalTokens: number;
    };
}
/**
 * 执行一步智能体推理
 * Execute one agent step:
 * 1. 组装消息（系统提示词 + 历史 + 当前状态） / Assemble messages (system prompt + history + current state)
 * 2. 使用 MacroTool 函数调用方式调用 LLM / Call LLM with MacroTool function calling
 * 3. 解析并返回结构化输出 / Parse and return structured output
 */
export declare function executeAgentStep(model: ChatOpenAI, registry: ToolRegistry, input: AgentChainInput): Promise<AgentChainOutput>;
//# sourceMappingURL=agent.chain.d.ts.map