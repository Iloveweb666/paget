import type { FlatDomNode, InteractiveElementDomNode } from './dom_tree/types'

export * from './dom_tree'

/**
 * DOM 树提取配置
 * Configuration for DOM tree extraction
 */
export interface DomExtractionConfig {
  /** 最大遍历深度 / Maximum depth to traverse */
  maxDepth?: number
  /** 是否包含隐藏元素 / Whether to include hidden elements */
  includeHidden?: boolean
  /** 交互元素的自定义选择器 / Custom selector for interactive elements */
  interactiveSelector?: string
}

/**
 * 从 DOM 中提取交互元素和文本节点的扁平树。
 * 每个交互元素会被分配一个索引编号，供 LLM 引用。
 *
 * Extract a flat tree of interactive and text nodes from the DOM.
 * Each interactive element is assigned an index for LLM reference.
 */
export function getFlatTree(
  root: Element = document.body,
  config: DomExtractionConfig = {},
): FlatDomNode[] {
  const { maxDepth = 50, includeHidden = false } = config
  const nodes: FlatDomNode[] = []
  let index = 0

  // 递归遍历 DOM 树 / Recursively walk the DOM tree
  function walk(element: Element, depth: number) {
    // 超过最大深度则停止 / Stop if max depth exceeded
    if (depth > maxDepth) return

    // 检查元素可见性 / Check element visibility
    const style = window.getComputedStyle(element)
    if (!includeHidden && (style.display === 'none' || style.visibility === 'hidden')) {
      return
    }

    // 获取元素的边界矩形 / Get the element's bounding rectangle
    const rect = element.getBoundingClientRect()
    const isVisible = rect.width > 0 && rect.height > 0

    // 如果是交互元素，收集其信息 / If interactive, collect its info
    if (isInteractive(element)) {
      const node: InteractiveElementDomNode = {
        type: 'interactive',
        index: index++,
        tagName: element.tagName.toLowerCase(),
        isVisible,
        rect: { x: rect.x, y: rect.y, width: rect.width, height: rect.height },
        attributes: getRelevantAttributes(element),
        ariaLabel: element.getAttribute('aria-label') || undefined,
        placeholder: (element as HTMLInputElement).placeholder || undefined,
        value: (element as HTMLInputElement).value || undefined,
        isDisabled: (element as HTMLInputElement).disabled || false,
        role: element.getAttribute('role') || undefined,
        text: element.textContent?.trim().slice(0, 100) || undefined,
      }
      nodes.push(node)
    }

    // 递归处理子元素 / Recursively process child elements
    for (const child of element.children) {
      walk(child, depth + 1)
    }
  }

  walk(root, 0)
  return nodes
}

/**
 * 将扁平树转换为简化的 HTML 字符串，供 LLM 消费。
 * Convert flat tree to simplified HTML string for LLM consumption.
 */
export function flatTreeToString(nodes: FlatDomNode[]): string {
  return nodes
    .filter((n) => n.isVisible)
    .map((node) => {
      if (node.type === 'interactive') {
        // 拼接属性字符串 / Build attribute string
        const attrs = Object.entries(node.attributes)
          .map(([k, v]) => `${k}="${v}"`)
          .join(' ')
        // 优先使用 aria-label，其次 placeholder，最后 text / Prefer aria-label, then placeholder, then text
        const label = node.ariaLabel || node.placeholder || node.text || ''
        return `[${node.index}] <${node.tagName} ${attrs}>${label}</${node.tagName}>`
      }
      return node.text
    })
    .join('\n')
}

/**
 * 创建元素索引到实际 DOM 元素的映射表。
 * Create a map from element index to actual DOM element.
 */
export function getSelectorMap(
  root: Element = document.body,
  nodes: FlatDomNode[],
): Map<number, Element> {
  const map = new Map<number, Element>()
  // 过滤出交互节点 / Filter interactive nodes only
  const interactiveNodes = nodes.filter(
    (n): n is InteractiveElementDomNode => n.type === 'interactive',
  )

  // 遍历所有元素，按顺序匹配交互节点 / Iterate all elements, match interactive nodes in order
  const allElements = root.querySelectorAll('*')
  let nodeIdx = 0

  for (const el of allElements) {
    if (nodeIdx >= interactiveNodes.length) break
    if (isInteractive(el)) {
      map.set(interactiveNodes[nodeIdx].index, el)
      nodeIdx++
    }
  }

  return map
}

/**
 * 检查元素是否是交互元素（可点击、可编辑等）
 * Check if an element is interactive (clickable, editable, etc.)
 */
function isInteractive(element: Element): boolean {
  // 检查标签名 / Check tag name
  const tag = element.tagName.toLowerCase()
  const interactiveTags = ['a', 'button', 'input', 'select', 'textarea']
  if (interactiveTags.includes(tag)) return true

  // 检查 ARIA 角色 / Check ARIA role
  const role = element.getAttribute('role')
  const interactiveRoles = ['button', 'link', 'textbox', 'checkbox', 'radio', 'tab', 'menuitem']
  if (role && interactiveRoles.includes(role)) return true

  // 检查 onclick 属性或 tabindex / Check onclick attribute or tabindex
  if (element.getAttribute('onclick') || element.getAttribute('tabindex')) return true

  return false
}

/**
 * 提取用于标识元素的相关属性
 * Extract relevant attributes for identification
 */
function getRelevantAttributes(element: Element): Record<string, string> {
  const attrs: Record<string, string> = {}
  // 只提取有助于标识的属性 / Only extract attributes useful for identification
  const relevant = ['id', 'name', 'type', 'href', 'data-testid', 'class']
  for (const name of relevant) {
    const value = element.getAttribute(name)
    if (value) attrs[name] = value
  }
  return attrs
}
