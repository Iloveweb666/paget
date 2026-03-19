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
exports.LLMService = void 0;
/**
 * LLM 服务 — 从环境变量读取配置，提供 LangChain ChatModel 实例
 * LLM service — reads config from environment variables and provides LangChain ChatModel instances
 */
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const openai_1 = require("@langchain/openai");
const business_exception_1 = require("../../common/exceptions/business.exception");
const business_code_1 = require("../../common/constants/business-code");
let LLMService = class LLMService {
    configService;
    // ChatModel 单例缓存 / Cached ChatModel singleton
    cachedModel = null;
    constructor(configService) {
        this.configService = configService;
    }
    /**
     * 获取 LangChain ChatModel 实例（单例复用）
     * Get a LangChain ChatModel instance (singleton, reused across calls)
     */
    async getChatModel() {
        if (this.cachedModel)
            return this.cachedModel;
        const baseUrl = this.configService.get('DEFAULT_LLM_BASE_URL');
        const apiKey = this.configService.get('DEFAULT_LLM_API_KEY');
        const model = this.configService.get('DEFAULT_LLM_MODEL');
        if (!apiKey || !model) {
            throw new business_exception_1.BusinessException(business_code_1.BusinessCode.LLM_CONFIG_NOT_FOUND, 'Missing LLM config: set DEFAULT_LLM_API_KEY and DEFAULT_LLM_MODEL in .env');
        }
        this.cachedModel = new openai_1.ChatOpenAI({
            openAIApiKey: apiKey,
            modelName: model,
            temperature: this.configService.get('DEFAULT_LLM_TEMPERATURE', 0.7),
            maxTokens: this.configService.get('DEFAULT_LLM_MAX_TOKENS', 4096),
            configuration: {
                baseURL: baseUrl || 'https://api.openai.com/v1',
                // Node.js 默认不发 Origin 头，部分 LLM 代理端点（如 page-agent 测试接口）要求携带
                // Node.js doesn't send Origin header by default; some LLM proxy endpoints require it
                defaultHeaders: {
                    Origin: 'http://localhost',
                },
            },
        });
        return this.cachedModel;
    }
};
exports.LLMService = LLMService;
exports.LLMService = LLMService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_1.ConfigService])
], LLMService);
//# sourceMappingURL=llm.service.js.map