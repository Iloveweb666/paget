/**
 * 智能体编排服务 — 实现核心的"观察-思考-行动"循环，支持批量操作
 * Agent orchestration service — implements the core Observe-Think-Act loop with batch action support
 */
import { Injectable, Logger } from '@nestjs/common';
import { LLMService } from '../llm/llm.service';
import { PromptService } from '../prompt/prompt.service';
import { SessionService } from '../session/session.service';
import { ToolRegistry } from './tools/tool.registry';
import { executeAgentStep, type AgentChainInput } from './chain/agent.chain';
import { restructureBatchActions } from './tools/batch-utils';
import type { AgentRunContext, StreamingChatCallbacks } from './agent.types';

// 对话系统提示词 / Chat system prompt
const CHAT_SYSTEM_PROMPT = `你是 Paget AI 助手，一个智能的网页自动化助手。
You are Paget AI Assistant, an intelligent web page automation assistant.

你可以回答用户关于页面内容、业务逻辑、操作流程等方面的问题。
You can answer user questions about page content, business logic, operation processes, etc.

回复要求 / Response requirements:
- 回复简洁明了 / Keep responses concise and clear
- 使用用户的语言回复（中文问题用中文回答，英文问题用英文回答）/ Reply in the user's language
- 如果用户的问题涉及页面自动化操作，告知他们可以直接描述想要执行的操作 / If the question involves page automation, inform them they can describe the desired action directly`;

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
   * 执行流式对话（非自动化场景）
   * Execute streaming chat (non-automation scenario)
   */
  async chat(
    sessionId: string,
    message: string,
    callbacks: StreamingChatCallbacks,
  ): Promise<void> {
    this.streamingSessions.add(sessionId);
    const llm = this.llmService.getLLM();

    try {
      // 使用原生 fetch 实现流式对话 / Use native fetch for streaming chat
      const response = await fetch(`${llm.config.baseURL}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(llm.config.apiKey && { Authorization: `Bearer ${llm.config.apiKey}` }),
        },
        body: JSON.stringify({
          model: llm.config.model,
          temperature: llm.config.temperature,
          stream: true,
          messages: [
            { role: 'system', content: CHAT_SYSTEM_PROMPT },
            { role: 'user', content: message },
          ],
        }),
      });

      if (!response.ok || !response.body) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let fullText = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split('\n').filter((line) => line.startsWith('data: '));

        for (const line of lines) {
          const data = line.slice(6).trim();
          if (data === '[DONE]') continue;

          try {
            const parsed = JSON.parse(data);
            const content = parsed.choices?.[0]?.delta?.content || '';
            if (content) {
              fullText += content;
              callbacks.onChunk(content);
            }
          } catch {
            // 忽略无法解析的行 / Ignore unparseable lines
          }
        }
      }

      this.streamingSessions.delete(sessionId);
      callbacks.onDone(fullText);
    } catch (err) {
      this.streamingSessions.delete(sessionId);
      callbacks.onError(err instanceof Error ? err : new Error(String(err)));
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
   * 根据 batchableTools 生成批量操作提示词片段
   * Generate batch instruction prompt fragment based on batchableTools
   */
  private buildBatchInstructions(batchableTools: string[]): string {
    if (batchableTools.length === 0) return '';

    const toolList = batchableTools.map((t) => `**${t}**`).join(', ');
    return [
      '',
      '## Batch Operations (Enabled)',
      '',
      `For the following tools, you MAY combine multiple actions in a single step when they can be performed without re-observing the page: ${toolList}.`,
      '',
      'Example: filling multiple form fields in one step:',
      '```json',
      '{ "actions": [',
      '  { "tool": "input", "params": { "index": 3, "text": "John" } },',
      '  { "tool": "input", "params": { "index": 5, "text": "john@example.com" } }',
      '] }',
      '```',
      '',
      'For all other tools, output exactly one action per step.',
    ].join('\n');
  }

  /**
   * 执行智能体主循环
   * Execute the agent main loop
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
      abort: () => { aborted = true; },
    });

    // 初始化会话并更新状态为运行中 / Initialize session and update status to running
    await this.sessionService.getOrCreate(sessionId);
    await this.sessionService.updateStatus(sessionId, 'running', task);
    ctx.emitStatus('running');

    // 获取 LLM 实例和系统提示词 / Get LLM instance and system prompt
    const llm = this.llmService.getLLM();
    // 构建语言指令（写入提示词末尾）/ Build language instruction (appended to system prompt)
    const languageInstruction = ctx.language
      ? `IMPORTANT: You MUST respond in ${ctx.language}. All your reflection text (evaluation_previous_goal, memory, next_goal) and done messages must be written in ${ctx.language}.`
      : '';
    // 构建批量操作指令 / Build batch instructions
    const batchableTools = ctx.batchableTools ?? [];
    const batchInstructions = this.buildBatchInstructions(batchableTools);
    const systemPrompt = await this.promptService.getSystemPrompt({ languageInstruction, batchInstructions });

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
        const stepOutput = await executeAgentStep(llm, this.toolRegistry, {
          systemPrompt,
          browserState: pageState,
          history,
          task,
          stepNumber,
          maxSteps,
          batchableTools,
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
              // eslint-disable-next-line @typescript-eslint/no-explicit-any -- params 结构取决于具体工具 / params structure depends on the specific tool
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

        // 重组 batch actions，确保 dropdown click 只能在开头或结尾 / Restructure batch actions for dropdown handling
        const restructuredActions = restructureBatchActions(stepOutput.actions);
        const results = await ctx.executeBatchActions(restructuredActions);
        if (aborted) break;
        const executedActions = stepOutput.actions.slice(0, results.length);
        const batchTruncated =
          results.length < stepOutput.actions.length &&
          results.every((r) => r.success);

        ctx.emitActivity({
          type: 'executed',
          actionIndex: Math.max(results.length - 1, 0),
          actionTotal: results.length,
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
          actions: executedActions,
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
          actions: executedActions,
          results,
        });
        await this.sessionService.appendHistory(sessionId, stepEvent);
        ctx.emitHistory(stepEvent);

        if (batchTruncated) {
          const obs = {
            type: 'observation' as const,
            message:
              'Batch execution stopped early after interacting with a dropdown-like control so the UI state can settle. Re-observe the page and handle the updated options or dependent fields before other actions.',
            timestamp: Date.now(),
            taskRunId: ctx.taskRunId,
          };
          await this.sessionService.appendHistory(sessionId, obs);
          ctx.emitHistory(obs);
        }

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
