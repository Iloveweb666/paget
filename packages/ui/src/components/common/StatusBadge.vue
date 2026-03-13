<script setup lang="ts">
/**
 * 状态徽章组件
 * Status badge component
 *
 * 根据 Agent 状态（idle/running/completed/error）显示对应颜色的徽章
 * Displays a color-coded badge based on agent status (idle/running/completed/error)
 */
import { computed } from 'vue'
import { AgentStatus } from '@paget/shared'
import { t } from '@/i18n'

// 组件属性：Agent 状态 / Props: agent status
const props = defineProps<{
  status: AgentStatus
}>()

// 根据状态计算 CSS 类名 / Compute CSS class name based on status
const statusClass = computed(() => `status-badge--${props.status}`)
// 根据状态获取国际化标签文本 / Get i18n label text based on status
const label = computed(() => t(`status.${props.status}`))
</script>

<template>
  <span class="status-badge" :class="statusClass">
    <span class="status-badge__dot" />
    {{ label }}
  </span>
</template>

<style scoped>
.status-badge {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: var(--paget-font-size-xs);
  font-weight: 500;
  padding: 2px 8px;
  border-radius: var(--paget-radius-full);
}

.status-badge__dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
}

.status-badge--idle {
  color: var(--paget-text-secondary);
  background: var(--paget-bg-tertiary);
}
.status-badge--idle .status-badge__dot {
  background: var(--paget-text-tertiary);
}

.status-badge--running {
  color: var(--paget-primary);
  background: var(--paget-primary-light);
}
.status-badge--running .status-badge__dot {
  background: var(--paget-primary);
  animation: pulse 1.5s infinite;
}

.status-badge--completed {
  color: var(--paget-success);
  background: #f0fdf4;
}
.status-badge--completed .status-badge__dot {
  background: var(--paget-success);
}

.status-badge--error {
  color: var(--paget-error);
  background: #fef2f2;
}
.status-badge--error .status-badge__dot {
  background: var(--paget-error);
}

@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.4; }
}
</style>
