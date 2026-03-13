/**
 * 提示词模板实体
 * Prompt template entity
 */
export interface PromptTemplate {
  id: string
  // 模板名称 / Template name
  name: string
  // 模板内容（支持 {{variable}} 插值）/ Template content (supports {{variable}} interpolation)
  content: string
  // 变量定义 / Variable definitions
  variables?: PromptVariable[]
  // 模板类型 / Template type
  type: 'system' | 'instruction' | 'page'
  // 版本号 / Version number
  version: number
  // 是否为当前生效的版本 / Whether this is the active version
  isActive?: boolean
  createdAt?: string
  updatedAt?: string
}

/**
 * 提示词模板中的变量定义
 * Variable definition within a prompt template
 */
export interface PromptVariable {
  // 变量名（在模板中以 {{name}} 形式使用）/ Variable name (used as {{name}} in template)
  name: string
  // 变量描述 / Description of the variable
  description?: string
  // 默认值 / Default value
  defaultValue?: string
  // 是否必填 / Whether this variable is required
  required?: boolean
}
