export type MessageRole = 'user' | 'assistant' | 'system';
/**
 * 聊天消息，在 UI 中展示
 * A chat message displayed in the UI
 */
export interface ChatMessage {
    id: string;
    role: MessageRole;
    content: string;
    timestamp: number;
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
    sessionId: string;
    messageId: string;
    chunk: string;
    done: boolean;
}
/**
 * WebSocket 任务提交载荷
 * WebSocket task submission payload
 */
export interface TaskSubmitPayload {
    task: string;
    sessionId: string;
    llmConfigId?: string;
}
/**
 * 客户端上报的页面状态
 * WebSocket page state report from client
 */
export interface PageStatePayload {
    sessionId: string;
    url: string;
    title: string;
    content: string;
    header: string;
    footer: string;
}
//# sourceMappingURL=message.d.ts.map