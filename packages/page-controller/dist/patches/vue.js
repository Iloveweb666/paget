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
export function triggerVueInput(element, value) {
    // 使用原生 input value setter 绕过 Vue 的代理 / Use the native input value setter to bypass Vue's proxy
    const nativeInputValueSetter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')?.set ||
        Object.getOwnPropertyDescriptor(HTMLTextAreaElement.prototype, 'value')?.set;
    if (nativeInputValueSetter) {
        nativeInputValueSetter.call(element, value);
    }
    else {
        element.value = value;
    }
    // 派发 Vue v-model 监听的原生事件 / Dispatch native events that Vue's v-model listens to
    element.dispatchEvent(new Event('input', { bubbles: true }));
    element.dispatchEvent(new Event('change', { bubbles: true }));
}
/**
 * 触发 Vue 兼容的 checkbox/radio 变更。
 * Trigger a Vue-compatible checkbox/radio change.
 */
export function triggerVueCheck(element, checked) {
    // 获取原生 checked 属性的 setter / Get the native checked property setter
    const nativeCheckedSetter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'checked')?.set;
    if (nativeCheckedSetter) {
        nativeCheckedSetter.call(element, checked);
    }
    else {
        element.checked = checked;
    }
    // 派发 change 和 input 事件 / Dispatch change and input events
    element.dispatchEvent(new Event('change', { bubbles: true }));
    element.dispatchEvent(new Event('input', { bubbles: true }));
}
/**
 * 触发 Vue 兼容的 select 变更。
 * Element Plus 和其他 Vue 组件库可能使用自定义下拉框，
 * 而非标准的 <select> 元素。
 *
 * Trigger a Vue-compatible select change.
 * Element Plus and other Vue component libraries use custom dropdowns
 * that may not be standard <select> elements.
 */
export function triggerVueSelect(element, value) {
    // 获取原生 value 属性的 setter / Get the native value property setter
    const nativeValueSetter = Object.getOwnPropertyDescriptor(HTMLSelectElement.prototype, 'value')?.set;
    if (nativeValueSetter) {
        nativeValueSetter.call(element, value);
    }
    else {
        element.value = value;
    }
    // 派发 change 事件 / Dispatch change event
    element.dispatchEvent(new Event('change', { bubbles: true }));
}
/**
 * 检测当前页面是否是 Vue 3 应用。
 * Detect if the current page is a Vue 3 application.
 */
export function isVueApp() {
    // 检查 Vue 3 devtools 钩子 / Check Vue 3 devtools hook
    if ('__vue_app__' in document.documentElement)
        return true;
    // 检查根元素上是否有 Vue 3 应用实例 / Check for Vue 3 app instances on root elements
    const root = document.querySelector('#app') || document.querySelector('[data-v-app]');
    if (root && '__vue_app__' in root)
        return true;
    return false;
}
//# sourceMappingURL=vue.js.map