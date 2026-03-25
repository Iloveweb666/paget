/**
 * 智能体编排服务 — 实现核心的"观察-思考-行动"循环，支持批量操作
 * Agent orchestration service — implements the core Observe-Think-Act loop with batch action support
 */
import { Injectable, Logger } from '@nestjs/common';
import { ChatOpenAI } from '@langchain/openai';
import { LLMService } from '../llm/llm.service';
import { PromptService } from '../prompt/prompt.service';
import { SessionService } from '../session/session.service';
import { ToolRegistry } from './tools/tool.registry';
import { executeAgentStep, type AgentChainInput } from './chain/agent.chain';
import { executeStreamingChat } from './chain/chat.chain';

/**
 * 智能体运行上下文 — 包含会话信息和与客户端交互的回调函数
 * Agent run context — contains session info and callbacks for client interaction
 */
export interface AgentRunContext {
  sessionId: string;       // 会话 ID / Session ID
  task: string;            // 用户任务描述 / User task description
  llmConfigId?: string;    // 指定使用的 LLM 配置 ID / Specified LLM config ID to use
  maxSteps?: number;       // 最大步骤数限制 / Maximum step count limit
  taskRunId?: string;      // 任务运行 ID，透传到所有历史事件 / Task run ID, propagated to all history events
  language?: string;       // 用户语言偏好，写入系统提示词 / User language preference, injected into system prompt
  /**
   * 回调：从客户端获取当前页面状态
   * Callback to get current page state from the client
   */
  getPageState: () => Promise<{ header: string; content: string; footer: string }>;
  /**
   * 回调：在客户端执行批量操作
   * Callback to execute batch actions on the client
   */
  executeBatchActions: (
    actions: Array<{ tool: string; params: Record<string, unknown> }>,
  ) => Promise<Array<{ success: boolean; output?: string; error?: string }>>;
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
@Injectable()
export class AgentService {
  private readonly logger = new Logger(AgentService.name);
  // 正在运行的任务映射表，键为 sessionId / Map of running tasks, keyed by sessionId
  private readonly runningTasks = new Map<string, { abort: () => void }>();
  // 正在进行流式对话的会话集合 / Set of sessions with active streaming chat
  private readonly streamingSessions = new Set<string>();

  constructor(
    private readonly llmService: LLMService,
    private readonly promptService: PromptService,
    private readonly sessionService: SessionService,
    private readonly toolRegistry: ToolRegistry,
  ) {}

  /**
   * 检查指定会话是否有正在运行的任务（包括流式对话）
   * Check if a session has a running task (including streaming chat)
   */
  isRunning(sessionId: string): boolean {
    return this.runningTasks.has(sessionId) || this.streamingSessions.has(sessionId);
  }

  /**
   * 获取 LLM 模型实例（供 gateway 做意图分类等用途）
   * Get LLM model instance (for gateway to do intent classification, etc.)
   */
  async getLLMModel(): Promise<ChatOpenAI> {
    return this.llmService.getChatModel();
  }

  /**
   * 执行流式对话（非自动化场景）
   * Execute streaming chat (non-automation scenario)
   */
  async chat(
    sessionId: string,
    message: string,
    callbacks: {
      onChunk: (chunk: string) => void;
      onDone: (fullText: string) => void;
      onError: (error: Error) => void;
    },
  ): Promise<void> {
    this.streamingSessions.add(sessionId);
    const model = await this.llmService.getChatModel();

    try {
      await executeStreamingChat(model, message, {
        onChunk: callbacks.onChunk,
        onDone: (fullText) => {
          this.streamingSessions.delete(sessionId);
          callbacks.onDone(fullText);
        },
        onError: (error) => {
          this.streamingSessions.delete(sessionId);
          callbacks.onError(error);
        },
      });
    } catch (err) {
      this.streamingSessions.delete(sessionId);
      throw err;
    }
  }

  /**
   * 取消正在运行的任务
   * Cancel a running task
   */
  cancel(sessionId: string): void {
    const task = this.runningTasks.get(sessionId);
    if (task) {
      task.abort();
      this.runningTasks.delete(sessionId);
    }
  }

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
  async run(ctx: AgentRunContext): Promise<void> {
    const { sessionId, task, maxSteps = 40 } = ctx;
    let aborted = false;

    // 注册当前任务到运行映射表（附带中止回调） / Register current task in running map (with abort callback)
    this.runningTasks.set(sessionId, {
      abort: () => {
        aborted = true;
      },
    });

    // 初始化会话并更新状态为运行中 / Initialize session and update status to running
    await this.sessionService.getOrCreate(sessionId);
    await this.sessionService.updateStatus(sessionId, 'running', task);
    ctx.emitStatus('running');

    // 获取 LLM 模型实例和系统提示词 / Get LLM model instance and system prompt
    const model = await this.llmService.getChatModel();
    // 构建语言指令（写入提示词末尾）/ Build language instruction (appended to system prompt)
    const languageInstruction = ctx.language
      ? `IMPORTANT: You MUST respond in ${ctx.language}. All your reflection text (evaluation_previous_goal, memory, next_goal) and done messages must be written in ${ctx.language}.`
      : '';
    const systemPrompt = await this.promptService.getSystemPrompt({ languageInstruction });

    // 步骤历史记录（与 AgentChainInput.history 对齐）/ Step history (aligned with AgentChainInput.history)
    const history: AgentChainInput['history'] = [];
    let stepNumber = 0;

    try {
      while (stepNumber < maxSteps && !aborted) {
        stepNumber++;

        // 1. OBSERVE（观察）— 获取页面状态 / Get page state
        ctx.emitActivity({ type: 'thinking' });
        const pageState = await ctx.getPageState();
        if (aborted) break;

        // 2. THINK（思考）— 调用 LLM 进行推理 / Call LLM for inference
        const stepOutput = await executeAgentStep(model, this.toolRegistry, {
          systemPrompt,
          browserState: pageState,
          history,
          task,
          stepNumber,
          maxSteps,
        });
        if (aborted) break;

        // 3. ACT（行动）— 将批量操作发送到客户端 / Send batch actions to client
        // 如果包含 done 工具则跳过执行，直接完成 / Skip execution if done tool is present, complete directly
        const hasDone = stepOutput.actions.some((a) => a.tool === 'done');
        if (hasDone) {
          // 记录最终步骤到历史 / Record final step to history
          const doneEvent = {
            type: 'step' as const,
            stepNumber,
            reflection: {
              evaluation_previous_goal: stepOutput.evaluation_previous_goal,
              memory: stepOutput.memory,
              next_goal: stepOutput.next_goal,
            },
            actions: stepOutput.actions,
            results: stepOutput.actions.map((a) => ({
              success: true,
              output: a.tool === 'done' ? (a.params as any).message : 'skipped',
            })),
            usage: stepOutput.usage,
            timestamp: Date.now(),
            taskRunId: ctx.taskRunId,
          };
          await this.sessionService.appendHistory(sessionId, doneEvent);
          ctx.emitHistory(doneEvent);
          await this.sessionService.updateStatus(sessionId, 'completed');
          ctx.emitStatus('completed', 'Task completed successfully');
          return;
        }

        ctx.emitActivity({
          type: 'executing',
          actionIndex: 0,
          actionTotal: stepOutput.actions.length,
        });

        const results = await ctx.executeBatchActions(stepOutput.actions);
        if (aborted) break;

        ctx.emitActivity({
          type: 'executed',
          actionIndex: stepOutput.actions.length - 1,
          actionTotal: stepOutput.actions.length,
        });

        // 等待页面动画/渲染稳定（下拉菜单收起、路由过渡等）
        // Wait for page animations/rendering to stabilize (dropdown close, route transitions, etc.)
        await new Promise((resolve) => setTimeout(resolve, 500));

        // 4. RECORD（记录）— 将步骤持久化 / Persist step
        const stepEvent = {
          type: 'step' as const,
          stepNumber,
          reflection: {
            evaluation_previous_goal: stepOutput.evaluation_previous_goal,
            memory: stepOutput.memory,
            next_goal: stepOutput.next_goal,
          },
          actions: stepOutput.actions,
          results,
          usage: stepOutput.usage,
          timestamp: Date.now(),
          taskRunId: ctx.taskRunId,
        };

        // 存入完整步骤记录（reflection + actions + results）供后续 LLM 上下文使用
        // Push complete step record for subsequent LLM context
        history.push({
          reflection: {
            evaluation_previous_goal: stepOutput.evaluation_previous_goal,
            memory: stepOutput.memory,
            next_goal: stepOutput.next_goal,
          },
          actions: stepOutput.actions,
          results,
        });
        await this.sessionService.appendHistory(sessionId, stepEvent);
        ctx.emitHistory(stepEvent);

        // 5. CHECK（检查）— 检查批量操作中是否有错误 / Check for errors in batch results
        const hasError = results.some((r) => !r.success);
        if (hasError) {
          // 记录错误观察，但继续循环（让 LLM 自我纠正） / Record observation about the error, but continue (let LLM self-correct)
          const errorMsg = results
            .filter((r) => !r.success)
            .map((r) => r.error)
            .join('; ');
          const obs = {
            type: 'observation' as const,
            message: `Action error: ${errorMsg}`,
            timestamp: Date.now(),
            taskRunId: ctx.taskRunId,
          };
          await this.sessionService.appendHistory(sessionId, obs);
          ctx.emitHistory(obs);
        }
      }

      // 达到最大步骤数限制 / Max steps reached
      if (!aborted) {
        await this.sessionService.updateStatus(sessionId, 'error');
        ctx.emitStatus('error', `Max steps (${maxSteps}) reached`);
      }
    } catch (err) {
      // 捕获运行时错误并记录到会话历史 / Catch runtime errors and record to session history
      this.logger.error(`Agent error for session ${sessionId}:`, err);
      const errorEvent = {
        type: 'error' as const,
        message: err instanceof Error ? err.message : String(err),
        timestamp: Date.now(),
        taskRunId: ctx.taskRunId,
      };
      await this.sessionService.appendHistory(sessionId, errorEvent);
      ctx.emitHistory(errorEvent);
      await this.sessionService.updateStatus(sessionId, 'error');
      ctx.emitStatus('error', errorEvent.message);
    } finally {
      // 无论成功或失败，清理运行映射表 / Clean up running map regardless of success or failure
      this.runningTasks.delete(sessionId);
    }
  }
}
