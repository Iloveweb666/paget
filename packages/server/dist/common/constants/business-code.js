"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BusinessCode = void 0;
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
var BusinessCode;
(function (BusinessCode) {
    // 成功 / Success
    BusinessCode[BusinessCode["SUCCESS"] = 0] = "SUCCESS";
    // ---- 通用错误 / Common errors ----
    // 参数校验失败 / Parameter validation failed
    BusinessCode[BusinessCode["PARAM_INVALID"] = 10001] = "PARAM_INVALID";
    // 资源不存在 / Resource not found
    BusinessCode[BusinessCode["RESOURCE_NOT_FOUND"] = 10002] = "RESOURCE_NOT_FOUND";
    // 未授权 / Unauthorized
    BusinessCode[BusinessCode["UNAUTHORIZED"] = 10003] = "UNAUTHORIZED";
    // 无权限 / Forbidden
    BusinessCode[BusinessCode["FORBIDDEN"] = 10004] = "FORBIDDEN";
    // ---- LLM 相关 / LLM related ----
    // LLM 配置不存在 / LLM config not found
    BusinessCode[BusinessCode["LLM_CONFIG_NOT_FOUND"] = 20001] = "LLM_CONFIG_NOT_FOUND";
    // LLM 调用失败 / LLM call failed
    BusinessCode[BusinessCode["LLM_CALL_FAILED"] = 20002] = "LLM_CALL_FAILED";
    // ---- Agent 相关 / Agent related ----
    // Agent 正在运行中 / Agent is already running
    BusinessCode[BusinessCode["AGENT_BUSY"] = 30001] = "AGENT_BUSY";
    // Agent 执行失败 / Agent execution failed
    BusinessCode[BusinessCode["AGENT_EXEC_FAILED"] = 30002] = "AGENT_EXEC_FAILED";
    // ---- Session 相关 / Session related ----
    // 会话不存在 / Session not found
    BusinessCode[BusinessCode["SESSION_NOT_FOUND"] = 40001] = "SESSION_NOT_FOUND";
    // ---- Prompt 相关 / Prompt related ----
    // 提示词不存在 / Prompt not found
    BusinessCode[BusinessCode["PROMPT_NOT_FOUND"] = 50001] = "PROMPT_NOT_FOUND";
    // ---- 系统级错误 / System-level errors ----
    // 未知内部错误 / Unknown internal error
    BusinessCode[BusinessCode["INTERNAL_ERROR"] = 99999] = "INTERNAL_ERROR";
})(BusinessCode || (exports.BusinessCode = BusinessCode = {}));
//# sourceMappingURL=business-code.js.map