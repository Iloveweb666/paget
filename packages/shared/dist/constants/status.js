// Agent 生命周期状态枚举 / Agent lifecycle status enum
export var AgentStatus;
(function (AgentStatus) {
    // 空闲，等待任务 / Idle, waiting for task
    AgentStatus["IDLE"] = "idle";
    // 正在执行任务 / Task is running
    AgentStatus["RUNNING"] = "running";
    // 流式对话回复中（非自动化）/ Streaming chat reply (non-automation)
    AgentStatus["STREAMING"] = "streaming";
    // 任务成功完成 / Task completed successfully
    AgentStatus["COMPLETED"] = "completed";
    // 任务执行出错 / Task execution error
    AgentStatus["ERROR"] = "error";
})(AgentStatus || (AgentStatus = {}));
//# sourceMappingURL=status.js.map