import { ChatOpenAI } from '@langchain/openai';
import { LLMService } from '../llm/llm.service';
import { PromptService } from '../prompt/prompt.service';
import { SessionService } from '../session/session.service';
import { ToolRegistry } from './tools/tool.registry';
/**
 * 智能体运行上下文 — 包含会话信息和与客户端交互的回调函数
 * Agent run context — contains session info and callbacks for client interaction
 */
export interface AgentRunContext {
    sessionId: string;
    task: string;
    llmConfigId?: string;
    maxSteps?: number;
    /**
     * 回调：从客户端获取当前页面状态
     * Callback to get current page state from the client
     */
    getPageState: () => Promise<{
        header: string;
        content: string;
        footer: string;
    }>;
    /**
     * 回调：在客户端执行批量操作
     * Callback to execute batch actions on the client
     */
    executeBatchActions: (actions: Array<{
        tool: string;
        params: Record<string, unknown>;
    }>) => Promise<Array<{
        success: boolean;
        output?: string;
        error?: string;
    }>>;
    /**
     * 回调：向客户端发送状态变更事件
     * Callback to emit status change events to the client
     */
    emitStatus: (status: string, message?: string) => void;
    /**
     * 回调：向客户端发送历史事件（持久化）
     * Callback to emit history events to the client (persisted)
     */
    emitHistory: (event: Record<string, unknown>) => void;
    /**
     * 回调：向客户端发送活动事件（瞬态，不发送给 LLM）
     * Callback to emit activity events to the client (transient, not sent to LLM)
     */
    emitActivity: (activity: Record<string, unknown>) => void;
}
/**
 * 智能体编排服务
 * 实现核心的"观察 -> 思考 -> 行动"循环，镜像了 page-agent 的 PageAgentCore 模式，但运行在服务端
 * Agent orchestration service.
 * Implements the core Observe -> Think -> Act loop with batch action support.
 * Mirrors page-agent's PageAgentCore pattern but runs server-side.
 */
export declare class AgentService {
    private readonly llmService;
    private readonly promptService;
    private readonly sessionService;
    private readonly toolRegistry;
    private readonly logger;
    private readonly runningTasks;
    private readonly streamingSessions;
    constructor(llmService: LLMService, promptService: PromptService, sessionService: SessionService, toolRegistry: ToolRegistry);
    /**
     * 检查指定会话是否有正在运行的任务（包括流式对话）
     * Check if a session has a running task (including streaming chat)
     */
    isRunning(sessionId: string): boolean;
    /**
     * 获取 LLM 模型实例（供 gateway 做意图分类等用途）
     * Get LLM model instance (for gateway to do intent classification, etc.)
     */
    getLLMModel(): Promise<ChatOpenAI>;
    /**
     * 执行流式对话（非自动化场景）
     * Execute streaming chat (non-automation scenario)
     */
    chat(sessionId: string, message: string, callbacks: {
        onChunk: (chunk: string) => void;
        onDone: (fullText: string) => void;
        onError: (error: Error) => void;
    }): Promise<void>;
    /**
     * 取消正在运行的任务
     * Cancel a running task
     */
    cancel(sessionId: string): void;
    /**
     * 执行智能体主循环
     * Execute the agent loop for a given task.
     *
     * 循环步骤 / Loop steps:
     *   1. OBSERVE（观察） — 从客户端获取页面状态 / get page state from client
     *   2. THINK（思考）  — LLM 推理，使用 MacroTool 输出反思 + 动作列表 / LLM inference with MacroTool (reflection + actions[])
     *   3. ACT（行动）    — 将批量动作发送到客户端执行 / send batch actions to client, collect results
     *   4. RECORD（记录） — 将步骤持久化到历史记录并发送事件 / persist step to history, emit events
     *   5. CHECK（检查）  — 判断任务是否完成/出错/超步 / terminate if done/error/maxSteps
     */
    run(ctx: AgentRunContext): Promise<void>;
}
//# sourceMappingURL=agent.service.d.ts.map