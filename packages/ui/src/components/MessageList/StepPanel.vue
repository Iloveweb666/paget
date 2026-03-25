<script setup lang="ts">
/**
 * 步骤面板组件 — 可折叠展示某次任务运行的所有步骤
 * Step panel component — collapsible display of all steps for a task run
 *
 * 收起时显示步骤计数摘要，展开后渲染每个 StepCard，
 * 若检测到 done 工具则在底部显示任务总结卡片
 * Shows step count summary when collapsed, renders each StepCard when expanded,
 * and displays a task summary card at the bottom if a done tool is detected
 */
import { ref, computed } from 'vue'
import type { HistoryEvent, AgentStepEvent } from '@paget/shared'
import { t } from '@/i18n'
import StepCard from './StepCard.vue'

const props = defineProps<{
  // 该次任务运行的所有历史事件 / All history events for this task run
  events: HistoryEvent[]
  // 任务是否仍在运行 / Whether the task is still running
  running: boolean
}>()

// 面板是否展开 / Whether the panel is expanded
const expanded = ref(false)

// 只保留 step 类型的事件 / Filter to step events only
const steps = computed(() =>
  props.events.filter((e): e is AgentStepEvent => e.type === 'step')
)

// 检测最后一步是否有 done 工具 / Detect if the last step contains a done tool
const doneStep = computed(() => {
  const last = steps.value[steps.value.length - 1]
  if (!last) return null
  const doneAction = last.actions.find(a => a.tool === 'done')
  if (!doneAction) return null
  return {
    message: (doneAction.params as Record<string, unknown>).message as string || '',
    step: last,
  }
})

// 从历史步骤中提取 input 操作 / Extract input actions from history steps
const formInputs = computed(() => {
  const inputs: Array<{ index: number; text: string }> = []
  for (const step of steps.value) {
    for (const action of step.actions) {
      if (action.tool === 'input' && action.params) {
        const params = action.params as Record<string, unknown>
        inputs.push({
          index: params.index as number,
          text: String(params.text ?? ''),
        })
      }
    }
  }
  return inputs
})

// 面板标题文本 / Panel header text
const headerText = computed(() => {
  const count = steps.value.length
  if (props.running) {
    return t('stepPanel.running', { count })
  }
  return t('stepPanel.completed', { count })
})
</script>

<template>
  <div class="step-panel">
    <div class="step-panel__header" @click="expanded = !expanded">
      <span class="step-panel__toggle">{{ expanded ? '▼' : '▶' }}</span>
      <span class="step-panel__title">{{ headerText }}</span>
      <span v-if="running" class="step-panel__running-dot" />
    </div>

    <div v-if="expanded" class="step-panel__body">
      <!-- 逐步渲染 StepCard / Render each StepCard -->
      <StepCard v-for="step in steps" :key="step.stepNumber" :step="step" />

      <!-- 错误和观察事件 / Error and observation events -->
      <template v-for="(event, i) in events" :key="'ev-' + i">
        <div v-if="event.type === 'observation'" class="step-panel__observation">
          {{ event.message }}
        </div>
        <div v-else-if="event.type === 'error'" class="step-panel__error">
          {{ event.message }}
        </div>
      </template>

      <!-- Done 总结卡片 / Done summary card -->
      <div v-if="doneStep" class="step-panel__done">
        <div class="step-panel__done-title">{{ t('stepPanel.taskSummary') }}</div>
        <div class="step-panel__done-message">{{ doneStep.message }}</div>
        <div v-if="formInputs.length > 0" class="step-panel__done-inputs">
          <div class="step-panel__done-inputs-title">{{ t('stepPanel.formInputs') }}</div>
          <div
            v-for="(input, i) in formInputs"
            :key="i"
            class="step-panel__done-input"
          >
            <span class="step-panel__done-input-label">[{{ input.index }}]:</span>
            <span class="step-panel__done-input-value">{{ input.text }}</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.step-panel {
  margin-left: 40px;
  border: 1px solid var(--paget-border);
  border-radius: var(--paget-radius-md);
  overflow: hidden;
  flex-shrink: 0;
}

.step-panel__header {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  background: var(--paget-bg-secondary);
  cursor: pointer;
  font-size: var(--paget-font-size-sm);
  color: var(--paget-text-secondary);
  user-select: none;
}

.step-panel__header:hover {
  background: var(--paget-bg-tertiary);
}

.step-panel__toggle {
  font-size: 10px;
  color: var(--paget-text-tertiary);
  flex-shrink: 0;
}

.step-panel__title {
  flex: 1;
}

.step-panel__running-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: var(--paget-primary);
  animation: step-panel-pulse 1.2s ease-in-out infinite;
  flex-shrink: 0;
}

@keyframes step-panel-pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.3; }
}

.step-panel__body {
  padding: 8px;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.step-panel__observation {
  padding: 4px 12px;
  font-size: var(--paget-font-size-xs);
  color: var(--paget-text-tertiary);
}

.step-panel__error {
  padding: 4px 12px;
  font-size: var(--paget-font-size-xs);
  color: var(--paget-error);
  background: var(--paget-error-light);
  border-radius: var(--paget-radius-sm);
}

.step-panel__done {
  margin-top: 4px;
  padding: 10px 12px;
  background: var(--paget-bg-secondary);
  border-radius: var(--paget-radius-md);
  border: 1px solid var(--paget-border);
}

.step-panel__done-title {
  font-weight: 600;
  font-size: var(--paget-font-size-sm);
  color: var(--paget-success);
  margin-bottom: 6px;
}

.step-panel__done-message {
  font-size: var(--paget-font-size-sm);
  color: var(--paget-text);
  line-height: 1.5;
  margin-bottom: 8px;
}

.step-panel__done-inputs {
  border-top: 1px solid var(--paget-border);
  padding-top: 8px;
}

.step-panel__done-inputs-title {
  font-size: var(--paget-font-size-xs);
  font-weight: 600;
  color: var(--paget-text-secondary);
  margin-bottom: 4px;
}

.step-panel__done-input {
  font-size: var(--paget-font-size-xs);
  color: var(--paget-text);
  padding: 2px 0;
}

.step-panel__done-input-label {
  color: var(--paget-text-tertiary);
  margin-right: 4px;
  font-family: monospace;
}

.step-panel__done-input-value {
  color: var(--paget-text);
}
</style>
