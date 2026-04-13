/**
 * 网关相关类型定义
 * Gateway-related type definitions
 */

/**
 * Promise 解析器 — 用于 WebSocket 请求-响应对
 * Promise resolver — for WebSocket request-response pairs
 */
export interface PromiseResolver<T = unknown> {
  resolve: (value: T) => void;
  reject: (err: Error) => void;
}

/**
 * 页面状态响应 / Page state response
 */
export interface PageStateResponse {
  header: string;
  content: string;
  footer: string;
}

/**
 * 批量操作结果响应 / Batch action result response
 */
export type BatchResultResponse = Array<{ success: boolean; output?: string; error?: string }>;
