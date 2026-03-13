/**
 * Element Plus 组件特定补丁。
 * Element Plus component-specific patches.
 *
 * Element Plus 对 Select、DatePicker、Cascader 等组件使用自定义 DOM 结构。
 * 这些补丁处理所需的非标准交互模式。
 *
 * Element Plus uses custom DOM structures for components like Select,
 * DatePicker, Cascader, etc. These patches handle the non-standard
 * interaction patterns required.
 *
 * TODO: 遇到具体的 Element Plus 组件时再逐步实现 / Implement as specific Element Plus components are encountered.
 */

/**
 * 处理 Element Plus Select 组件。
 * el-select 渲染的是自定义下拉覆盖层，而非原生 <select>。
 * 实际的 input 是 .el-select 内部的一个只读 <input>。
 *
 * Handle Element Plus Select component.
 * el-select renders a custom dropdown overlay, not a native <select>.
 * The actual input is a readonly <input> inside .el-select.
 */
export async function handleElSelect(
  trigger: Element,
  optionText: string,
): Promise<boolean> {
  // 点击触发元素打开下拉菜单 / Click to open dropdown
  const input = trigger.querySelector(".el-input__inner") || trigger;
  input.dispatchEvent(new MouseEvent("click", { bubbles: true }));

  // 等待下拉菜单出现 / Wait for dropdown to appear
  await new Promise((resolve) => setTimeout(resolve, 300));

  // 在下拉覆盖层中查找匹配的选项 / Find option in the dropdown overlay
  const dropdowns = document.querySelectorAll(".el-select-dropdown__item");
  for (const option of dropdowns) {
    if (option.textContent?.trim() === optionText) {
      (option as HTMLElement).click();
      return true;
    }
  }

  return false;
}

/**
 * 处理 Element Plus DatePicker 组件。
 * el-date-picker 具有复杂的面板结构。
 *
 * Handle Element Plus DatePicker.
 * el-date-picker has a complex panel structure.
 */
export async function handleElDatePicker(
  trigger: Element,
  dateStr: string,
): Promise<boolean> {
  // 点击触发元素打开日期面板 / Click to open date panel
  const input = trigger.querySelector(".el-input__inner") as HTMLInputElement;
  if (!input) return false;

  input.dispatchEvent(new MouseEvent("click", { bubbles: true }));
  // 等待日期面板出现 / Wait for date panel to appear
  await new Promise((resolve) => setTimeout(resolve, 300));

  // 简化处理：直接通过 input 设置值 / For simplicity, directly set the value via input
  input.value = dateStr;
  input.dispatchEvent(new Event("input", { bubbles: true }));
  input.dispatchEvent(new Event("change", { bubbles: true }));

  // 关闭面板 / Close panel
  document.body.click();
  return true;
}
