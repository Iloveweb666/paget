// Agent 生命周期状态变更 / Agent lifecycle status change
export const EVENT_STATUS_CHANGE = 'statuschange'

// 持久化历史记录更新（步骤、观察、错误）/ Persistent history updated (steps, observations, errors)
export const EVENT_HISTORY_CHANGE = 'historychange'

// 瞬态活动反馈（思考中、执行中等）/ Transient activity feedback (thinking, executing, etc.)
export const EVENT_ACTIVITY = 'activity'

// Agent 已销毁 / Agent disposed
export const EVENT_DISPOSE = 'dispose'

// WebSocket 事件名称常量 / WebSocket event name constants
export const WS_EVENTS = {
  // 客户端 → 服务端：提交新任务 / Client → Server: submit a new task
  TASK_SUBMIT: 'task:submit',
  // 客户端 → 服务端：取消运行中的任务 / Client → Server: cancel running task
  TASK_CANCEL: 'task:cancel',
  // 服务端 → 客户端：Agent 状态变更 / Server → Client: agent status changed
  AGENT_STATUS: 'agent:status',
  // 服务端 → 客户端：历史事件追加 / Server → Client: history event appended
  AGENT_HISTORY: 'agent:history',
  // 服务端 → 客户端：瞬态活动反馈 / Server → Client: transient activity
  AGENT_ACTIVITY: 'agent:activity',
  // TODO: LLM 流式文本输出 / LLM streaming text output
  // 当用户进行纯对话（如咨询页面业务逻辑、查阅操作手册）而非页面自动化时，
  // LLM 应以流式方式返回文本，实现逐字渲染效果。
  // When the user engages in pure conversation (e.g. asking about page business logic,
  // consulting operation manuals) rather than page automation, the LLM should stream
  // text back for incremental rendering.
  // AGENT_STREAM: 'agent:stream',
  // 服务端 → 客户端：页面操作指令 / Server → Client: page action command
  PAGE_ACTION: 'page:action',
  // 客户端 → 服务端：页面状态上报 / Client → Server: page state report
  PAGE_STATE: 'page:state',
  // 服务端 → 客户端：请求批量操作 / Server → Client: request batch actions
  PAGE_BATCH_ACTION: 'page:batch_action',
  // 客户端 → 服务端：批量操作结果 / Client → Server: batch action results
  PAGE_BATCH_RESULT: 'page:batch_result',
} as const
