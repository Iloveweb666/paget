/**
 * 完成工具 — 标记任务已完成并附带总结消息
 * Done tool — marks the task as completed with a summary message
 */
import { z } from 'zod';
import { BaseTool } from '../base.tool';
export declare class DoneTool extends BaseTool {
    readonly name = "done";
    readonly description = "Mark the task as completed with a summary message";
    readonly schema: z.ZodObject<{
        message: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        message: string;
    }, {
        message: string;
    }>;
    execute(params: z.infer<typeof this.schema>): Promise<string>;
}
//# sourceMappingURL=done.tool.d.ts.map