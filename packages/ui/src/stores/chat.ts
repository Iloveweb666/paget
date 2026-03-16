/**
 * 聊天状态 Pinia Store（带 localStorage 持久化）
 * Chat state Pinia store with localStorage persistence
 *
 * 管理会话 ID、消息列表、历史事件、Agent 状态和活动指示
 * Manages session ID, message list, history events, agent status, and activity indicator
 */
import { defineStore } from 'pinia'
import { ref, watch } from 'vue'
import type { ChatMessage, HistoryEvent, ActivityPayload } from '@paget/shared'
import { AgentStatus } from '@paget/shared'

// localStorage 键前缀 / localStorage key prefix
const KEY_SESSION = 'paget_chat_session'
const KEY_MESSAGES = 'paget_chat_messages'
const KEY_HISTORY = 'paget_chat_history'

/**
 * 安全读取 localStorage / Safe localStorage read
 */
function loadJSON<T>(key: string, fallback: T): T {
  try {
    const saved = localStorage.getItem(key)
    return saved ? JSON.parse(saved) : fallback
  } catch {
    return fallback
  }
}

/**
 * 安全写入 localStorage / Safe localStorage write
 */
function saveJSON(key: string, value: unknown): void {
  try {
    localStorage.setItem(key, JSON.stringify(value))
  } catch {
    // localStorage 已满时静默失败 / Silently fail when localStorage is full
  }
}

export const useChatStore = defineStore('chat', () => {
  // 恢复上次会话或新建 / Restore previous session or create new
  const savedSessionId = loadJSON<string | null>(KEY_SESSION, null)

  // 当前会话 ID / Current session ID
  const sessionId = ref(savedSessionId || crypto.randomUUID())
  // 聊天消息列表 / Chat message list
  const messages = ref<ChatMessage[]>(
    savedSessionId ? loadJSON<ChatMessage[]>(`${KEY_MESSAGES}_${savedSessionId}`, []) : [],
  )
  // Agent 历史事件列表 / Agent history event list
  const history = ref<HistoryEvent[]>(
    savedSessionId ? loadJSON<HistoryEvent[]>(`${KEY_HISTORY}_${savedSessionId}`, []) : [],
  )
  // Agent 当前状态 / Agent current status
  const status = ref<AgentStatus>(AgentStatus.IDLE)
  // 当前活动指示（瞬态）/ Current activity indicator (transient)
  const activity = ref<ActivityPayload | null>(null)

  // 持久化 sessionId / Persist sessionId
  watch(sessionId, (val) => {
    saveJSON(KEY_SESSION, val)
  }, { immediate: true })

  // 持久化消息列表 / Persist messages
  watch(messages, (val) => {
    saveJSON(`${KEY_MESSAGES}_${sessionId.value}`, val)
  }, { deep: true })

  // 持久化历史事件 / Persist history events
  watch(history, (val) => {
    saveJSON(`${KEY_HISTORY}_${sessionId.value}`, val)
  }, { deep: true })

  /**
   * 创建新会话，重置所有状态 / Create new session and reset all state
   */
  function newSession() {
    sessionId.value = crypto.randomUUID()
    messages.value = []
    history.value = []
    status.value = AgentStatus.IDLE
    activity.value = null
  }

  return { sessionId, messages, history, status, activity, newSession }
})
