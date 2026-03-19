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
export declare class SessionService {
    private readonly sessions;
    getOrCreate(sessionId: string): Promise<SessionData>;
    updateStatus(sessionId: string, status: string, task?: string): Promise<void>;
    appendHistory(sessionId: string, event: Record<string, unknown>): Promise<void>;
}
export {};
//# sourceMappingURL=session.service.d.ts.map