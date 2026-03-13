/**
 * 更新 LLM 配置的数据传输对象 — 所有字段均为可选
 * Update LLM config DTO — all fields are optional
 */
import { IsString, IsOptional, IsNumber, IsBoolean, Min, Max } from 'class-validator';

export class UpdateLLMDto {
  // 配置名称 / Config name
  @IsOptional()
  @IsString()
  name?: string;

  // API 基础地址 / API base URL
  @IsOptional()
  @IsString()
  baseUrl?: string;

  // API 密钥 / API key
  @IsOptional()
  @IsString()
  apiKey?: string;

  // 模型名称 / Model name
  @IsOptional()
  @IsString()
  model?: string;

  // 温度参数（范围 0-2） / Temperature (range 0-2)
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(2)
  temperature?: number;

  // 最大 token 数（最小值 1） / Max tokens (minimum 1)
  @IsOptional()
  @IsNumber()
  @Min(1)
  maxTokens?: number;

  // 是否设为默认配置 / Whether to set as default config
  @IsOptional()
  @IsBoolean()
  isDefault?: boolean;
}
