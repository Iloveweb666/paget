/**
 * 可视化遮罩层，在代理自动化期间阻止用户交互，并高亮正在操作的元素。
 * Visual overlay mask that blocks user interaction during agent automation
 * and highlights elements being operated on.
 */
export class SimulatorMask {
  // 全屏遮罩层元素 / Full-screen overlay element
  private overlay: HTMLDivElement | null = null;
  // 高亮框元素 / Highlight box element
  private highlight: HTMLDivElement | null = null;
  // 状态提示标签 / Status indicator badge
  private badge: HTMLDivElement | null = null;
  // 记录并恢复原始 overflow 样式 / Keep original overflow styles for restore
  private prevHtmlOverflow: string | null = null;
  private prevBodyOverflow: string | null = null;

  /**
   * 显示遮罩层，阻止用户交互
   * Show the overlay mask, blocking user interaction
   */
  show(): void {
    // 如果已经显示则跳过 / Skip if already shown
    if (this.overlay) return;

    // 锁定页面滚动，确保遮罩完全覆盖交互 / Lock page scroll so the mask fully covers interactions
    const html = document.documentElement;
    const body = document.body;
    this.prevHtmlOverflow = html.style.overflow;
    this.prevBodyOverflow = body.style.overflow;
    html.style.overflow = "hidden";
    body.style.overflow = "hidden";

    // 创建全屏遮罩层（带半透明底色和内边框）/ Create full-screen overlay with subtle background and inner border
    this.overlay = document.createElement("div");
    this.overlay.setAttribute("data-paget-ignore", "");
    Object.assign(this.overlay.style, {
      position: "fixed",
      top: "0",
      left: "0",
      width: "100vw",
      height: "100vh",
      zIndex: "99998",
      pointerEvents: "auto",
      cursor: "not-allowed",
      // 半透明底色，让用户感知到遮罩存在 / Semi-transparent background so users notice the overlay
      backgroundColor: "rgba(0, 0, 0, 0.03)",
      // 呼吸动画：内侧阴影在 0.8 和 0.3 透明度之间变化 / Breathing animation: inner shadow oscillates between 0.8 and 0.3 opacity
      animation: "paget-overlay-pulse 2s ease-in-out infinite",
    } satisfies Partial<CSSStyleDeclaration>);
    document.body.appendChild(this.overlay);

    // 创建状态提示标签 / Create status indicator badge
    this.badge = document.createElement("div");
    this.badge.setAttribute("data-paget-ignore", "");
    Object.assign(this.badge.style, {
      position: "fixed",
      top: "12px",
      left: "50%",
      transform: "translateX(-50%)",
      zIndex: "99999",
      padding: "6px 16px",
      borderRadius: "20px",
      backgroundColor: "rgba(79, 70, 229, 0.9)",
      color: "#fff",
      fontSize: "12px",
      lineHeight: "18px",
      fontWeight: "500",
      fontFamily:
        '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      pointerEvents: "none",
      boxShadow: "0 2px 8px rgba(79, 70, 229, 0.3)",
      // 呼吸动画 / Breathing animation
      animation: "paget-mask-pulse 2s ease-in-out infinite",
    } satisfies Partial<CSSStyleDeclaration>);
    this.badge.textContent = "AI 操作中...";
    document.body.appendChild(this.badge);

    // 注入呼吸动画关键帧（仅一次）/ Inject breathing animation keyframes (only once)
    if (!document.getElementById("paget-mask-style")) {
      const style = document.createElement("style");
      style.id = "paget-mask-style";
      style.textContent = `
        @keyframes paget-mask-pulse {
          0%, 100% { opacity: 0.9; }
          50% { opacity: 0.6; }
        }
        @keyframes paget-overlay-pulse {
          0%, 100% { box-shadow: inset 0 0 40px rgba(79, 70, 229, 0.8); }
          50% { box-shadow: inset 0 0 40px rgba(79, 70, 229, 0.3); }
        }
      `;
      document.head.appendChild(style);
    }

    // 创建高亮框元素 / Create highlight box element
    this.highlight = document.createElement("div");
    this.highlight.setAttribute("data-paget-ignore", "");
    Object.assign(this.highlight.style, {
      position: "fixed",
      zIndex: "99999",
      border: "2px solid #4f46e5",
      borderRadius: "4px",
      backgroundColor: "rgba(79, 70, 229, 0.1)",
      pointerEvents: "none",
      transition: "all 0.2s ease",
      display: "none",
      // 外发光效果增强高亮可见性 / Outer glow effect for better highlight visibility
      boxShadow:
        "0 0 0 4px rgba(79, 70, 229, 0.15), 0 0 12px rgba(79, 70, 229, 0.1)",
    } satisfies Partial<CSSStyleDeclaration>);
    document.body.appendChild(this.highlight);
  }

  /**
   * 隐藏遮罩层
   * Hide the overlay mask
   */
  hide(): void {
    this.overlay?.remove();
    this.overlay = null;
    this.highlight?.remove();
    this.highlight = null;
    this.badge?.remove();
    this.badge = null;

    // 恢复页面原始滚动样式 / Restore original page scroll styles
    const html = document.documentElement;
    const body = document.body;
    html.style.overflow = this.prevHtmlOverflow ?? "";
    body.style.overflow = this.prevBodyOverflow ?? "";
    this.prevHtmlOverflow = null;
    this.prevBodyOverflow = null;
  }

  /**
   * 高亮正在操作的指定元素
   * Highlight a specific element being operated on
   */
  highlightElement(element: Element): void {
    if (!this.highlight) return;

    // 根据元素边界矩形定位高亮框 / Position highlight box based on element bounding rect
    const rect = element.getBoundingClientRect();
    Object.assign(this.highlight.style, {
      display: "block",
      top: `${rect.top - 4}px`,
      left: `${rect.left - 4}px`,
      width: `${rect.width + 8}px`,
      height: `${rect.height + 8}px`,
    });
  }

  /**
   * 清除元素高亮
   * Clear the element highlight
   */
  clearHighlight(): void {
    if (!this.highlight) return;
    this.highlight.style.display = "none";
  }

  /**
   * 设置遮罩层是否拦截指针事件（DOM 提取期间需要临时关闭）
   * Set whether the overlay intercepts pointer events (disabled during DOM extraction)
   */
  setPointerEvents(enabled: boolean): void {
    if (this.overlay) {
      this.overlay.style.pointerEvents = enabled ? "auto" : "none";
    }
  }

  /**
   * 遮罩层当前是否可见
   * Whether the mask is currently visible
   */
  get isVisible(): boolean {
    return this.overlay !== null;
  }
}
