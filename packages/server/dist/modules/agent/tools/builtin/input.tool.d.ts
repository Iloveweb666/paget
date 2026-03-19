/**
 * 输入工具 — 通过元素索引向表单字段输入文本
 * Input tool — inputs text into a form field by its index
 */
import { z } from 'zod';
import { BaseTool } from '../base.tool';
export declare class InputTool extends BaseTool {
    readonly name = "input";
    readonly description = "Input text into a form field by its index";
    readonly schema: z.ZodObject<{
        index: z.ZodNumber;
        text: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        text: string;
        index: number;
    }, {
        text: string;
        index: number;
    }>;
    execute(params: z.infer<typeof this.schema>): Promise<string>;
}
//# sourceMappingURL=input.tool.d.ts.map