import type { AgentAction, ActionResult, BatchResult } from '@paget/shared'

/**
 * 通过选择器映射中的索引点击元素。
 * Click an element by its index in the selector map.
 */
export async function clickElement(
  element: Element,
  options: { doubleClick?: boolean } = {},
): Promise<void> {
  // 计算元素中心坐标 / Calculate the center coordinates of the element
  const rect = element.getBoundingClientRect()
  const x = rect.x + rect.width / 2
  const y = rect.y + rect.height / 2

  // 构造鼠标事件的公共初始化参数 / Build common init params for mouse events
  const commonInit: MouseEventInit = {
    bubbles: true,
    cancelable: true,
    clientX: x,
    clientY: y,
  }

  // 按顺序派发鼠标事件链 / Dispatch mouse event chain in order
  element.dispatchEvent(new MouseEvent('mouseover', commonInit))
  element.dispatchEvent(new MouseEvent('mousedown', commonInit))
  element.dispatchEvent(new MouseEvent('mouseup', commonInit))
  element.dispatchEvent(new MouseEvent('click', commonInit))

  // 如果需要双击，额外派发 dblclick 事件 / If double click needed, dispatch dblclick event
  if (options.doubleClick) {
    element.dispatchEvent(new MouseEvent('dblclick', commonInit))
  }
}

/**
 * 向元素输入文本，先清除已有内容。
 * Input text into an element, clearing existing content first.
 */
export async function inputText(element: Element, text: string): Promise<void> {
  const el = element as HTMLInputElement | HTMLTextAreaElement

  // 聚焦元素 / Focus the element
  el.focus()
  el.dispatchEvent(new FocusEvent('focus', { bubbles: true }))

  // 清除已有值 / Clear existing value
  el.value = ''
  el.dispatchEvent(new Event('input', { bubbles: true }))

  // 设置新值 / Set new value
  el.value = text
  el.dispatchEvent(new Event('input', { bubbles: true }))
  el.dispatchEvent(new Event('change', { bubbles: true }))
}

/**
 * 通过值或文本选择下拉选项。
 * Select a dropdown option by value or text.
 */
export async function selectOption(element: Element, value: string): Promise<void> {
  const select = element as HTMLSelectElement

  // 先按 value 匹配，再按文本内容匹配 / Try matching by value first, then by text
  const option = Array.from(select.options).find(
    (opt) => opt.value === value || opt.textContent?.trim() === value,
  )

  if (option) {
    select.value = option.value
    select.dispatchEvent(new Event('change', { bubbles: true }))
    select.dispatchEvent(new Event('input', { bubbles: true }))
  }
}

/**
 * 在页面或指定元素上垂直滚动。
 * Scroll vertically on the page or a specific element.
 */
export async function scrollVertically(
  direction: 'up' | 'down',
  element?: Element,
  amount = 500,
): Promise<void> {
  const target = element || document.documentElement
  // 根据方向计算滚动偏移量 / Calculate scroll delta based on direction
  const delta = direction === 'down' ? amount : -amount
  target.scrollBy({ top: delta, behavior: 'smooth' })
}

/**
 * 在指定元素上水平滚动。
 * Scroll horizontally on a specific element.
 */
export async function scrollHorizontally(
  direction: 'left' | 'right',
  element?: Element,
  amount = 300,
): Promise<void> {
  const target = element || document.documentElement
  // 根据方向计算水平滚动偏移量 / Calculate horizontal scroll delta based on direction
  const delta = direction === 'right' ? amount : -amount
  target.scrollBy({ left: delta, behavior: 'smooth' })
}

/**
 * 在页面上执行单个操作。
 * Execute a single action on the page.
 */
export async function executeAction(
  action: AgentAction,
  selectorMap: Map<number, Element>,
): Promise<ActionResult> {
  try {
    const { tool, params } = action

    switch (tool) {
      // 点击操作 / Click action
      case 'click': {
        const el = selectorMap.get(params.index as number)
        if (!el) return { action, success: false, error: `Element [${params.index}] not found` }
        await clickElement(el, { doubleClick: params.doubleClick as boolean })
        return { action, success: true, output: `Clicked element [${params.index}]` }
      }

      // 输入操作 / Input action
      case 'input': {
        const el = selectorMap.get(params.index as number)
        if (!el) return { action, success: false, error: `Element [${params.index}] not found` }
        await inputText(el, params.text as string)
        return { action, success: true, output: `Input "${params.text}" into [${params.index}]` }
      }

      // 选择操作 / Select action
      case 'select': {
        const el = selectorMap.get(params.index as number)
        if (!el) return { action, success: false, error: `Element [${params.index}] not found` }
        await selectOption(el, params.value as string)
        return { action, success: true, output: `Selected "${params.value}" in [${params.index}]` }
      }

      // 垂直滚动操作 / Vertical scroll action
      case 'scroll': {
        const el = params.index ? selectorMap.get(params.index as number) : undefined
        await scrollVertically(params.direction as 'up' | 'down', el, params.amount as number)
        return { action, success: true, output: `Scrolled ${params.direction}` }
      }

      // 水平滚动操作 / Horizontal scroll action
      case 'scroll_horizontally': {
        const el = params.index ? selectorMap.get(params.index as number) : undefined
        await scrollHorizontally(params.direction as 'left' | 'right', el, params.amount as number)
        return { action, success: true, output: `Scrolled ${params.direction}` }
      }

      // 等待操作 / Wait action
      case 'wait': {
        const ms = (params.ms as number) || 1000
        await new Promise((resolve) => setTimeout(resolve, ms))
        return { action, success: true, output: `Waited ${ms}ms` }
      }

      // 执行 JavaScript 代码 / Execute JavaScript code
      case 'execute_javascript': {
        const result = eval(params.code as string)
        return { action, success: true, output: String(result) }
      }

      // 未知工具类型 / Unknown tool type
      default:
        return { action, success: false, error: `Unknown tool: ${tool}` }
    }
  } catch (err) {
    return {
      action,
      success: false,
      error: err instanceof Error ? err.message : String(err),
    }
  }
}

/**
 * 按顺序执行一批操作。
 * 遇到第一个错误即停止，剩余操作不再执行。
 *
 * Execute a batch of actions sequentially.
 * Stops on first error — remaining actions are not executed.
 */
export async function executeBatch(
  actions: AgentAction[],
  selectorMap: Map<number, Element>,
  onProgress?: (index: number, result: ActionResult) => void,
): Promise<BatchResult> {
  const results: ActionResult[] = []

  for (let i = 0; i < actions.length; i++) {
    const result = await executeAction(actions[i], selectorMap)
    results.push(result)
    onProgress?.(i, result)

    // 遇到错误立即停止 / Stop immediately on error
    if (!result.success) break

    // 操作之间加入短暂延迟，以确保 DOM 稳定 / Small delay between actions for DOM stability
    if (i < actions.length - 1) {
      await new Promise((resolve) => setTimeout(resolve, 100))
    }
  }

  return {
    results,
    completedCount: results.filter((r) => r.success).length,
  }
}
