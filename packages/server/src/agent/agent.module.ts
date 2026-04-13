/**
 * 智能体模块 — 聚合智能体服务和工具注册表
 * Agent module — aggregates agent service and tool registry
 */
import { Module } from '@nestjs/common';
import { AgentService } from './agent.service';
import { ToolRegistry } from './tools/tool.registry';
import { LLMModule } from '../llm/llm.module';
import { PromptModule } from '../prompt/prompt.module';
import { SessionModule } from '../session/session.module';

@Module({
  imports: [LLMModule, PromptModule, SessionModule],
  providers: [AgentService, ToolRegistry],
  exports: [AgentService],
})
export class AgentModule {}
