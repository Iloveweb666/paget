"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SessionService = void 0;
/**
 * 会话服务 — 基于内存 Map 的会话状态管理（适用于单实例单次会话场景）
 * Session service — in-memory Map-based session state management (for single-instance, single-session scenarios)
 */
const common_1 = require("@nestjs/common");
let SessionService = class SessionService {
    // 会话存储（键为 sessionId）/ Session store (keyed by sessionId)
    sessions = new Map();
    // 获取或创建会话（幂等操作）/ Get or create a session (idempotent)
    async getOrCreate(sessionId) {
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
    async updateStatus(sessionId, status, task) {
        const session = await this.getOrCreate(sessionId);
        session.status = status;
        if (task !== undefined)
            session.currentTask = task;
    }
    // 追加历史事件 / Append a history event
    async appendHistory(sessionId, event) {
        const session = await this.getOrCreate(sessionId);
        session.history.push(event);
        session.totalSteps = session.history.filter((e) => e.type === 'step').length;
    }
};
exports.SessionService = SessionService;
exports.SessionService = SessionService = __decorate([
    (0, common_1.Injectable)()
], SessionService);
//# sourceMappingURL=session.service.js.map