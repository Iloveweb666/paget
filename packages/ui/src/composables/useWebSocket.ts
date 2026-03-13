/**
 * WebSocket 通信组合式函数
 * WebSocket communication composable
 *
 * 封装 Socket.IO 客户端连接，提供任务提交、取消、页面状态上报等功能
 * Encapsulates Socket.IO client connection, providing task submission, cancellation, page state reporting, etc.
 */
import { ref, onUnmounted } from 'vue'
import { io, type Socket } from 'socket.io-client'
import { WS_EVENTS } from '@paget/shared'
import type {
  StatusChangePayload,
  HistoryEvent,
  ActivityPayload,
  AgentAction,
} from '@paget/shared'

export function useWebSocket(url = '/') {
  // Socket 实例引用 / Socket instance reference
  const socket = ref<Socket | null>(null)
  // 连接状态 / Connection status
  const connected = ref(false)

  /**
   * 建立 WebSocket 连接 / Establish WebSocket connection
   */
  function connect(): void {
    const s = io(url, {
      transports: ['websocket'],
      reconnection: true,
      reconnectionDelay: 1000,
    })

    // 连接成功回调 / Connection success callback
    s.on('connect', () => {
      connected.value = true
    })

    // 断开连接回调 / Disconnection callback
    s.on('disconnect', () => {
      connected.value = false
    })

    socket.value = s
  }

  /**
   * 向 Agent 提交任务 / Submit a task to the agent
   */
  function submitTask(task: string, sessionId: string) {
    socket.value?.emit(WS_EVENTS.TASK_SUBMIT, { task, sessionId })
  }

  /**
   * 取消当前正在运行的任务 / Cancel the currently running task
   */
  function cancelTask(sessionId: string) {
    socket.value?.emit(WS_EVENTS.TASK_CANCEL, { sessionId })
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
    socket.value?.emit(WS_EVENTS.PAGE_STATE, payload)
  }

  /**
   * 上报批量操作结果到服务端 / Report batch action results to server
   */
  function reportBatchResult(sessionId: string, results: unknown) {
    socket.value?.emit(WS_EVENTS.PAGE_BATCH_RESULT, { sessionId, results })
  }

  /**
   * 监听 Agent 状态变化事件 / Listen for agent status changes
   */
  function onStatusChange(callback: (payload: StatusChangePayload) => void) {
    socket.value?.on(WS_EVENTS.AGENT_STATUS, callback)
  }

  /**
   * 监听历史事件（用于 LLM 上下文）/ Listen for history events (for LLM context)
   */
  function onHistoryChange(callback: (event: HistoryEvent) => void) {
    socket.value?.on(WS_EVENTS.AGENT_HISTORY, callback)
  }

  /**
   * 监听活动事件（瞬态 UI 反馈）/ Listen for activity events (transient UI feedback)
   */
  function onActivity(callback: (payload: ActivityPayload) => void) {
    socket.value?.on(WS_EVENTS.AGENT_ACTIVITY, callback)
  }

  // TODO: 监听 LLM 流式文本分片 / Listen for LLM streaming text chunks
  // 当用户进行纯对话（咨询业务逻辑、查阅页面嵌入的操作手册等）时，
  // 服务端会通过 AGENT_STREAM 事件逐步推送文本分片，UI 侧需增量渲染到消息气泡中。
  // When the user engages in pure conversation (asking about business logic,
  // consulting embedded manuals, etc.), the server pushes text chunks via
  // AGENT_STREAM event, and the UI incrementally renders them into the message bubble.
  //
  // function onStreamChunk(callback: (payload: StreamChunkPayload) => void) {
  //   socket.value?.on(WS_EVENTS.AGENT_STREAM, callback)
  // }

  /**
   * 监听来自服务端的页面操作指令 / Listen for page action commands from server
   */
  function onPageAction(callback: (action: AgentAction) => void) {
    socket.value?.on(WS_EVENTS.PAGE_ACTION, callback)
  }

  /**
   * 监听来自服务端的批量操作指令 / Listen for batch action commands from server
   */
  function onBatchAction(callback: (actions: AgentAction[]) => void) {
    socket.value?.on(WS_EVENTS.PAGE_BATCH_ACTION, callback)
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
    submitTask,
    cancelTask,
    reportPageState,
    reportBatchResult,
    onStatusChange,
    onHistoryChange,
    onActivity,
    onPageAction,
    onBatchAction,
  }
}
