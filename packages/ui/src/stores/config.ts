/**
 * 配置状态 Pinia Store
 * Config state Pinia store
 *
 * 管理 LLM 配置列表、选中的模型 ID 和最大步数
 * Manages LLM config list, selected model ID, and max steps
 */
import { defineStore } from 'pinia'
import { ref, watch } from 'vue'
import type { LLMConfig } from '@paget/shared'

export const useConfigStore = defineStore('config', () => {
  // LLM 配置列表 / LLM configuration list
  const llmConfigs = ref<LLMConfig[]>([])
  // 当前选中的 LLM 配置 ID / Currently selected LLM config ID
  const selectedLLMId = ref('')
  // 每个任务的最大步数 / Max steps per task
  const maxSteps = ref(40)

  /**
   * 从服务端加载 LLM 配置列表 / Load LLM configs from server
   */
  async function loadLLMConfigs() {
    try {
      const res = await fetch('/api/llm')
      llmConfigs.value = await res.json()
      // 如果未选择配置，则自动选择默认配置或第一个 / Auto-select default or first config if none selected
      if (!selectedLLMId.value && llmConfigs.value.length > 0) {
        const defaultConfig = llmConfigs.value.find((c) => c.isDefault)
        selectedLLMId.value = defaultConfig?.id || llmConfigs.value[0].id
      }
    } catch (err) {
      console.error('Failed to load LLM configs:', err)
    }
  }

  return { llmConfigs, selectedLLMId, maxSteps, loadLLMConfigs }
})
