/**
 * 浏览器页面状态快照（发送给 LLM 的核心数据）
 * Browser page state snapshot (core data sent to LLM)
 */
export interface BrowserState {
  // 当前页面 URL / Current page URL
  url: string
  // 页面标题 / Page title
  title: string
  // 页面头部信息（标题 + 视口信息 + 滚动提示）/ Page header info (title + viewport + scroll hints)
  header: string
  // 简化后的页面内容（带索引的交互元素）/ Simplified page content (indexed interactive elements)
  content: string
  // 页面底部信息（滚动提示）/ Page footer info (scroll hints)
  footer: string
}

/**
 * 批量执行选项
 * Batch execution options
 */
export interface BatchExecuteOptions {
  // 遇错策略：stop 停止，continue 继续 / Failure strategy: stop or continue
  failStrategy: 'stop' | 'continue'
  // 每步之间的延迟（毫秒）/ Delay between steps (ms)
  stepDelay?: number
  // 是否在每步后重新观察页面 / Whether to re-observe page after each step
  observeAfterEach?: boolean
}

/**
 * 批量操作结果
 * Batch action result
 */
export interface BatchActionResult {
  // 每个操作的结果 / Result of each action
  results: Array<{ success: boolean; output?: string; error?: string }>
  // 成功数量 / Success count
  successCount: number
  // 失败数量 / Failure count
  failureCount: number
  // 总耗时（毫秒）/ Total duration (ms)
  totalDuration: number
}
