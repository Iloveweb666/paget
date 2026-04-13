/**
 * LLM 模块 — 基于 @paget/llm 提供 LLM 客户端实例
 * LLM module — provides LLM client instances via @paget/llm
 */
import { Module } from '@nestjs/common';
import { LLMService } from './llm.service';
import { ConfigModule } from '../config/config.module';

@Module({
  imports: [ConfigModule],
  providers: [LLMService],
  exports: [LLMService],
})
export class LLMModule {}
