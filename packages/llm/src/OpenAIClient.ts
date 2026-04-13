/**
 * OpenAI 兼容 API 客户端实现
 * OpenAI Client implementation
 */
import { z } from 'zod'

import { InvokeError, InvokeErrorType } from './errors.js'
import type { InvokeOptions, InvokeResult, LLMClient, LLMConfig, Message, Tool } from './types.js'
import { modelPatch, zodToOpenAITool } from './utils.js'

/**
 * OpenAI 兼容 API 客户端
 * Client for OpenAI compatible APIs
 */
export class OpenAIClient implements LLMClient {
	/** LLM 配置 / LLM configuration */
	config: Required<LLMConfig>
	/** fetch 函数实例 / Fetch function instance */
	private fetch: typeof globalThis.fetch

	constructor(config: Required<LLMConfig>) {
		this.config = config
		this.fetch = config.customFetch
	}

	async invoke(
		messages: Message[],
		tools: Record<string, Tool>,
		abortSignal?: AbortSignal,
		options?: InvokeOptions
	): Promise<InvokeResult> {
		// 1. 将工具转换为 OpenAI 格式 / Convert tools to OpenAI format
		const openaiTools = Object.entries(tools).map(([name, t]) => zodToOpenAITool(name, t))

		// 构建请求体 / Build request body

		let toolChoice: unknown = 'required'
		if (options?.toolChoiceName && !this.config.disableNamedToolChoice) {
			toolChoice = { type: 'function', function: { name: options.toolChoiceName } }
		}

		const requestBody: Record<string, unknown> = {
			model: this.config.model,
			temperature: this.config.temperature,
			messages,
			tools: openaiTools,
			parallel_tool_calls: false,
			tool_choice: toolChoice,
		}

		modelPatch(requestBody)

		// 2. 调用 API / Call API
		let response: Response
		try {
			response = await this.fetch(`${this.config.baseURL}/chat/completions`, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
					...(this.config.apiKey && { Authorization: `Bearer ${this.config.apiKey}` }),
				},
				body: JSON.stringify(requestBody),
				signal: abortSignal,
			})
		} catch (error: unknown) {
			const isAbortError = (error as any)?.name === 'AbortError'
			const errorMessage = isAbortError ? 'Network request aborted' : 'Network request failed'
			if (!isAbortError) console.error(error)
			throw new InvokeError(InvokeErrorType.NETWORK_ERROR, errorMessage, error)
		}

		// 3. 处理 HTTP 错误 / Handle HTTP errors
		if (!response.ok) {
			const errorData = await response.json().catch()
			const errorMessage =
				(errorData as { error?: { message?: string } }).error?.message || response.statusText

			if (response.status === 401 || response.status === 403) {
				throw new InvokeError(
					InvokeErrorType.AUTH_ERROR,
					`Authentication failed: ${errorMessage}`,
					errorData
				)
			}
			if (response.status === 429) {
				throw new InvokeError(
					InvokeErrorType.RATE_LIMIT,
					`Rate limit exceeded: ${errorMessage}`,
					errorData
				)
			}
			if (response.status >= 500) {
				throw new InvokeError(
					InvokeErrorType.SERVER_ERROR,
					`Server error: ${errorMessage}`,
					errorData
				)
			}
			throw new InvokeError(
				InvokeErrorType.UNKNOWN,
				`HTTP ${response.status}: ${errorMessage}`,
				errorData
			)
		}

		// 4. 解析和验证响应 / Parse and validate response
		const data = await response.json()

		const choice = data.choices?.[0]
		if (!choice) {
			throw new InvokeError(InvokeErrorType.UNKNOWN, 'No choices in response', data)
		}

		// 检查完成原因 / Check finish_reason
		switch (choice.finish_reason) {
			case 'tool_calls':
			case 'function_call': // gemini
			case 'stop': // 某些模型即使有工具调用也使用 stop / some models use this even with tool calls
				break
			case 'length':
				throw new InvokeError(
					InvokeErrorType.CONTEXT_LENGTH,
					'Response truncated: max tokens reached',
					undefined,
					data
				)
			case 'content_filter':
				throw new InvokeError(
					InvokeErrorType.CONTENT_FILTER,
					'Content filtered by safety system',
					undefined,
					data
				)
			default:
				throw new InvokeError(
					InvokeErrorType.UNKNOWN,
					`Unexpected finish_reason: ${choice.finish_reason}`,
					undefined,
					data
				)
		}

		// 如果提供了 normalizeResponse 则应用（用于自动修复格式问题）
		// Apply normalizeResponse if provided (for fixing format issues automatically)
		const normalizedData = options?.normalizeResponse ? options.normalizeResponse(data) : data
		const normalizedChoice = (normalizedData as any).choices?.[0]

		// 从响应中获取工具名称 / Get tool name from response
		const toolCallName = normalizedChoice?.message?.tool_calls?.[0]?.function?.name
		if (!toolCallName) {
			throw new InvokeError(
				InvokeErrorType.NO_TOOL_CALL,
				'No tool call found in response',
				undefined,
				data
			)
		}

		const tool = tools[toolCallName]
		if (!tool) {
			throw new InvokeError(
				InvokeErrorType.UNKNOWN,
				`Tool "${toolCallName}" not found in tools`,
				undefined,
				data
			)
		}

		// 提取并解析工具参数 / Extract and parse tool arguments
		const argString = normalizedChoice.message?.tool_calls?.[0]?.function?.arguments
		if (!argString) {
			throw new InvokeError(
				InvokeErrorType.INVALID_TOOL_ARGS,
				'No tool call arguments found',
				undefined,
				data
			)
		}

		let parsedArgs: unknown
		try {
			parsedArgs = JSON.parse(argString)
		} catch (error) {
			throw new InvokeError(
				InvokeErrorType.INVALID_TOOL_ARGS,
				'Failed to parse tool arguments as JSON',
				error,
				data
			)
		}

		// 使用 schema 验证 / Validate with schema
		const validation = tool.inputSchema.safeParse(parsedArgs)
		if (!validation.success) {
			console.error(JSON.stringify(validation.error.format(), null, 2))
			throw new InvokeError(
				InvokeErrorType.INVALID_TOOL_ARGS,
				'Tool arguments validation failed',
				validation.error,
				data
			)
		}
		const toolInput = validation.data

		// 5. 执行工具 / Execute tool
		let toolResult: unknown
		try {
			toolResult = await tool.execute(toolInput)
		} catch (e) {
			throw new InvokeError(
				InvokeErrorType.TOOL_EXECUTION_ERROR,
				`Tool execution failed: ${(e as Error).message}`,
				e,
				data
			)
		}

		// 返回结果 / Return result
		return {
			toolCall: {
				name: toolCallName,
				args: toolInput,
			},
			toolResult,
			usage: {
				promptTokens: data.usage?.prompt_tokens ?? 0,
				completionTokens: data.usage?.completion_tokens ?? 0,
				totalTokens: data.usage?.total_tokens ?? 0,
				cachedTokens: data.usage?.prompt_tokens_details?.cached_tokens,
				reasoningTokens: data.usage?.completion_tokens_details?.reasoning_tokens,
			},
			rawResponse: data,
			rawRequest: requestBody,
		}
	}
}
