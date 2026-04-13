/**
 * 网关模块 — WebSocket 通信层
 * Gateway module — WebSocket communication layer
 */
import { Module } from '@nestjs/common';
import { AgentGateway } from './agent.gateway';
import { AgentModule } from '../agent/agent.module';
import { IntentModule } from '../intent/intent.module';
import { LLMModule } from '../llm/llm.module';

@Module({
  imports: [AgentModule, IntentModule, LLMModule],
  providers: [AgentGateway],
})
export class GatewayModule {}
