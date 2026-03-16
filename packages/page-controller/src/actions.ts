/**
 * DOM 操作原语
 * DOM action primitives — aligned with page-agent's battle-tested implementation
 */
import type { AgentAction, ActionResult, BatchResult } from "@paget/shared";

// ======= 通用工具 / General utils =======

/**
 * 等待指定秒数 / Wait for specified seconds
 */
async function waitFor(seconds: number): Promise<void> {
  await new Promise((resolve) => setTimeout(resolve, seconds * 1000));
}

// ======= DOM 工具 / DOM utils =======

/**
 * 将遮罩层指针移动到元素中心位置（触发视觉反馈）
 * Move mask pointer to element center (triggers visual feedback)
 */
export async function movePointerToElement(
  element: HTMLElement,
): Promise<void> {
  const rect = element.getBoundingClientRect();
  const x = rect.left + rect.width / 2;
  const y = rect.top + rect.height / 2;

  // 派发自定义事件供 SimulatorMask 监听 / Dispatch custom event for SimulatorMask
  window.dispatchEvent(
    new CustomEvent("PageAgent::MovePointerTo", { detail: { x, y } }),
  );

  await waitFor(0.3);
}

/**
 * 如果元素不在视口内则滚动到可见位置
 * Scroll element into view if not currently visible
 */
export async function scrollIntoViewIfNeeded(
  element: HTMLElement,
): Promise<void> {
  // 优先使用非标准但更精确的 scrollIntoViewIfNeeded / Prefer non-standard but more precise method
  const el = element as any;
  if (el.scrollIntoViewIfNeeded) {
    el.scrollIntoViewIfNeeded();
  } else {
    el.scrollIntoView({ behavior: "auto", block: "center", inline: "nearest" });
  }
}

// 记录上一次点击的元素，以便在下一次点击前清理焦点 / Track last clicked element for blur cleanup
let lastClickedElement: HTMLElement | null = null;

/**
 * 清除上一次点击的元素的焦点状态
 * Blur the previously clicked element
 */
function blurLastClickedElement(): void {
  if (lastClickedElement) {
    lastClickedElement.blur();
    lastClickedElement.dispatchEvent(
      new MouseEvent("mouseout", { bubbles: true, cancelable: true }),
    );
    lastClickedElement = null;
  }
}

/**
 * 模拟完整的点击事件链
 * Simulate a full click event chain
 *
 * 事件顺序 / Event sequence:
 * blur previous → scrollIntoView → movePointer → mouseenter → mouseover
 * → mousedown → focus → mouseup → click → wait
 */
export async function clickElement(element: HTMLElement): Promise<void> {
  // 清理上一个被点击元素的状态 / Clean up previous clicked element
  blurLastClickedElement();
  lastClickedElement = element;

  // 确保元素在视口内 / Ensure element is in viewport
  await scrollIntoViewIfNeeded(element);

  // 移动指针到元素中心（视觉反馈）/ Move pointer to element center (visual feedback)
  await movePointerToElement(element);

  // 派发点击动画事件 / Dispatch click animation event
  window.dispatchEvent(new CustomEvent("PageAgent::ClickPointer"));
  await waitFor(0.1);

  // 悬停事件 / Hover events
  element.dispatchEvent(
    new MouseEvent("mouseenter", { bubbles: true, cancelable: true }),
  );
  element.dispatchEvent(
    new MouseEvent("mouseover", { bubbles: true, cancelable: true }),
  );

  // 按下、聚焦、抬起、点击 / Press, focus, release, click
  element.dispatchEvent(
    new MouseEvent("mousedown", { bubbles: true, cancelable: true }),
  );
  element.focus();
  element.dispatchEvent(
    new MouseEvent("mouseup", { bubbles: true, cancelable: true }),
  );
  element.dispatchEvent(
    new MouseEvent("click", { bubbles: true, cancelable: true }),
  );

  // 等待确保点击事件处理完成 / Wait for click event processing
  await waitFor(0.2);
}

// 原生 value setter，绕过框架代理（React/Vue）/ Native value setters to bypass framework proxies
// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
const nativeInputValueSetter = Object.getOwnPropertyDescriptor(
  window.HTMLInputElement.prototype,
  "value",
)!.set!;

// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
const nativeTextAreaValueSetter = Object.getOwnPropertyDescriptor(
  window.HTMLTextAreaElement.prototype,
  "value",
)!.set!;

/**
 * 向元素输入文本（对齐 page-agent 实现）
 * Input text into an element (aligned with page-agent)
 *
 * 支持三种类型 / Supports three types:
 * - HTMLInputElement / HTMLTextAreaElement：使用原生 setter 触发框架响应式
 * - contenteditable：使用 beforeinput + input 事件序列
 */
export async function inputText(
  element: HTMLElement,
  text: string,
): Promise<void> {
  const isContentEditable = element.isContentEditable;

  if (
    !(element instanceof HTMLInputElement) &&
    !(element instanceof HTMLTextAreaElement) &&
    !isContentEditable
  ) {
    throw new Error("Element is not an input, textarea, or contenteditable");
  }

  // 先点击元素使其获得焦点 / Click element first to focus it
  await clickElement(element);

  if (isContentEditable) {
    // Contenteditable 支持（部分）/ Contenteditable support (partial)
    // 适用于：LinkedIn、React contenteditable、Quill
    // Works: LinkedIn, React contenteditable, Quill
    // 不适用于：Slate.js / Fails: Slate.js
    // 事件序列：beforeinput → mutation → input → change → blur
    // Sequence: beforeinput → mutation → input → change → blur

    // 清除阶段 / Clearing phase
    if (
      element.dispatchEvent(
        new InputEvent("beforeinput", {
          bubbles: true,
          cancelable: true,
          inputType: "deleteContent",
        }),
      )
    ) {
      element.innerText = "";
      element.dispatchEvent(
        new InputEvent("input", {
          bubbles: true,
          inputType: "deleteContent",
        }),
      );
    }

    // 插入阶段（对 React 应用尤为重要）/ Insertion phase (important for React apps)
    if (
      element.dispatchEvent(
        new InputEvent("beforeinput", {
          bubbles: true,
          cancelable: true,
          inputType: "insertText",
          data: text,
        }),
      )
    ) {
      element.innerText = text;
      element.dispatchEvent(
        new InputEvent("input", {
          bubbles: true,
          inputType: "insertText",
          data: text,
        }),
      );
    }

    // 派发 change 事件 / Dispatch change event
    element.dispatchEvent(new Event("change", { bubbles: true }));

    // 触发 blur 以便表单验证 / Trigger blur for validation
    element.blur();
  } else if (element instanceof HTMLTextAreaElement) {
    // 使用原生 setter 绕过 Vue/React 代理 / Use native setter to bypass Vue/React proxy
    nativeTextAreaValueSetter.call(element, text);
  } else {
    // HTMLInputElement
    nativeInputValueSetter.call(element, text);
  }

  // 非 contenteditable 需要额外派发 input 事件 / Non-contenteditable needs extra input event
  if (!isContentEditable) {
    element.dispatchEvent(new Event("input", { bubbles: true }));
  }

  await waitFor(0.1);

  // 清理焦点状态 / Clean up focus
  blurLastClickedElement();
}

/**
 * 选择下拉选项（对齐 page-agent 实现）
 * Select a dropdown option (aligned with page-agent)
 */
export async function selectOption(
  element: HTMLSelectElement,
  optionText: string,
): Promise<void> {
  if (!(element instanceof HTMLSelectElement)) {
    throw new Error("Element is not a select element");
  }

  const options = Array.from(element.options);
  const option = options.find(
    (opt) => opt.textContent?.trim() === optionText.trim(),
  );

  if (!option) {
    throw new Error(
      `Option with text "${optionText}" not found in select element`,
    );
  }

  element.value = option.value;
  element.dispatchEvent(new Event("change", { bubbles: true }));

  await waitFor(0.1);
}

/**
 * 垂直滚动（对齐 page-agent 实现）
 * Scroll vertically (aligned with page-agent)
 *
 * 支持元素级和页面级滚动，会自动检测可滚动容器（CSS overflow 属性）
 * Supports element-level and page-level scrolling, auto-detects scrollable
 * containers via CSS overflow properties
 */
export async function scrollVertically(
  down: boolean,
  scrollAmount: number,
  element?: HTMLElement | null,
): Promise<string> {
  // 元素级滚动：沿 DOM 树向上查找可滚动容器 / Element scroll: walk up DOM to find scrollable container
  if (element) {
    let currentElement: HTMLElement | null = element;
    let attempts = 0;
    const dy = scrollAmount;

    while (currentElement && attempts < 10) {
      const computedStyle = window.getComputedStyle(currentElement);
      const hasScrollableY = /(auto|scroll|overlay)/.test(
        computedStyle.overflowY,
      );
      const canScrollVertically =
        currentElement.scrollHeight > currentElement.clientHeight;

      if (hasScrollableY && canScrollVertically) {
        const beforeScroll = currentElement.scrollTop;
        const maxScroll =
          currentElement.scrollHeight - currentElement.clientHeight;
        let amount = dy / 3;

        if (amount > 0) {
          amount = Math.min(amount, maxScroll - beforeScroll);
        } else {
          amount = Math.max(amount, -beforeScroll);
        }

        currentElement.scrollTop = beforeScroll + amount;
        const actualDelta = currentElement.scrollTop - beforeScroll;

        if (Math.abs(actualDelta) > 0.5) {
          return `Scrolled container (${currentElement.tagName}) by ${actualDelta}px`;
        }
      }

      if (
        currentElement === document.body ||
        currentElement === document.documentElement
      )
        break;
      currentElement = currentElement.parentElement as HTMLElement | null;
      attempts++;
    }

    return `No scrollable container found for element (${element.tagName})`;
  }

  // 页面级滚动：查找可滚动的容器或回退到 document / Page scroll: find scrollable container or fallback
  const dy = scrollAmount;
  const bigEnough = (el: HTMLElement) =>
    el.clientHeight >= window.innerHeight * 0.5;
  const canScroll = (el: HTMLElement | null): boolean =>
    !!el &&
    /(auto|scroll|overlay)/.test(getComputedStyle(el).overflowY) &&
    el.scrollHeight > el.clientHeight &&
    bigEnough(el);

  // 从当前焦点元素向上查找 / Walk up from currently focused element
  let el: HTMLElement | null = document.activeElement as HTMLElement | null;
  while (el && !canScroll(el) && el !== document.body)
    el = el.parentElement as HTMLElement | null;

  // 如果找不到，全局查找或回退到文档根 / If not found, global search or fallback to document root
  if (!canScroll(el)) {
    el =
      Array.from(document.querySelectorAll<HTMLElement>("*")).find((e) =>
        canScroll(e),
      ) ||
      (document.scrollingElement as HTMLElement) ||
      document.documentElement;
  }

  if (
    el === document.scrollingElement ||
    el === document.documentElement ||
    el === document.body
  ) {
    // 页面级滚动 / Page-level scroll
    const scrollBefore = window.scrollY;
    const scrollMax =
      document.documentElement.scrollHeight - window.innerHeight;

    window.scrollBy(0, dy);

    const scrollAfter = window.scrollY;
    const scrolled = scrollAfter - scrollBefore;

    if (Math.abs(scrolled) < 1) {
      return dy > 0
        ? "Already at the bottom of the page, cannot scroll down further."
        : "Already at the top of the page, cannot scroll up further.";
    }

    const reachedBottom = dy > 0 && scrollAfter >= scrollMax - 1;
    const reachedTop = dy < 0 && scrollAfter <= 1;

    if (reachedBottom)
      return `Scrolled page by ${scrolled}px. Reached the bottom of the page.`;
    if (reachedTop)
      return `Scrolled page by ${scrolled}px. Reached the top of the page.`;
    return `Scrolled page by ${scrolled}px.`;
  } else {
    // 容器级滚动 / Container-level scroll
    const container = el!;
    const scrollBefore = container.scrollTop;
    const scrollMax = container.scrollHeight - container.clientHeight;

    container.scrollBy({ top: dy, behavior: "smooth" });
    await waitFor(0.1);

    const scrollAfter = container.scrollTop;
    const scrolled = scrollAfter - scrollBefore;

    if (Math.abs(scrolled) < 1) {
      return dy > 0
        ? `Already at the bottom of container (${container.tagName}), cannot scroll down further.`
        : `Already at the top of container (${container.tagName}), cannot scroll up further.`;
    }

    const reachedBottom = dy > 0 && scrollAfter >= scrollMax - 1;
    const reachedTop = dy < 0 && scrollAfter <= 1;

    if (reachedBottom)
      return `Scrolled container (${container.tagName}) by ${scrolled}px. Reached the bottom.`;
    if (reachedTop)
      return `Scrolled container (${container.tagName}) by ${scrolled}px. Reached the top.`;
    return `Scrolled container (${container.tagName}) by ${scrolled}px.`;
  }
}

/**
 * 水平滚动（对齐 page-agent 实现）
 * Scroll horizontally (aligned with page-agent)
 */
export async function scrollHorizontally(
  right: boolean,
  scrollAmount: number,
  element?: HTMLElement | null,
): Promise<string> {
  // 元素级滚动 / Element-level scroll
  if (element) {
    let currentElement: HTMLElement | null = element;
    let attempts = 0;
    const dx = right ? scrollAmount : -scrollAmount;

    while (currentElement && attempts < 10) {
      const computedStyle = window.getComputedStyle(currentElement);
      const hasScrollableX = /(auto|scroll|overlay)/.test(
        computedStyle.overflowX,
      );
      const canScrollHorizontally =
        currentElement.scrollWidth > currentElement.clientWidth;

      if (hasScrollableX && canScrollHorizontally) {
        const beforeScroll = currentElement.scrollLeft;
        const maxScroll =
          currentElement.scrollWidth - currentElement.clientWidth;
        let amount = dx / 3;

        if (amount > 0) {
          amount = Math.min(amount, maxScroll - beforeScroll);
        } else {
          amount = Math.max(amount, -beforeScroll);
        }

        currentElement.scrollLeft = beforeScroll + amount;
        const actualDelta = currentElement.scrollLeft - beforeScroll;

        if (Math.abs(actualDelta) > 0.5) {
          return `Scrolled container (${currentElement.tagName}) horizontally by ${actualDelta}px`;
        }
      }

      if (
        currentElement === document.body ||
        currentElement === document.documentElement
      )
        break;
      currentElement = currentElement.parentElement as HTMLElement | null;
      attempts++;
    }

    return `No horizontally scrollable container found for element (${element.tagName})`;
  }

  // 页面级滚动 / Page-level scroll
  const dx = right ? scrollAmount : -scrollAmount;
  const bigEnough = (el: HTMLElement) =>
    el.clientWidth >= window.innerWidth * 0.5;
  const canScroll = (el: HTMLElement | null): boolean =>
    !!el &&
    /(auto|scroll|overlay)/.test(getComputedStyle(el).overflowX) &&
    el.scrollWidth > el.clientWidth &&
    bigEnough(el);

  let el: HTMLElement | null = document.activeElement as HTMLElement | null;
  while (el && !canScroll(el) && el !== document.body)
    el = el.parentElement as HTMLElement | null;

  if (!canScroll(el)) {
    el =
      Array.from(document.querySelectorAll<HTMLElement>("*")).find((e) =>
        canScroll(e),
      ) ||
      (document.scrollingElement as HTMLElement) ||
      document.documentElement;
  }

  if (
    el === document.scrollingElement ||
    el === document.documentElement ||
    el === document.body
  ) {
    const scrollBefore = window.scrollX;
    const scrollMax = document.documentElement.scrollWidth - window.innerWidth;

    window.scrollBy(dx, 0);

    const scrollAfter = window.scrollX;
    const scrolled = scrollAfter - scrollBefore;

    if (Math.abs(scrolled) < 1) {
      return dx > 0
        ? "Already at the right edge of the page, cannot scroll right further."
        : "Already at the left edge of the page, cannot scroll left further.";
    }

    const reachedRight = dx > 0 && scrollAfter >= scrollMax - 1;
    const reachedLeft = dx < 0 && scrollAfter <= 1;

    if (reachedRight)
      return `Scrolled page by ${scrolled}px. Reached the right edge of the page.`;
    if (reachedLeft)
      return `Scrolled page by ${scrolled}px. Reached the left edge of the page.`;
    return `Scrolled page horizontally by ${scrolled}px.`;
  } else {
    const container = el!;
    const scrollBefore = container.scrollLeft;
    const scrollMax = container.scrollWidth - container.clientWidth;

    container.scrollBy({ left: dx, behavior: "smooth" });
    await waitFor(0.1);

    const scrollAfter = container.scrollLeft;
    const scrolled = scrollAfter - scrollBefore;

    if (Math.abs(scrolled) < 1) {
      return dx > 0
        ? `Already at the right edge of container (${container.tagName}), cannot scroll right further.`
        : `Already at the left edge of container (${container.tagName}), cannot scroll left further.`;
    }

    const reachedRight = dx > 0 && scrollAfter >= scrollMax - 1;
    const reachedLeft = dx < 0 && scrollAfter <= 1;

    if (reachedRight)
      return `Scrolled container (${container.tagName}) by ${scrolled}px. Reached the right edge.`;
    if (reachedLeft)
      return `Scrolled container (${container.tagName}) by ${scrolled}px. Reached the left edge.`;
    return `Scrolled container (${container.tagName}) horizontally by ${scrolled}px.`;
  }
}

/**
 * 在页面上执行单个操作
 * Execute a single action on the page
 */
export async function executeAction(
  action: AgentAction,
  selectorMap: Map<number, Element>,
): Promise<ActionResult> {
  try {
    const { tool, params } = action;

    /**
     * 从索引映射中获取 HTMLElement / Get HTMLElement from index map
     */
    function getElement(index: number): HTMLElement {
      const el = selectorMap.get(index);
      if (!el) throw new Error(`Element [${index}] not found`);
      if (!(el instanceof HTMLElement))
        throw new Error(`Element [${index}] is not an HTMLElement`);
      return el;
    }

    switch (tool) {
      // 点击操作 / Click action
      case "click": {
        const el = getElement(params.index as number);
        await clickElement(el);

        // 处理新标签页链接 / Handle links that open in new tabs
        if (el instanceof HTMLAnchorElement && el.target === "_blank") {
          return {
            action,
            success: true,
            output: `Clicked element [${params.index}]. Link opened in a new tab.`,
          };
        }
        return {
          action,
          success: true,
          output: `Clicked element [${params.index}]`,
        };
      }

      // 输入操作 / Input action
      case "input": {
        const el = getElement(params.index as number);
        await inputText(el, params.text as string);
        return {
          action,
          success: true,
          output: `Input "${params.text}" into [${params.index}]`,
        };
      }

      // 选择操作 / Select action
      case "select": {
        const el = getElement(params.index as number);
        await selectOption(
          el as HTMLSelectElement,
          (params.value || params.optionText) as string,
        );
        return {
          action,
          success: true,
          output: `Selected "${params.value || params.optionText}" in [${params.index}]`,
        };
      }

      // 垂直滚动操作 / Vertical scroll action
      case "scroll": {
        const el =
          params.index != null ? getElement(params.index as number) : null;
        const down = params.direction === "down" || params.down === true;
        const amount =
          (params.amount as number) ||
          (params.pixels as number) ||
          window.innerHeight;
        const msg = await scrollVertically(down, down ? amount : -amount, el);
        return { action, success: true, output: msg };
      }

      // 水平滚动操作 / Horizontal scroll action
      case "scroll_horizontally": {
        const el =
          params.index != null ? getElement(params.index as number) : null;
        const isRight = params.direction === "right" || params.right === true;
        const amount =
          (params.amount as number) || (params.pixels as number) || 300;
        const msg = await scrollHorizontally(isRight, amount, el);
        return { action, success: true, output: msg };
      }

      // 等待操作 / Wait action
      case "wait": {
        const ms =
          (params.ms as number) || (params.seconds as number)
            ? (params.seconds as number) * 1000
            : 1000;
        await new Promise((resolve) => setTimeout(resolve, ms));
        return { action, success: true, output: `Waited ${ms}ms` };
      }

      // 执行 JavaScript 代码 / Execute JavaScript code
      case "execute_javascript": {
        // 支持 async/await 语法 / Support async/await syntax
        const asyncFn = eval(`(async () => { ${params.code as string} })`);
        const result = await asyncFn();
        return {
          action,
          success: true,
          output: `Executed JavaScript. Result: ${String(result)}`,
        };
      }

      // 任务完成标记 / Task completion marker
      case "done": {
        return {
          action,
          success: true,
          output: (params.data as string) || "Task completed",
        };
      }

      // 未知工具类型 / Unknown tool type
      default:
        return { action, success: false, error: `Unknown tool: ${tool}` };
    }
  } catch (err) {
    return {
      action,
      success: false,
      error: err instanceof Error ? err.message : String(err),
    };
  }
}

/**
 * 按顺序执行一批操作（遇错即停）
 * Execute a batch of actions sequentially (fail-fast)
 */
export async function executeBatch(
  actions: AgentAction[],
  selectorMap: Map<number, Element>,
  onProgress?: (index: number, result: ActionResult) => void,
): Promise<BatchResult> {
  const results: ActionResult[] = [];

  for (let i = 0; i < actions.length; i++) {
    const result = await executeAction(actions[i], selectorMap);
    results.push(result);
    onProgress?.(i, result);

    // 遇到错误立即停止 / Stop immediately on error
    if (!result.success) break;

    // 操作之间加入短暂延迟以确保 DOM 稳定 / Small delay between actions for DOM stability
    if (i < actions.length - 1) {
      await new Promise((resolve) => setTimeout(resolve, 100));
    }
  }

  return {
    results,
    completedCount: results.filter((r) => r.success).length,
  };
}
