/**
 * 流式对话链 — 使用 LangChain model.stream() 实现流式文本输出
 * Streaming chat chain — uses LangChain model.stream() for streaming text output
 */
import { ChatOpenAI } from '@langchain/openai';
import { HumanMessage, SystemMessage } from '@langchain/core/messages';

// 对话系统提示词 / Chat system prompt
const CHAT_SYSTEM_PROMPT = `你是 Paget AI 助手，一个智能的网页自动化助手。
You are Paget AI Assistant, an intelligent web page automation assistant.

你可以回答用户关于页面内容、业务逻辑、操作流程等方面的问题。
You can answer user questions about page content, business logic, operation processes, etc.

回复要求 / Response requirements:
- 回复简洁明了 / Keep responses concise and clear
- 使用用户的语言回复（中文问题用中文回答，英文问题用英文回答）/ Reply in the user's language
- 如果用户的问题涉及页面自动化操作，告知他们可以直接描述想要执行的操作 / If the question involves page automation, inform them they can describe the desired action directly`;

/**
 * 流式对话回调接口 / Streaming chat callbacks
 */
export interface StreamingChatCallbacks {
  // 收到增量文本分片 / Received an incremental text chunk
  onChunk: (chunk: string) => void;
  // 流式输出结束 / Streaming output completed
  onDone: (fullText: string) => void;
  // 流式输出出错 / Streaming output error
  onError: (error: Error) => void;
}

/**
 * 执行流式对话 / Execute streaming chat
 * 使用 LangChain model.stream() 逐步返回文本 / Uses LangChain model.stream() to return text incrementally
 */
export async function executeStreamingChat(
  model: ChatOpenAI,
  message: string,
  callbacks: StreamingChatCallbacks,
): Promise<void> {
  try {
    const stream = await model.stream([
      new SystemMessage(CHAT_SYSTEM_PROMPT),
      new HumanMessage(message),
    ]);

    let fullText = '';
    for await (const chunk of stream) {
      const text =
        typeof chunk.content === 'string' ? chunk.content : '';
      if (text) {
        fullText += text;
        callbacks.onChunk(text);
      }
    }

    callbacks.onDone(fullText);
  } catch (err) {
    callbacks.onError(
      err instanceof Error ? err : new Error(String(err)),
    );
  }
}
