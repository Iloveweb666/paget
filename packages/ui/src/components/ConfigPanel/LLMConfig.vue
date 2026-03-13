<script setup lang="ts">
/**
 * LLM 模型配置组件
 * LLM model configuration component
 *
 * 提供 LLM 模型选择、API 地址/密钥/模型名称编辑和保存功能
 * Provides LLM model selection, API URL/key/model name editing, and save functionality
 */
import { ref } from 'vue'
import type { LLMConfig } from '@paget/shared'
import { t } from '@/i18n'

// 组件属性：配置列表和当前选中 ID / Props: config list and currently selected ID
const props = defineProps<{
  configs: LLMConfig[]
  selectedId: string
}>()

// 事件：选择配置、保存配置 / Events: select config, save config
const emit = defineEmits<{
  select: [id: string]
  save: [config: Partial<LLMConfig>]
}>()

// 正在编辑的配置表单数据 / Config form data being edited
const editingConfig = ref<Partial<LLMConfig>>({
  name: '',
  baseUrl: '',
  apiKey: '',
  model: '',
  temperature: 0.7,
  maxTokens: 4096,
})

/**
 * 选择一个 LLM 配置并加载其数据到编辑表单
 * Select an LLM config and load its data into the editing form
 */
function selectConfig(id: string) {
  emit('select', id)
  const config = props.configs.find((c) => c.id === id)
  if (config) {
    editingConfig.value = { ...config }
  }
}

/**
 * 保存当前编辑的配置 / Save the currently edited config
 */
function handleSave() {
  emit('save', editingConfig.value)
}
</script>

<template>
  <div class="llm-config">
    <h4>{{ t('config.llmSection') }}</h4>

    <div class="llm-config__select">
      <label>{{ t('config.model') }}</label>
      <select :value="selectedId" @change="selectConfig(($event.target as HTMLSelectElement).value)">
        <option v-for="c in configs" :key="c.id" :value="c.id">{{ c.name }}</option>
      </select>
    </div>

    <div class="llm-config__fields">
      <div class="llm-config__field">
        <label>{{ t('config.baseUrl') }}</label>
        <input v-model="editingConfig.baseUrl" type="text" placeholder="https://api.openai.com/v1" />
      </div>
      <div class="llm-config__field">
        <label>{{ t('config.apiKey') }}</label>
        <input v-model="editingConfig.apiKey" type="password" placeholder="sk-..." />
      </div>
      <div class="llm-config__field">
        <label>{{ t('config.model') }}</label>
        <input v-model="editingConfig.model" type="text" placeholder="gpt-4o" />
      </div>
    </div>

    <button class="llm-config__save" @click="handleSave">{{ t('config.save') }}</button>
  </div>
</template>

<style scoped>
.llm-config {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.llm-config h4 {
  font-size: var(--paget-font-size-md);
  font-weight: 600;
}

.llm-config__fields {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.llm-config__field,
.llm-config__select {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.llm-config__field label,
.llm-config__select label {
  font-size: var(--paget-font-size-xs);
  color: var(--paget-text-secondary);
  font-weight: 500;
}

.llm-config__field input,
.llm-config__select select {
  padding: 6px 10px;
  border: 1px solid var(--paget-border);
  border-radius: var(--paget-radius-sm);
  font-size: var(--paget-font-size-sm);
  outline: none;
}

.llm-config__field input:focus,
.llm-config__select select:focus {
  border-color: var(--paget-primary);
  box-shadow: 0 0 0 2px var(--paget-primary-light);
}

.llm-config__save {
  align-self: flex-end;
  padding: 6px 16px;
  background: var(--paget-primary);
  color: var(--paget-text-inverse);
  border: none;
  border-radius: var(--paget-radius-sm);
  cursor: pointer;
  font-size: var(--paget-font-size-sm);
}

.llm-config__save:hover {
  background: var(--paget-primary-hover);
}
</style>
