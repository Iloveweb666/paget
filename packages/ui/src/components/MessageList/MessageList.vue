<script setup lang="ts">
/**
 * 消息列表组件
 * Message list component
 *
 * 统一时间线：聊天气泡 + 步骤面板 + 思考指示器
 * Unified timeline: chat bubbles + step panels + thinking indicator
 */
import { computed } from 'vue'
import type { ChatMessage, HistoryEvent, ActivityPayload } from '@paget/shared'
import MessageItem from './MessageItem.vue'
import StepPanel from './StepPanel.vue'
import ActivityIndicator from './ActivityIndicator.vue'

const props = defineProps<{
  messages: ChatMessage[]
  history: HistoryEvent[]
  activity: ActivityPayload | null
  /** Agent 是否正在运行（控制思考指示器）/ Whether agent is running */
  isRunning: boolean
  /** 当前正在流式输出的消息 ID / Currently streaming message ID */
  streamingMessageId?: string | null
}>()

// 列表 DOM 引用（用于父组件控制滚动）/ List DOM ref (for parent scroll control)
const listRef = defineModel<HTMLElement | null>('listRef')

// 按 taskRunId 将历史事件分组 / Group history events by taskRunId
const historyByTaskRunId = computed(() => {
  const grouped = new Map<string, HistoryEvent[]>()
  const orphans: HistoryEvent[] = []
  for (const event of props.history) {
    const id = (event as HistoryEvent & { taskRunId?: string }).taskRunId
    if (id) {
      if (!grouped.has(id)) grouped.set(id, [])
      grouped.get(id)!.push(event)
    } else {
      orphans.push(event)
    }
  }
  return { grouped, orphans }
})

// 当前正在运行的 taskRunId（取最后一条用户消息的 taskRunId） / Currently running taskRunId
const activeTaskRunId = computed(() => {
  if (!props.isRunning) return null
  for (let i = props.messages.length - 1; i >= 0; i--) {
    if (props.messages[i].role === 'user' && props.messages[i].taskRunId) {
      return props.messages[i].taskRunId
    }
  }
  return null
})
</script>

<template>
  <div ref="listRef" class="message-list">
    <!-- 统一时间线：遍历消息，用户消息后跟步骤面板 / Unified timeline: iterate messages, step panel after user messages -->
    <template v-for="msg in messages" :key="msg.id">
      <MessageItem
        :message="msg"
        :is-streaming="msg.id === props.streamingMessageId"
      />

      <!-- 用户消息且有 taskRunId → 渲染步骤面板 / User message with taskRunId → render step panel -->
      <StepPanel
        v-if="msg.role === 'user' && msg.taskRunId && (historyByTaskRunId.grouped.get(msg.taskRunId)?.length ?? 0) > 0"
        :events="historyByTaskRunId.grouped.get(msg.taskRunId)!"
        :running="activeTaskRunId === msg.taskRunId"
      />

      <!-- Agent 正在运行且当前用户消息是活跃任务但还没有步骤 → 显示活动指示器 / Running with active task but no steps yet → show activity -->
      <ActivityIndicator
        v-if="msg.role === 'user' && msg.taskRunId && msg.taskRunId === activeTaskRunId && (historyByTaskRunId.grouped.get(msg.taskRunId)?.length ?? 0) === 0"
        :activity="activity"
        :is-running="isRunning"
      />
    </template>

    <!-- 有步骤时把活动指示器放在最后一个活跃任务的步骤面板后 / Activity indicator after the last active task's step panel -->
    <ActivityIndicator
      v-if="activeTaskRunId && (historyByTaskRunId.grouped.get(activeTaskRunId)?.length ?? 0) > 0"
      :activity="activity"
      :is-running="isRunning"
    />

    <!-- 向后兼容：无 taskRunId 的旧历史事件 / Backward compatible: orphan history events without taskRunId -->
    <template v-for="(event, i) in historyByTaskRunId.orphans" :key="'orphan-' + i">
      <div v-if="event.type === 'observation'" class="message-list__observation">
        {{ event.message }}
      </div>
      <div v-else-if="event.type === 'error'" class="message-list__error">
        {{ event.message }}
      </div>
    </template>

    <!-- 无活跃 taskRunId 时的活动指示器（向后兼容）/ Activity indicator without taskRunId (backward compatible) -->
    <ActivityIndicator
      v-if="!activeTaskRunId"
      :activity="activity"
      :is-running="isRunning"
    />
  </div>
</template>

<style scoped>
.message-list {
  flex: 1;
  overflow-y: auto;
  background: var(--paget-bg-secondary);
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

/* 自定义滚动条 / Custom scrollbar */
.message-list::-webkit-scrollbar {
  width: 4px;
}

.message-list::-webkit-scrollbar-track {
  background: transparent;
}

.message-list::-webkit-scrollbar-thumb {
  background: var(--paget-border);
  border-radius: 2px;
}

/* 防止所有子项在 flex 滚动容器中被压缩 / Prevent flex children from being squished in scroll container */
.message-list > * {
  flex-shrink: 0;
}

.message-list__observation {
  padding: 4px 16px;
  font-size: var(--paget-font-size-xs);
  color: var(--paget-text-tertiary);
  text-align: center;
}

.message-list__error {
  padding: 6px 16px;
  margin: 0 12px;
  font-size: var(--paget-font-size-xs);
  color: var(--paget-error);
  background: var(--paget-error-light);
  border-radius: var(--paget-radius-sm);
}
</style>
