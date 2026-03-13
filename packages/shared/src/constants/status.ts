// Agent 生命周期状态枚举 / Agent lifecycle status enum
export enum AgentStatus {
  // 空闲，等待任务 / Idle, waiting for task
  IDLE = 'idle',
  // 正在执行任务 / Task is running
  RUNNING = 'running',
  // 任务成功完成 / Task completed successfully
  COMPLETED = 'completed',
  // 任务执行出错 / Task execution error
  ERROR = 'error',
}
