"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.executeStreamingChat = executeStreamingChat;
const messages_1 = require("@langchain/core/messages");
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
 * 执行流式对话 / Execute streaming chat
 * 使用 LangChain model.stream() 逐步返回文本 / Uses LangChain model.stream() to return text incrementally
 */
async function executeStreamingChat(model, message, callbacks) {
    try {
        const stream = await model.stream([
            new messages_1.SystemMessage(CHAT_SYSTEM_PROMPT),
            new messages_1.HumanMessage(message),
        ]);
        let fullText = '';
        for await (const chunk of stream) {
            const text = typeof chunk.content === 'string' ? chunk.content : '';
            if (text) {
                fullText += text;
                callbacks.onChunk(text);
            }
        }
        callbacks.onDone(fullText);
    }
    catch (err) {
        callbacks.onError(err instanceof Error ? err : new Error(String(err)));
    }
}
//# sourceMappingURL=chat.chain.js.map