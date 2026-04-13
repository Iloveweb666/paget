import type { IntentType } from '../constants/intent.js'

/**
 * 意图分类结果
 * Intent classification result
 */
export interface IntentResult {
  // 意图类型 / Intent type
  type: IntentType
  // 置信度 (0-1) / Confidence score (0-1)
  confidence: number
  // 分类推理过程 / Reasoning for classification
  reasoning?: string
}

/**
 * 意图路由结果
 * Intent routing result
 */
export interface RouteResult {
  // 路由目标 / Route destination
  // agent_loop: 走完整 Agent 执行流程 / Full agent execution loop
  // direct_chat: 直接 LLM 对话回复 / Direct LLM chat reply
  // ask_user: 询问用户确认 / Ask user for confirmation
  routeTo: 'agent_loop' | 'direct_chat' | 'ask_user'
  // 直接回复内容（当 routeTo = 'direct_chat' 或 'ask_user' 时）/ Direct response content
  response?: string
}
