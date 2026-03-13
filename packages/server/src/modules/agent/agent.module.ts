/**
 * 智能体模块 — 聚合智能体服务、WebSocket 网关和工具注册表
 * Agent module — aggregates agent service, WebSocket gateway, and tool registry
 */
import { Module } from '@nestjs/common';
import { AgentService } from './agent.service';
import { AgentGateway } from './agent.gateway';
import { ToolRegistry } from './tools/tool.registry';
import { LLMModule } from '../llm/llm.module';
import { PromptModule } from '../prompt/prompt.module';
import { SessionModule } from '../session/session.module';

@Module({
  imports: [LLMModule, PromptModule, SessionModule], // 导入依赖模块 / Import dependency modules
  providers: [AgentService, AgentGateway, ToolRegistry], // 注册服务、网关和工具注册表 / Register service, gateway, and tool registry
  exports: [AgentService],                              // 导出智能体服务 / Export agent service
})
export class AgentModule {}
