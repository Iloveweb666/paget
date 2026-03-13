<script setup lang="ts">
/**
 * 活动指示器组件（打字动画 + 状态提示）
 * Activity indicator component (typing dots animation + status hint)
 *
 * 当 Agent 正在思考/执行时显示三点跳动动画
 * Shows bouncing dots animation when agent is thinking/executing
 */
import { computed } from 'vue'
import type { ActivityPayload } from '@paget/shared'
import { t } from '@/i18n'

const props = defineProps<{
  activity: ActivityPayload | null
  isRunning: boolean
}>()

// 是否显示思考中指示器 / Whether to show thinking indicator
const showTyping = computed(() => {
  if (!props.activity && props.isRunning) return true
  if (!props.activity) return false
  return ['thinking', 'executing', 'retrying'].includes(props.activity.type)
})

// 根据活动类型计算显示文本 / Compute display text based on activity type
const message = computed(() => {
  if (!props.activity) return ''
  const { type, actionIndex, actionTotal, attempt, maxAttempts } = props.activity
  switch (type) {
    case 'thinking': return t('activity.thinking')
    case 'executing': return t('activity.executing', {
      current: String((actionIndex ?? 0) + 1), total: String(actionTotal ?? 1),
    })
    case 'executed': return t('activity.executed')
    case 'retrying': return t('activity.retrying', {
      attempt: String(attempt ?? 1), max: String(maxAttempts ?? 3),
    })
    case 'error': return props.activity.message || t('activity.error')
    default: return ''
  }
})
</script>

<template>
  <!-- 思考中动画（三点跳动）/ Typing animation (bouncing dots) -->
  <div v-if="showTyping" class="typing-indicator">
    <div class="typing-indicator__avatar">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M12 8V4H8" />
        <rect width="16" height="12" x="4" y="8" rx="2" />
        <path d="M2 14h2" /><path d="M20 14h2" />
        <path d="M15 13v2" /><path d="M9 13v2" />
      </svg>
    </div>
    <div class="typing-indicator__bubble">
      <span class="typing-indicator__dot typing-indicator__dot--1" />
      <span class="typing-indicator__dot typing-indicator__dot--2" />
      <span class="typing-indicator__dot typing-indicator__dot--3" />
    </div>
  </div>

  <!-- 非思考状态的活动提示 / Non-thinking activity hints -->
  <div v-else-if="activity && activity.type === 'error'" class="activity-hint activity-hint--error">
    {{ message }}
  </div>
  <div v-else-if="activity && activity.type === 'executed'" class="activity-hint activity-hint--done">
    {{ message }}
  </div>
</template>

<style scoped>
.typing-indicator {
  display: flex;
  gap: 8px;
  align-items: flex-start;
}

.typing-indicator__avatar {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: var(--paget-primary-light);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.typing-indicator__avatar svg {
  width: 18px;
  height: 18px;
  color: var(--paget-primary);
}

.typing-indicator__bubble {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 12px 16px;
  background: var(--paget-bg);
  border: 1px solid var(--paget-border);
  border-radius: 2px 12px 12px 12px;
}

.typing-indicator__dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: var(--paget-primary);
  animation: typing-bounce 1.4s infinite ease-in-out;
}

.typing-indicator__dot--1 {
  opacity: 0.8;
  animation-delay: 0s;
}

.typing-indicator__dot--2 {
  opacity: 0.5;
  animation-delay: 0.2s;
}

.typing-indicator__dot--3 {
  opacity: 0.3;
  animation-delay: 0.4s;
}

@keyframes typing-bounce {
  0%, 80%, 100% {
    transform: scale(1);
  }
  40% {
    transform: scale(1.3);
  }
}

/* 活动状态文本提示 / Activity status text hint */
.activity-hint {
  font-size: var(--paget-font-size-xs);
  padding: 4px 12px;
  text-align: center;
}

.activity-hint--error {
  color: var(--paget-error);
}

.activity-hint--done {
  color: var(--paget-success);
}
</style>
