/**
 * 提示词模板实体
 * Prompt template entity
 */
export interface PromptTemplate {
    id: string;
    name: string;
    content: string;
    variables?: PromptVariable[];
    type: 'system' | 'instruction' | 'page';
    version: number;
    isActive?: boolean;
    createdAt?: string;
    updatedAt?: string;
}
/**
 * 提示词模板中的变量定义
 * Variable definition within a prompt template
 */
export interface PromptVariable {
    name: string;
    description?: string;
    defaultValue?: string;
    required?: boolean;
}
//# sourceMappingURL=prompt.d.ts.map