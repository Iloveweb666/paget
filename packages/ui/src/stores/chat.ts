/**
 * 聊天状态 Pinia Store
 * Chat state Pinia store
 *
 * 管理会话 ID、消息列表、历史事件、Agent 状态和活动指示
 * Manages session ID, message list, history events, agent status, and activity indicator
 */
import { defineStore } from 'pinia'
import { ref } from 'vue'
import type { ChatMessage, HistoryEvent, ActivityPayload } from '@paget/shared'
import { AgentStatus } from '@paget/shared'

export const useChatStore = defineStore('chat', () => {
  // 当前会话 ID（每次新建会话时重新生成）/ Current session ID (regenerated on new session)
  const sessionId = ref(crypto.randomUUID())
  // 聊天消息列表 / Chat message list
  const messages = ref<ChatMessage[]>([])
  // Agent 历史事件列表 / Agent history event list
  const history = ref<HistoryEvent[]>([])
  // Agent 当前状态 / Agent current status
  const status = ref<AgentStatus>(AgentStatus.IDLE)
  // 当前活动指示（瞬态）/ Current activity indicator (transient)
  const activity = ref<ActivityPayload | null>(null)

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
