/**
 * @paget/llm — 独立 LLM 客户端，替代 LangChain
 * @paget/llm — Standalone LLM client that replaces LangChain
 */
import { OpenAIClient } from './OpenAIClient.js'
import { DEFAULT_TEMPERATURE, LLM_MAX_RETRIES } from './constants.js'
import { InvokeError, InvokeErrorType } from './errors.js'
import type { InvokeOptions, InvokeResult, LLMClient, LLMConfig, Message, Tool } from './types.js'

export { InvokeError, InvokeErrorType }
export type { InvokeOptions, InvokeResult, LLMClient, LLMConfig, Message, Tool }

/**
 * 解析并填充 LLM 配置默认值
 * Parse and fill LLM config with defaults
 */
export function parseLLMConfig(config: LLMConfig): Required<LLMConfig> {
	// 运行时校验作为防御性编程（类型已保证这些字段存在）
	// Runtime validation as defensive programming (types already guarantee these)
	if (!config.baseURL || !config.model) {
		throw new Error(
			'[Paget] LLM configuration required. Please provide: baseURL, model. ' +
				'See: https://github.com/nicepkg/paget'
		)
	}

	return {
		baseURL: config.baseURL,
		model: config.model,
		apiKey: config.apiKey || '',
		temperature: config.temperature ?? DEFAULT_TEMPERATURE,
		maxRetries: config.maxRetries ?? LLM_MAX_RETRIES,
		disableNamedToolChoice: config.disableNamedToolChoice ?? false,
		customFetch: (config.customFetch ?? fetch).bind(globalThis), // fetch 未绑定时会失效 / fetch will be illegal unless bound
	}
}

/**
 * LLM 主类 — 封装 LLM 客户端调用与重试逻辑
 * LLM main class — wraps LLM client invocation with retry logic
 */
export class LLM extends EventTarget {
	/** 完整配置 / Full configuration */
	config: Required<LLMConfig>
	/** LLM 客户端实例 / LLM client instance */
	client: LLMClient

	constructor(config: LLMConfig) {
		super()
		this.config = parseLLMConfig(config)

		// 默认使用 OpenAI 兼容客户端 / Default to OpenAI client
		this.client = new OpenAIClient(this.config)
	}

	/**
	 * 调用 LLM API 一次，执行工具调用一次，返回工具结果
	 * - call llm api *once*
	 * - invoke tool call *once*
	 * - return the result of the tool
	 */
	async invoke(
		messages: Message[],
		tools: Record<string, Tool>,
		abortSignal: AbortSignal,
		options?: InvokeOptions
	): Promise<InvokeResult> {
		return await withRetry(
			async () => {
				// 在调用前检查用户是否已中止 / in case user aborted before invoking
				if (abortSignal.aborted) throw new Error('AbortError')

				const result = await this.client.invoke(messages, tools, abortSignal, options)

				return result
			},
			// 重试设置 / retry settings
			{
				maxRetries: this.config.maxRetries,
				onRetry: (attempt: number) => {
					this.dispatchEvent(
						new CustomEvent('retry', { detail: { attempt, maxAttempts: this.config.maxRetries } })
					)
				},
				onError: (error: Error) => {
					this.dispatchEvent(new CustomEvent('error', { detail: { error } }))
				},
			}
		)
	}
}

/**
 * 带重试的异步函数执行器
 * Async function executor with retry logic
 */
async function withRetry<T>(
	fn: () => Promise<T>,
	settings: {
		maxRetries: number
		onRetry: (attempt: number) => void
		onError: (error: Error) => void
	}
): Promise<T> {
	let attempt = 0
	let lastError: Error | null = null
	while (attempt <= settings.maxRetries) {
		if (attempt > 0) {
			settings.onRetry(attempt)
			await new Promise((resolve) => setTimeout(resolve, 100))
		}

		try {
			return await fn()
		} catch (error: unknown) {
			// 用户中止时不重试 / do not retry if aborted by user
			if ((error as any)?.rawError?.name === 'AbortError') throw error

			console.error(error)
			settings.onError(error as Error)

			// 不可重试的 InvokeError 直接抛出 / do not retry if error is not retryable (InvokeError)
			if (error instanceof InvokeError && !error.retryable) throw error

			lastError = error as Error
			attempt++

			await new Promise((resolve) => setTimeout(resolve, 100))
		}
	}

	throw lastError!
}
