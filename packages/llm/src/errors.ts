/**
 * LLM 调用的错误类型和错误处理
 * Error types and error handling for LLM invocations
 */

/**
 * 调用错误类型枚举
 * Invoke error type enum
 */
export const InvokeErrorType = {
	// 可重试 / Retryable
	/** 网络错误，可重试 / Network error, retry */
	NETWORK_ERROR: 'network_error',
	/** 速率限制，可重试 / Rate limit, retry */
	RATE_LIMIT: 'rate_limit',
	/** 服务端错误（5xx），可重试 / Server error (5xx), retry */
	SERVER_ERROR: 'server_error',
	/** 模型未调用工具 / Model did not call tool */
	NO_TOOL_CALL: 'no_tool_call',
	/** 工具参数不匹配 schema / Tool args don't match schema */
	INVALID_TOOL_ARGS: 'invalid_tool_args',
	/** 工具执行错误 / Tool execution error */
	TOOL_EXECUTION_ERROR: 'tool_execution_error',

	/** 未知错误 / Unknown error */
	UNKNOWN: 'unknown',

	// 不可重试 / Non-retryable
	/** 认证失败 / Authentication failed */
	AUTH_ERROR: 'auth_error',
	/** 上下文长度超限 / Prompt too long */
	CONTEXT_LENGTH: 'context_length',
	/** 内容被安全过滤 / Content filtered */
	CONTENT_FILTER: 'content_filter',
} as const

export type InvokeErrorType = (typeof InvokeErrorType)[keyof typeof InvokeErrorType]

/**
 * LLM 调用错误
 * LLM invocation error
 */
export class InvokeError extends Error {
	/** 错误类型 / Error type */
	type: InvokeErrorType
	/** 是否可重试 / Whether this error is retryable */
	retryable: boolean
	/** HTTP 状态码 / HTTP status code */
	statusCode?: number
	/** 原始错误（如果此错误由另一个错误引起） / Raw error (provided if this error is caused by another error) */
	rawError?: unknown
	/** API 原始响应（如果此错误由 API 调用引起） / Raw response from the API (provided if this error is caused by an API calling) */
	rawResponse?: unknown

	constructor(type: InvokeErrorType, message: string, rawError?: unknown, rawResponse?: unknown) {
		super(message)
		this.name = 'InvokeError'
		this.type = type
		this.retryable = this.isRetryable(type, rawError)
		this.rawError = rawError
		this.rawResponse = rawResponse
	}

	/**
	 * 判断错误是否可重试
	 * Determine if the error is retryable
	 */
	private isRetryable(type: InvokeErrorType, rawError?: unknown): boolean {
		// 用户主动中止不可重试 / Abort errors are not retryable
		const isAbortError = (rawError as any)?.name === 'AbortError'
		if (isAbortError) return false

		const retryableTypes: InvokeErrorType[] = [
			InvokeErrorType.NETWORK_ERROR,
			InvokeErrorType.RATE_LIMIT,
			InvokeErrorType.SERVER_ERROR,
			InvokeErrorType.NO_TOOL_CALL,
			InvokeErrorType.INVALID_TOOL_ARGS,
			InvokeErrorType.TOOL_EXECUTION_ERROR,
			InvokeErrorType.UNKNOWN,
		]
		return retryableTypes.includes(type)
	}
}
