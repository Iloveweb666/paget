/**
 * 点击工具 — 通过元素索引点击页面元素
 * Click tool — clicks a page element by its index
 */
import { z } from 'zod';
import { BaseTool } from '../base.tool';
export declare class ClickTool extends BaseTool {
    readonly name = "click";
    readonly description = "Click an element by its index";
    readonly schema: z.ZodObject<{
        index: z.ZodNumber;
        doubleClick: z.ZodOptional<z.ZodBoolean>;
    }, "strip", z.ZodTypeAny, {
        index: number;
        doubleClick?: boolean | undefined;
    }, {
        index: number;
        doubleClick?: boolean | undefined;
    }>;
    execute(params: z.infer<typeof this.schema>): Promise<string>;
}
//# sourceMappingURL=click.tool.d.ts.map