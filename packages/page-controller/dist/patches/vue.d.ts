/**
 * Vue 特定的 DOM 补丁。
 * Vue-specific DOM patches.
 *
 * Vue 3 使用响应式系统通过 getter/setter 追踪变化。
 * 以编程方式设置输入值时，需要触发正确的事件链，
 * 以便 Vue 的 v-model 能够捕获变更。
 *
 * Vue 3 uses a reactive system that tracks changes via getters/setters.
 * When programmatically setting input values, we need to trigger the
 * correct event chain so Vue's v-model picks up the change.
 */
/**
 * 触发 Vue 兼容的 input 事件。
 * Vue 3 的 v-model 监听 `input` 事件，并从 `event.target.value` 读取值。
 * 需要确保调用原生 setter，使 Vue 的响应式系统能检测到变更。
 *
 * Trigger a Vue-compatible input event.
 * Vue 3's v-model listens to `input` events with the value read from
 * `event.target.value`. We need to ensure the native setter is called
 * so Vue's reactivity system detects the change.
 */
export declare function triggerVueInput(element: HTMLInputElement | HTMLTextAreaElement, value: string): void;
/**
 * 触发 Vue 兼容的 checkbox/radio 变更。
 * Trigger a Vue-compatible checkbox/radio change.
 */
export declare function triggerVueCheck(element: HTMLInputElement, checked: boolean): void;
/**
 * 触发 Vue 兼容的 select 变更。
 * Element Plus 和其他 Vue 组件库可能使用自定义下拉框，
 * 而非标准的 <select> 元素。
 *
 * Trigger a Vue-compatible select change.
 * Element Plus and other Vue component libraries use custom dropdowns
 * that may not be standard <select> elements.
 */
export declare function triggerVueSelect(element: HTMLSelectElement, value: string): void;
/**
 * 检测当前页面是否是 Vue 3 应用。
 * Detect if the current page is a Vue 3 application.
 */
export declare function isVueApp(): boolean;
//# sourceMappingURL=vue.d.ts.map