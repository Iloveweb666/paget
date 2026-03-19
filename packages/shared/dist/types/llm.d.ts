/**
 * LLM 服务商配置
 * LLM provider configuration
 */
export interface LLMConfig {
    id: string;
    name: string;
    baseUrl: string;
    apiKey: string;
    model: string;
    temperature?: number;
    maxTokens?: number;
    isDefault?: boolean;
    createdAt?: string;
    updatedAt?: string;
}
/**
 * LLM 消息格式（OpenAI 兼容）
 * LLM message format (OpenAI-compatible)
 */
export interface LLMMessage {
    role: 'system' | 'user' | 'assistant' | 'tool';
    content: string;
    tool_call_id?: string;
    tool_calls?: LLMToolCall[];
}
/**
 * LLM 工具调用
 * LLM tool call
 */
export interface LLMToolCall {
    id: string;
    type: 'function';
    function: {
        name: string;
        arguments: string;
    };
}
/**
 * LLM 调用结果
 * LLM invoke result
 */
export interface LLMInvokeResult {
    content: string;
    toolCalls?: LLMToolCall[];
    usage?: {
        promptTokens: number;
        completionTokens: number;
        totalTokens: number;
    };
}
//# sourceMappingURL=llm.d.ts.map