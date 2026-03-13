<script setup lang="ts">
/**
 * 单条消息项组件
 * Single message item component
 *
 * 根据角色（user/assistant/system）渲染不同样式的消息气泡
 * Renders different bubble styles based on role (user/assistant/system)
 */
import { computed } from 'vue'
import type { ChatMessage } from '@paget/shared'
import MarkdownRenderer from '../common/MarkdownRenderer.vue'

const props = defineProps<{
  message: ChatMessage
}>()

// 格式化时间 / Format timestamp
const timeStr = computed(() => {
  if (!props.message.timestamp) return ''
  const d = new Date(props.message.timestamp)
  return d.getHours().toString().padStart(2, '0') + ':' + d.getMinutes().toString().padStart(2, '0')
})
</script>

<template>
  <!-- 用户消息（右对齐）/ User message (right-aligned) -->
  <div v-if="message.role === 'user'" class="msg msg--user">
    <div class="msg__bubble msg__bubble--user">
      <div class="msg__text">{{ message.content }}</div>
      <div v-if="timeStr" class="msg__time msg__time--user">{{ timeStr }}</div>
    </div>
  </div>

  <!-- AI 助手消息（左对齐 + 头像）/ AI assistant message (left-aligned + avatar) -->
  <div v-else-if="message.role === 'assistant'" class="msg msg--ai">
    <div class="msg__avatar">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M12 8V4H8" />
        <rect width="16" height="12" x="4" y="8" rx="2" />
        <path d="M2 14h2" /><path d="M20 14h2" />
        <path d="M15 13v2" /><path d="M9 13v2" />
      </svg>
    </div>
    <div class="msg__bubble msg__bubble--ai">
      <div class="msg__content">
        <MarkdownRenderer :content="message.content" />
      </div>
      <div v-if="timeStr" class="msg__time">{{ timeStr }}</div>
    </div>
  </div>

  <!-- 系统消息 / System message -->
  <div v-else class="msg msg--system">
    <div class="msg__system-text">{{ message.content }}</div>
  </div>
</template>

<style scoped>
.msg {
  display: flex;
  gap: 8px;
  width: 100%;
}

.msg--user {
  justify-content: flex-end;
}

.msg--ai {
  justify-content: flex-start;
}

.msg--system {
  justify-content: center;
}

/* 头像 / Avatar */
.msg__avatar {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: var(--paget-primary-light);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.msg__avatar svg {
  width: 18px;
  height: 18px;
  color: var(--paget-primary);
}

/* 气泡 / Bubble */
.msg__bubble {
  max-width: 70%;
  padding: 10px 14px;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.msg__bubble--user {
  background: var(--paget-primary);
  border-radius: 12px 2px 12px 12px;
}

.msg__bubble--ai {
  background: var(--paget-bg);
  border: 1px solid var(--paget-border);
  border-radius: 2px 12px 12px 12px;
}

.msg__text {
  font-size: var(--paget-font-size-md);
  color: var(--paget-text-inverse);
  line-height: 1.5;
  word-break: break-word;
}

.msg__content {
  font-size: var(--paget-font-size-md);
  color: var(--paget-text);
  line-height: 1.5;
  word-break: break-word;
}

.msg__content :deep(p) {
  margin: 0;
}

.msg__content :deep(p + p) {
  margin-top: 8px;
}

.msg__time {
  font-size: var(--paget-font-size-xs);
  color: var(--paget-text-tertiary);
}

.msg__time--user {
  color: var(--paget-text-inverse);
  opacity: 0.6;
}

/* 系统消息 / System message */
.msg__system-text {
  font-size: var(--paget-font-size-xs);
  color: var(--paget-text-tertiary);
  background: var(--paget-bg-tertiary);
  padding: 4px 12px;
  border-radius: var(--paget-radius-full);
}
</style>
