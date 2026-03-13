import type { AgentAction, ActionResult, BatchResult } from '@paget/shared'
import { getFlatTree, flatTreeToString, getSelectorMap } from './dom'
import type { FlatDomNode, DomExtractionConfig } from './dom'
import { executeAction, executeBatch } from './actions'
import { SimulatorMask } from './mask/SimulatorMask'
import { isVueApp, triggerVueInput, triggerVueCheck, triggerVueSelect } from './patches/vue'

/**
 * 浏览器状态快照，供 LLM 消费
 * Browser state snapshot for LLM consumption
 */
export interface BrowserState {
  /** 当前页面 URL / Current page URL */
  url: string
  /** 页面标题 / Page title */
  title: string
  /** 页面信息 + 滚动位置提示 / Page info + scroll position hints */
  header: string
  /** 交互元素的简化 HTML / Simplified HTML of interactive elements */
  content: string
  /** 视口下方内容指示器 / Content below viewport indicator */
  footer: string
}

/**
 * PageController 配置
 * PageController configuration
 */
export interface PageControllerConfig {
  /** 要观察的根元素（默认：document.body）/ Root element to observe (default: document.body) */
  root?: Element
  /** DOM 提取设置 / DOM extraction settings */
  domConfig?: DomExtractionConfig
  /** 自动化期间是否显示模拟器遮罩层 / Whether to show the simulator mask during automation */
  showMask?: boolean
}

/**
 * PageController 管理 DOM 状态提取和元素交互。
 * PageController manages DOM state extraction and element interactions.
 *
 * 职责：
 * Responsibilities:
 * - 提取和索引交互式 DOM 元素（flatTree）/ Extract and index interactive DOM elements (flatTree)
 * - 为 LLM 生成简化 HTML（simplifiedHTML）/ Generate simplified HTML for LLM (simplifiedHTML)
 * - 将元素索引映射到实际 DOM 元素（selectorMap）/ Map element indices to actual DOM elements (selectorMap)
 * - 在页面上执行操作和批量操作 / Execute actions and batch actions on the page
 * - 显示/隐藏视觉反馈遮罩层 / Show/hide visual feedback mask
 */
export class PageController {
  // 要观察的根 DOM 元素 / Root DOM element to observe
  private root: Element
  // DOM 提取配置 / DOM extraction configuration
  private domConfig: DomExtractionConfig
  // 模拟器遮罩层实例 / Simulator mask instance
  private mask: SimulatorMask
  // 是否在自动化期间显示遮罩层 / Whether to show mask during automation
  private showMask: boolean

  // DOM 的扁平树表示 / Flat tree representation of the DOM
  private flatTree: FlatDomNode[] = []
  // 元素索引到 DOM 元素的映射 / Map from element index to DOM element
  private selectorMap: Map<number, Element> = new Map()
  // 供 LLM 使用的简化 HTML 字符串 / Simplified HTML string for LLM consumption
  private simplifiedHTML = ''

  constructor(config: PageControllerConfig = {}) {
    this.root = config.root || document.body
    this.domConfig = config.domConfig || {}
    this.mask = new SimulatorMask()
    this.showMask = config.showMask ?? true
  }

  /**
   * 获取当前浏览器状态供 LLM 上下文使用。
   * 每次调用都会重新提取 DOM 树以确保数据最新。
   *
   * Get the current browser state for LLM context.
   * This re-extracts the DOM tree each time for freshness.
   */
  getBrowserState(): BrowserState {
    this.update()

    // 计算滚动位置信息 / Calculate scroll position info
    const scrollTop = document.documentElement.scrollTop
    const scrollHeight = document.documentElement.scrollHeight
    const clientHeight = document.documentElement.clientHeight
    const scrollPercent = Math.round((scrollTop / (scrollHeight - clientHeight)) * 100) || 0

    // 构建页面头部信息 / Build page header info
    const header = [
      `URL: ${window.location.href}`,
      `Title: ${document.title}`,
      `Scroll: ${scrollPercent}% (${scrollTop}px / ${scrollHeight}px)`,
      scrollTop > 0 ? '↑ Content above' : '',
      scrollTop + clientHeight < scrollHeight ? '↓ Content below' : '',
    ]
      .filter(Boolean)
      .join('\n')

    return {
      url: window.location.href,
      title: document.title,
      header,
      content: this.simplifiedHTML,
      footer: scrollTop + clientHeight < scrollHeight ? '[More content below, scroll to see]' : '',
    }
  }

  /**
   * 重新提取 DOM 树并更新内部状态
   * Re-extract the DOM tree and update internal state
   */
  private update(): void {
    this.flatTree = getFlatTree(this.root, this.domConfig)
    this.selectorMap = getSelectorMap(this.root, this.flatTree)
    this.simplifiedHTML = flatTreeToString(this.flatTree)
  }

  /**
   * 执行单个操作
   * Execute a single action
   */
  async executeAction(action: AgentAction): Promise<ActionResult> {
    // 如果启用了遮罩层则显示 / Show mask if enabled
    if (this.showMask) this.mask.show()

    // 如果操作有目标元素索引，则高亮该元素 / Highlight the target element if applicable
    const index = action.params.index as number | undefined
    if (index !== undefined) {
      const el = this.selectorMap.get(index)
      if (el) this.mask.highlightElement(el)
    }

    const result = await executeAction(action, this.selectorMap)

    // 清除高亮 / Clear highlight
    this.mask.clearHighlight()
    return result
  }

  /**
   * 按顺序执行一批操作。
   * 操作时会高亮正在操作的每个元素。
   *
   * Execute a batch of actions sequentially.
   * Highlights each element as it's being operated on.
   */
  async executeBatch(
    actions: AgentAction[],
    onProgress?: (index: number, result: ActionResult) => void,
  ): Promise<BatchResult> {
    // 如果启用了遮罩层则显示 / Show mask if enabled
    if (this.showMask) this.mask.show()

    const result = await executeBatch(actions, this.selectorMap, (i, r) => {
      // 高亮下一个要操作的元素 / Highlight next element to operate on
      const nextAction = actions[i + 1]
      if (nextAction) {
        const idx = nextAction.params.index as number | undefined
        if (idx !== undefined) {
          const el = this.selectorMap.get(idx)
          if (el) this.mask.highlightElement(el)
        }
      }
      onProgress?.(i, r)
    })

    // 清除高亮 / Clear highlight
    this.mask.clearHighlight()
    return result
  }

  /**
   * 显示自动化遮罩层
   * Show the automation mask
   */
  showOverlay(): void {
    this.mask.show()
  }

  /**
   * 隐藏自动化遮罩层
   * Hide the automation mask
   */
  hideOverlay(): void {
    this.mask.hide()
  }

  /**
   * 获取当前的扁平 DOM 树
   * Get the current flat DOM tree
   */
  getFlatTree(): FlatDomNode[] {
    return this.flatTree
  }

  /**
   * 获取当前的选择器映射表
   * Get the current selector map
   */
  getSelectorMap(): Map<number, Element> {
    return this.selectorMap
  }

  /**
   * 检查当前页面是否是 Vue 应用
   * Check if current page is a Vue app
   */
  isVueApp(): boolean {
    return isVueApp()
  }

  /**
   * 销毁并清理资源
   * Dispose and clean up resources
   */
  dispose(): void {
    this.mask.hide()
    this.flatTree = []
    this.selectorMap.clear()
    this.simplifiedHTML = ''
  }
}
