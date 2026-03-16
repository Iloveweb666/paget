/**
 * LLM 模块 — 基于环境变量提供 LangChain ChatModel 实例
 * LLM module — provides LangChain ChatModel instances based on environment variables
 */
import { Module } from '@nestjs/common';
import { LLMService } from './llm.service';

@Module({
  providers: [LLMService],
  exports: [LLMService],
})
export class LLMModule {}
