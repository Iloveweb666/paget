/**
 * LLM 集成工具函数
 * Utility functions for LLM integration
 */
import { z } from 'zod'
import { zodToJsonSchema } from 'zod-to-json-schema'

import type { Tool } from './types.js'

/** 调试日志 / Debug logger */
const debug = console.debug.bind(console, '[LLM]')

/**
 * 将 Zod schema 转换为 OpenAI 工具格式
 * Convert Zod schema to OpenAI tool format
 */
export function zodToOpenAITool(name: string, tool: Tool) {
	return {
		type: 'function' as const,
		function: {
			name,
			description: tool.description,
			parameters: zodToJsonSchema(tool.inputSchema),
		},
	}
}

/**
 * 模型特定参数补丁
 * Patch model specific parameters
 * @note 原地修改 / in-place modification
 */
export function modelPatch(body: Record<string, any>) {
	const model: string = body.model || ''
	if (!model) return body

	const modelName = normalizeModelName(model)

	if (modelName.startsWith('qwen')) {
		debug('Applying Qwen patch: use higher temperature for auto fixing')
		body.temperature = Math.max(body.temperature || 0, 1.0)
		body.enable_thinking = false
	}

	if (modelName.startsWith('claude')) {
		debug('Applying Claude patch: disable thinking')
		body.thinking = { type: 'disabled' }

		// 将 tool_choice 转换为 Claude 格式 / Convert tool_choice to Claude format
		if (body.tool_choice === 'required') {
			// 'required' -> { type: 'any' }（必须调用某个工具）
			debug('Applying Claude patch: convert tool_choice "required" to { type: "any" }')
			body.tool_choice = { type: 'any' }
		} else if (body.tool_choice?.function?.name) {
			// { type: 'function', function: { name: '...' } } -> { type: 'tool', name: '...' }
			debug('Applying Claude patch: convert tool_choice format')
			body.tool_choice = { type: 'tool', name: body.tool_choice.function.name }
		}
	}

	if (modelName.startsWith('grok')) {
		debug('Applying Grok patch: removing tool_choice')
		delete body.tool_choice
		debug('Applying Grok patch: disable reasoning and thinking')
		body.thinking = { type: 'disabled', effort: 'minimal' }
		body.reasoning = { enabled: false, effort: 'low' }
	}

	if (modelName.startsWith('gpt')) {
		debug('Applying GPT patch: set verbosity to low')
		body.verbosity = 'low'

		if (modelName.startsWith('gpt-52')) {
			debug('Applying GPT-52 patch: disable reasoning')
			body.reasoning_effort = 'none'
		} else if (modelName.startsWith('gpt-51')) {
			debug('Applying GPT-51 patch: disable reasoning')
			body.reasoning_effort = 'none'
		} else if (modelName.startsWith('gpt-54')) {
			debug(
				'Applying GPT-5.4 patch: skip reasoning_effort because chat/completions rejects it with function tools'
			)
			delete body.reasoning_effort
		} else if (modelName.startsWith('gpt-5-mini')) {
			debug('Applying GPT-5-mini patch: set reasoning effort to low, temperature to 1')
			body.reasoning_effort = 'low'
			body.temperature = 1
		} else if (modelName.startsWith('gpt-5')) {
			debug('Applying GPT-5 patch: set reasoning effort to low')
			body.reasoning_effort = 'low'
		}
	}

	if (modelName.startsWith('gemini')) {
		debug('Applying Gemini patch: set reasoning effort to minimal')
		body.reasoning_effort = 'minimal'
	}

	if (modelName.startsWith('minimax')) {
		debug('Applying MiniMax patch: clamp temperature to (0, 1]')
		// MiniMax API 拒绝 temperature = 0，限制到最小正值 / MiniMax API rejects temperature = 0; clamp to a small positive value
		body.temperature = Math.max(body.temperature || 0, 0.01)
		if (body.temperature > 1) body.temperature = 1
		// MiniMax 不支持 parallel_tool_calls / MiniMax does not support parallel_tool_calls
		delete body.parallel_tool_calls
	}

	return body
}

/**
 * 检查给定的模型 ID 是否匹配特定模型名称
 * Check if a given model ID fits a specific model name
 *
 * @note
 * 不同模型供应商可能使用不同的模型 ID 来表示同一模型。
 * Different model providers may use different model IDs for the same model.
 *
 * 例如 OpenAI 的 `gpt-5.2` 可能被称为:
 * For example, openai's `gpt-5.2` may called:
 *
 * - `gpt-5.2-version`
 * - `gpt-5_2-date`
 * - `GPT-52-version-date`
 * - `openai/gpt-5.2-chat`
 *
 * 它们应被视为同一模型，统一规范化为 `gpt-52`
 * They should be treated as the same model.
 * Normalize them to `gpt-52`
 */
function normalizeModelName(modelName: string): string {
	let normalizedName = modelName.toLowerCase()

	// 移除 '/' 之前的前缀 / remove prefix before '/'
	if (normalizedName.includes('/')) {
		normalizedName = normalizedName.split('/')[1]
	}

	// 移除 '_' / remove '_'
	normalizedName = normalizedName.replace(/_/g, '')

	// 移除 '.' / remove '.'
	normalizedName = normalizedName.replace(/\./g, '')

	return normalizedName
}
