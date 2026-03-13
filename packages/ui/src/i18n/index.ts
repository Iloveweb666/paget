/**
 * 国际化（i18n）模块
 * Internationalization (i18n) module
 *
 * 提供多语言翻译功能，支持中文和英文，支持 {{variable}} 插值
 * Provides multi-language translation with Chinese and English support, with {{variable}} interpolation
 */
import zhCN from './zh-CN'
import enUS from './en-US'

// 语言类型定义 / Locale type definition
export type Locale = 'zh-CN' | 'en-US'

// 语言包映射 / Locale message map
const locales = {
  'zh-CN': zhCN,
  'en-US': enUS,
} as const

// 当前语言（默认中文）/ Current locale (default Chinese)
let currentLocale: Locale = 'zh-CN'

/**
 * 设置当前语言 / Set the current locale
 */
export function setLocale(locale: Locale): void {
  currentLocale = locale
}

/**
 * 获取当前语言 / Get the current locale
 */
export function getLocale(): Locale {
  return currentLocale
}

/**
 * 根据点分隔的键路径获取翻译字符串，支持 {{variable}} 插值
 * Get a translated string by dot-separated key path, supports {{variable}} interpolation
 */
export function t(key: string, vars?: Record<string, string | number>): string {
  // 按点号拆分键路径 / Split key path by dots
  const keys = key.split('.')
  let result: unknown = locales[currentLocale]

  // 逐层查找翻译值 / Traverse nested locale object
  for (const k of keys) {
    if (result && typeof result === 'object') {
      result = (result as Record<string, unknown>)[k]
    } else {
      return key
    }
  }

  // 未找到翻译或类型不匹配时返回原始键 / Return raw key if translation not found or type mismatch
  if (typeof result !== 'string') return key

  // 替换插值变量 / Replace interpolation variables
  if (vars) {
    return result.replace(/\{\{(\w+)\}\}/g, (_, name) => String(vars[name] ?? ''))
  }

  return result
}
