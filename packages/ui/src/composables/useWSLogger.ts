/**
 * WebSocket 事件日志记录器（localStorage 持久化）
 * WebSocket event logger with localStorage persistence
 *
 * 模块级单例，记录所有 WS 收发事件，支持查看、导出和清空
 * Module-level singleton that logs all WS send/receive events, supports viewing, exporting, and clearing
 */

// 日志条目接口 / Log entry interface
export interface WSLogEntry {
  /** 时间戳 / Timestamp */
  timestamp: number
  /** 方向：发送或接收 / Direction: send or receive */
  direction: 'send' | 'receive'
  /** 事件名称 / Event name */
  event: string
  /** 事件数据 / Event data */
  data: unknown
}

// localStorage 存储键 / localStorage storage key
const STORAGE_KEY = 'paget_ws_logs'

// 最大保留条数（FIFO 淘汰）/ Max entries (FIFO eviction)
const MAX_ENTRIES = 200

// 内存缓存 / In-memory cache
let logs: WSLogEntry[] = loadLogs()

/**
 * 从 localStorage 加载日志 / Load logs from localStorage
 */
function loadLogs(): WSLogEntry[] {
  try {
    const saved = localStorage.getItem(STORAGE_KEY)
    return saved ? JSON.parse(saved) : []
  } catch {
    return []
  }
}

/**
 * 持久化日志到 localStorage / Persist logs to localStorage
 */
function saveLogs(): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(logs))
  } catch {
    // localStorage 已满时静默失败 / Silently fail when localStorage is full
  }
}

/**
 * 记录一条 WS 事件 / Log a WS event
 */
function log(direction: 'send' | 'receive', event: string, data: unknown): void {
  const entry: WSLogEntry = {
    timestamp: Date.now(),
    direction,
    event,
    data,
  }

  logs.push(entry)

  // FIFO 淘汰超出上限的旧条目 / FIFO eviction for entries exceeding the limit
  if (logs.length > MAX_ENTRIES) {
    logs = logs.slice(logs.length - MAX_ENTRIES)
  }

  saveLogs()

  // 同时输出到控制台便于调试 / Also output to console for debugging
  const arrow = direction === 'send' ? '↑' : '↓'
  console.debug(`[WS] ${arrow} ${event}`, data)
}

/**
 * 获取所有日志 / Get all logs
 */
function getLogs(): WSLogEntry[] {
  return logs
}

/**
 * 清空所有日志 / Clear all logs
 */
function clearLogs(): void {
  logs = []
  localStorage.removeItem(STORAGE_KEY)
}

/**
 * 导出完整 JSON 字符串 / Export full JSON string
 */
function exportLogs(): string {
  return JSON.stringify(logs, null, 2)
}

export const wsLogger = {
  log,
  getLogs,
  clearLogs,
  exportLogs,
}
