/**
 * LLM 服务 — 从环境变量读取配置，提供 LangChain ChatModel 实例
 * LLM service — reads config from environment variables and provides LangChain ChatModel instances
 */
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ChatOpenAI } from '@langchain/openai';
import { BusinessException } from '../../common/exceptions/business.exception';
import { BusinessCode } from '../../common/constants/business-code';

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

    const baseUrl = this.configService.get<string>('DEFAULT_LLM_BASE_URL');
    const apiKey = this.configService.get<string>('DEFAULT_LLM_API_KEY');
    const model = this.configService.get<string>('DEFAULT_LLM_MODEL');

    if (!apiKey || !model) {
      throw new BusinessException(
        BusinessCode.LLM_CONFIG_NOT_FOUND,
        'Missing LLM config: set DEFAULT_LLM_API_KEY and DEFAULT_LLM_MODEL in .env',
      );
    }

    this.cachedModel = new ChatOpenAI({
      openAIApiKey: apiKey,
      modelName: model,
      temperature: this.configService.get<number>('DEFAULT_LLM_TEMPERATURE', 0.7),
      maxTokens: this.configService.get<number>('DEFAULT_LLM_MAX_TOKENS', 4096),
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
}
