"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ClickTool = void 0;
/**
 * 点击工具 — 通过元素索引点击页面元素
 * Click tool — clicks a page element by its index
 */
const zod_1 = require("zod");
const base_tool_1 = require("../base.tool");
class ClickTool extends base_tool_1.BaseTool {
    name = 'click';
    description = 'Click an element by its index';
    // 参数模式：元素索引 + 可选的双击标记 / Parameter schema: element index + optional double-click flag
    schema = zod_1.z.object({
        index: zod_1.z.number().describe('Element index to click'),
        doubleClick: zod_1.z.boolean().optional().describe('Whether to double-click'),
    });
    async execute(params) {
        // 实际执行发生在客户端（通过 WebSocket 传递），这里仅返回动作描述 / Actual execution happens on the client side via WebSocket; this only returns the action description
        return `Click element [${params.index}]`;
    }
}
exports.ClickTool = ClickTool;
//# sourceMappingURL=click.tool.js.map