"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AgentModule = void 0;
/**
 * 智能体模块 — 聚合智能体服务、WebSocket 网关和工具注册表
 * Agent module — aggregates agent service, WebSocket gateway, and tool registry
 */
const common_1 = require("@nestjs/common");
const agent_service_1 = require("./agent.service");
const agent_gateway_1 = require("./agent.gateway");
const tool_registry_1 = require("./tools/tool.registry");
const llm_module_1 = require("../llm/llm.module");
const prompt_module_1 = require("../prompt/prompt.module");
const session_module_1 = require("../session/session.module");
let AgentModule = class AgentModule {
};
exports.AgentModule = AgentModule;
exports.AgentModule = AgentModule = __decorate([
    (0, common_1.Module)({
        imports: [llm_module_1.LLMModule, prompt_module_1.PromptModule, session_module_1.SessionModule], // 导入依赖模块 / Import dependency modules
        providers: [agent_service_1.AgentService, agent_gateway_1.AgentGateway, tool_registry_1.ToolRegistry], // 注册服务、网关和工具注册表 / Register service, gateway, and tool registry
        exports: [agent_service_1.AgentService], // 导出智能体服务 / Export agent service
    })
], AgentModule);
//# sourceMappingURL=agent.module.js.map