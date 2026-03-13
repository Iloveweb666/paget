/**
 * 会话服务 — 管理智能体会话的创建、状态更新和历史记录追加
 * Session service — manages agent session creation, status updates, and history appending
 */
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SessionEntity } from './session.entity';

@Injectable()
export class SessionService {
  constructor(
    @InjectRepository(SessionEntity)
    private readonly sessionRepo: Repository<SessionEntity>,
  ) {}

  // 查询所有会话，按更新时间降序 / Find all sessions, ordered by update time descending
  async findAll(): Promise<SessionEntity[]> {
    return this.sessionRepo.find({ order: { updatedAt: 'DESC' } });
  }

  // 根据会话 ID 查找会话 / Find a session by session ID
  async findBySessionId(sessionId: string): Promise<SessionEntity | null> {
    return this.sessionRepo.findOneBy({ sessionId });
  }

  // 获取或创建会话（幂等操作） / Get or create a session (idempotent operation)
  async getOrCreate(sessionId: string): Promise<SessionEntity> {
    let session = await this.findBySessionId(sessionId);
    if (!session) {
      // 会话不存在，创建新会话并初始化空历史记录 / Session doesn't exist, create new one with empty history
      session = this.sessionRepo.create({ sessionId, history: [] });
      session = await this.sessionRepo.save(session);
    }
    return session;
  }

  // 更新会话状态，可选同时更新当前任务 / Update session status, optionally update current task
  async updateStatus(sessionId: string, status: string, task?: string): Promise<void> {
    await this.sessionRepo.update(
      { sessionId },
      { status, ...(task ? { currentTask: task } : {}) },
    );
  }

  // 追加历史事件到会话记录，并更新步骤计数 / Append a history event to the session and update step count
  async appendHistory(sessionId: string, event: Record<string, unknown>): Promise<void> {
    const session = await this.getOrCreate(sessionId);
    const history = session.history || [];
    history.push(event);
    await this.sessionRepo.update(
      { sessionId },
      {
        history,
        totalSteps: history.filter((e) => e.type === 'step').length, // 仅计算 step 类型事件 / Only count step-type events
      },
    );
  }
}
