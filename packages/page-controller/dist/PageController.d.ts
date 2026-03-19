/**
 * PageController — 管理 DOM 状态提取和元素交互（对齐 page-agent）
 * PageController — Manages DOM state extraction and element interactions (aligned with page-agent)
 *
 * 设计为独立于 LLM，所有公开方法均为 async 以支持远程调用。
 * Designed to be independent of LLM. All public methods are async for potential remote calling support.
 *
 * @lifecycle
 * - beforeUpdate: DOM 树更新前触发 / Emitted before DOM tree update
 * - afterUpdate: DOM 树更新后触发 / Emitted after DOM tree update
 */
import type { AgentAction, ActionResult, BatchResult } from '@paget/shared';
import type { FlatDomNode, DomExtractionConfig } from './dom';
/**
 * 浏览器状态快照，供 LLM 消费
 * Structured browser state for LLM consumption
 */
export interface BrowserState {
    url: string;
    title: string;
    /** 页面信息 + 滚动位置提示 / Page info + scroll position hints */
    header: string;
    /** 交互元素的简化 HTML / Simplified HTML of interactive elements */
    content: string;
    /** 视口下方内容指示器 / Content below viewport indicator */
    footer: string;
}
/**
 * PageController 配置
 * PageController configuration
 */
export interface PageControllerConfig {
    /** 要观察的根元素（默认：document.body）/ Root element to observe (default: document.body) */
    root?: Element;
    /** DOM 提取设置 / DOM extraction settings */
    domConfig?: DomExtractionConfig;
    /** 是否启用遮罩层（默认：false）/ Whether to enable visual mask (default: false) */
    enableMask?: boolean;
}
/**
 * PageController 管理 DOM 状态提取和元素交互。
 * PageController manages DOM state extraction and element interactions.
 *
 * 继承 EventTarget 以支持自定义事件（beforeUpdate / afterUpdate）
 * Extends EventTarget for custom events (beforeUpdate / afterUpdate)
 */
export declare class PageController extends EventTarget {
    private root;
    private domConfig;
    private flatTree;
    private selectorMap;
    private elementTextMap;
    private simplifiedHTML;
    private lastTimeUpdate;
    private isIndexed;
    private mask;
    private enableMask;
    constructor(config?: PageControllerConfig);
    /**
     * 初始化遮罩层 / Initialize the mask
     */
    private initMask;
    /**
     * 获取上次 DOM 树更新时间戳
     * Get last DOM tree update timestamp
     */
    getLastUpdateTime(): Promise<number>;
    /**
     * 获取当前浏览器状态供 LLM 上下文使用。
     * 自动调用 updateTree() 刷新 DOM 状态。
     *
     * Get structured browser state for LLM consumption.
     * Automatically calls updateTree() to refresh DOM state.
     */
    getBrowserState(): Promise<BrowserState>;
    /**
     * 更新 DOM 树，返回简化 HTML。
     * 如果启用了遮罩层，在提取期间暂时关闭其 pointerEvents。
     *
     * Update DOM tree, returns simplified HTML.
     * If mask is enabled, temporarily disables its pointerEvents during extraction.
     */
    updateTree(): Promise<string>;
    /**
     * 确保 DOM 树已索引。未索引时抛出异常。
     * Ensure DOM tree has been indexed. Throws if updateTree() hasn't been called.
     */
    private assertIndexed;
    /**
     * 通过索引点击元素
     * Click element by index
     */
    clickElement(index: number): Promise<ActionResult>;
    /**
     * 通过索引向元素输入文本
     * Input text into element by index
     */
    inputText(index: number, text: string): Promise<ActionResult>;
    /**
     * 通过索引选择下拉选项
     * Select dropdown option by index
     */
    selectOption(index: number, optionText: string): Promise<ActionResult>;
    /**
     * 垂直滚动
     * Scroll vertically
     */
    scroll(options: {
        down: boolean;
        numPages?: number;
        pixels?: number;
        index?: number;
    }): Promise<ActionResult>;
    /**
     * 水平滚动
     * Scroll horizontally
     */
    scrollHorizontal(options: {
        right: boolean;
        pixels?: number;
        index?: number;
    }): Promise<ActionResult>;
    /**
     * 执行任意 JavaScript
     * Execute arbitrary JavaScript on the page
     */
    executeJavascript(script: string): Promise<ActionResult>;
    /**
     * 执行单个操作（通过 AgentAction 接口）
     * Execute a single action via AgentAction interface
     */
    executeAction(action: AgentAction): Promise<ActionResult>;
    /**
     * 按顺序执行一批操作（高亮每个正在操作的元素）
     * Execute a batch of actions sequentially (highlights each element)
     */
    executeBatch(actions: AgentAction[], onProgress?: (index: number, result: ActionResult) => void): Promise<BatchResult>;
    /**
     * 高亮指定操作的目标元素 / Highlight the target element of an action
     */
    private highlightActionTarget;
    /**
     * 显示自动化遮罩层 / Show the automation mask
     */
    showMask(): void;
    /**
     * 隐藏自动化遮罩层 / Hide the automation mask
     */
    hideMask(): void;
    /**
     * 通过索引从映射中获取 HTMLElement
     * Get HTMLElement by index from the selector map
     */
    private getElementByIndex;
    /**
     * 获取当前扁平 DOM 树 / Get the current flat DOM tree
     */
    getFlatTree(): FlatDomNode[];
    /**
     * 获取当前选择器映射表 / Get the current selector map
     */
    getSelectorMap(): Map<number, Element>;
    /**
     * 销毁并清理资源 / Dispose and clean up resources
     */
    dispose(): void;
}
//# sourceMappingURL=PageController.d.ts.map