<script setup lang="ts">
/**
 * Agent 参数配置组件
 * Agent parameter configuration component
 *
 * 提供最大步数和 UI 语言的配置选项
 * Provides max steps and UI language configuration options
 */
import { t } from '@/i18n'
import type { PagetConfig } from '@/composables'

// 双向绑定的用户配置对象 / Two-way bound user configuration object
const config = defineModel<PagetConfig>({ required: true })
</script>

<template>
  <div class="agent-config">
    <h4>{{ t('config.agentSection') }}</h4>

    <div class="agent-config__field">
      <label>{{ t('config.maxSteps') }}</label>
      <input v-model.number="config.maxSteps" type="number" min="1" max="100" />
    </div>

    <div class="agent-config__field">
      <label>{{ t('config.language') }}</label>
      <select v-model="config.locale">
        <option value="zh-CN">中文</option>
        <option value="en-US">English</option>
      </select>
    </div>
  </div>
</template>

<style scoped>
.agent-config {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.agent-config h4 {
  font-size: var(--paget-font-size-md);
  font-weight: 600;
}

.agent-config__field {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.agent-config__field label {
  font-size: var(--paget-font-size-xs);
  color: var(--paget-text-secondary);
  font-weight: 500;
}

.agent-config__field input,
.agent-config__field select {
  padding: 6px 10px;
  border: 1px solid var(--paget-border);
  border-radius: var(--paget-radius-sm);
  font-size: var(--paget-font-size-sm);
  outline: none;
}

.agent-config__field input:focus,
.agent-config__field select:focus {
  border-color: var(--paget-primary);
  box-shadow: 0 0 0 2px var(--paget-primary-light);
}
</style>
