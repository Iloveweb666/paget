/**
 * 智能体运行上下文 — 包含会话信息和与客户端交互的回调函数
 * Agent run context — contains session info and callbacks for client interaction
 */
export interface AgentRunContext {
  sessionId: string;
  task: string;
  llmConfigId?: string;
  maxSteps?: number;
  taskRunId?: string;
  language?: string;
  // 允许批量执行的工具名列表，默认为空（每步只能 1 个 action）/ Batchable tool names, default empty (single action per step)
  batchableTools?: string[];
  getPageState: () => Promise<{ header: string; content: string; footer: string }>;
  executeBatchActions: (
    actions: Array<{ tool: string; params: Record<string, unknown> }>,
  ) => Promise<Array<{ success: boolean; output?: string; error?: string }>>;
  emitStatus: (status: string, message?: string) => void;
  emitHistory: (event: Record<string, unknown>) => void;
  emitActivity: (activity: Record<string, unknown>) => void;
}

/**
 * 流式对话回调接口
 * Streaming chat callbacks
 */
export interface StreamingChatCallbacks {
  onChunk: (chunk: string) => void;
  onDone: (fullText: string) => void;
  onError: (error: Error) => void;
}
