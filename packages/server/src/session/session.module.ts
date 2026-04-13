/**
 * 会话模块 — 基于内存的会话状态管理
 * Session module — in-memory session state management
 */
import { Module } from '@nestjs/common';
import { SessionService } from './session.service';

@Module({
  providers: [SessionService],
  exports: [SessionService],
})
export class SessionModule {}
