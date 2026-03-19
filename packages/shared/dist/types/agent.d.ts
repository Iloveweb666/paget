import type { AgentStatus } from '../constants/status.js';
/**
 * 单个原子操作，Agent 可执行的最小动作单元
 * A single atomic action the agent can perform
 */
export interface AgentAction {
    tool: string;
    params: Record<string, unknown>;
}
/**
 * 单个操作的执行结果
 * Result of executing a single action
 */
export interface ActionResult {
    action: AgentAction;
    success: boolean;
    output?: string;
    error?: string;
}
/**
 * 批量执行结果
 * Result of a batch execution
 */
export interface BatchResult {
    results: ActionResult[];
    completedCount: number;
}
/**
 * MacroTool 输出：反思 + 批量操作
 * MacroTool output: reflection + batch actions
 */
export interface MacroToolOutput {
    evaluation_previous_goal: string;
    memory: string;
    next_goal: string;
    actions: AgentAction[];
}
/**
 * Agent 执行历史中的单个步骤
 * A single step in agent execution history
 */
export interface AgentStepEvent {
    type: 'step';
    stepNumber: number;
    reflection: {
        evaluation_previous_goal: string;
        memory: string;
        next_goal: string;
    };
    actions: AgentAction[];
    results: ActionResult[];
    usage?: TokenUsage;
    timestamp: number;
}
/**
 * 系统生成的观察事件
 * System-generated observation
 */
export interface ObservationEvent {
    type: 'observation';
    message: string;
    timestamp: number;
}
/**
 * 错误事件
 * Error event
 */
export interface ErrorEvent {
    type: 'error';
    message: string;
    timestamp: number;
}
export type HistoryEvent = AgentStepEvent | ObservationEvent | ErrorEvent;
/**
 * Token 用量信息
 * Token usage info
 */
export interface TokenUsage {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
}
/**
 * Agent 状态变更载荷
 * Agent status change payload
 */
export interface StatusChangePayload {
    status: AgentStatus;
    taskId?: string;
    message?: string;
}
export type ActivityType = 'thinking' | 'executing' | 'executed' | 'retrying' | 'error';
/**
 * 活动事件载荷
 * Activity event payload
 */
export interface ActivityPayload {
    type: ActivityType;
    actionIndex?: number;
    actionTotal?: number;
    action?: AgentAction;
    attempt?: number;
    maxAttempts?: number;
    message?: string;
}
/**
 * 任务执行结果
 * Task execution result
 */
export interface ExecutionResult {
    success: boolean;
    data?: string;
    history: HistoryEvent[];
    totalSteps: number;
    totalTokens: TokenUsage;
}
//# sourceMappingURL=agent.d.ts.map