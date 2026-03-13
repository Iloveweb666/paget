/**
 * 提示词模块 — 注册提示词实体、服务和控制器，并导出服务供 AgentModule 使用
 * Prompt module — registers prompt entity, service, and controller, and exports service for AgentModule
 */
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PromptTemplateEntity } from './prompt.entity';
import { PromptService } from './prompt.service';
import { PromptController } from './prompt.controller';

@Module({
  imports: [TypeOrmModule.forFeature([PromptTemplateEntity])], // 注册提示词模板实体 / Register prompt template entity
  controllers: [PromptController],                             // 注册控制器 / Register controller
  providers: [PromptService],                                  // 注册服务 / Register service
  exports: [PromptService],                                    // 导出服务供智能体模块使用 / Export service for agent module
})
export class PromptModule {}
