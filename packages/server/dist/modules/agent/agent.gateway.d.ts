/**
 * WebSocket 网关 — 处理客户端与智能体之间的实时双向通信
 * WebSocket gateway — handles real-time bidirectional communication between client and agent
 *
 * 事件流 / Event flow:
 * - 客户端 -> 服务端 / Client -> Server: task:submit, task:cancel, page:state, page:batch_result
 * - 服务端 -> 客户端 / Server -> Client: agent:status, agent:history, agent:activity, page:batch_action
 */
import { OnGatewayConnection, OnGatewayDisconnect } from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { AgentService } from './agent.service';
export declare class AgentGateway implements OnGatewayConnection, OnGatewayDisconnect {
    private readonly agentService;
    server: Server;
    private readonly logger;
    /**
     * 每个会话的待处理页面状态和批量结果的 Promise 解析器
     * 当智能体循环需要客户端数据时，在此设置解析器；客户端响应时由网关解析
     * Per-session state for pending page state / batch result responses.
     * When the agent loop needs data from the client, it sets a resolver here
     * and the gateway resolves it when the client responds.
     */
    private pageStateResolvers;
    private batchResultResolvers;
    /**
     * Socket ID → Session ID 映射，用于断连时清理运行中的任务
     * Socket ID → Session ID mapping for cleaning up running tasks on disconnect
     */
    private clientSessionMap;
    constructor(agentService: AgentService);
    handleConnection(client: Socket): void;
    handleDisconnect(client: Socket): void;
    handleTaskSubmit(client: Socket, data: {
        task: string;
        sessionId: string;
        llmConfigId?: string;
    }): Promise<void>;
    handleTaskCancel(client: Socket, data: {
        sessionId: string;
    }): void;
    handlePageState(data: {
        sessionId: string;
        header: string;
        content: string;
        footer: string;
    }): void;
    handleBatchResult(data: {
        sessionId: string;
        results: any;
    }): void;
    /**
     * 向客户端请求页面状态并等待响应（带超时）
     * Request page state from client and wait for response (with timeout)
     */
    private requestPageState;
    /**
     * 向客户端发送批量操作并等待结果（带超时）
     * Send batch actions to client and wait for results (with timeout)
     */
    private requestBatchActions;
}
//# sourceMappingURL=agent.gateway.d.ts.map