/**
 * Agent 会话 API 接口
 * Agent session API endpoints
 *
 * 提供 Agent 会话管理和历史记录查询接口
 * Provides agent session management and history query endpoints
 */

// API 基础路径 / API base path
const BASE = '/api/agent'

/**
 * 获取指定会话的历史记录 / Get session history by session ID
 */
export async function getSessionHistory(sessionId: string) {
  const res = await fetch(`${BASE}/session/${sessionId}/history`)
  return res.json()
}

/**
 * 获取所有会话列表 / Get all sessions
 */
export async function getSessions() {
  const res = await fetch(`${BASE}/session`)
  return res.json()
}
