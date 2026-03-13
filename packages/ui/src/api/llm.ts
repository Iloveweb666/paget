/**
 * LLM 配置 API 接口
 * LLM configuration API endpoints
 *
 * 提供 LLM 配置的增删改查接口
 * Provides CRUD operations for LLM configurations
 */
import type { LLMConfig } from '@paget/shared'

// API 基础路径 / API base path
const BASE = '/api/llm'

/**
 * 获取所有 LLM 配置列表 / Get all LLM configurations
 */
export async function getLLMConfigs(): Promise<LLMConfig[]> {
  const res = await fetch(BASE)
  return res.json()
}

/**
 * 创建新的 LLM 配置 / Create a new LLM configuration
 */
export async function createLLMConfig(data: Omit<LLMConfig, 'id' | 'createdAt' | 'updatedAt'>): Promise<LLMConfig> {
  const res = await fetch(BASE, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  })
  return res.json()
}

/**
 * 更新已有的 LLM 配置 / Update an existing LLM configuration
 */
export async function updateLLMConfig(id: string, data: Partial<LLMConfig>): Promise<LLMConfig> {
  const res = await fetch(`${BASE}/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  })
  return res.json()
}

/**
 * 删除指定的 LLM 配置 / Delete a specific LLM configuration
 */
export async function deleteLLMConfig(id: string): Promise<void> {
  await fetch(`${BASE}/${id}`, { method: 'DELETE' })
}
