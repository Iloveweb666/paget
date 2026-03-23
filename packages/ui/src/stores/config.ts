/**
 * 全局配置 Pinia Store（带 localStorage 持久化）
 * Global config Pinia store with localStorage persistence
 */
import { defineStore } from 'pinia'
import { ref, watch } from 'vue'
import type { Locale } from '@/i18n'
import { setLocale } from '@/i18n'

// 配置接口定义 / Configuration interface definition
export interface PagetConfig {
  /** 选中的 LLM 配置 ID / Selected LLM config ID */
  llmConfigId: string
  /** 每个任务的最大步数 / Max steps per task */
  maxSteps: number
  /** UI 语言 / UI language */
  locale: Locale
  /** 是否显示模拟器遮罩 / Whether to show simulator mask */
  showMask: boolean
  /** 是否启用深色模式 / Whether to enable dark mode */
  darkMode: boolean
  /** 是否启用消息通知 / Whether to enable message notifications */
  notification: boolean
  /** 是否启用自动翻译 / Whether to enable auto-translation */
  autoTranslate: boolean
}

// localStorage 存储键 / localStorage storage key
const STORAGE_KEY = 'paget_config'

// 默认配置 / Default configuration
const defaultConfig: PagetConfig = {
  llmConfigId: '',
  maxSteps: 40,
  locale: 'zh-CN',
  showMask: true,
  darkMode: false,
  notification: false,
  autoTranslate: false,
}

/**
 * 规范化最大步数，限制在 [1, 200]
 * Normalize max steps to [1, 200]
 */
function normalizeMaxSteps(value: unknown): number {
  if (typeof value !== 'number' || !Number.isFinite(value)) return defaultConfig.maxSteps
  return Math.max(1, Math.min(200, Math.floor(value)))
}

/**
 * 合并并修正配置字段
 * Merge and sanitize config fields
 */
function sanitizeConfig(raw: Partial<PagetConfig>): PagetConfig {
  return {
    ...defaultConfig,
    ...raw,
    maxSteps: normalizeMaxSteps(raw.maxSteps),
  }
}

/**
 * 从 localStorage 加载配置
 * Load config from localStorage
 */
function loadConfig(): PagetConfig {
  try {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (!saved) return { ...defaultConfig }
    const parsed = JSON.parse(saved) as Partial<PagetConfig>
    return sanitizeConfig(parsed)
  } catch {
    return { ...defaultConfig }
  }
}

export const useConfigStore = defineStore('config', () => {
  // 加载已保存配置 / Load persisted configuration
  const config = ref<PagetConfig>(loadConfig())

  // 初始化语言 / Initialize locale
  setLocale(config.value.locale)

  // 配置变更时持久化 + 同步语言 / Persist config and sync locale on changes
  watch(
    config,
    (val) => {
      const sanitized = sanitizeConfig(val)
      // 如果输入值被修正，回写到状态 / Write back when incoming value needs sanitization
      if (sanitized.maxSteps !== val.maxSteps) {
        config.value = sanitized
        return
      }
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(sanitized))
      } catch {
        // localStorage 不可用或空间不足时静默降级 / Silently degrade when localStorage is unavailable or full
      }
      setLocale(sanitized.locale)
    },
    { deep: true, immediate: true },
  )

  /**
   * 重置为默认配置
   * Reset to default config
   */
  function resetConfig(): void {
    config.value = { ...defaultConfig }
  }

  return {
    config,
    resetConfig,
  }
})
