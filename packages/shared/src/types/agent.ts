import type { AgentStatus } from '../constants/status.js'

/**
 * 单个原子操作，Agent 可执行的最小动作单元
 * A single atomic action the agent can perform
 */
export interface AgentAction {
  // 工具名称：click, input, select, scroll, scroll_horizontally, wait, done, ask_user, execute_javascript
  // Tool name: click, input, select, scroll, scroll_horizontally, wait, done, ask_user, execute_javascript
  tool: string
  // 工具特定参数 / Tool-specific parameters
  params: Record<string, unknown>
}

/**
 * 单个操作的执行结果
 * Result of executing a single action
 */
export interface ActionResult {
  // 已执行的操作 / The action that was executed
  action: AgentAction
  // 执行是否成功 / Whether execution succeeded
  success: boolean
  // 输出消息或数据 / Output message or data
  output?: string
  // 失败时的错误消息 / Error message if failed
  error?: string
}

/**
 * 批量执行结果
 * Result of a batch execution
 */
export interface BatchResult {
  results: ActionResult[]
  // 已完成的操作数（遇错中断时可能小于总数）/ Completed count (may be < total if one errored)
  completedCount: number
}

/**
 * MacroTool 输出：反思 + 批量操作
 * MacroTool output: reflection + batch actions
 */
export interface MacroToolOutput {
  // 对上一步目标完成度的评估 / Evaluation of the previous goal's success
  evaluation_previous_goal: string
  // 需要记住的关键信息 / Key information to remember
  memory: string
  // 下一步要达成的目标 / The next goal to achieve
  next_goal: string
  // 一个或多个待执行的操作（支持批量）/ One or more actions to execute (batch support)
  actions: AgentAction[]
}

/**
 * Agent 执行历史中的单个步骤
 * A single step in agent execution history
 */
export interface AgentStepEvent {
  type: 'step'
  // 步骤序号 / Step number
  stepNumber: number
  // 反思输出 / The reflection output
  reflection: {
    evaluation_previous_goal: string
    memory: string
    next_goal: string
  }
  // 本步骤执行的所有操作 / All actions executed in this step
  actions: AgentAction[]
  // 每个操作的结果 / Results for each action
  results: ActionResult[]
  // LLM Token 用量 / LLM token usage
  usage?: TokenUsage
  timestamp: number
}

/**
 * 系统生成的观察事件
 * System-generated observation
 */
export interface ObservationEvent {
  type: 'observation'
  message: string
  timestamp: number
}

/**
 * 错误事件
 * Error event
 */
export interface ErrorEvent {
  type: 'error'
  message: string
  timestamp: number
}

// 所有历史事件类型的联合 / Union of all history event types
export type HistoryEvent = AgentStepEvent | ObservationEvent | ErrorEvent

/**
 * Token 用量信息
 * Token usage info
 */
export interface TokenUsage {
  promptTokens: number
  completionTokens: number
  totalTokens: number
}

/**
 * Agent 状态变更载荷
 * Agent status change payload
 */
export interface StatusChangePayload {
  status: AgentStatus
  taskId?: string
  message?: string
}

// 活动类型，用于瞬态 UI 反馈 / Activity types for transient UI feedback
export type ActivityType = 'thinking' | 'executing' | 'executed' | 'retrying' | 'error'

/**
 * 活动事件载荷
 * Activity event payload
 */
export interface ActivityPayload {
  type: ActivityType
  // 当前批量操作中的索引（用于 executing/executed）/ Current action index in batch
  actionIndex?: number
  // 批量操作总数 / Total actions in batch
  actionTotal?: number
  // 正在执行的操作 / Action being executed
  action?: AgentAction
  // 重试信息 / Retry info
  attempt?: number
  maxAttempts?: number
  // 错误消息 / Error message
  message?: string
}

/**
 * 任务执行结果
 * Task execution result
 */
export interface ExecutionResult {
  success: boolean
  data?: string
  history: HistoryEvent[]
  totalSteps: number
  totalTokens: TokenUsage
}
