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
export declare enum BusinessCode {
    SUCCESS = 0,
    PARAM_INVALID = 10001,
    RESOURCE_NOT_FOUND = 10002,
    UNAUTHORIZED = 10003,
    FORBIDDEN = 10004,
    LLM_CONFIG_NOT_FOUND = 20001,
    LLM_CALL_FAILED = 20002,
    AGENT_BUSY = 30001,
    AGENT_EXEC_FAILED = 30002,
    SESSION_NOT_FOUND = 40001,
    PROMPT_NOT_FOUND = 50001,
    INTERNAL_ERROR = 99999
}
//# sourceMappingURL=business-code.d.ts.map