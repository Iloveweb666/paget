/**
 * 根模块 — 聚合所有功能模块
 * Root module — aggregates all feature modules
 */
import { Module } from '@nestjs/common';
import { ConfigModule } from './config/config.module';
import { LLMModule } from './llm/llm.module';
import { PromptModule } from './prompt/prompt.module';
import { SessionModule } from './session/session.module';
import { IntentModule } from './intent/intent.module';
import { AgentModule } from './agent/agent.module';
import { GatewayModule } from './gateway/gateway.module';

@Module({
  imports: [
    ConfigModule,       // 配置模块（全局 ConfigService）/ Configuration module (global ConfigService)
    LLMModule,          // LLM 客户端模块 / LLM client module
    PromptModule,       // 提示词模板模块 / Prompt template module
    SessionModule,      // 会话管理模块 / Session management module
    IntentModule,       // 意图分流模块 / Intent routing module
    AgentModule,        // 智能体编排模块 / Agent orchestration module
    GatewayModule,      // WebSocket 网关模块 / WebSocket gateway module
  ],
})
export class AppModule {}
