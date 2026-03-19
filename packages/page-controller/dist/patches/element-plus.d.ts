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
export declare function handleElSelect(trigger: Element, optionText: string): Promise<boolean>;
/**
 * 处理 Element Plus DatePicker 组件。
 * el-date-picker 具有复杂的面板结构。
 *
 * Handle Element Plus DatePicker.
 * el-date-picker has a complex panel structure.
 */
export declare function handleElDatePicker(trigger: Element, dateStr: string): Promise<boolean>;
//# sourceMappingURL=element-plus.d.ts.map