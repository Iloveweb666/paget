/**
 * Agent 事件流状态管理组合式函数
 * Agent event stream state management composable
 *
 * 映射 page-agent 的三种事件类别：
 * Maps to page-agent's three event categories:
 * - statuschange（持久化状态）/ statuschange (persistent state)
 * - historychange（持久化事件，用于 LLM 上下文）/ historychange (persistent events for LLM context)
 * - activity（瞬态 UI 反馈）/ activity (transient UI feedback)
 */
import { ref, computed } from 'vue'
import { AgentStatus } from '@paget/shared'
import type {
  StatusChangePayload,
  HistoryEvent,
  ActivityPayload,
} from '@paget/shared'

export function useAgent() {
  // Agent 当前状态 / Agent current status
  const status = ref<AgentStatus>(AgentStatus.IDLE)
  // 历史事件列表（步骤、观察、错误）/ History event list (steps, observations, errors)
  const history = ref<HistoryEvent[]>([])
  // 当前活动指示（瞬态）/ Current activity indicator (transient)
  const currentActivity = ref<ActivityPayload | null>(null)
  // 当前任务 ID / Current task ID
  const taskId = ref<string | null>(null)

  // 是否正在运行 / Whether the agent is running
  const isRunning = computed(() => status.value === AgentStatus.RUNNING)
  // 是否处于空闲状态 / Whether the agent is idle
  const isIdle = computed(() => status.value === AgentStatus.IDLE)

  /**
   * 处理来自服务端的状态变更事件 / Handle status change event from server
   */
  function handleStatusChange(payload: StatusChangePayload) {
    status.value = payload.status
    taskId.value = payload.taskId || null

    // Agent 变为空闲或已完成时清除活动指示 / Clear activity when agent becomes idle or completed
    if (payload.status === AgentStatus.IDLE || payload.status === AgentStatus.COMPLETED) {
      currentActivity.value = null
    }
  }

  /**
   * 处理来自服务端的历史事件 / Handle history event from server
   */
  function handleHistoryChange(event: HistoryEvent) {
    history.value.push(event)
  }

  /**
   * 处理来自服务端的瞬态活动事件 / Handle transient activity from server
   */
  function handleActivity(payload: ActivityPayload) {
    currentActivity.value = payload

    // "executed" 类型的活动在短暂延迟后自动清除 / Auto-clear "executed" activity after a short delay
    if (payload.type === 'executed') {
      setTimeout(() => {
        if (currentActivity.value?.type === 'executed') {
          currentActivity.value = null
        }
      }, 1500)
    }
  }

  /**
   * 重置所有状态（用于新会话）/ Clear all state for a new session
   */
  function reset() {
    status.value = AgentStatus.IDLE
    history.value = []
    currentActivity.value = null
    taskId.value = null
  }

  return {
    status,
    history,
    currentActivity,
    taskId,
    isRunning,
    isIdle,
    handleStatusChange,
    handleHistoryChange,
    handleActivity,
    reset,
  }
}
