/**
 * WebSocket 通信组合式函数
 * WebSocket communication composable
 *
 * 封装 Socket.IO 客户端连接，提供任务提交、取消、页面状态上报等功能
 * Encapsulates Socket.IO client connection, providing task submission, cancellation, page state reporting, etc.
 */
import { ref, onUnmounted, inject } from 'vue'
import { io, type Socket } from 'socket.io-client'
import { WS_EVENTS } from '@paget/shared'
import type {
  StatusChangePayload,
  HistoryEvent,
  ActivityPayload,
  AgentAction,
  StreamChunkPayload,
  TaskSubmitPayload,
} from '@paget/shared'
import { wsLogger } from './useWSLogger'

/**
 * Bookmarklet 配置接口（通过 provide/inject 传递）
 * Bookmarklet config interface (passed via provide/inject)
 */
interface PagetBookmarkletConfig {
  serverUrl: string
}

export function useWebSocket(urlOrPath = '/agent') {
  // 尝试从 inject 获取 Bookmarklet 配置（如果存在则使用完整 URL）
  // Try to get Bookmarklet config from inject (use full URL if exists)
  const bookmarkletConfig = inject<PagetBookmarkletConfig | null>('pagetConfig', null)

  // 计算最终的 WebSocket URL / Calculate final WebSocket URL
  // Socket.IO 需要 http/https 协议（它内部自行升级到 WebSocket）
  // Socket.IO requires http/https protocol (it upgrades to WebSocket internally)
  let url: string
  if (bookmarkletConfig?.serverUrl) {
    // Bookmarklet 模式：使用完整 URL / Bookmarklet mode: use full URL
    // 例如：http://localhost:3000 + /agent → http://localhost:3000/agent
    const baseUrl = bookmarkletConfig.serverUrl
      .replace(/\/$/, '')
      .replace(/^ws:/, 'http:')
      .replace(/^wss:/, 'https:')
    url = urlOrPath.startsWith('/') ? `${baseUrl}${urlOrPath}` : `${baseUrl}/${urlOrPath}`
  } else {
    // 普通模式：使用相对路径 / Normal mode: use relative path
    url = urlOrPath
  }
  // Socket 实例引用 / Socket instance reference
  const socket = ref<Socket | null>(null)
  // 连接状态 / Connection status
  const connected = ref(false)

  // 已注册的事件处理器（用于断开重连后重新绑定）/ Registered event handlers (for re-binding after reconnect)
  const eventHandlers = new Map<string, ((...args: unknown[]) => void)[]>()

  /**
   * 注册事件处理器并存储引用（断开重连时自动重新绑定）
   * Register event handler and store reference (auto re-bind on reconnect)
   */
  function registerHandler(event: string, handler: (...args: unknown[]) => void) {
    if (!eventHandlers.has(event)) eventHandlers.set(event, [])
    eventHandlers.get(event)!.push(handler)
    socket.value?.on(event, handler)
  }

  /**
   * 创建 Socket 实例并绑定基础事件 + 已注册的业务事件
   * Create Socket instance and bindbase events + registered business events
   */
  function createSocket(): Socket {
    const s = io(url, {
      transports: ['websocket'],
      reconnection: true,
      reconnectionDelay: 1000,
    })

    // 连接成功回调 / Connection success callback
    s.on('connect', () => {
      connected.value = true
      wsLogger.log('receive', 'connect', { id: s.id })
    })

    // 断开连接回调 / Disconnection callback
    s.on('disconnect', (reason: string) => {
      connected.value = false
      wsLogger.log('receive', 'disconnect', { reason })
    })

    // 重新绑定已注册的业务事件处理器 / Re-bindregistered business event handlers
    for (const [event, handlers] of eventHandlers) {
      for (const handler of handlers) {
        s.on(event, handler)
      }
    }

    return s
  }

  /**
   * 建立 WebSocket 连接 / Establish WebSocket connection
   */
  function connect(): void {
    socket.value = createSocket()
  }

  /**
   * 强制停止：发送取消信号 → 断开连接 → 立即重连
   * Force stop: send cancel signal → disconnect → immediately reconnect
   *
   * 这会切断服务端等待客户端响应的 Promise 链，让 agent 循环尽快退出
   * This breaks the server-side Promise chain waiting for client response,
   * causing the agent loop to exit as soon as possible
   */
  function forceStop(sessionId: string): void {
    // 先发送取消信号（设置服务端 aborted 标志）/ Send cancel signal first (sets server aborted flag)
    const payload = { sessionId }
    wsLogger.log('send', WS_EVENTS.TASK_CANCEL, payload)
    socket.value?.emit(WS_EVENTS.TASK_CANCEL, payload)

    wsLogger.log('send', 'force-stop', { sessionId })

    // 断开旧连接，切断服务端的 Promise 等待链 / Disconnect old socket, breaking server's pending Promise chain
    socket.value?.disconnect()
    socket.value = null

    // 立即重连，恢复正常通信 / Immediately reconnect to restore normal communication
    socket.value = createSocket()
  }

  /**
   * 向 Agent 提交任务 / Submit a task to the agent
   */
  function submitTask(payload: TaskSubmitPayload) {
    wsLogger.log('send', WS_EVENTS.TASK_SUBMIT, payload)
    socket.value?.emit(WS_EVENTS.TASK_SUBMIT, payload)
  }

  /**
   * 取消当前正在运行的任务 / Cancel the currently running task
   */
  function cancelTask(sessionId: string) {
    const payload = { sessionId }
    wsLogger.log('send', WS_EVENTS.TASK_CANCEL, payload)
    socket.value?.emit(WS_EVENTS.TASK_CANCEL, payload)
  }

  /**
   * 上报页面状态到服务端 / Report page state to server
   */
  function reportPageState(payload: {
    sessionId: string
    url: string
    title: string
    content: string
    header: string
    footer: string
  }) {
    wsLogger.log('send', WS_EVENTS.PAGE_STATE, payload)
    socket.value?.emit(WS_EVENTS.PAGE_STATE, payload)
  }

  /**
   * 上报批量操作结果到服务端 / Report batch action results to server
   */
  function reportBatchResult(sessionId: string, results: unknown) {
    const payload = { sessionId, results }
    wsLogger.log('send', WS_EVENTS.PAGE_BATCH_RESULT, payload)
    socket.value?.emit(WS_EVENTS.PAGE_BATCH_RESULT, payload)
  }

  /**
   * 监听 Agent 状态变化事件 / Listen for agent status changes
   */
  function onStatusChange(callback: (payload: StatusChangePayload) => void) {
    registerHandler(WS_EVENTS.AGENT_STATUS, (payload: unknown) => {
      wsLogger.log('receive', WS_EVENTS.AGENT_STATUS, payload)
      callback(payload as StatusChangePayload)
    })
  }

  /**
   * 监听历史事件（用于 LLM 上下文）/ Listen for history events (for LLM context)
   */
  function onHistoryChange(callback: (event: HistoryEvent) => void) {
    registerHandler(WS_EVENTS.AGENT_HISTORY, (event: unknown) => {
      wsLogger.log('receive', WS_EVENTS.AGENT_HISTORY, event)
      callback(event as HistoryEvent)
    })
  }

  /**
   * 监听活动事件（瞬态 UI 反馈）/ Listen for activity events (transient UI feedback)
   */
  function onActivity(callback: (payload: ActivityPayload) => void) {
    registerHandler(WS_EVENTS.AGENT_ACTIVITY, (payload: unknown) => {
      wsLogger.log('receive', WS_EVENTS.AGENT_ACTIVITY, payload)
      callback(payload as ActivityPayload)
    })
  }

  /**
   * 监听 LLM 流式文本分片 / Listen for LLM streaming text chunks
   * 当用户进行纯对话（咨询业务逻辑、查阅页面嵌入的操作手册等）时，
   * 服务端会通过 AGENT_STREAM 事件逐步推送文本分片，UI 侧需增量渲染到消息气泡中。
   * When the user engages in pure conversation (asking about business logic,
   * consulting embedded manuals, etc.), the server pushes text chunks via
   * AGENT_STREAM event, and the UI incrementally renders them into the message bubble.
   */
  function onStreamChunk(callback: (payload: StreamChunkPayload) => void) {
    registerHandler(WS_EVENTS.AGENT_STREAM, (payload: unknown) => {
      wsLogger.log('receive', WS_EVENTS.AGENT_STREAM, payload)
      callback(payload as StreamChunkPayload)
    })
  }

  /**
   * 监听来自服务端的页面操作指令（如 get_state）
   * Listen for page action commands from server (e.g. get_state)
   */
  function onPageAction(callback: (payload: { type: string; sessionId: string }) => void) {
    registerHandler(WS_EVENTS.PAGE_ACTION, (payload: unknown) => {
      wsLogger.log('receive', WS_EVENTS.PAGE_ACTION, payload)
      callback(payload as { type: string; sessionId: string })
    })
  }

  /**
   * 监听来自服务端的批量操作指令
   * Listen for batch action commands from server
   */
  function onBatchAction(callback: (payload: { sessionId: string; actions: AgentAction[] }) => void) {
    registerHandler(WS_EVENTS.PAGE_BATCH_ACTION, (payload: unknown) => {
      wsLogger.log('receive', WS_EVENTS.PAGE_BATCH_ACTION, payload)
      callback(payload as { sessionId: string; actions: AgentAction[] })
    })
  }

  /**
   * 断开 WebSocket 连接 / Disconnect WebSocket connection
   */
  function disconnect() {
    socket.value?.disconnect()
    socket.value = null
    connected.value = false
  }

  // 组件卸载时自动断开连接 / Automatically disconnect on component unmount
  onUnmounted(() => {
    disconnect()
  })

  return {
    connected,
    connect,
    disconnect,
    forceStop,
    submitTask,
    cancelTask,
    reportPageState,
    reportBatchResult,
    onStatusChange,
    onHistoryChange,
    onActivity,
    onStreamChunk,
    onPageAction,
    onBatchAction,
  }
}
