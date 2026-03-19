"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
var AgentGateway_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.AgentGateway = void 0;
/**
 * WebSocket 网关 — 处理客户端与智能体之间的实时双向通信
 * WebSocket gateway — handles real-time bidirectional communication between client and agent
 *
 * 事件流 / Event flow:
 * - 客户端 -> 服务端 / Client -> Server: task:submit, task:cancel, page:state, page:batch_result
 * - 服务端 -> 客户端 / Server -> Client: agent:status, agent:history, agent:activity, page:batch_action
 */
const websockets_1 = require("@nestjs/websockets");
const common_1 = require("@nestjs/common");
const socket_io_1 = require("socket.io");
const uuid_1 = require("uuid");
const shared_1 = require("@paget/shared");
const agent_service_1 = require("./agent.service");
const intent_classifier_1 = require("./chain/intent-classifier");
let AgentGateway = AgentGateway_1 = class AgentGateway {
    agentService;
    server;
    logger = new common_1.Logger(AgentGateway_1.name);
    /**
     * 每个会话的待处理页面状态和批量结果的 Promise 解析器
     * 当智能体循环需要客户端数据时，在此设置解析器；客户端响应时由网关解析
     * Per-session state for pending page state / batch result responses.
     * When the agent loop needs data from the client, it sets a resolver here
     * and the gateway resolves it when the client responds.
     */
    pageStateResolvers = new Map();
    batchResultResolvers = new Map();
    /**
     * Socket ID → Session ID 映射，用于断连时清理运行中的任务
     * Socket ID → Session ID mapping for cleaning up running tasks on disconnect
     */
    clientSessionMap = new Map();
    constructor(agentService) {
        this.agentService = agentService;
    }
    // 客户端连接时记录日志 / Log when a client connects
    handleConnection(client) {
        this.logger.log(`Client connected: ${client.id}`);
    }
    // 客户端断开时清理运行中的任务和等待中的 resolver / Clean up running tasks and pending resolvers on disconnect
    handleDisconnect(client) {
        this.logger.log(`Client disconnected: ${client.id}`);
        // 查找该客户端关联的 sessionId / Find sessionId associated with this client
        const sessionId = this.clientSessionMap.get(client.id);
        if (sessionId) {
            // 取消运行中的任务 / Cancel running task
            this.agentService.cancel(sessionId);
            // 清理等待中的 resolver（让服务端 Promise 超时或拒绝）/ Clean up pending resolvers
            this.pageStateResolvers.delete(sessionId);
            this.batchResultResolvers.delete(sessionId);
            this.clientSessionMap.delete(client.id);
            this.logger.log(`Cleaned up session ${sessionId} for disconnected client ${client.id}`);
        }
    }
    // 处理任务提交事件 — 意图分类后分发到对话或自动化 / Handle task submission — classify intent then dispatch to chat or automation
    async handleTaskSubmit(client, data) {
        const { task, sessionId, llmConfigId } = data;
        // 记录 socket → session 映射，用于断连清理 / Track socket → session mapping for disconnect cleanup
        this.clientSessionMap.set(client.id, sessionId);
        // 检查是否已有任务在运行 / Check if a task is already running
        if (this.agentService.isRunning(sessionId)) {
            client.emit(shared_1.WS_EVENTS.AGENT_STATUS, { status: 'error', message: 'Task already running' });
            return;
        }
        // 意图分类 / Intent classification
        try {
            const model = await this.agentService.getLLMModel();
            const intent = await (0, intent_classifier_1.classifyIntent)(model, task);
            this.logger.log(`Intent classified: "${task}" → ${intent}`);
            if (intent === 'chat') {
                // 对话意图 → 流式回复 / Chat intent → streaming reply
                const messageId = (0, uuid_1.v4)();
                client.emit(shared_1.WS_EVENTS.AGENT_STATUS, { status: 'streaming', sessionId });
                await this.agentService.chat(sessionId, task, {
                    onChunk: (chunk) => {
                        client.emit(shared_1.WS_EVENTS.AGENT_STREAM, {
                            sessionId,
                            messageId,
                            chunk,
                            done: false,
                        });
                    },
                    onDone: () => {
                        client.emit(shared_1.WS_EVENTS.AGENT_STREAM, {
                            sessionId,
                            messageId,
                            chunk: '',
                            done: true,
                        });
                        client.emit(shared_1.WS_EVENTS.AGENT_STATUS, { status: 'idle', sessionId });
                    },
                    onError: (error) => {
                        client.emit(shared_1.WS_EVENTS.AGENT_STREAM, {
                            sessionId,
                            messageId,
                            chunk: '',
                            done: true,
                        });
                        client.emit(shared_1.WS_EVENTS.AGENT_STATUS, {
                            status: 'error',
                            sessionId,
                            message: error.message,
                        });
                    },
                });
                return;
            }
            // 自动化意图 → 走现有 agent 循环 / Automation intent → existing agent loop
            await this.agentService.run({
                sessionId,
                task,
                llmConfigId,
                getPageState: () => this.requestPageState(client, sessionId),
                executeBatchActions: (actions) => this.requestBatchActions(client, sessionId, actions),
                emitStatus: (status, message) => {
                    client.emit(shared_1.WS_EVENTS.AGENT_STATUS, { status, sessionId, message });
                },
                emitHistory: (event) => {
                    client.emit(shared_1.WS_EVENTS.AGENT_HISTORY, event);
                },
                emitActivity: (activity) => {
                    client.emit(shared_1.WS_EVENTS.AGENT_ACTIVITY, activity);
                },
            });
        }
        catch (err) {
            this.logger.error(`Task handling error for session ${sessionId}:`, err);
            client.emit(shared_1.WS_EVENTS.AGENT_STATUS, {
                status: 'error',
                sessionId,
                message: err instanceof Error ? err.message : String(err),
            });
        }
    }
    // 处理任务取消事件 — 中止运行中的任务 / Handle task cancel event — abort the running task
    handleTaskCancel(client, data) {
        this.agentService.cancel(data.sessionId);
        client.emit('agent:status', { status: 'idle', sessionId: data.sessionId });
    }
    // 处理页面状态响应 — 解析等待中的页面状态请求 / Handle page state response — resolve pending page state request
    handlePageState(data) {
        const resolver = this.pageStateResolvers.get(data.sessionId);
        if (resolver) {
            resolver({ header: data.header, content: data.content, footer: data.footer });
            this.pageStateResolvers.delete(data.sessionId);
        }
    }
    // 处理批量操作结果响应 — 解析等待中的批量操作请求 / Handle batch result response — resolve pending batch action request
    handleBatchResult(data) {
        const resolver = this.batchResultResolvers.get(data.sessionId);
        if (resolver) {
            resolver(data.results);
            this.batchResultResolvers.delete(data.sessionId);
        }
    }
    /**
     * 向客户端请求页面状态并等待响应（带超时）
     * Request page state from client and wait for response (with timeout)
     */
    requestPageState(client, sessionId) {
        return new Promise((resolve, reject) => {
            // 30 秒超时 / 30-second timeout
            const timeout = setTimeout(() => {
                this.pageStateResolvers.delete(sessionId);
                reject(new Error('Page state request timed out'));
            }, 30000);
            // 注册解析器，等待客户端响应 / Register resolver, wait for client response
            this.pageStateResolvers.set(sessionId, (state) => {
                clearTimeout(timeout);
                resolve(state);
            });
            // 向客户端发送获取页面状态的请求 / Send page state request to client
            client.emit('page:action', { type: 'get_state', sessionId });
        });
    }
    /**
     * 向客户端发送批量操作并等待结果（带超时）
     * Send batch actions to client and wait for results (with timeout)
     */
    requestBatchActions(client, sessionId, actions) {
        return new Promise((resolve, reject) => {
            // 60 秒超时（批量操作可能需要更长时间） / 60-second timeout (batch actions may take longer)
            const timeout = setTimeout(() => {
                this.batchResultResolvers.delete(sessionId);
                reject(new Error('Batch action request timed out'));
            }, 60000);
            // 注册解析器，等待客户端返回批量操作结果 / Register resolver, wait for client to return batch results
            this.batchResultResolvers.set(sessionId, (results) => {
                clearTimeout(timeout);
                resolve(results);
            });
            // 向客户端发送批量操作指令 / Send batch action commands to client
            client.emit('page:batch_action', { sessionId, actions });
        });
    }
};
exports.AgentGateway = AgentGateway;
__decorate([
    (0, websockets_1.WebSocketServer)(),
    __metadata("design:type", socket_io_1.Server)
], AgentGateway.prototype, "server", void 0);
__decorate([
    (0, websockets_1.SubscribeMessage)('task:submit'),
    __param(0, (0, websockets_1.ConnectedSocket)()),
    __param(1, (0, websockets_1.MessageBody)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [socket_io_1.Socket, Object]),
    __metadata("design:returntype", Promise)
], AgentGateway.prototype, "handleTaskSubmit", null);
__decorate([
    (0, websockets_1.SubscribeMessage)('task:cancel'),
    __param(0, (0, websockets_1.ConnectedSocket)()),
    __param(1, (0, websockets_1.MessageBody)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [socket_io_1.Socket, Object]),
    __metadata("design:returntype", void 0)
], AgentGateway.prototype, "handleTaskCancel", null);
__decorate([
    (0, websockets_1.SubscribeMessage)('page:state'),
    __param(0, (0, websockets_1.MessageBody)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], AgentGateway.prototype, "handlePageState", null);
__decorate([
    (0, websockets_1.SubscribeMessage)('page:batch_result'),
    __param(0, (0, websockets_1.MessageBody)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], AgentGateway.prototype, "handleBatchResult", null);
exports.AgentGateway = AgentGateway = AgentGateway_1 = __decorate([
    (0, websockets_1.WebSocketGateway)({ namespace: '/agent', cors: { origin: '*' } }),
    __metadata("design:paramtypes", [agent_service_1.AgentService])
], AgentGateway);
//# sourceMappingURL=agent.gateway.js.map