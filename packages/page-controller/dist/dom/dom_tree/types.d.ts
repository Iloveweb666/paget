/**
 * DOM 节点基础表示
 * Base DOM node representation
 */
export interface DomNode {
    index: number;
    tagName: string;
    isVisible: boolean;
    rect?: DomRect;
}
/**
 * 可交互元素，Agent 可以对其进行操作
 * Interactive element that the agent can operate on
 */
export interface InteractiveElementDomNode extends DomNode {
    type: 'interactive';
    attributes: Record<string, string>;
    ariaLabel?: string;
    placeholder?: string;
    value?: string;
    isDisabled?: boolean;
    role?: string;
    text?: string;
}
/**
 * 纯文本节点，提供上下文信息
 * Text-only node for context
 */
export interface TextDomNode extends DomNode {
    type: 'text';
    text: string;
}
export type FlatDomNode = InteractiveElementDomNode | TextDomNode;
/**
 * 边界矩形
 * Bounding rectangle
 */
export interface DomRect {
    x: number;
    y: number;
    width: number;
    height: number;
}
//# sourceMappingURL=types.d.ts.map