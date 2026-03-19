"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ToolRegistry = void 0;
/**
 * 工具注册表 — 管理所有可用的智能体工具，支持动态注册自定义工具
 * Tool registry — manages all available agent tools, supports dynamic registration of custom tools
 */
const common_1 = require("@nestjs/common");
const click_tool_1 = require("./builtin/click.tool");
const input_tool_1 = require("./builtin/input.tool");
const done_tool_1 = require("./builtin/done.tool");
let ToolRegistry = class ToolRegistry {
    // 工具映射表，以工具名称为键 / Tool map, keyed by tool name
    tools = new Map();
    constructor() {
        // 初始化时注册内置工具 / Register built-in tools on initialization
        this.registerBuiltinTools();
    }
    // 注册内置工具（click、input、done） / Register built-in tools (click, input, done)
    registerBuiltinTools() {
        const builtins = [new click_tool_1.ClickTool(), new input_tool_1.InputTool(), new done_tool_1.DoneTool()];
        for (const tool of builtins) {
            this.register(tool);
        }
    }
    // 注册一个新工具 / Register a new tool
    register(tool) {
        this.tools.set(tool.name, tool);
    }
    // 按名称获取工具实例 / Get a tool instance by name
    get(name) {
        return this.tools.get(name);
    }
    // 获取所有已注册的工具 / Get all registered tools
    getAll() {
        return Array.from(this.tools.values());
    }
    /**
     * 获取工具描述信息列表，用于构建 LLM 上下文
     * Get tool descriptions for LLM context
     */
    getToolDescriptions() {
        return this.getAll().map((tool) => ({
            name: tool.name,
            description: tool.description,
            schema: tool.schema,
        }));
    }
};
exports.ToolRegistry = ToolRegistry;
exports.ToolRegistry = ToolRegistry = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [])
], ToolRegistry);
//# sourceMappingURL=tool.registry.js.map