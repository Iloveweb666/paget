/**
 * 会话模块 — 注册会话实体和服务，导出服务供 AgentModule 使用
 * Session module — registers session entity and service, exports service for AgentModule
 */
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SessionEntity } from './session.entity';
import { SessionService } from './session.service';

@Module({
  imports: [TypeOrmModule.forFeature([SessionEntity])], // 注册会话实体 / Register session entity
  providers: [SessionService],                          // 注册会话服务 / Register session service
  exports: [SessionService],                            // 导出供智能体模块使用 / Export for agent module
})
export class SessionModule {}
