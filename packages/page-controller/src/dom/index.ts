import type { FlatDomNode, InteractiveElementDomNode, TextDomNode } from './dom_tree/types'

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
 * 用于标识元素的属性白名单（对齐 page-agent）
 * Attribute whitelist for element identification (aligned with page-agent)
 */
const RELEVANT_ATTRIBUTES = [
  'title', 'type', 'checked', 'name', 'role', 'value', 'placeholder',
  'alt', 'aria-label', 'aria-expanded', 'data-state', 'aria-checked',
  'id', 'for', 'href', 'target', 'aria-haspopup', 'aria-controls',
  'aria-owns', 'contenteditable',
]

/**
 * 获取元素自身的直接文本内容（不递归子元素）
 * Get the element's own direct text content (non-recursive)
 */
function getOwnTextContent(element: Element): string {
  let text = ''
  for (const child of element.childNodes) {
    // 只取直接文本子节点 / Only take direct text child nodes
    if (child.nodeType === Node.TEXT_NODE) {
      text += child.textContent || ''
    }
  }
  return text.trim()
}

/**
 * 从 DOM 中提取交互元素和文本节点的扁平树。
 * 每个交互元素会被分配一个索引编号，供 LLM 引用。
 * 非交互元素的直接文本会作为上下文文本节点输出（index=-1）。
 *
 * Extract a flat tree of interactive and text nodes from the DOM.
 * Each interactive element is assigned an index for LLM reference.
 * Direct text of non-interactive elements is emitted as context text nodes (index=-1).
 */
export function getFlatTree(
  root: Element = document.body,
  config: DomExtractionConfig = {},
): FlatDomNode[] {
  const { maxDepth = 50, includeHidden = false, excludeSelector } = config
  const nodes: FlatDomNode[] = []
  let index = 0

  /**
   * 递归遍历 DOM 树 / Recursively walk the DOM tree
   * @param insideInteractive 是否在交互元素内部，避免文本重复 / Whether inside an interactive element to avoid text duplication
   */
  function walk(element: Element, depth: number, insideInteractive: boolean) {
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

    const isThisInteractive = isInteractive(element)

    // 如果是交互元素，收集其信息 / If interactive, collect its info
    if (isThisInteractive) {
      const node: InteractiveElementDomNode = {
        type: 'interactive',
        index: index++,
        tagName: element.tagName.toLowerCase(),
        isVisible,
        depth,
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
    } else if (!insideInteractive) {
      // 非交互元素：收集直接文本作为上下文 / Non-interactive element: collect direct text as context
      const ownText = getOwnTextContent(element)
      if (ownText.length >= 2) {
        const textNode: TextDomNode = {
          type: 'text',
          index: -1,
          tagName: element.tagName.toLowerCase(),
          isVisible,
          depth,
          text: ownText.slice(0, 100),
        }
        nodes.push(textNode)
      }
    }

    // 递归处理子元素 / Recursively process child elements
    for (const child of element.children) {
      walk(child, depth + 1, insideInteractive || isThisInteractive)
    }
  }

  walk(root, 0, false)
  return nodes
}

/**
 * 构建属性字符串：过滤 + 去重 + 截断
 * Build attribute string: filter + deduplicate + truncate
 */
function buildAttributeString(node: InteractiveElementDomNode): string {
  const parts: string[] = []
  const seenValues = new Set<string>()
  const text = node.text || ''

  for (const [key, value] of Object.entries(node.attributes)) {
    // role 与 tagName 相同时跳过 / Skip role if same as tagName
    if (key === 'role' && value === node.tagName) continue

    // 文本去重：aria-label / placeholder / title 与 text 相同时从属性中删除
    // Text dedup: remove aria-label / placeholder / title from attrs if same as text
    if ((key === 'aria-label' || key === 'placeholder' || key === 'title') && value === text) continue

    // 属性值去重：同一节点内值相同（>5 字符）时删后出现的
    // Value dedup within same node: skip duplicate values (>5 chars)
    if (value.length > 5 && seenValues.has(value)) continue
    if (value.length > 5) seenValues.add(value)

    // 截断超长属性值 / Truncate long attribute values
    const truncated = value.length > 20 ? value.slice(0, 20) + '...' : value
    parts.push(`${key}=${truncated}`)
  }

  return parts.length > 0 ? ' ' + parts.join(' ') : ''
}

/**
 * 选择显示文本：text > ariaLabel > placeholder
 * Pick display label: text > ariaLabel > placeholder
 */
function pickLabel(node: InteractiveElementDomNode): string {
  return node.text || node.ariaLabel || node.placeholder || ''
}

/**
 * 将扁平树转换为层级化简化字符串，供 LLM 消费。
 * 使用 tab 缩进表示层级关系，自闭合格式减少 token。
 *
 * Convert flat tree to hierarchical simplified string for LLM consumption.
 * Uses tab indentation for hierarchy, self-closing format to reduce tokens.
 */
export function flatTreeToString(nodes: FlatDomNode[]): string {
  const visibleNodes = nodes.filter((n) => n.isVisible)
  if (visibleNodes.length === 0) return ''

  // 计算最小深度作为基准 / Calculate min depth as baseline
  const minDepth = Math.min(...visibleNodes.map((n) => n.depth ?? 0))

  return visibleNodes
    .map((node) => {
      // 计算相对缩进，上限 5 级 / Calculate relative indent, capped at 5
      const relativeDepth = Math.min((node.depth ?? 0) - minDepth, 5)
      const indent = '\t'.repeat(relativeDepth)

      if (node.type === 'interactive') {
        const attrs = buildAttributeString(node)
        const label = pickLabel(node)
        return `${indent}[${node.index}]<${node.tagName}${attrs}>${label} />`
      }

      // 文本节点：直接输出缩进 + 文本 / Text node: output indent + text
      return `${indent}${node.text}`
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
  const interactiveRoles = ['button', 'link', 'textbox', 'checkbox', 'radio', 'tab', 'menuitem', 'option']
  if (role && interactiveRoles.includes(role)) return true

  // 检查 onclick 属性或 tabindex / Check onclick attribute or tabindex
  if (element.getAttribute('onclick') || element.getAttribute('tabindex')) return true

  // 检查 <li> 是否在下拉列表容器内（Element Plus / Element UI 系列组件）
  // Check if <li> is inside a dropdown container (Element Plus / Element UI variants: el-*, eu-*)
  if (tag === 'li') {
    const dropdownParent = element.closest(
      '[class*="select-dropdown"], [class*="select__popper"], [class*="dropdown-menu"], [role="listbox"]'
    )
    if (dropdownParent) return true
  }

  return false
}

/**
 * 提取用于标识元素的相关属性（对齐 page-agent，去掉 class）
 * Extract relevant attributes for identification (aligned with page-agent, no class)
 */
function getRelevantAttributes(element: Element): Record<string, string> {
  const attrs: Record<string, string> = {}
  for (const name of RELEVANT_ATTRIBUTES) {
    const value = element.getAttribute(name)
    if (value) attrs[name] = value
  }
  return attrs
}
