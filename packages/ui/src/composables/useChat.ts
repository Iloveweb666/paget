/**
 * 聊天消息状态与自动滚动行为管理
 * Manages chat message state and auto-scroll behavior
 */
import { ref, nextTick } from 'vue'
import type { ChatMessage, StreamChunkPayload } from '@paget/shared'

export function useChat() {
  // 消息列表 / Message list
  const messages = ref<ChatMessage[]>([])
  // 输入框文本 / Input text
  const inputText = ref('')
  // 消息列表 DOM 引用（用于滚动控制）/ Message list DOM reference (for scroll control)
  const messageListRef = ref<HTMLElement | null>(null)

  /**
   * 添加用户消息 / Add a user message
   */
  function addUserMessage(content: string): ChatMessage {
    const msg: ChatMessage = {
      id: crypto.randomUUID(),
      role: 'user',
      content,
      timestamp: Date.now(),
    }
    messages.value.push(msg)
    scrollToBottom()
    return msg
  }

  /**
   * 添加助手消息 / Add an assistant message
   */
  function addAssistantMessage(content: string): ChatMessage {
    const msg: ChatMessage = {
      id: crypto.randomUUID(),
      role: 'assistant',
      content,
      timestamp: Date.now(),
    }
    messages.value.push(msg)
    scrollToBottom()
    return msg
  }

  /**
   * 添加系统消息 / Add a system message
   */
  function addSystemMessage(content: string): ChatMessage {
    const msg: ChatMessage = {
      id: crypto.randomUUID(),
      role: 'system',
      content,
      timestamp: Date.now(),
    }
    messages.value.push(msg)
    scrollToBottom()
    return msg
  }

  // 当前正在流式输出的消息 ID / Currently streaming message ID
  const streamingMessageId = ref<string | null>(null)

  /**
   * 处理 LLM 流式文本分片，实现逐字渲染 / Handle LLM streaming text chunks for typewriter rendering
   * 当用户进行纯对话时，将流式分片增量追加到同一条 assistant 消息中。
   * When the user engages in pure conversation, stream chunks are appended
   * incrementally to the same assistant message.
   */
  function handleStreamChunk(payload: StreamChunkPayload) {
    const existing = messages.value.find(m => m.id === payload.messageId)
    if (existing) {
      existing.content += payload.chunk
    } else {
      messages.value.push({
        id: payload.messageId,
        role: 'assistant',
        content: payload.chunk,
        timestamp: Date.now(),
      })
    }

    // 跟踪流式消息 ID / Track streaming message ID
    if (payload.done) {
      streamingMessageId.value = null
    } else {
      streamingMessageId.value = payload.messageId
    }

    if (payload.done || !existing) scrollToBottom()
  }

  /**
   * 滚动消息列表到底部 / Scroll the message list to the bottom
   */
  async function scrollToBottom() {
    await nextTick()
    if (messageListRef.value) {
      messageListRef.value.scrollTop = messageListRef.value.scrollHeight
    }
  }

  /**
   * 清空所有消息 / Clear all messages
   */
  function clearMessages() {
    messages.value = []
  }

  /**
   * 处理发送消息（获取输入文本、清空输入框、添加用户消息）
   * Handle sending a message (get input text, clear input, add user message)
   */
  function sendMessage(): string | null {
    const text = inputText.value.trim()
    if (!text) return null
    inputText.value = ''
    addUserMessage(text)
    return text
  }

  return {
    messages,
    inputText,
    messageListRef,
    streamingMessageId,
    addUserMessage,
    addAssistantMessage,
    addSystemMessage,
    handleStreamChunk,
    scrollToBottom,
    clearMessages,
    sendMessage,
  }
}
