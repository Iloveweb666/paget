/**
 * LLM 模块 — 注册 LLM 实体、服务和控制器，并导出服务供其他模块使用
 * LLM module — registers LLM entity, service, and controller, and exports service for other modules
 */
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { LLMConfigEntity } from './llm.entity';
import { LLMService } from './llm.service';
import { LLMController } from './llm.controller';

@Module({
  imports: [TypeOrmModule.forFeature([LLMConfigEntity])], // 注册 LLM 配置实体 / Register LLM config entity
  controllers: [LLMController],                           // 注册控制器 / Register controller
  providers: [LLMService],                                // 注册服务 / Register service
  exports: [LLMService],                                  // 导出服务供 AgentModule 等使用 / Export service for AgentModule etc.
})
export class LLMModule {}
