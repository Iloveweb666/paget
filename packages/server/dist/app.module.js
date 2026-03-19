"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppModule = void 0;
/**
 * 根模块 — 聚合所有功能模块
 * Root module — aggregates all feature modules
 */
const common_1 = require("@nestjs/common");
const config_module_1 = require("./common/config/config.module");
const llm_module_1 = require("./modules/llm/llm.module");
const prompt_module_1 = require("./modules/prompt/prompt.module");
const session_module_1 = require("./modules/session/session.module");
const agent_module_1 = require("./modules/agent/agent.module");
let AppModule = class AppModule {
};
exports.AppModule = AppModule;
exports.AppModule = AppModule = __decorate([
    (0, common_1.Module)({
        imports: [
            config_module_1.AppConfigModule, // 配置模块（全局 ConfigService）/ Configuration module (global ConfigService)
            llm_module_1.LLMModule, // 大语言模型管理模块 / LLM management module
            prompt_module_1.PromptModule, // 提示词模板模块 / Prompt template module
            session_module_1.SessionModule, // 会话管理模块 / Session management module
            agent_module_1.AgentModule, // 智能体编排模块 / Agent orchestration module
        ],
    })
], AppModule);
//# sourceMappingURL=app.module.js.map