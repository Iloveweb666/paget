"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var AgentService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.AgentService = void 0;
/**
 * 智能体编排服务 — 实现核心的"观察-思考-行动"循环，支持批量操作
 * Agent orchestration service — implements the core Observe-Think-Act loop with batch action support
 */
const common_1 = require("@nestjs/common");
const llm_service_1 = require("../llm/llm.service");
const prompt_service_1 = require("../prompt/prompt.service");
const session_service_1 = require("../session/session.service");
const tool_registry_1 = require("./tools/tool.registry");
const agent_chain_1 = require("./chain/agent.chain");
const chat_chain_1 = require("./chain/chat.chain");
/**
 * 智能体编排服务
 * 实现核心的"观察 -> 思考 -> 行动"循环，镜像了 page-agent 的 PageAgentCore 模式，但运行在服务端
 * Agent orchestration service.
 * Implements the core Observe -> Think -> Act loop with batch action support.
 * Mirrors page-agent's PageAgentCore pattern but runs server-side.
 */
let AgentService = AgentService_1 = class AgentService {
    llmService;
    promptService;
    sessionService;
    toolRegistry;
    logger = new common_1.Logger(AgentService_1.name);
    // 正在运行的任务映射表，键为 sessionId / Map of running tasks, keyed by sessionId
    runningTasks = new Map();
    // 正在进行流式对话的会话集合 / Set of sessions with active streaming chat
    streamingSessions = new Set();
    constructor(llmService, promptService, sessionService, toolRegistry) {
        this.llmService = llmService;
        this.promptService = promptService;
        this.sessionService = sessionService;
        this.toolRegistry = toolRegistry;
    }
    /**
     * 检查指定会话是否有正在运行的任务（包括流式对话）
     * Check if a session has a running task (including streaming chat)
     */
    isRunning(sessionId) {
        return this.runningTasks.has(sessionId) || this.streamingSessions.has(sessionId);
    }
    /**
     * 获取 LLM 模型实例（供 gateway 做意图分类等用途）
     * Get LLM model instance (for gateway to do intent classification, etc.)
     */
    async getLLMModel() {
        return this.llmService.getChatModel();
    }
    /**
     * 执行流式对话（非自动化场景）
     * Execute streaming chat (non-automation scenario)
     */
    async chat(sessionId, message, callbacks) {
        this.streamingSessions.add(sessionId);
        const model = await this.llmService.getChatModel();
        try {
            await (0, chat_chain_1.executeStreamingChat)(model, message, {
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
        }
        catch (err) {
            this.streamingSessions.delete(sessionId);
            throw err;
        }
    }
    /**
     * 取消正在运行的任务
     * Cancel a running task
     */
    cancel(sessionId) {
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
    async run(ctx) {
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
        const systemPrompt = await this.promptService.getSystemPrompt();
        // 步骤历史记录（与 AgentChainInput.history 对齐）/ Step history (aligned with AgentChainInput.history)
        const history = [];
        let stepNumber = 0;
        try {
            while (stepNumber < maxSteps && !aborted) {
                stepNumber++;
                // 1. OBSERVE（观察）— 获取页面状态 / Get page state
                ctx.emitActivity({ type: 'thinking' });
                const pageState = await ctx.getPageState();
                // 2. THINK（思考）— 调用 LLM 进行推理 / Call LLM for inference
                const stepOutput = await (0, agent_chain_1.executeAgentStep)(model, this.toolRegistry, {
                    systemPrompt,
                    browserState: pageState,
                    history,
                    task,
                    stepNumber,
                    maxSteps,
                });
                // 3. ACT（行动）— 将批量操作发送到客户端 / Send batch actions to client
                ctx.emitActivity({
                    type: 'executing',
                    actionIndex: 0,
                    actionTotal: stepOutput.actions.length,
                });
                const results = await ctx.executeBatchActions(stepOutput.actions);
                ctx.emitActivity({
                    type: 'executed',
                    actionIndex: stepOutput.actions.length - 1,
                    actionTotal: stepOutput.actions.length,
                });
                // 4. RECORD（记录）— 将步骤持久化 / Persist step
                const stepEvent = {
                    type: 'step',
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
                // 5. CHECK（检查）— 任务是否完成 / Is the task done?
                const hasDone = stepOutput.actions.some((a) => a.tool === 'done');
                if (hasDone) {
                    await this.sessionService.updateStatus(sessionId, 'completed');
                    ctx.emitStatus('completed', 'Task completed successfully');
                    return;
                }
                // 检查批量操作中是否有错误 / Check for errors in batch results
                const hasError = results.some((r) => !r.success);
                if (hasError) {
                    // 记录错误观察，但继续循环（让 LLM 自我纠正） / Record observation about the error, but continue (let LLM self-correct)
                    const errorMsg = results
                        .filter((r) => !r.success)
                        .map((r) => r.error)
                        .join('; ');
                    const obs = {
                        type: 'observation',
                        message: `Action error: ${errorMsg}`,
                        timestamp: Date.now(),
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
        }
        catch (err) {
            // 捕获运行时错误并记录到会话历史 / Catch runtime errors and record to session history
            this.logger.error(`Agent error for session ${sessionId}:`, err);
            const errorEvent = {
                type: 'error',
                message: err instanceof Error ? err.message : String(err),
                timestamp: Date.now(),
            };
            await this.sessionService.appendHistory(sessionId, errorEvent);
            ctx.emitHistory(errorEvent);
            await this.sessionService.updateStatus(sessionId, 'error');
            ctx.emitStatus('error', errorEvent.message);
        }
        finally {
            // 无论成功或失败，清理运行映射表 / Clean up running map regardless of success or failure
            this.runningTasks.delete(sessionId);
        }
    }
};
exports.AgentService = AgentService;
exports.AgentService = AgentService = AgentService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [llm_service_1.LLMService,
        prompt_service_1.PromptService,
        session_service_1.SessionService,
        tool_registry_1.ToolRegistry])
], AgentService);
//# sourceMappingURL=agent.service.js.map