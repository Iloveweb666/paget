/**
 * 页面控制器组合式函数
 * Page controller composable
 *
 * 封装 PageController 实例，提供 DOM 状态提取和操作执行能力。
 * Wraps PageController instance for DOM state extraction and action execution.
 */
import { onUnmounted } from 'vue'
import { PageController } from '@paget/page-controller'
import type { BrowserState, PageControllerConfig } from '@paget/page-controller'
import type { AgentAction, ActionResult, BatchResult } from '@paget/shared'

export function usePageController(config?: PageControllerConfig) {
  // 创建控制器实例 / Create controller instance
  const controller = new PageController(config)

  /**
   * 获取当前浏览器状态快照（自动刷新 DOM 树）
   * Get current browser state snapshot (auto-refreshes DOM tree)
   */
  async function getBrowserState(): Promise<BrowserState> {
    return controller.getBrowserState()
  }

  /**
   * 执行批量操作 / Execute batch actions
   */
  async function executeBatch(
    actions: AgentAction[],
    onProgress?: (index: number, result: ActionResult) => void,
  ): Promise<BatchResult> {
    return controller.executeBatch(actions, onProgress)
  }

  /**
   * 显示自动化遮罩层 / Show automation mask
   */
  function showMask(): void {
    controller.showMask()
  }

  /**
   * 隐藏自动化遮罩层 / Hide automation mask
   */
  function hideMask(): void {
    controller.hideMask()
  }

  /**
   * 动态设置遮罩开关 / Dynamically toggle mask behavior
   */
  function setMaskEnabled(enabled: boolean): void {
    controller.setMaskEnabled(enabled)
  }

  // 组件卸载时清理资源 / Clean up on unmount
  onUnmounted(() => {
    controller.dispose()
  })

  return {
    controller,
    getBrowserState,
    executeBatch,
    showMask,
    hideMask,
    setMaskEnabled,
  }
}
