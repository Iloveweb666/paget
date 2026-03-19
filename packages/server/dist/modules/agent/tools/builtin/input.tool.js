"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.InputTool = void 0;
/**
 * 输入工具 — 通过元素索引向表单字段输入文本
 * Input tool — inputs text into a form field by its index
 */
const zod_1 = require("zod");
const base_tool_1 = require("../base.tool");
class InputTool extends base_tool_1.BaseTool {
    name = 'input';
    description = 'Input text into a form field by its index';
    // 参数模式：目标元素索引 + 输入文本 / Parameter schema: target element index + text to input
    schema = zod_1.z.object({
        index: zod_1.z.number().describe('Element index to input text into'),
        text: zod_1.z.string().describe('Text to input'),
    });
    async execute(params) {
        // 返回动作描述（实际输入由客户端执行） / Return action description (actual input is executed by the client)
        return `Input "${params.text}" into element [${params.index}]`;
    }
}
exports.InputTool = InputTool;
//# sourceMappingURL=input.tool.js.map