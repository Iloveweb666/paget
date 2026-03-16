/**
 * 可视化遮罩层，在代理自动化期间阻止用户交互，并高亮正在操作的元素。
 * Visual overlay mask that blocks user interaction during agent automation
 * and highlights elements being operated on.
 */
export class SimulatorMask {
  // 全屏遮罩层元素 / Full-screen overlay element
  private overlay: HTMLDivElement | null = null
  // 高亮框元素 / Highlight box element
  private highlight: HTMLDivElement | null = null

  /**
   * 显示遮罩层，阻止用户交互
   * Show the overlay mask, blocking user interaction
   */
  show(): void {
    // 如果已经显示则跳过 / Skip if already shown
    if (this.overlay) return

    // 创建全屏遮罩层 / Create full-screen overlay
    this.overlay = document.createElement('div')
    Object.assign(this.overlay.style, {
      position: 'fixed',
      top: '0',
      left: '0',
      width: '100vw',
      height: '100vh',
      zIndex: '99998',
      pointerEvents: 'auto',
      cursor: 'not-allowed',
    } satisfies Partial<CSSStyleDeclaration>)
    document.body.appendChild(this.overlay)

    // 创建高亮框元素 / Create highlight box element
    this.highlight = document.createElement('div')
    Object.assign(this.highlight.style, {
      position: 'fixed',
      zIndex: '99999',
      border: '2px solid #4f46e5',
      borderRadius: '4px',
      backgroundColor: 'rgba(79, 70, 229, 0.1)',
      pointerEvents: 'none',
      transition: 'all 0.2s ease',
      display: 'none',
    } satisfies Partial<CSSStyleDeclaration>)
    document.body.appendChild(this.highlight)
  }

  /**
   * 隐藏遮罩层
   * Hide the overlay mask
   */
  hide(): void {
    this.overlay?.remove()
    this.overlay = null
    this.highlight?.remove()
    this.highlight = null
  }

  /**
   * 高亮正在操作的指定元素
   * Highlight a specific element being operated on
   */
  highlightElement(element: Element): void {
    if (!this.highlight) return

    // 根据元素边界矩形定位高亮框 / Position highlight box based on element bounding rect
    const rect = element.getBoundingClientRect()
    Object.assign(this.highlight.style, {
      display: 'block',
      top: `${rect.top - 2}px`,
      left: `${rect.left - 2}px`,
      width: `${rect.width + 4}px`,
      height: `${rect.height + 4}px`,
    })
  }

  /**
   * 清除元素高亮
   * Clear the element highlight
   */
  clearHighlight(): void {
    if (!this.highlight) return
    this.highlight.style.display = 'none'
  }

  /**
   * 设置遮罩层是否拦截指针事件（DOM 提取期间需要临时关闭）
   * Set whether the overlay intercepts pointer events (disabled during DOM extraction)
   */
  setPointerEvents(enabled: boolean): void {
    if (this.overlay) {
      this.overlay.style.pointerEvents = enabled ? 'auto' : 'none'
    }
  }

  /**
   * 遮罩层当前是否可见
   * Whether the mask is currently visible
   */
  get isVisible(): boolean {
    return this.overlay !== null
  }
}
