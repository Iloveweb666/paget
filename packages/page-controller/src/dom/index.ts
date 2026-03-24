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
  /**
   * 要排除的元素 CSS 选择器（匹配的元素及其子树会被跳过）
   * CSS selector for elements to exclude (matching elements and their subtrees are skipped)
   */
  excludeSelector?: string
}

// TODO: 使用 MutationObserver 实现增量 DOM 扫描优化 / Incremental DOM scan via MutationObserver
// 当前每次调用 getFlatTree 都全量遍历 DOM 树，对于 Element Plus 中后台页面（~3000-5000 节点）
// 耗时约 30-80ms。Agent 循环中两次观察之间页面变化通常很小，可通过以下方案优化：
// Currently getFlatTree does a full DOM traversal every call. For typical Element Plus admin
// pages (~3000-5000 nodes), this takes ~30-80ms. Between Agent loop observations, page
// changes are usually minimal. Optimization approach:
//
// 1. 初始化时注册 MutationObserver 监听 childList/attributes/subtree 变化
//    Register MutationObserver on init to watch childList/attributes/subtree changes
// 2. 维护脏子树根节点集合（dirtyRoots），mutation 回调中标记变化节点
//    Maintain a dirtyRoots set, mark changed nodes in mutation callback
// 3. getFlatTree 调用时，若无脏标记则直接返回缓存结果（<1ms）
//    On getFlatTree call, return cached result if no dirty marks (<1ms)
// 4. 若有脏标记，仅重新遍历脏子树并合并到缓存中（通常 2-5ms）
//    If dirty, only re-traverse dirty subtrees and merge into cache (typically 2-5ms)
// 5. 路由跳转等全量替换场景仍需全量扫描，此时无额外收益
//    Full page replacement (route navigation) still requires full scan, no extra benefit

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
  const { maxDepth = 50, includeHidden = false, excludeSelector } = config
  const nodes: FlatDomNode[] = []
  let index = 0

  // 递归遍历 DOM 树 / Recursively walk the DOM tree
  function walk(element: Element, depth: number) {
    // 超过最大深度则停止 / Stop if max depth exceeded
    if (depth > maxDepth) return

    // 跳过排除的元素及其子树 / Skip excluded elements and their subtrees
    if (excludeSelector && element.matches(excludeSelector)) return

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
  config: DomExtractionConfig = {},
): Map<number, Element> {
  const map = new Map<number, Element>()
  const { excludeSelector } = config
  // 过滤出交互节点 / Filter interactive nodes only
  const interactiveNodes = nodes.filter(
    (n): n is InteractiveElementDomNode => n.type === 'interactive',
  )

  // 遍历所有元素，按顺序匹配交互节点 / Iterate all elements, match interactive nodes in order
  const allElements = root.querySelectorAll('*')
  let nodeIdx = 0

  for (const el of allElements) {
    if (nodeIdx >= interactiveNodes.length) break
    // 跳过排除的元素 / Skip excluded elements
    if (excludeSelector && el.closest(excludeSelector)) continue
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
