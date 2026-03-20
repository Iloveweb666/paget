/**
 * Bookmarklet 入口文件 — IIFE 自执行脚本
 * Bookmarklet entry file — IIFE self-executing script
 *
 * 通过书签栏执行时，将 Paget UI 注入到当前页面
 * When executed via bookmarklet, injects Paget UI into the current page
 */
import { createApp, h } from 'vue'
import { createPinia } from 'pinia'
import BookmarkletApp from './BookmarkletApp.vue'
import variablesCSS from './styles/variables.css?inline'

// 声明全局变量 / Declare global variables
declare global {
  interface Window {
    Paget: typeof Paget
    paget: Paget | null
    __PAGET_DEFAULT_SERVER__: string
  }
  const __PAGET_DEFAULT_SERVER__: string
}

console.log('[Paget] Script loaded')

/**
 * Paget 配置接口 / Paget configuration interface
 */
interface PagetConfig {
  /** WebSocket 服务端地址 / WebSocket server URL */
  serverUrl: string
}

/**
 * Paget 类 — 管理 UI 注入和生命周期
 * Paget class — manages UI injection and lifecycle
 */
class Paget {
  private app: ReturnType<typeof createApp> | null = null
  private container: HTMLElement | null = null
  private config: PagetConfig

  constructor(config: Partial<PagetConfig> = {}) {
    console.log('[Paget] Constructor called with config:', config)
    this.config = {
      serverUrl: config.serverUrl || __PAGET_DEFAULT_SERVER__,
    }
    this.init()
  }

  /**
   * 初始化 Paget UI / Initialize Paget UI
   */
  private init() {
    try {
      console.log('[Paget] Initializing...')

      // 清理已存在的实例（防止重复注入）/ Clean up existing instance (prevent duplicate injection)
      if (window.paget) {
        console.log('[Paget] Cleaning up existing instance...')
        window.paget.dispose()
      }

      // 创建挂载容器 / Create mount container
      this.container = document.createElement('div')
      this.container.id = 'paget-root'
      document.body.appendChild(this.container)
      console.log('[Paget] Container created')

      // 注入全局 CSS 变量到 document.head / Inject global CSS variables to document.head
      const globalStyle = document.createElement('style')
      globalStyle.id = 'paget-global-styles'
      globalStyle.textContent = variablesCSS
      // 移除旧样式（如果存在）/ Remove old style if exists
      document.getElementById('paget-global-styles')?.remove()
      document.head.appendChild(globalStyle)
      console.log('[Paget] CSS variables injected')

      // 创建 Vue 挂载点 / Create Vue mount point
      const appRoot = document.createElement('div')
      appRoot.className = 'paget-app'
      appRoot.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        z-index: 2147483647;
        font-family: var(--paget-font-family);
      `
      this.container.appendChild(appRoot)

      // 创建 Pinia 实例 / Create Pinia instance
      const pinia = createPinia()
      console.log('[Paget] Pinia created')

      // 创建并挂载 Vue 应用 / Create and mount Vue app
      this.app = createApp({
        render: () => h(BookmarkletApp),
      })
      this.app.use(pinia)

      // 提供配置到 Vue 上下文 / Provide config to Vue context
      this.app.provide('pagetConfig', this.config)

      this.app.mount(appRoot)
      console.log('[Paget] Vue app mounted')

      console.log('[Paget] UI injected successfully')
      console.log('[Paget] Server:', this.config.serverUrl)
    } catch (error) {
      console.error('[Paget] Initialization failed:', error)
    }
  }

  /**
   * 显示 Paget UI / Show Paget UI
   */
  show() {
    if (this.container) {
      this.container.style.display = 'block'
    }
  }

  /**
   * 隐藏 Paget UI / Hide Paget UI
   */
  hide() {
    if (this.container) {
      this.container.style.display = 'none'
    }
  }

  /**
   * 销毁 Paget 实例 / Dispose Paget instance
   */
  dispose() {
    this.app?.unmount()
    this.container?.remove()
    document.getElementById('paget-global-styles')?.remove()
    this.app = null
    this.container = null
    console.log('[Paget] Disposed')
  }

  /**
   * 获取配置 / Get configuration
   */
  getConfig(): PagetConfig {
    return { ...this.config }
  }
}

// 暴露到全局对象 / Expose to global object
window.Paget = Paget

/**
 * 自动初始化（从脚本 URL 参数读取配置）
 * Auto-initialize (read config from script URL params)
 */
;(() => {
  console.log('[Paget] Auto-init starting...')

  let serverUrl = __PAGET_DEFAULT_SERVER__
  console.log('[Paget] Default server:', serverUrl)

  // 尝试从脚本标签获取参数 / Try to get params from script tag
  // 查找最后一个加载的 paget 脚本 / Find the last loaded paget script
  const scripts = document.querySelectorAll('script[src*="paget"]')
  const script = scripts[scripts.length - 1] as HTMLScriptElement | null

  if (script?.src) {
    try {
      const url = new URL(script.src)
      console.log('[Paget] Script URL:', script.src)
      // 支持 ?server=xxx 参数 / Support ?server=xxx param
      const serverParam = url.searchParams.get('server')
      if (serverParam) {
        serverUrl = serverParam
        console.log('[Paget] Server from URL param:', serverUrl)
      }
    } catch (e) {
      console.warn('[Paget] Failed to parse script URL:', e)
    }
  } else {
    console.log('[Paget] No script element found, using default server')
  }

  // 创建并显示 Paget / Create and show Paget
  try {
    window.paget = new Paget({ serverUrl })
    window.paget.show()
    console.log('[Paget] Auto-init completed')
  } catch (error) {
    console.error('[Paget] Auto-init failed:', error)
  }
})()

// 导出类型供外部使用 / Export types for external use
export { Paget, type PagetConfig }
