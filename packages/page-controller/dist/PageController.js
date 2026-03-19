import { getFlatTree, flatTreeToString, getSelectorMap } from './dom';
import { getPageInfo } from './dom/getPageInfo';
import { executeAction, executeBatch } from './actions';
import { SimulatorMask } from './mask/SimulatorMask';
/**
 * PageController 管理 DOM 状态提取和元素交互。
 * PageController manages DOM state extraction and element interactions.
 *
 * 继承 EventTarget 以支持自定义事件（beforeUpdate / afterUpdate）
 * Extends EventTarget for custom events (beforeUpdate / afterUpdate)
 */
export class PageController extends EventTarget {
    root;
    domConfig;
    // DOM 的扁平树表示 / Flat tree representation of the DOM
    flatTree = [];
    // 元素索引到 DOM 元素的映射 / Map from element index to DOM element
    selectorMap = new Map();
    // 索引到元素文本描述的映射 / Map from index to element text description
    elementTextMap = new Map();
    // 供 LLM 使用的简化 HTML 字符串 / Simplified HTML string for LLM consumption
    simplifiedHTML = '<EMPTY>';
    // 上次 DOM 树更新时间戳 / Last DOM tree update timestamp
    lastTimeUpdate = 0;
    // DOM 树是否已完成首次索引（操作前必须先索引）/ Whether tree has been indexed (required before actions)
    isIndexed = false;
    // 模拟器遮罩层 / Simulator mask
    mask = null;
    enableMask;
    constructor(config = {}) {
        super();
        this.root = config.root || document.body;
        this.domConfig = config.domConfig || {};
        this.enableMask = config.enableMask ?? false;
        if (this.enableMask)
            this.initMask();
    }
    /**
     * 初始化遮罩层 / Initialize the mask
     */
    initMask() {
        if (this.mask)
            return;
        this.mask = new SimulatorMask();
    }
    // ======= 状态查询 / State Queries =======
    /**
     * 获取上次 DOM 树更新时间戳
     * Get last DOM tree update timestamp
     */
    async getLastUpdateTime() {
        return this.lastTimeUpdate;
    }
    /**
     * 获取当前浏览器状态供 LLM 上下文使用。
     * 自动调用 updateTree() 刷新 DOM 状态。
     *
     * Get structured browser state for LLM consumption.
     * Automatically calls updateTree() to refresh DOM state.
     */
    async getBrowserState() {
        const url = window.location.href;
        const title = document.title;
        const pi = getPageInfo();
        await this.updateTree();
        const content = this.simplifiedHTML;
        // 构建头部信息 / Build header info
        const titleLine = `Current Page: [${title}](${url})`;
        const pageInfoLine = `Page info: ${pi.viewport_width}x${pi.viewport_height}px viewport, ${pi.page_width}x${pi.page_height}px total page size, ${pi.pages_above.toFixed(1)} pages above, ${pi.pages_below.toFixed(1)} pages below, ${pi.total_pages.toFixed(1)} total pages, at ${(pi.current_page_position * 100).toFixed(0)}% of page`;
        const elementsLabel = 'Interactive elements from top layer of the current page inside the viewport:';
        const hasContentAbove = pi.pixels_above > 4;
        const scrollHintAbove = hasContentAbove
            ? `... ${pi.pixels_above} pixels above (${pi.pages_above.toFixed(1)} pages) - scroll to see more ...`
            : '[Start of page]';
        const header = `${titleLine}\n${pageInfoLine}\n\n${elementsLabel}\n\n${scrollHintAbove}`;
        // 构建底部信息 / Build footer info
        const hasContentBelow = pi.pixels_below > 4;
        const footer = hasContentBelow
            ? `... ${pi.pixels_below} pixels below (${pi.pages_below.toFixed(1)} pages) - scroll to see more ...`
            : '[End of page]';
        return { url, title, header, content, footer };
    }
    // ======= DOM 树操作 / DOM Tree Operations =======
    /**
     * 更新 DOM 树，返回简化 HTML。
     * 如果启用了遮罩层，在提取期间暂时关闭其 pointerEvents。
     *
     * Update DOM tree, returns simplified HTML.
     * If mask is enabled, temporarily disables its pointerEvents during extraction.
     */
    async updateTree() {
        this.dispatchEvent(new Event('beforeUpdate'));
        this.lastTimeUpdate = Date.now();
        // 暂时绕过遮罩层以允许 DOM 提取 / Temporarily bypass mask for DOM extraction
        if (this.mask?.isVisible) {
            this.mask.setPointerEvents(false);
        }
        this.flatTree = getFlatTree(this.root, this.domConfig);
        this.simplifiedHTML = flatTreeToString(this.flatTree);
        this.selectorMap = getSelectorMap(this.root, this.flatTree);
        // 构建元素文本映射 / Build element text map
        this.elementTextMap.clear();
        const lines = this.simplifiedHTML.split('\n');
        for (const line of lines) {
            const match = line.match(/^\[(\d+)\]/);
            if (match) {
                this.elementTextMap.set(Number(match[1]), line);
            }
        }
        // 标记为已索引 — 现在可以执行操作了 / Mark as indexed — actions are now allowed
        this.isIndexed = true;
        // 恢复遮罩层阻塞 / Restore mask blocking
        if (this.mask?.isVisible) {
            this.mask.setPointerEvents(true);
        }
        this.dispatchEvent(new Event('afterUpdate'));
        return this.simplifiedHTML;
    }
    // ======= 操作执行 / Element Actions =======
    /**
     * 确保 DOM 树已索引。未索引时抛出异常。
     * Ensure DOM tree has been indexed. Throws if updateTree() hasn't been called.
     */
    assertIndexed() {
        if (!this.isIndexed) {
            throw new Error('DOM tree not indexed yet. Call updateTree() or getBrowserState() first.');
        }
    }
    /**
     * 通过索引点击元素
     * Click element by index
     */
    async clickElement(index) {
        try {
            this.assertIndexed();
            const el = this.getElementByIndex(index);
            const elemText = this.elementTextMap.get(index);
            const { clickElement: doClick } = await import('./actions');
            await doClick(el);
            // 处理新标签页链接 / Handle links that open in new tabs
            if (el instanceof HTMLAnchorElement && el.target === '_blank') {
                return { action: { tool: 'click', params: { index } }, success: true, output: `Clicked element (${elemText ?? index}). Link opened in a new tab.` };
            }
            return { action: { tool: 'click', params: { index } }, success: true, output: `Clicked element (${elemText ?? index}).` };
        }
        catch (error) {
            return { action: { tool: 'click', params: { index } }, success: false, error: `Failed to click element: ${error}` };
        }
    }
    /**
     * 通过索引向元素输入文本
     * Input text into element by index
     */
    async inputText(index, text) {
        try {
            this.assertIndexed();
            const el = this.getElementByIndex(index);
            const elemText = this.elementTextMap.get(index);
            const { inputText: doInput } = await import('./actions');
            await doInput(el, text);
            return { action: { tool: 'input', params: { index, text } }, success: true, output: `Input text (${text}) into element (${elemText ?? index}).` };
        }
        catch (error) {
            return { action: { tool: 'input', params: { index, text } }, success: false, error: `Failed to input text: ${error}` };
        }
    }
    /**
     * 通过索引选择下拉选项
     * Select dropdown option by index
     */
    async selectOption(index, optionText) {
        try {
            this.assertIndexed();
            const el = this.getElementByIndex(index);
            const elemText = this.elementTextMap.get(index);
            const { selectOption: doSelect } = await import('./actions');
            await doSelect(el, optionText);
            return { action: { tool: 'select', params: { index, optionText } }, success: true, output: `Selected option (${optionText}) in element (${elemText ?? index}).` };
        }
        catch (error) {
            return { action: { tool: 'select', params: { index, optionText } }, success: false, error: `Failed to select option: ${error}` };
        }
    }
    /**
     * 垂直滚动
     * Scroll vertically
     */
    async scroll(options) {
        try {
            this.assertIndexed();
            const { down, numPages, pixels, index } = options;
            const scrollAmount = pixels ?? (numPages ?? 1) * window.innerHeight;
            const element = index !== undefined ? this.getElementByIndex(index) : null;
            const { scrollVertically } = await import('./actions');
            const message = await scrollVertically(down, down ? scrollAmount : -scrollAmount, element);
            return { action: { tool: 'scroll', params: options }, success: true, output: message };
        }
        catch (error) {
            return { action: { tool: 'scroll', params: options }, success: false, error: `Failed to scroll: ${error}` };
        }
    }
    /**
     * 水平滚动
     * Scroll horizontally
     */
    async scrollHorizontal(options) {
        try {
            this.assertIndexed();
            const { right, pixels, index } = options;
            const scrollAmount = pixels ?? 300;
            const element = index !== undefined ? this.getElementByIndex(index) : null;
            const { scrollHorizontally } = await import('./actions');
            const message = await scrollHorizontally(right, scrollAmount, element);
            return { action: { tool: 'scroll_horizontally', params: options }, success: true, output: message };
        }
        catch (error) {
            return { action: { tool: 'scroll_horizontally', params: options }, success: false, error: `Failed to scroll horizontally: ${error}` };
        }
    }
    /**
     * 执行任意 JavaScript
     * Execute arbitrary JavaScript on the page
     */
    async executeJavascript(script) {
        try {
            const asyncFn = eval(`(async () => { ${script} })`);
            const result = await asyncFn();
            return { action: { tool: 'execute_javascript', params: { code: script } }, success: true, output: `Executed JavaScript. Result: ${String(result)}` };
        }
        catch (error) {
            return { action: { tool: 'execute_javascript', params: { code: script } }, success: false, error: `Error executing JavaScript: ${error}` };
        }
    }
    /**
     * 执行单个操作（通过 AgentAction 接口）
     * Execute a single action via AgentAction interface
     */
    async executeAction(action) {
        this.assertIndexed();
        // 如果启用遮罩层则显示并高亮目标元素 / Show mask and highlight target element if enabled
        if (this.enableMask && this.mask) {
            this.mask.show();
            const index = action.params.index;
            if (index !== undefined) {
                const el = this.selectorMap.get(index);
                if (el)
                    this.mask.highlightElement(el);
            }
        }
        const result = await executeAction(action, this.selectorMap);
        // 清除高亮 / Clear highlight
        this.mask?.clearHighlight();
        return result;
    }
    /**
     * 按顺序执行一批操作（高亮每个正在操作的元素）
     * Execute a batch of actions sequentially (highlights each element)
     */
    async executeBatch(actions, onProgress) {
        this.assertIndexed();
        // 如果启用遮罩层则显示 / Show mask if enabled
        if (this.enableMask && this.mask) {
            this.mask.show();
            // 高亮第一个操作的目标元素 / Highlight the first action's target element
            this.highlightActionTarget(actions[0]);
        }
        const result = await executeBatch(actions, this.selectorMap, (i, r) => {
            // 当前操作完成后，高亮下一个要操作的目标元素 / After current action, highlight next action's target
            if (this.mask) {
                const nextAction = actions[i + 1];
                if (nextAction) {
                    this.highlightActionTarget(nextAction);
                }
            }
            onProgress?.(i, r);
        });
        // 清除高亮 / Clear highlight
        this.mask?.clearHighlight();
        return result;
    }
    /**
     * 高亮指定操作的目标元素 / Highlight the target element of an action
     */
    highlightActionTarget(action) {
        if (!action || !this.mask)
            return;
        const idx = action.params.index;
        if (idx !== undefined) {
            const el = this.selectorMap.get(idx);
            if (el)
                this.mask.highlightElement(el);
        }
    }
    // ======= 遮罩层操作 / Mask Operations =======
    /**
     * 显示自动化遮罩层 / Show the automation mask
     */
    showMask() {
        if (!this.mask)
            this.initMask();
        this.mask?.show();
    }
    /**
     * 隐藏自动化遮罩层 / Hide the automation mask
     */
    hideMask() {
        this.mask?.hide();
    }
    // ======= 内部工具 / Internal Utilities =======
    /**
     * 通过索引从映射中获取 HTMLElement
     * Get HTMLElement by index from the selector map
     */
    getElementByIndex(index) {
        const el = this.selectorMap.get(index);
        if (!el)
            throw new Error(`No interactive element found at index ${index}`);
        if (!(el instanceof HTMLElement))
            throw new Error(`Element at index ${index} is not an HTMLElement`);
        return el;
    }
    /**
     * 获取当前扁平 DOM 树 / Get the current flat DOM tree
     */
    getFlatTree() {
        return this.flatTree;
    }
    /**
     * 获取当前选择器映射表 / Get the current selector map
     */
    getSelectorMap() {
        return this.selectorMap;
    }
    /**
     * 销毁并清理资源 / Dispose and clean up resources
     */
    dispose() {
        this.flatTree = [];
        this.selectorMap.clear();
        this.elementTextMap.clear();
        this.simplifiedHTML = '<EMPTY>';
        this.isIndexed = false;
        this.mask?.hide();
        this.mask = null;
    }
}
//# sourceMappingURL=PageController.js.map