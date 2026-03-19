import type { FlatDomNode } from './dom_tree/types';
export * from './dom_tree';
/**
 * DOM 树提取配置
 * Configuration for DOM tree extraction
 */
export interface DomExtractionConfig {
    /** 最大遍历深度 / Maximum depth to traverse */
    maxDepth?: number;
    /** 是否包含隐藏元素 / Whether to include hidden elements */
    includeHidden?: boolean;
    /** 交互元素的自定义选择器 / Custom selector for interactive elements */
    interactiveSelector?: string;
}
/**
 * 从 DOM 中提取交互元素和文本节点的扁平树。
 * 每个交互元素会被分配一个索引编号，供 LLM 引用。
 *
 * Extract a flat tree of interactive and text nodes from the DOM.
 * Each interactive element is assigned an index for LLM reference.
 */
export declare function getFlatTree(root?: Element, config?: DomExtractionConfig): FlatDomNode[];
/**
 * 将扁平树转换为简化的 HTML 字符串，供 LLM 消费。
 * Convert flat tree to simplified HTML string for LLM consumption.
 */
export declare function flatTreeToString(nodes: FlatDomNode[]): string;
/**
 * 创建元素索引到实际 DOM 元素的映射表。
 * Create a map from element index to actual DOM element.
 */
export declare function getSelectorMap(root: Element | undefined, nodes: FlatDomNode[]): Map<number, Element>;
//# sourceMappingURL=index.d.ts.map