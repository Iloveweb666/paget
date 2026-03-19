/**
 * 可视化遮罩层，在代理自动化期间阻止用户交互，并高亮正在操作的元素。
 * Visual overlay mask that blocks user interaction during agent automation
 * and highlights elements being operated on.
 */
export declare class SimulatorMask {
    private overlay;
    private highlight;
    private badge;
    /**
     * 显示遮罩层，阻止用户交互
     * Show the overlay mask, blocking user interaction
     */
    show(): void;
    /**
     * 隐藏遮罩层
     * Hide the overlay mask
     */
    hide(): void;
    /**
     * 高亮正在操作的指定元素
     * Highlight a specific element being operated on
     */
    highlightElement(element: Element): void;
    /**
     * 清除元素高亮
     * Clear the element highlight
     */
    clearHighlight(): void;
    /**
     * 设置遮罩层是否拦截指针事件（DOM 提取期间需要临时关闭）
     * Set whether the overlay intercepts pointer events (disabled during DOM extraction)
     */
    setPointerEvents(enabled: boolean): void;
    /**
     * 遮罩层当前是否可见
     * Whether the mask is currently visible
     */
    get isVisible(): boolean;
}
//# sourceMappingURL=SimulatorMask.d.ts.map