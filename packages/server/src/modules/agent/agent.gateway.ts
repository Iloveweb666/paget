/**
 * WebSocket 网关 — 处理客户端与智能体之间的实时双向通信
 * WebSocket gateway — handles real-time bidirectional communication between client and agent
 *
 * 事件流 / Event flow:
 * - 客户端 -> 服务端 / Client -> Server: task:submit, task:cancel, page:state, page:batch_result
 * - 服务端 -> 客户端 / Server -> Client: agent:status, agent:history, agent:activity, page:batch_action
 */
import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  ConnectedSocket,
  MessageBody,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Logger } from '@nestjs/common';
import { Server, Socket } from 'socket.io';
import { v4 as uuidv4 } from 'uuid';
import { WS_EVENTS } from '@paget/shared';
import { AgentService } from './agent.service';
import { classifyIntent } from './chain/intent-classifier';

@WebSocketGateway({ namespace: '/agent', cors: { origin: '*' } })
export class AgentGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server!: Server;

  private readonly logger = new Logger(AgentGateway.name);

  /**
   * 每个会话的待处理页面状态和批量结果的 Promise 解析器
   * 当智能体循环需要客户端数据时，在此设置解析器；客户端响应时由网关解析
   * Per-session state for pending page state / batch result responses.
   * When the agent loop needs data from the client, it sets a resolver here
   * and the gateway resolves it when the client responds.
   */
  private pageStateResolvers = new Map<string, (state: any) => void>();
  private batchResultResolvers = new Map<string, (results: any) => void>();

  /**
   * Socket ID → Session ID 映射，用于断连时清理运行中的任务
   * Socket ID → Session ID mapping for cleaning up running tasks on disconnect
   */
  private clientSessionMap = new Map<string, string>();

  constructor(private readonly agentService: AgentService) {}

  // 客户端连接时记录日志 / Log when a client connects
  handleConnection(client: Socket) {
    this.logger.log(`Client connected: ${client.id}`);
  }

  // 客户端断开时清理运行中的任务和等待中的 resolver / Clean up running tasks and pending resolvers on disconnect
  handleDisconnect(client: Socket) {
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
  @SubscribeMessage('task:submit')
  async handleTaskSubmit(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { task: string; sessionId: string; llmConfigId?: string },
  ) {
    const { task, sessionId, llmConfigId } = data;

    // 记录 socket → session 映射，用于断连清理 / Track socket → session mapping for disconnect cleanup
    this.clientSessionMap.set(client.id, sessionId);

    // 检查是否已有任务在运行 / Check if a task is already running
    if (this.agentService.isRunning(sessionId)) {
      client.emit(WS_EVENTS.AGENT_STATUS, { status: 'error', message: 'Task already running' });
      return;
    }

    // 意图分类 / Intent classification
    try {
      const model = await this.agentService.getLLMModel();
      const intent = await classifyIntent(model, task);
      this.logger.log(`Intent classified: "${task}" → ${intent}`);

      if (intent === 'chat') {
        // 对话意图 → 流式回复 / Chat intent → streaming reply
        const messageId = uuidv4();
        client.emit(WS_EVENTS.AGENT_STATUS, { status: 'streaming', sessionId });

        await this.agentService.chat(sessionId, task, {
          onChunk: (chunk) => {
            client.emit(WS_EVENTS.AGENT_STREAM, {
              sessionId,
              messageId,
              chunk,
              done: false,
            });
          },
          onDone: () => {
            client.emit(WS_EVENTS.AGENT_STREAM, {
              sessionId,
              messageId,
              chunk: '',
              done: true,
            });
            client.emit(WS_EVENTS.AGENT_STATUS, { status: 'idle', sessionId });
          },
          onError: (error) => {
            client.emit(WS_EVENTS.AGENT_STREAM, {
              sessionId,
              messageId,
              chunk: '',
              done: true,
            });
            client.emit(WS_EVENTS.AGENT_STATUS, {
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
        emitStatus: (status, message?) => {
          client.emit(WS_EVENTS.AGENT_STATUS, { status, sessionId, message });
        },
        emitHistory: (event) => {
          client.emit(WS_EVENTS.AGENT_HISTORY, event);
        },
        emitActivity: (activity) => {
          client.emit(WS_EVENTS.AGENT_ACTIVITY, activity);
        },
      });
    } catch (err) {
      this.logger.error(`Task handling error for session ${sessionId}:`, err);
      client.emit(WS_EVENTS.AGENT_STATUS, {
        status: 'error',
        sessionId,
        message: err instanceof Error ? err.message : String(err),
      });
    }
  }

  // 处理任务取消事件 — 中止运行中的任务 / Handle task cancel event — abort the running task
  @SubscribeMessage('task:cancel')
  handleTaskCancel(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { sessionId: string },
  ) {
    this.agentService.cancel(data.sessionId);
    client.emit('agent:status', { status: 'idle', sessionId: data.sessionId });
  }

  // 处理页面状态响应 — 解析等待中的页面状态请求 / Handle page state response — resolve pending page state request
  @SubscribeMessage('page:state')
  handlePageState(
    @MessageBody() data: { sessionId: string; header: string; content: string; footer: string },
  ) {
    const resolver = this.pageStateResolvers.get(data.sessionId);
    if (resolver) {
      resolver({ header: data.header, content: data.content, footer: data.footer });
      this.pageStateResolvers.delete(data.sessionId);
    }
  }

  // 处理批量操作结果响应 — 解析等待中的批量操作请求 / Handle batch result response — resolve pending batch action request
  @SubscribeMessage('page:batch_result')
  handleBatchResult(
    @MessageBody() data: { sessionId: string; results: any },
  ) {
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
  private requestPageState(
    client: Socket,
    sessionId: string,
  ): Promise<{ header: string; content: string; footer: string }> {
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
  private requestBatchActions(
    client: Socket,
    sessionId: string,
    actions: Array<{ tool: string; params: Record<string, unknown> }>,
  ): Promise<Array<{ success: boolean; output?: string; error?: string }>> {
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
}
