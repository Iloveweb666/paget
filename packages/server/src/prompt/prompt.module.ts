/**
 * 提示词模块 — 从文件加载系统提示词模板
 * Prompt module — loads system prompt templates from files
 */
import { Module } from '@nestjs/common';
import { PromptService } from './prompt.service';

@Module({
  providers: [PromptService],
  exports: [PromptService],
})
export class PromptModule {}
