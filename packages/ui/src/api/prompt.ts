/**
 * 提示词模板 API 接口
 * Prompt template API endpoints
 *
 * 提供提示词模板的增删改查接口
 * Provides CRUD operations for prompt templates
 */
import type { PromptTemplate } from '@paget/shared'

// API 基础路径 / API base path
const BASE = '/api/prompt'

/**
 * 获取所有提示词模板列表 / Get all prompt templates
 */
export async function getPromptTemplates(): Promise<PromptTemplate[]> {
  const res = await fetch(BASE)
  return res.json()
}

/**
 * 根据 ID 获取单个提示词模板 / Get a single prompt template by ID
 */
export async function getPromptTemplate(id: string): Promise<PromptTemplate> {
  const res = await fetch(`${BASE}/${id}`)
  return res.json()
}

/**
 * 创建新的提示词模板 / Create a new prompt template
 */
export async function createPromptTemplate(
  data: Omit<PromptTemplate, 'id' | 'version' | 'createdAt' | 'updatedAt'>,
): Promise<PromptTemplate> {
  const res = await fetch(BASE, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  })
  return res.json()
}

/**
 * 更新已有的提示词模板 / Update an existing prompt template
 */
export async function updatePromptTemplate(
  id: string,
  data: Partial<PromptTemplate>,
): Promise<PromptTemplate> {
  const res = await fetch(`${BASE}/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  })
  return res.json()
}
