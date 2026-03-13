/**
 * 创建 LLM 配置的数据传输对象 — 定义创建时必填和可选字段
 * Create LLM config DTO — defines required and optional fields for creation
 */
import { IsString, IsOptional, IsNumber, IsBoolean, Min, Max } from 'class-validator';

export class CreateLLMDto {
  // 配置名称（必填） / Config name (required)
  @IsString()
  name!: string;

  // API 基础地址（必填） / API base URL (required)
  @IsString()
  baseUrl!: string;

  // API 密钥（必填） / API key (required)
  @IsString()
  apiKey!: string;

  // 模型名称（必填） / Model name (required)
  @IsString()
  model!: string;

  // 温度参数（可选，范围 0-2） / Temperature (optional, range 0-2)
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(2)
  temperature?: number;

  // 最大 token 数（可选，最小值 1） / Max tokens (optional, minimum 1)
  @IsOptional()
  @IsNumber()
  @Min(1)
  maxTokens?: number;

  // 是否设为默认配置（可选） / Whether to set as default config (optional)
  @IsOptional()
  @IsBoolean()
  isDefault?: boolean;
}
