/**
 * 配置服务 — 提供类型化的环境变量访问
 * Config service — provides typed access to environment variables
 */
import { Injectable } from '@nestjs/common';
import { ConfigService as NestConfigService } from '@nestjs/config';

@Injectable()
export class AppConfigService {
  constructor(private readonly configService: NestConfigService) {}

  // 获取 LLM Base URL / Get LLM base URL
  get llmBaseURL(): string {
    return this.configService.get<string>('DEFAULT_LLM_BASE_URL', 'https://api.openai.com/v1');
  }

  // 获取 LLM API Key / Get LLM API key
  get llmApiKey(): string {
    return this.configService.get<string>('DEFAULT_LLM_API_KEY', '');
  }

  // 获取 LLM 模型名称 / Get LLM model name
  get llmModel(): string {
    return this.configService.get<string>('DEFAULT_LLM_MODEL', 'gpt-4');
  }

  // 获取 LLM 温度参数 / Get LLM temperature
  get llmTemperature(): number {
    const val = this.configService.get<string | number>('DEFAULT_LLM_TEMPERATURE', 0.7);
    const num = Number(val);
    return Number.isFinite(num) ? num : 0.7;
  }

  // 获取 LLM 最大 Token 数 / Get LLM max tokens
  get llmMaxTokens(): number {
    const val = this.configService.get<string | number>('DEFAULT_LLM_MAX_TOKENS', 4096);
    const num = Number(val);
    return Number.isFinite(num) ? num : 4096;
  }

  // 获取服务端口 / Get server port
  get serverPort(): number {
    return this.configService.get<number>('SERVER_PORT', 3000);
  }
}
