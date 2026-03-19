"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DoneTool = void 0;
/**
 * 完成工具 — 标记任务已完成并附带总结消息
 * Done tool — marks the task as completed with a summary message
 */
const zod_1 = require("zod");
const base_tool_1 = require("../base.tool");
class DoneTool extends base_tool_1.BaseTool {
    name = 'done';
    description = 'Mark the task as completed with a summary message';
    // 参数模式：任务完成总结 / Parameter schema: task completion summary
    schema = zod_1.z.object({
        message: zod_1.z.string().describe('Summary of what was accomplished'),
    });
    async execute(params) {
        // 返回完成消息（智能体循环检测到 done 工具后会终止） / Return the completion message (agent loop terminates when done tool is detected)
        return params.message;
    }
}
exports.DoneTool = DoneTool;
//# sourceMappingURL=done.tool.js.map