/**
 * 流式对话链 — 使用 LangChain model.stream() 实现流式文本输出
 * Streaming chat chain — uses LangChain model.stream() for streaming text output
 */
import { ChatOpenAI } from '@langchain/openai';
/**
 * 流式对话回调接口 / Streaming chat callbacks
 */
export interface StreamingChatCallbacks {
    onChunk: (chunk: string) => void;
    onDone: (fullText: string) => void;
    onError: (error: Error) => void;
}
/**
 * 执行流式对话 / Execute streaming chat
 * 使用 LangChain model.stream() 逐步返回文本 / Uses LangChain model.stream() to return text incrementally
 */
export declare function executeStreamingChat(model: ChatOpenAI, message: string, callbacks: StreamingChatCallbacks): Promise<void>;
//# sourceMappingURL=chat.chain.d.ts.map