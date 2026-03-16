/**
 * 根模块 — 聚合所有功能模块
 * Root module — aggregates all feature modules
 */
import { Module } from '@nestjs/common';
import { AppConfigModule } from './common/config/config.module';
import { LLMModule } from './modules/llm/llm.module';
import { PromptModule } from './modules/prompt/prompt.module';
import { SessionModule } from './modules/session/session.module';
import { AgentModule } from './modules/agent/agent.module';

@Module({
  imports: [
    AppConfigModule,   // 配置模块（全局 ConfigService）/ Configuration module (global ConfigService)
    LLMModule,         // 大语言模型管理模块 / LLM management module
    PromptModule,      // 提示词模板模块 / Prompt template module
    SessionModule,     // 会话管理模块 / Session management module
    AgentModule,       // 智能体编排模块 / Agent orchestration module
  ],
})
export class AppModule {}
