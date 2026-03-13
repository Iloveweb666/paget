/**
 * 用户配置管理组合式函数（带 localStorage 持久化）
 * User configuration composable with localStorage persistence
 */
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
  /** 是否显示模拟器遮罩 / Whether to show the simulator mask */
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

export function useConfig() {
  // 加载已保存的配置或使用默认值 / Load saved config or use defaults
  const config = ref<PagetConfig>(loadConfig())

  // 同步语言设置 / Sync locale setting
  setLocale(config.value.locale)

  // 配置变更时持久化到 localStorage / Persist to localStorage on change
  watch(config, (val) => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(val))
    setLocale(val.locale)
  }, { deep: true })

  /**
   * 从 localStorage 加载配置 / Load config from localStorage
   */
  function loadConfig(): PagetConfig {
    try {
      const saved = localStorage.getItem(STORAGE_KEY)
      return saved ? { ...defaultConfig, ...JSON.parse(saved) } : { ...defaultConfig }
    } catch {
      return { ...defaultConfig }
    }
  }

  /**
   * 重置为默认配置 / Reset to default configuration
   */
  function resetConfig() {
    config.value = { ...defaultConfig }
  }

  return {
    config,
    resetConfig,
  }
}
