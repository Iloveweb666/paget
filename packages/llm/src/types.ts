/**
 * LLM 集成核心类型定义
 * Core types for LLM integration
 */
import type { z } from 'zod'

/**
 * 消息格式 — 遵循 OpenAI 标准（行业标准）
 * Message format — OpenAI standard (industry standard)
 */
export interface Message {
	/** 消息角色 / Message role */
	role: 'system' | 'user' | 'assistant' | 'tool'
	/** 消息内容 / Message content */
	content?: string | null
	/** 工具调用列表 / Tool call list */
	tool_calls?: {
		/** 工具调用唯一标识 / Tool call unique ID */
		id: string
		/** 调用类型（固定为 function） / Call type (always 'function') */
		type: 'function'
		/** 函数调用详情 / Function call details */
		function: {
			/** 函数名称 / Function name */
			name: string
			/** 函数参数（JSON 字符串） / Function arguments (JSON string) */
			arguments: string
		}
	}[]
	/** 工具调用 ID（用于工具结果关联） / Tool call ID (for associating tool results) */
	tool_call_id?: string
	/** 工具名称 / Tool name */
	name?: string
}

/**
 * 工具定义 — 使用 Zod schema（LLM 无关）
 * 支持泛型以实现类型安全的参数和返回值
 *
 * Tool definition — uses Zod schema (LLM-agnostic)
 * Supports generics for type-safe parameters and return values
 */
export interface Tool<TParams = any, TResult = any> {
	/** 工具描述 / Tool description */
	description?: string
	/** 输入参数的 Zod schema / Zod schema for input parameters */
	inputSchema: z.ZodType<TParams>
	/** 执行函数 / Execute function */
	execute: (args: TParams) => Promise<TResult>
}

/**
 * LLM 调用选项
 * Invoke options for LLM call
 */
export interface InvokeOptions {
	/**
	 * 强制 LLM 调用指定名称的工具
	 * 提供时: tool_choice = { type: 'function', function: { name: toolChoiceName } }
	 * 未提供时: tool_choice = 'required'（必须调用某个工具，但由模型选择）
	 *
	 * Force LLM to call a specific tool by name.
	 * If provided: tool_choice = { type: 'function', function: { name: toolChoiceName } }
	 * If not provided: tool_choice = 'required' (must call some tool, but model chooses which)
	 */
	toolChoiceName?: string
	/**
	 * 响应规范化函数，在解析响应之前调用
	 * 用于修复模型返回的各种响应格式错误
	 *
	 * Response normalization function.
	 * Called before parsing the response.
	 * Used to fix various response format errors from the model.
	 */
	normalizeResponse?: (response: any) => any
}

/**
 * LLM 客户端接口
 * 注意：不使用泛型，因为 tools 数组中的每个工具类型不同
 *
 * LLM Client interface
 * Note: Does not use generics because each tool in the tools array has different types
 */
export interface LLMClient {
	invoke(
		messages: Message[],
		tools: Record<string, Tool>,
		abortSignal?: AbortSignal,
		options?: InvokeOptions
	): Promise<InvokeResult>
}

/**
 * 调用结果（严格类型，支持泛型）
 * Invoke result (strict typing, supports generics)
 */
export interface InvokeResult<TResult = unknown> {
	/** 工具调用信息 / Tool call information */
	toolCall: {
		/** 工具名称 / Tool name */
		name: string
		/** 工具参数 / Tool arguments */
		args: any
	}
	/** 工具执行结果（支持泛型，默认 unknown） / Tool result (supports generics, defaults to unknown) */
	toolResult: TResult
	/** Token 用量统计 / Token usage statistics */
	usage: {
		/** 提示词 token 数 / Prompt token count */
		promptTokens: number
		/** 补全 token 数 / Completion token count */
		completionTokens: number
		/** 总 token 数 / Total token count */
		totalTokens: number
		/** 缓存命中 token 数 / Prompt cache hit tokens */
		cachedTokens?: number
		/** 推理 token 数（OpenAI o1 系列） / Reasoning tokens (OpenAI o1 series) */
		reasoningTokens?: number
	}
	/** 原始响应（用于调试） / Raw response for debugging */
	rawResponse?: unknown
	/** 原始请求（用于调试） / Raw request for debugging */
	rawRequest?: unknown
}

/**
 * LLM 配置
 * LLM configuration
 */
export interface LLMConfig {
	/** API 基础 URL / API base URL */
	baseURL: string
	/** 模型名称 / Model name */
	model: string
	/** API 密钥 / API key */
	apiKey?: string

	/** 温度参数 / Temperature parameter */
	temperature?: number
	/** 最大重试次数 / Maximum retry count */
	maxRetries?: number

	/**
	 * 从请求中移除 tool_choice 字段
	 * 修复某些 LLM 的 "Invalid tool_choice type: 'object'" 错误
	 *
	 * Remove the tool_choice field from the request.
	 * @note fix "Invalid tool_choice type: 'object'" for some LLMs.
	 */
	disableNamedToolChoice?: boolean

	/**
	 * 自定义 fetch 函数，用于 LLM API 请求
	 * 可用于自定义请求头、凭证、代理等
	 * 响应应遵循 OpenAI API 格式
	 *
	 * Custom fetch function for LLM API requests.
	 * Use this to customize headers, credentials, proxy, etc.
	 * The response should follow OpenAI API format.
	 */
	customFetch?: typeof globalThis.fetch
}
