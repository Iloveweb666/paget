<script setup lang="ts">
/**
 * 消息列表组件
 * Message list component
 *
 * 显示聊天气泡（AI/用户）、历史事件、思考中指示器
 * Displays chat bubbles (AI/user), history events, and thinking indicator
 */
import type { ChatMessage, HistoryEvent, ActivityPayload } from '@paget/shared'
import MessageItem from './MessageItem.vue'
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
</script>

<template>
  <div ref="listRef" class="message-list">
    <!-- 聊天消息气泡 / Chat message bubbles -->
    <MessageItem
      v-for="msg in messages"
      :key="msg.id"
      :message="msg"
      :is-streaming="msg.id === props.streamingMessageId"
    />

    <!-- Agent 历史事件（观察、错误）/ Agent history events (observations, errors) -->
    <template v-for="(event, i) in history" :key="'h-' + i">
      <div v-if="event.type === 'observation'" class="message-list__observation">
        {{ event.message }}
      </div>
      <div v-else-if="event.type === 'error'" class="message-list__error">
        {{ event.message }}
      </div>
    </template>

    <!-- 思考中/活动指示器 / Thinking/activity indicator -->
    <ActivityIndicator :activity="activity" :is-running="isRunning" />
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
