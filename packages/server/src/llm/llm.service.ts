/**
 * LLM 服务 — 使用 @paget/llm 提供 LLM 客户端实例（替代 LangChain）
 * LLM service — provides LLM client instances via @paget/llm (replaces LangChain)
 */
import { Injectable } from '@nestjs/common';
import { LLM } from '@paget/llm';
import { AppConfigService } from '../config/config.service';
import { BusinessException } from '../common/exceptions/business.exception';
import { BusinessCode } from '../common/constants/business-code';

@Injectable()
export class LLMService {
  // LLM 实例缓存 / Cached LLM instance
  private cachedLLM: LLM | null = null;

  constructor(private readonly appConfig: AppConfigService) {}

  /**
   * 获取 LLM 实例（单例复用）
   * Get LLM instance (singleton, reused across calls)
   */
  getLLM(): LLM {
    if (this.cachedLLM) return this.cachedLLM;

    const apiKey = this.appConfig.llmApiKey;
    const model = this.appConfig.llmModel;

    if (!apiKey || !model) {
      throw new BusinessException(
        BusinessCode.LLM_CONFIG_NOT_FOUND,
        'Missing LLM config: set DEFAULT_LLM_API_KEY and DEFAULT_LLM_MODEL in .env',
      );
    }

    this.cachedLLM = new LLM({
      baseURL: this.appConfig.llmBaseURL,
      model,
      apiKey,
      temperature: this.appConfig.llmTemperature,
    });

    return this.cachedLLM;
  }
}
