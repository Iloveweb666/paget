export declare class PromptService {
    private readonly logger;
    private systemPromptCache;
    /**
     * 渲染模板 — 将 {{variable}} 占位符替换为实际值
     * Render a template by replacing {{variable}} placeholders with values.
     */
    render(template: string, variables: Record<string, string>): string;
    /**
     * 获取系统提示词（优先从 .md 文件加载，失败时使用内置默认值）
     * Get system prompt (loads from .md file first, falls back to built-in default)
     */
    getSystemPrompt(variables?: Record<string, string>): Promise<string>;
    /**
     * 从文件加载系统提示词 / Load system prompt from file
     */
    private loadFromFile;
}
//# sourceMappingURL=prompt.service.d.ts.map