/**
 * LLM 服务商配置
 * LLM provider configuration
 */
export interface LLMConfig {
  id: string
  // 显示名称 / Display name
  name: string
  // OpenAI 兼容的 Base URL / OpenAI-compatible base URL
  baseUrl: string
  // API 密钥 / API key
  apiKey: string
  // 模型标识符 / Model identifier
  model: string
  // 温度参数 (0-2) / Temperature (0-2)
  temperature?: number
  // 响应最大 Token 数 / Max tokens for response
  maxTokens?: number
  // 是否为默认配置 / Whether this is the default config
  isDefault?: boolean
  createdAt?: string
  updatedAt?: string
}

/**
 * LLM 消息格式（OpenAI 兼容）
 * LLM message format (OpenAI-compatible)
 */
export interface LLMMessage {
  role: 'system' | 'user' | 'assistant' | 'tool'
  content: string
  tool_call_id?: string
  tool_calls?: LLMToolCall[]
}

/**
 * LLM 工具调用
 * LLM tool call
 */
export interface LLMToolCall {
  id: string
  type: 'function'
  function: {
    name: string
    arguments: string
  }
}

/**
 * LLM 调用结果
 * LLM invoke result
 */
export interface LLMInvokeResult {
  content: string
  toolCalls?: LLMToolCall[]
  usage?: {
    promptTokens: number
    completionTokens: number
    totalTokens: number
  }
}
