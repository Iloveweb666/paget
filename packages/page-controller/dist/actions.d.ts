/**
 * DOM 操作原语
 * DOM action primitives — aligned with page-agent's battle-tested implementation
 */
import type { AgentAction, ActionResult, BatchResult } from "@paget/shared";
/**
 * 将遮罩层指针移动到元素中心位置（触发视觉反馈）
 * Move mask pointer to element center (triggers visual feedback)
 */
export declare function movePointerToElement(element: HTMLElement): Promise<void>;
/**
 * 如果元素不在视口内则滚动到可见位置
 * Scroll element into view if not currently visible
 */
export declare function scrollIntoViewIfNeeded(element: HTMLElement): Promise<void>;
/**
 * 模拟完整的点击事件链
 * Simulate a full click event chain
 *
 * 事件顺序 / Event sequence:
 * blur previous → scrollIntoView → movePointer → mouseenter → mouseover
 * → mousedown → focus → mouseup → click → wait
 */
export declare function clickElement(element: HTMLElement): Promise<void>;
/**
 * 向元素输入文本（对齐 page-agent 实现）
 * Input text into an element (aligned with page-agent)
 *
 * 支持三种类型 / Supports three types:
 * - HTMLInputElement / HTMLTextAreaElement：使用原生 setter 触发框架响应式
 * - contenteditable：使用 beforeinput + input 事件序列
 */
export declare function inputText(element: HTMLElement, text: string): Promise<void>;
/**
 * 选择下拉选项（对齐 page-agent 实现）
 * Select a dropdown option (aligned with page-agent)
 */
export declare function selectOption(element: HTMLSelectElement, optionText: string): Promise<void>;
/**
 * 垂直滚动（对齐 page-agent 实现）
 * Scroll vertically (aligned with page-agent)
 *
 * 支持元素级和页面级滚动，会自动检测可滚动容器（CSS overflow 属性）
 * Supports element-level and page-level scrolling, auto-detects scrollable
 * containers via CSS overflow properties
 */
export declare function scrollVertically(down: boolean, scrollAmount: number, element?: HTMLElement | null): Promise<string>;
/**
 * 水平滚动（对齐 page-agent 实现）
 * Scroll horizontally (aligned with page-agent)
 */
export declare function scrollHorizontally(right: boolean, scrollAmount: number, element?: HTMLElement | null): Promise<string>;
/**
 * 在页面上执行单个操作
 * Execute a single action on the page
 */
export declare function executeAction(action: AgentAction, selectorMap: Map<number, Element>): Promise<ActionResult>;
/**
 * 按顺序执行一批操作（遇错即停）
 * Execute a batch of actions sequentially (fail-fast)
 */
export declare function executeBatch(actions: AgentAction[], selectorMap: Map<number, Element>, onProgress?: (index: number, result: ActionResult) => void): Promise<BatchResult>;
//# sourceMappingURL=actions.d.ts.map