<script setup lang="ts">
/**
 * Agent 步骤卡片组件
 * Agent step card component
 *
 * 可折叠展示每一步的反思（evaluation/memory/next_goal）和批量操作详情
 * Collapsible display of each step's reflection (evaluation/memory/next_goal) and batch action details
 */
import { ref } from 'vue'
import type { AgentStepEvent } from '@paget/shared'
import { t } from '@/i18n'

// 组件属性：Agent 步骤事件数据 / Props: agent step event data
defineProps<{
  step: AgentStepEvent
}>()

// 卡片是否展开 / Whether the card is expanded
const expanded = ref(false)
</script>

<template>
  <div class="step-card">
    <div class="step-card__header" @click="expanded = !expanded">
      <span class="step-card__number">Step {{ step.stepNumber }}</span>
      <span class="step-card__goal">{{ step.reflection.next_goal }}</span>
      <span class="step-card__actions-count">
        {{ step.actions.length }} {{ step.actions.length > 1 ? 'actions' : 'action' }}
      </span>
      <span class="step-card__toggle">{{ expanded ? '▼' : '▶' }}</span>
    </div>

    <div v-if="expanded" class="step-card__body">
      <!-- Reflection -->
      <div class="step-card__section">
        <div class="step-card__section-title">{{ t('step.reflection') }}</div>
        <div class="step-card__reflection">
          <div class="step-card__field">
            <span class="step-card__label">Evaluation:</span>
            {{ step.reflection.evaluation_previous_goal }}
          </div>
          <div class="step-card__field">
            <span class="step-card__label">Memory:</span>
            {{ step.reflection.memory }}
          </div>
          <div class="step-card__field">
            <span class="step-card__label">Next Goal:</span>
            {{ step.reflection.next_goal }}
          </div>
        </div>
      </div>

      <!-- Actions (batch display) -->
      <div class="step-card__section">
        <div class="step-card__section-title">{{ t('step.actions') }}</div>
        <div
          v-for="(action, i) in step.actions"
          :key="i"
          class="step-card__action"
        >
          <span class="step-card__action-index">{{ i + 1 }}/{{ step.actions.length }}</span>
          <span class="step-card__action-tool">{{ action.tool }}</span>
          <span class="step-card__action-params">{{ JSON.stringify(action.params) }}</span>
          <span
            v-if="step.results[i]"
            class="step-card__action-status"
            :class="step.results[i].success ? 'step-card__action-status--ok' : 'step-card__action-status--fail'"
          >
            {{ step.results[i].success ? '✓' : '✗' }}
          </span>
        </div>
      </div>

      <!-- Token Usage -->
      <div v-if="step.usage" class="step-card__usage">
        Tokens: {{ step.usage.totalTokens }}
      </div>
    </div>
  </div>
</template>

<style scoped>
.step-card {
  border: 1px solid var(--paget-border);
  border-radius: var(--paget-radius-md);
  overflow: hidden;
  margin: 4px 0;
}

.step-card__header {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  background: var(--paget-bg-secondary);
  cursor: pointer;
  font-size: var(--paget-font-size-sm);
  user-select: none;
}

.step-card__header:hover {
  background: var(--paget-bg-tertiary);
}

.step-card__number {
  font-weight: 600;
  color: var(--paget-primary);
  flex-shrink: 0;
}

.step-card__goal {
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  color: var(--paget-text);
}

.step-card__actions-count {
  font-size: var(--paget-font-size-xs);
  color: var(--paget-text-tertiary);
  flex-shrink: 0;
}

.step-card__toggle {
  color: var(--paget-text-tertiary);
  font-size: 10px;
}

.step-card__body {
  padding: 12px;
  font-size: var(--paget-font-size-xs);
}

.step-card__section {
  margin-bottom: 12px;
}

.step-card__section:last-child {
  margin-bottom: 0;
}

.step-card__section-title {
  font-weight: 600;
  font-size: var(--paget-font-size-xs);
  color: var(--paget-text-secondary);
  margin-bottom: 4px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.step-card__reflection {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.step-card__field {
  color: var(--paget-text);
  line-height: 1.4;
}

.step-card__label {
  color: var(--paget-text-secondary);
  font-weight: 500;
}

.step-card__action {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 4px 8px;
  border-radius: var(--paget-radius-sm);
  background: var(--paget-bg-secondary);
  margin: 2px 0;
}

.step-card__action-index {
  color: var(--paget-text-tertiary);
  font-size: 11px;
  width: 28px;
  flex-shrink: 0;
}

.step-card__action-tool {
  font-weight: 600;
  color: var(--paget-primary);
  flex-shrink: 0;
}

.step-card__action-params {
  flex: 1;
  color: var(--paget-text-secondary);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.step-card__action-status--ok {
  color: var(--paget-success);
}

.step-card__action-status--fail {
  color: var(--paget-error);
}

.step-card__usage {
  font-size: 11px;
  color: var(--paget-text-tertiary);
  text-align: right;
}
</style>
