import { BaseTool } from './base.tool';
export declare class ToolRegistry {
    private tools;
    constructor();
    private registerBuiltinTools;
    register(tool: BaseTool): void;
    get(name: string): BaseTool | undefined;
    getAll(): BaseTool[];
    /**
     * 获取工具描述信息列表，用于构建 LLM 上下文
     * Get tool descriptions for LLM context
     */
    getToolDescriptions(): Array<{
        name: string;
        description: string;
        schema: unknown;
    }>;
}
//# sourceMappingURL=tool.registry.d.ts.map