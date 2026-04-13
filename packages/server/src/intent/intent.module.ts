/**
 * 意图模块 — 提供用户输入意图分类服务
 * Intent module — provides user input intent classification service
 */
import { Module } from '@nestjs/common';
import { IntentRouterService } from './intent-router.service';
import { LLMModule } from '../llm/llm.module';

@Module({
  imports: [LLMModule],
  providers: [IntentRouterService],
  exports: [IntentRouterService],
})
export class IntentModule {}
