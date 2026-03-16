/**
 * 会话服务 — 基于内存 Map 的会话状态管理（适用于单实例单次会话场景）
 * Session service — in-memory Map-based session state management (for single-instance, single-session scenarios)
 */
import { Injectable } from '@nestjs/common';

/**
 * 内存中的会话数据结构
 * In-memory session data structure
 */
interface SessionData {
  sessionId: string;
  status: string;
  currentTask: string | null;
  history: Array<Record<string, unknown>>;
  totalSteps: number;
  createdAt: Date;
}

@Injectable()
export class SessionService {
  // 会话存储（键为 sessionId）/ Session store (keyed by sessionId)
  private readonly sessions = new Map<string, SessionData>();

  // 获取或创建会话（幂等操作）/ Get or create a session (idempotent)
  async getOrCreate(sessionId: string): Promise<SessionData> {
    let session = this.sessions.get(sessionId);
    if (!session) {
      session = {
        sessionId,
        status: 'idle',
        currentTask: null,
        history: [],
        totalSteps: 0,
        createdAt: new Date(),
      };
      this.sessions.set(sessionId, session);
    }
    return session;
  }

  // 更新会话状态 / Update session status
  async updateStatus(sessionId: string, status: string, task?: string): Promise<void> {
    const session = await this.getOrCreate(sessionId);
    session.status = status;
    if (task !== undefined) session.currentTask = task;
  }

  // 追加历史事件 / Append a history event
  async appendHistory(sessionId: string, event: Record<string, unknown>): Promise<void> {
    const session = await this.getOrCreate(sessionId);
    session.history.push(event);
    session.totalSteps = session.history.filter((e) => e.type === 'step').length;
  }
}
