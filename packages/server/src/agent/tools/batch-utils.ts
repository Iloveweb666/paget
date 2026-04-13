/**
 * Batch 动作重组工具 — 确保 dropdown click 只能在队列开头或结尾
 * Batch action restructuring utilities — ensures dropdown clicks are only at the start or end of the queue
 */
import type { AgentAction } from '@paget/shared'

/**
 * 检测动作是否是下拉相关触发器点击
 * Detect if an action is a dropdown trigger click
 */
function isDropdownTriggerAction(action: AgentAction): boolean {
  if (action.tool !== 'click') return false

  const role = action.params?.role as string | undefined
  const ariaHasPopup = action.params?.ariaHaspopup as string | undefined
  const className = (action.params?.className as string | undefined) || ''
  const id = (action.params?.id as string | undefined) || ''
  const key = `${className} ${id}`.toLowerCase()

  if (role && ['combobox', 'listbox', 'option'].includes(role.toLowerCase())) return true
  if (ariaHasPopup && ['listbox', 'menu', 'tree', 'dialog'].includes(ariaHasPopup.toLowerCase())) return true
  if (/(select|dropdown|combobox|option-list|menu-item)/.test(key)) return true

  return false
}

/**
 * 重组 batch actions，确保 dropdown click 只能在队列开头或结尾
 * Restructure batch actions to ensure dropdown clicks are only at the start or end
 *
 * 规则：
 * - 如果 batch 中有 dropdown click 且有后续操作紧跟其后，将 dropdown click 移到队列开头
 * - 如果 dropdown click 后面没有其他操作，保持在原位置（末尾）
 * - 非 dropdown 操作保持相对顺序
 *
 * Rules:
 * - If a dropdown click has actions following it, move the dropdown click to the start
 * - If a dropdown click is at the end with no following actions, keep it at the end
 * - Non-dropdown actions maintain relative order
 */
export function restructureBatchActions(actions: AgentAction[]): AgentAction[] {
  if (actions.length <= 1) return actions

  const dropdownActions: AgentAction[] = []
  const nonDropdownActions: AgentAction[] = []

  for (const action of actions) {
    if (isDropdownTriggerAction(action)) {
      dropdownActions.push(action)
    } else {
      nonDropdownActions.push(action)
    }
  }

  // 如果没有 dropdown 或只有一个 dropdown，不需要重组
  if (dropdownActions.length === 0) return actions
  if (dropdownActions.length === 1 && nonDropdownActions.length === 0) return actions

  // 判断重组策略：
  // 1. 如果 nonDropdownActions 的最后一个是 input/select，认为是选择操作，dropdown 放开头
  // 2. 否则 dropdown 放末尾
  const lastNonDropdownTool = nonDropdownActions.length > 0
    ? nonDropdownActions[nonDropdownActions.length - 1]?.tool
    : null

  const isSelectingAfterDropdown = lastNonDropdownTool === 'input' || lastNonDropdownTool === 'select'

  if (isSelectingAfterDropdown) {
    // dropdown 在开头，后续操作保持选择操作
    return [...dropdownActions, ...nonDropdownActions]
  } else {
    // dropdown 在末尾
    return [...nonDropdownActions, ...dropdownActions]
  }
}
