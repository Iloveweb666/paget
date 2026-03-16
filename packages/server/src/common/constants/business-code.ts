/**
 * 业务状态码枚举 — code: 0 表示成功，非零表示具体的业务异常
 * Business status code enum — code: 0 means success, non-zero means specific business error
 *
 * 编码规则 / Coding rules:
 * - 0:      成功 / Success
 * - 10xxx:  通用错误 / Common errors
 * - 20xxx:  LLM 相关 / LLM related
 * - 30xxx:  Agent 相关 / Agent related
 * - 40xxx:  Session 相关 / Session related
 * - 50xxx:  Prompt 相关 / Prompt related
 * - 99xxx:  系统级错误 / System-level errors
 */
export enum BusinessCode {
  // 成功 / Success
  SUCCESS = 0,

  // ---- 通用错误 / Common errors ----
  // 参数校验失败 / Parameter validation failed
  PARAM_INVALID = 10001,
  // 资源不存在 / Resource not found
  RESOURCE_NOT_FOUND = 10002,
  // 未授权 / Unauthorized
  UNAUTHORIZED = 10003,
  // 无权限 / Forbidden
  FORBIDDEN = 10004,

  // ---- LLM 相关 / LLM related ----
  // LLM 配置不存在 / LLM config not found
  LLM_CONFIG_NOT_FOUND = 20001,
  // LLM 调用失败 / LLM call failed
  LLM_CALL_FAILED = 20002,

  // ---- Agent 相关 / Agent related ----
  // Agent 正在运行中 / Agent is already running
  AGENT_BUSY = 30001,
  // Agent 执行失败 / Agent execution failed
  AGENT_EXEC_FAILED = 30002,

  // ---- Session 相关 / Session related ----
  // 会话不存在 / Session not found
  SESSION_NOT_FOUND = 40001,

  // ---- Prompt 相关 / Prompt related ----
  // 提示词不存在 / Prompt not found
  PROMPT_NOT_FOUND = 50001,

  // ---- 系统级错误 / System-level errors ----
  // 未知内部错误 / Unknown internal error
  INTERNAL_ERROR = 99999,
}
