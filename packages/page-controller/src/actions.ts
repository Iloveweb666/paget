/**
 * Copyright (C) 2025 Alibaba Group Holding Limited
 * All rights reserved.
 *
 * DOM 操作原语（完全复刻 page-agent）+ paget 扩展
 * DOM action primitives (fully replicated from page-agent) + paget extensions
 */
import type { AgentAction, ActionResult, BatchResult } from '@paget/shared'
import type { InteractiveElementDomNode } from './dom/dom_tree/type'
import {
	clickPointer,
	disablePassThrough,
	enablePassThrough,
	getIframeOffset,
	getNativeValueSetter,
	isAnchorElement,
	isHTMLElement,
	isInputElement,
	isSelectElement,
	isTextAreaElement,
	movePointerToElement,
	waitFor,
} from './utils'
import { isVueApp, triggerVueCheck, triggerVueInput, triggerVueSelect } from './patches/vue'

/**
 * Get the HTMLElement by index from a selectorMap.
 * @private Internal method, subject to change at any time.
 */
export function getElementByIndex(
	selectorMap: Map<number, InteractiveElementDomNode>,
	index: number
): HTMLElement {
	const interactiveNode = selectorMap.get(index)
	if (!interactiveNode) {
		throw new Error(`No interactive element found at index ${index}`)
	}

	const element = interactiveNode.ref
	if (!element) {
		throw new Error(`Element at index ${index} does not have a reference`)
	}

	if (!isHTMLElement(element)) {
		throw new Error(`Element at index ${index} is not an HTMLElement`)
	}

	return element
}

let lastClickedElement: HTMLElement | null = null

function blurLastClickedElement() {
	if (lastClickedElement) {
		lastClickedElement.dispatchEvent(new PointerEvent('pointerout', { bubbles: true }))
		lastClickedElement.dispatchEvent(new PointerEvent('pointerleave', { bubbles: false }))
		lastClickedElement.dispatchEvent(new MouseEvent('mouseout', { bubbles: true }))
		lastClickedElement.dispatchEvent(new MouseEvent('mouseleave', { bubbles: false }))
		lastClickedElement.blur()
		lastClickedElement = null
	}
}

/**
 * Simulate a full click following W3C Pointer Events + UI Events spec order:
 * pointerover/enter → mouseover/enter → pointerdown → mousedown → [focus] →
 * pointerup → mouseup → click
 *
 * @private Internal method, subject to change at any time.
 */
export async function clickElement(element: HTMLElement) {
	blurLastClickedElement()

	lastClickedElement = element

	await scrollIntoViewIfNeeded(element)
	const frame = element.ownerDocument.defaultView?.frameElement
	if (frame) await scrollIntoViewIfNeeded(frame)

	const rect = element.getBoundingClientRect()
	const x = rect.left + rect.width / 2
	const y = rect.top + rect.height / 2

	await movePointerToElement(element, x, y)
	await clickPointer()

	await waitFor(0.1)

	// Hit-test to find the deepest element at click coordinates, matching
	// real browser behavior where events target the innermost element.
	// @note This may hit a element in the blacklist
	// TODO: This is a temporary workaround. Should have been handled during dom extraction.
	const doc = element.ownerDocument
	await enablePassThrough()
	const hitTarget = doc.elementFromPoint(x, y)
	await disablePassThrough()
	const target =
		hitTarget instanceof HTMLElement && element.contains(hitTarget) ? hitTarget : element

	const pointerOpts = {
		bubbles: true,
		cancelable: true,
		clientX: x,
		clientY: y,
		pointerType: 'mouse',
	}
	const mouseOpts = { bubbles: true, cancelable: true, clientX: x, clientY: y, button: 0 }

	// Hover — pointer events first, then mouse events (spec order)
	target.dispatchEvent(new PointerEvent('pointerover', pointerOpts))
	target.dispatchEvent(new PointerEvent('pointerenter', { ...pointerOpts, bubbles: false }))
	target.dispatchEvent(new MouseEvent('mouseover', mouseOpts))
	target.dispatchEvent(new MouseEvent('mouseenter', { ...mouseOpts, bubbles: false }))

	// Press
	target.dispatchEvent(new PointerEvent('pointerdown', pointerOpts))
	target.dispatchEvent(new MouseEvent('mousedown', mouseOpts))

	// Focus is not part of the standard pointer/mouse event sequence
	// "undefined and varies between user agents".
	// We focus the original element (nearest focusable ancestor), not the hit-test target, matching browser behavior.
	element.focus({ preventScroll: true })

	// Release
	target.dispatchEvent(new PointerEvent('pointerup', pointerOpts))
	target.dispatchEvent(new MouseEvent('mouseup', mouseOpts))

	// Click — activation behavior (navigation, form submit, etc.) triggers
	// via bubbling from target up to the interactive ancestor.
	target.click()

	await waitFor(0.2)
}

/**
 * @private Internal method, subject to change at any time.
 */
export async function inputTextElement(element: HTMLElement, text: string) {
	const isContentEditable = element.isContentEditable
	if (!isInputElement(element) && !isTextAreaElement(element) && !isContentEditable) {
		throw new Error('Element is not an input, textarea, or contenteditable')
	}

	await clickElement(element)

	if (isContentEditable) {
		// Contenteditable support (partial)
		// Not supported:
		// - Monaco/CodeMirror: Require direct JS instance access. No universal way to obtain.
		// - Draft.js: Not responsive to synthetic/execCommand/Range/DataTransfer. Unmaintained.
		//
		// Strategy: Try Plan A (synthetic events) first, then verify and fall back
		// to Plan B (execCommand) if the text wasn't actually inserted.
		//
		// Plan A: Dispatch synthetic events
		// Works: React contenteditable, Quill.
		// Fails: Slate.js, some contenteditable editors that ignore synthetic events.
		// Sequence: beforeinput -> mutation -> input -> change -> blur

		// Dispatch beforeinput + mutation + input for clearing
		if (
			element.dispatchEvent(
				new InputEvent('beforeinput', {
					bubbles: true,
					cancelable: true,
					inputType: 'deleteContent',
				})
			)
		) {
			element.innerText = ''
			element.dispatchEvent(
				new InputEvent('input', {
					bubbles: true,
					inputType: 'deleteContent',
				})
			)
		}

		// Dispatch beforeinput + mutation + input for insertion (important for React apps)
		if (
			element.dispatchEvent(
				new InputEvent('beforeinput', {
					bubbles: true,
					cancelable: true,
					inputType: 'insertText',
					data: text,
				})
			)
		) {
			element.innerText = text
			element.dispatchEvent(
				new InputEvent('input', {
					bubbles: true,
					inputType: 'insertText',
					data: text,
				})
			)
		}

		// Verify Plan A worked by checking if the text was actually inserted
		const planASucceeded = element.innerText.trim() === text.trim()

		if (!planASucceeded) {
			// Plan B: execCommand fallback (deprecated but widely supported)
			// Works: Quill, Slate.js, react contenteditable components.
			// This approach integrates with the browser's undo stack and is handled
			// natively by most rich-text editors.
			element.focus()

			// Select all existing content and delete it
			const doc = element.ownerDocument
			const selection = (doc.defaultView || window).getSelection()
			const range = doc.createRange()
			range.selectNodeContents(element)
			selection?.removeAllRanges()
			selection?.addRange(range)

			// eslint-disable-next-line @typescript-eslint/no-deprecated
			doc.execCommand('delete', false)
			// eslint-disable-next-line @typescript-eslint/no-deprecated
			doc.execCommand('insertText', false, text)
		}

		// Dispatch change event (for good measure)
		element.dispatchEvent(new Event('change', { bubbles: true }))

		// Trigger blur for validation
		element.blur()
	} else {
		getNativeValueSetter(element as HTMLInputElement | HTMLTextAreaElement).call(element, text)
	}

	// Only dispatch shared input event for non-contenteditable (contenteditable has its own)
	if (!isContentEditable) {
		element.dispatchEvent(new Event('input', { bubbles: true }))
	}

	await waitFor(0.1)

	blurLastClickedElement()
}

/**
 * @todo browser-use version is very complex and supports menu tags, need to follow up
 * @private Internal method, subject to change at any time.
 */
export async function selectOptionElement(selectElement: HTMLSelectElement, optionText: string) {
	if (!isSelectElement(selectElement)) {
		throw new Error('Element is not a select element')
	}

	const options = Array.from(selectElement.options)
	const option = options.find((opt) => opt.textContent?.trim() === optionText.trim())

	if (!option) {
		throw new Error(`Option with text "${optionText}" not found in select element`)
	}

	selectElement.value = option.value
	selectElement.dispatchEvent(new Event('change', { bubbles: true }))

	await waitFor(0.1) // Wait to ensure change event processing completes
}

interface ScrollableElement extends Element {
	scrollIntoViewIfNeeded?: (centerIfNeeded?: boolean) => void
}

/**
 * @private Internal method, subject to change at any time.
 */
export async function scrollIntoViewIfNeeded(element: Element) {
	const el = element as ScrollableElement
	if (typeof el.scrollIntoViewIfNeeded === 'function') {
		el.scrollIntoViewIfNeeded()
		// await waitFor(0.5) // Animation playback
	} else {
		// @todo visibility check
		element.scrollIntoView({ behavior: 'auto', block: 'center', inline: 'nearest' })
		// await waitFor(0.5) // Animation playback
	}
}

export async function scrollVertically(scroll_amount: number, element?: HTMLElement | null) {
	// Element-specific scrolling if element is provided
	if (element) {
		const targetElement = element
		let currentElement = targetElement as HTMLElement | null
		let scrollSuccess = false
		let scrolledElement: HTMLElement | null = null
		let scrollDelta = 0
		let attempts = 0
		const dy = scroll_amount

		while (currentElement && attempts < 10) {
			const computedStyle = window.getComputedStyle(currentElement)
			const hasScrollableY =
				/(auto|scroll|overlay)/.test(computedStyle.overflowY) ||
				(computedStyle.scrollbarWidth && computedStyle.scrollbarWidth !== 'auto') ||
				(computedStyle.scrollbarGutter && computedStyle.scrollbarGutter !== 'auto')
			const canScrollVertically = currentElement.scrollHeight > currentElement.clientHeight

			if (hasScrollableY && canScrollVertically) {
				const beforeScroll = currentElement.scrollTop
				const maxScroll = currentElement.scrollHeight - currentElement.clientHeight

				let scrollAmount = dy / 3

				if (scrollAmount > 0) {
					scrollAmount = Math.min(scrollAmount, maxScroll - beforeScroll)
				} else {
					scrollAmount = Math.max(scrollAmount, -beforeScroll)
				}

				currentElement.scrollTop = beforeScroll + scrollAmount

				const afterScroll = currentElement.scrollTop
				const actualScrollDelta = afterScroll - beforeScroll

				if (Math.abs(actualScrollDelta) > 0.5) {
					scrollSuccess = true
					scrolledElement = currentElement
					scrollDelta = actualScrollDelta
					break
				}
			}

			if (currentElement === document.body || currentElement === document.documentElement) {
				break
			}
			currentElement = currentElement.parentElement
			attempts++
		}

		if (scrollSuccess) {
			return `Scrolled container (${scrolledElement?.tagName}) by ${scrollDelta}px`
		} else {
			return `No scrollable container found for element (${targetElement.tagName})`
		}
	}

	// Page-level scrolling (default or fallback)

	const dy = scroll_amount
	const bigEnough = (el: HTMLElement) => el.clientHeight >= window.innerHeight * 0.5
	const canScroll = (el: HTMLElement | null) =>
		el &&
		/(auto|scroll|overlay)/.test(getComputedStyle(el).overflowY) &&
		el.scrollHeight > el.clientHeight &&
		bigEnough(el)

	// @deprecated Heuristic container search.
	// Unreliable in multi-panel layouts. Should guide LLMs to use indexed scroll for consistency.
	// TODO: remove this fallback

	// try to find the nearest scrollable container
	// document.activeElement is usually body.
	// After a successful element.focus(), activeElement become the nearest focusable parent

	let el: HTMLElement | null = document.activeElement as HTMLElement | null
	while (el && !canScroll(el) && el !== document.body) el = el.parentElement

	// Something is wrong if it falls back to global '*' search
	// TODO: Return error message instead of global '*' search

	el = canScroll(el)
		? el
		: Array.from(document.querySelectorAll<HTMLElement>('*')).find(canScroll) ||
			(document.scrollingElement as HTMLElement) ||
			(document.documentElement as HTMLElement)

	if (el === document.scrollingElement || el === document.documentElement || el === document.body) {
		// Page-level scroll
		const scrollBefore = window.scrollY
		const scrollMax = document.documentElement.scrollHeight - window.innerHeight

		window.scrollBy(0, dy)

		const scrollAfter = window.scrollY
		const scrolled = scrollAfter - scrollBefore

		if (Math.abs(scrolled) < 1) {
			return dy > 0
				? `⚠️ Already at the bottom of the page, cannot scroll down further.`
				: `⚠️ Already at the top of the page, cannot scroll up further.`
		}

		const reachedBottom = dy > 0 && scrollAfter >= scrollMax - 1
		const reachedTop = dy < 0 && scrollAfter <= 1

		if (reachedBottom) return `✅ Scrolled page by ${scrolled}px. Reached the bottom of the page.`
		if (reachedTop) return `✅ Scrolled page by ${scrolled}px. Reached the top of the page.`
		return `✅ Scrolled page by ${scrolled}px.`
	} else {
		// Container scroll

		const warningMsg = `The document is not scrollable. Falling back to container scroll.`
		console.log(`[PageController] ${warningMsg}`)

		const scrollBefore = el!.scrollTop
		const scrollMax = el!.scrollHeight - el!.clientHeight

		el!.scrollBy({ top: dy, behavior: 'smooth' })
		await waitFor(0.1)

		const scrollAfter = el!.scrollTop
		const scrolled = scrollAfter - scrollBefore

		if (Math.abs(scrolled) < 1) {
			return dy > 0
				? `⚠️ ${warningMsg} Already at the bottom of container (${el!.tagName}), cannot scroll down further.`
				: `⚠️ ${warningMsg} Already at the top of container (${el!.tagName}), cannot scroll up further.`
		}

		const reachedBottom = dy > 0 && scrollAfter >= scrollMax - 1
		const reachedTop = dy < 0 && scrollAfter <= 1

		if (reachedBottom)
			return `✅ ${warningMsg} Scrolled container (${el!.tagName}) by ${scrolled}px. Reached the bottom.`
		if (reachedTop)
			return `✅ ${warningMsg} Scrolled container (${el!.tagName}) by ${scrolled}px. Reached the top.`
		return `✅ ${warningMsg} Scrolled container (${el!.tagName}) by ${scrolled}px.`
	}
}

export async function scrollHorizontally(scroll_amount: number, element?: HTMLElement | null) {
	// Element-specific scrolling if element is provided
	if (element) {
		const targetElement = element
		let currentElement = targetElement as HTMLElement | null
		let scrollSuccess = false
		let scrolledElement: HTMLElement | null = null
		let scrollDelta = 0
		let attempts = 0
		const dx = scroll_amount

		while (currentElement && attempts < 10) {
			const computedStyle = window.getComputedStyle(currentElement)
			const hasScrollableX =
				/(auto|scroll|overlay)/.test(computedStyle.overflowX) ||
				(computedStyle.scrollbarWidth && computedStyle.scrollbarWidth !== 'auto') ||
				(computedStyle.scrollbarGutter && computedStyle.scrollbarGutter !== 'auto')
			const canScrollHorizontally = currentElement.scrollWidth > currentElement.clientWidth

			if (hasScrollableX && canScrollHorizontally) {
				const beforeScroll = currentElement.scrollLeft
				const maxScroll = currentElement.scrollWidth - currentElement.clientWidth

				let scrollAmount = dx / 3

				if (scrollAmount > 0) {
					scrollAmount = Math.min(scrollAmount, maxScroll - beforeScroll)
				} else {
					scrollAmount = Math.max(scrollAmount, -beforeScroll)
				}

				currentElement.scrollLeft = beforeScroll + scrollAmount

				const afterScroll = currentElement.scrollLeft
				const actualScrollDelta = afterScroll - beforeScroll

				if (Math.abs(actualScrollDelta) > 0.5) {
					scrollSuccess = true
					scrolledElement = currentElement
					scrollDelta = actualScrollDelta
					break
				}
			}

			if (currentElement === document.body || currentElement === document.documentElement) {
				break
			}
			currentElement = currentElement.parentElement
			attempts++
		}

		if (scrollSuccess) {
			return `Scrolled container (${scrolledElement?.tagName}) horizontally by ${scrollDelta}px`
		} else {
			return `No horizontally scrollable container found for element (${targetElement.tagName})`
		}
	}

	// Page-level scrolling (default or fallback)

	const dx = scroll_amount

	const bigEnough = (el: HTMLElement) => el.clientWidth >= window.innerWidth * 0.5
	const canScroll = (el: HTMLElement | null) =>
		el &&
		/(auto|scroll|overlay)/.test(getComputedStyle(el).overflowX) &&
		el.scrollWidth > el.clientWidth &&
		bigEnough(el)

	// @deprecated Same heuristic container search as scrollVertically.
	// TODO: Remove once LLMs reliably use indexed scrolling via data-scrollable.

	let el: HTMLElement | null = document.activeElement as HTMLElement | null
	while (el && !canScroll(el) && el !== document.body) el = el.parentElement

	el = canScroll(el)
		? el
		: Array.from(document.querySelectorAll<HTMLElement>('*')).find(canScroll) ||
			(document.scrollingElement as HTMLElement) ||
			(document.documentElement as HTMLElement)

	if (el === document.scrollingElement || el === document.documentElement || el === document.body) {
		// Page-level scroll
		const scrollBefore = window.scrollX
		const scrollMax = document.documentElement.scrollWidth - window.innerWidth

		window.scrollBy(dx, 0)

		const scrollAfter = window.scrollX
		const scrolled = scrollAfter - scrollBefore

		if (Math.abs(scrolled) < 1) {
			return dx > 0
				? `⚠️ Already at the right edge of the page, cannot scroll right further.`
				: `⚠️ Already at the left edge of the page, cannot scroll left further.`
		}

		const reachedRight = dx > 0 && scrollAfter >= scrollMax - 1
		const reachedLeft = dx < 0 && scrollAfter <= 1

		if (reachedRight)
			return `✅ Scrolled page by ${scrolled}px. Reached the right edge of the page.`
		if (reachedLeft) return `✅ Scrolled page by ${scrolled}px. Reached the left edge of the page.`
		return `✅ Scrolled page horizontally by ${scrolled}px.`
	} else {
		// Container scroll
		const warningMsg = `The document is not scrollable. Falling back to container scroll.`
		console.log(`[PageController] ${warningMsg}`)

		const scrollBefore = el!.scrollLeft
		const scrollMax = el!.scrollWidth - el!.clientWidth

		el!.scrollBy({ left: dx, behavior: 'smooth' })
		await waitFor(0.1)

		const scrollAfter = el!.scrollLeft
		const scrolled = scrollAfter - scrollBefore

		if (Math.abs(scrolled) < 1) {
			return dx > 0
				? `⚠️ ${warningMsg} Already at the right edge of container (${el!.tagName}), cannot scroll right further.`
				: `⚠️ ${warningMsg} Already at the left edge of container (${el!.tagName}), cannot scroll left further.`
		}

		const reachedRight = dx > 0 && scrollAfter >= scrollMax - 1
		const reachedLeft = dx < 0 && scrollAfter <= 1

		if (reachedRight)
			return `✅ ${warningMsg} Scrolled container (${el!.tagName}) by ${scrolled}px. Reached the right edge.`
		if (reachedLeft)
			return `✅ ${warningMsg} Scrolled container (${el!.tagName}) by ${scrolled}px. Reached the left edge.`
		return `✅ ${warningMsg} Scrolled container (${el!.tagName}) horizontally by ${scrolled}px.`
	}
}

// ======= Element Plus 组件检测 / Element Plus component detection =======

/**
 * 检测元素是否为 Element Plus 日期选择器。
 * Detect if element is an Element Plus date picker.
 */
function isElementPlusDatePicker(element: HTMLElement): boolean {
	// 检查元素自身或其祖先是否有 date picker 类名 / Check if element or ancestor has date picker class
	const className = element.className || ''
	const isDatePickerClass = /\b(el-date-editor|el-date-picker|date-picker)\b/i.test(className)
	if (isDatePickerClass) return true

	// 检查祖先元素 / Check ancestor elements
	const parent = element.parentElement
	if (parent) {
		const parentClassName = parent.className || ''
		if (/\b(el-date-editor|el-date-picker)\b/i.test(parentClassName)) return true
	}

	return false
}

/**
 * 检测元素是否为 Element Plus Select 组件。
 * Detect if element is an Element Plus Select component.
 */
function isElementPlusSelect(element: HTMLElement): boolean {
	return Boolean(
		element.closest('.el-select, .el-select__wrapper')
	)
}

/**
 * 检测元素是否为 Element Plus 弹出触发器。
 * Detect if element is an Element Plus popup trigger.
 */
function isElementPlusPopupTrigger(element: HTMLElement): boolean {
	return Boolean(
		element.closest('.el-select, .el-select__wrapper, .el-date-editor, .el-picker, .el-input__wrapper')
	)
}

// ======= 下拉检测 / Dropdown detection =======

/**
 * 判断元素是否像下拉菜单。
 * Determine if element is likely a dropdown element.
 */
function isLikelyDropdownElement(element: HTMLElement): boolean {
	if (element instanceof HTMLSelectElement) return true

	const role = element.getAttribute('role')?.toLowerCase()
	if (role && ['combobox', 'listbox', 'option'].includes(role)) return true

	const ariaHasPopup = element.getAttribute('aria-haspopup')?.toLowerCase()
	if (ariaHasPopup && ['listbox', 'menu', 'tree', 'dialog'].includes(ariaHasPopup)) return true

	const key = `${element.className} ${element.id}`.toLowerCase()
	return /(select|dropdown|combobox|option-list|menu-item)/.test(key)
}

/**
 * 判断点击后是否应终止批量操作（例如打开了下拉菜单）。
 * Determine if batch should end after a click (e.g., dropdown opened).
 */
function shouldEndBatchAfterClick(action: AgentAction, element: HTMLElement, nextAction?: AgentAction): boolean {
	if (action.tool !== 'click' || !nextAction) return false
	return isLikelyDropdownElement(element)
}

// ======= 执行单个操作 / Execute single action =======

/**
 * 执行单个代理操作，分发到对应的 DOM 操作。
 * 包含 Element Plus 和 Vue 的特殊处理。
 *
 * Execute a single agent action by dispatching to the corresponding DOM operation.
 * Includes Element Plus and Vue special handling.
 */
export async function executeAction(
	action: AgentAction,
	selectorMap: Map<number, InteractiveElementDomNode>,
	options: { nextAction?: AgentAction } = {}
): Promise<ActionResult> {
	try {
		const { tool, params } = action

		function getEl(index: number): HTMLElement {
			return getElementByIndex(selectorMap, index)
		}

		switch (tool) {
			case 'click': {
				const el = getEl(params.index as number)
				const shouldBlur = params.blur !== false // 默认 blur / Default to blur

				// Element Plus 日期选择器特殊处理 / Element Plus date picker needs special handling
				if (isElementPlusDatePicker(el)) {
					const input = el.querySelector('.el-input__inner') as HTMLInputElement | null
					if (input) {
						input.focus()
						input.dispatchEvent(new MouseEvent('focus', { bubbles: true }))
						input.dispatchEvent(new MouseEvent('mousedown', { bubbles: true, cancelable: true }))
						input.dispatchEvent(new MouseEvent('mouseup', { bubbles: true }))
						input.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }))
						await waitFor(0.3)
						if (shouldBlur) input.blur()
						return { action, success: true, output: `Clicked Element Plus date picker [${params.index}]` }
					}
				}

				// Element Plus Select 特殊处理 / Element Plus select needs special handling
				if (isElementPlusSelect(el)) {
					const input = el.querySelector('.el-input__inner') as HTMLInputElement | null
					if (input) {
						input.focus()
						input.dispatchEvent(new MouseEvent('mousedown', { bubbles: true, cancelable: true }))
						input.dispatchEvent(new MouseEvent('mouseup', { bubbles: true }))
						input.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }))
						await waitFor(0.3)
						if (shouldBlur) input.blur()
						return { action, success: true, output: `Clicked Element Plus select [${params.index}]` }
					}
				}

				await clickElement(el)
				// blur=false 时保留焦点，用于下拉菜单等中间步骤 / Keep focus when blur=false for intermediate dropdown steps
				if (shouldBlur) el.blur()

				if (isAnchorElement(el) && el.target === '_blank') {
					return { action, success: true, output: `Clicked element [${params.index}]. Link opened in a new tab.` }
				}
				return { action, success: true, output: `Clicked element [${params.index}]` }
			}

			case 'input': {
				const el = getEl(params.index as number)
				const shouldBlurInput = params.blur !== false // 默认 blur / Default to blur
				await inputTextElement(el, params.text as string)
				if (shouldBlurInput) el.blur()
				return { action, success: true, output: `Input "${params.text}" into [${params.index}]` }
			}

			case 'select': {
				const el = getEl(params.index as number)
				const shouldBlurSelect = params.blur !== false // 默认 blur / Default to blur
				const optionText = (params.value || params.optionText) as string
				await selectOptionElement(el as HTMLSelectElement, optionText)
				if (shouldBlurSelect) el.blur()
				return { action, success: true, output: `Selected "${optionText}" in [${params.index}]` }
			}

			case 'scroll': {
				const el = params.index != null ? getEl(params.index as number) : null
				const down = params.direction === 'down' || params.down === true
				const amount = (params.amount as number) || (params.pixels as number) || window.innerHeight
				const msg = await scrollVertically(down ? amount : -amount, el)
				return { action, success: true, output: msg }
			}

			case 'scroll_horizontally': {
				const el = params.index != null ? getEl(params.index as number) : null
				const isRight = params.direction === 'right' || params.right === true
				const amount = (params.amount as number) || (params.pixels as number) || 300
				const msg = await scrollHorizontally(isRight ? amount : -amount, el)
				return { action, success: true, output: msg }
			}

			case 'wait': {
				const rawMs = params.ms as number | undefined
				const rawSeconds = params.seconds as number | undefined
				const ms =
					typeof rawMs === 'number' && Number.isFinite(rawMs) && rawMs >= 0
						? rawMs
						: typeof rawSeconds === 'number' && Number.isFinite(rawSeconds) && rawSeconds >= 0
							? rawSeconds * 1000
							: 1000
				await new Promise((resolve) => setTimeout(resolve, ms))
				return { action, success: true, output: `Waited ${ms}ms` }
			}

			case 'execute_javascript': {
				// eslint-disable-next-line @typescript-eslint/no-implied-eval
				const asyncFn = eval(`(async () => { ${params.code as string} })`)
				const result = await asyncFn()
				return { action, success: true, output: `Executed JavaScript. Result: ${String(result)}` }
			}

			case 'done': {
				return {
					action,
					success: true,
					output: (params.message as string) || 'Task completed',
				}
			}

			case 'ask_user': {
				const question = (params.question as string) || 'Need user clarification'
				return { action, success: true, output: `Ask user: ${question}` }
			}

			default:
				return { action, success: true, output: `Skipped unknown tool: ${tool}` }
		}
	} catch (err) {
		return {
			action,
			success: false,
			error: err instanceof Error ? err.message : String(err),
		}
	}
}

// ======= 执行批量操作 / Execute batch actions =======

/**
 * 批量执行代理操作，遇到错误则中止（fail-fast）。
 * 在点击下拉触发器后会提前结束批量。
 *
 * Execute a batch of agent actions with fail-fast behavior.
 * Ends batch early after clicking a dropdown trigger.
 */
export async function executeBatch(
	actions: AgentAction[],
	selectorMap: Map<number, InteractiveElementDomNode>,
	onProgress?: (index: number, result: ActionResult) => void
): Promise<BatchResult> {
	const results: ActionResult[] = []

	for (let i = 0; i < actions.length; i++) {
		const action = actions[i]
		const nextAction = i < actions.length - 1 ? actions[i + 1] : undefined

		const result = await executeAction(action, selectorMap, { nextAction })
		results.push(result)
		onProgress?.(i, result)

		// 遇到错误立即中止 / Fail-fast on error
		if (!result.success) break

		// 点击下拉触发器后结束批量 / End batch after clicking dropdown trigger
		if (action.tool === 'click') {
			const index = action.params.index as number | undefined
			const element = typeof index === 'number' ? selectorMap.get(index)?.ref : undefined
			if (element instanceof HTMLElement && shouldEndBatchAfterClick(action, element, nextAction)) {
				break
			}
		}

		// 操作间的短暂延迟 / Small delay between actions
		if (i < actions.length - 1) {
			await new Promise((resolve) => setTimeout(resolve, 100))
		}
	}

	return {
		results,
		completedCount: results.filter((r) => r.success).length,
	}
}
