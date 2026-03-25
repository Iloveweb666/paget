// 聊天消息角色 / Chat message role
export type MessageRole = 'user' | 'assistant' | 'system'

/**
 * 聊天消息，在 UI 中展示
 * A chat message displayed in the UI
 */
export interface ChatMessage {
  id: string
  role: MessageRole
  content: string
  timestamp: number
  // 关联的任务运行 ID（用于将步骤事件分组到对应的用户消息下）/ Associated task run ID (groups step events under the corresponding user message)
  taskRunId?: string
}

/**
 * LLM 流式文本分片载荷 / LLM streaming text chunk payload
 * 用于纯对话场景（如用户咨询页面业务逻辑、查阅嵌入的操作手册/资料），
 * LLM 以流式方式逐步返回文本，UI 侧增量追加到同一条 assistant 消息中实现逐字渲染。
 * For pure conversation scenarios (e.g. user inquiring about page business logic,
 * consulting embedded manuals/documents). The LLM streams text incrementally,
 * and the UI appends chunks to the same assistant message for typewriter rendering.
 */
export interface StreamChunkPayload {
  sessionId: string
  messageId: string   // 同一条消息的所有 chunk 共享此 ID / All chunks of the same message share this ID
  chunk: string       // 本次增量文本 / Incremental text for this chunk
  done: boolean       // 是否为最后一个 chunk / Whether this is the final chunk
}

/**
 * WebSocket 任务提交载荷
 * WebSocket task submission payload
 */
export interface TaskSubmitPayload {
  // 自然语言任务描述 / The task description in natural language
  task: string
  // 会话 ID，用于对话连续性 / Session ID for conversation continuity
  sessionId: string
  // 可选的 LLM 配置覆盖 / Optional LLM config override
  llmConfigId?: string
  // 可选的最大步数覆盖 / Optional max steps override
  maxSteps?: number
  // 任务运行 ID，用于关联步骤事件与用户消息 / Task run ID to link step events to user messages
  taskRunId?: string
  // 用户语言偏好，写入 LLM 提示词 / User language preference, injected into LLM system prompt
  language?: string
}

/**
 * 客户端上报的页面状态
 * WebSocket page state report from client
 */
export interface PageStatePayload {
  sessionId: string
  url: string
  title: string
  // 简化后的 HTML 内容（来自 PageController）/ Simplified HTML content (from PageController)
  content: string
  // 页面头部信息 / Page header info
  header: string
  // 折叠以下的内容 / Content below fold
  footer: string
}
