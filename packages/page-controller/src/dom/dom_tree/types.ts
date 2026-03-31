/**
 * DOM 节点基础表示
 * Base DOM node representation
 */
export interface DomNode {
  // 分配的索引，供 LLM 引用 / Assigned index for LLM reference
  index: number
  // 标签名 / Tag name
  tagName: string
  // 是否可见 / Whether this node is visible
  isVisible: boolean
  // 边界矩形 / Bounding rect
  rect?: DomRect
  // DOM 树深度（相对于根元素）/ DOM tree depth (relative to root)
  depth?: number
}

/**
 * 可交互元素，Agent 可以对其进行操作
 * Interactive element that the agent can operate on
 */
export interface InteractiveElementDomNode extends DomNode {
  type: 'interactive'
  // 用于识别的元素属性 / Element attributes relevant for identification
  attributes: Record<string, string>
  // 无障碍名称或标签 / Accessible name or label
  ariaLabel?: string
  // 占位文本 / Placeholder text
  placeholder?: string
  // 当前值（用于输入框）/ Current value (for inputs)
  value?: string
  // 是否禁用 / Whether the element is disabled
  isDisabled?: boolean
  // 元素角色 / Element role
  role?: string
  // 内部文本内容（截断）/ Inner text content (truncated)
  text?: string
}

/**
 * 纯文本节点，提供上下文信息
 * Text-only node for context
 */
export interface TextDomNode extends DomNode {
  type: 'text'
  // 文本内容 / Text content
  text: string
}

// 所有 DOM 节点类型的联合 / Union of all DOM node types
export type FlatDomNode = InteractiveElementDomNode | TextDomNode

/**
 * 边界矩形
 * Bounding rectangle
 */
export interface DomRect {
  x: number
  y: number
  width: number
  height: number
}
