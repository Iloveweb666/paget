/**
 * LLM 服务 — 从环境变量读取配置，提供 LangChain ChatModel 实例
 * LLM service — reads config from environment variables and provides LangChain ChatModel instances
 */
import { Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { ChatOpenAI } from "@langchain/openai";
import { BusinessException } from "../../common/exceptions/business.exception";
import { BusinessCode } from "../../common/constants/business-code";
import { resolveChatModelOverrides } from "./llm-model.config";

@Injectable()
export class LLMService {
  // ChatModel 单例缓存 / Cached ChatModel singleton
  private cachedModel: ChatOpenAI | null = null;

  constructor(private readonly configService: ConfigService) {}

  /**
   * 获取 LangChain ChatModel 实例（单例复用）
   * Get a LangChain ChatModel instance (singleton, reused across calls)
   */
  async getChatModel(): Promise<ChatOpenAI> {
    if (this.cachedModel) return this.cachedModel;

    const baseUrl = this.configService.get<string>("DEFAULT_LLM_BASE_URL");
    const apiKey = this.configService.get<string>("DEFAULT_LLM_API_KEY");
    const model = this.configService.get<string>("DEFAULT_LLM_MODEL");

    if (!apiKey || !model) {
      throw new BusinessException(
        BusinessCode.LLM_CONFIG_NOT_FOUND,
        "Missing LLM config: set DEFAULT_LLM_API_KEY and DEFAULT_LLM_MODEL in .env",
      );
    }

    const temperatureValue = this.configService.get<string | number>(
      "DEFAULT_LLM_TEMPERATURE",
      0.7,
    );
    const maxTokensValue = this.configService.get<string | number>(
      "DEFAULT_LLM_MAX_TOKENS",
      4096,
    );
    const temperature = Number(temperatureValue);
    const maxTokens = Number(maxTokensValue);
    const baseTemperature = Number.isFinite(temperature) ? temperature : 0.7;
    const baseMaxTokens = Number.isFinite(maxTokens) ? maxTokens : 4096;
    const modelOverrides = resolveChatModelOverrides(model);

    this.cachedModel = new ChatOpenAI({
      openAIApiKey: apiKey,
      modelName: model,
      temperature: modelOverrides.temperature ?? baseTemperature,
      maxTokens: modelOverrides.maxTokens ?? baseMaxTokens,
      modelKwargs: modelOverrides.modelKwargs,
      configuration: {
        baseURL:
          modelOverrides.configuration?.baseURL ||
          baseUrl ||
          "https://api.openai.com/v1",
        // Node.js 默认不发 Origin 头，部分 LLM 代理端点（如 page-agent 测试接口）要求携带
        // Node.js doesn't send Origin header by default; some LLM proxy endpoints require it
        defaultHeaders: {
          Origin: "http://localhost",
          ...(modelOverrides.configuration?.defaultHeaders ?? {}),
        },
      },
    });

    return this.cachedModel;
  }
}
