/**
 * 业务逻辑异常 — HTTP 状态码始终为 200，通过 code 字段区分错误类型
 * Business logic exception — HTTP status is always 200, error type indicated by code field
 *
 * 用法 / Usage:
 *   throw new BusinessException(BusinessCode.LLM_CONFIG_NOT_FOUND, '未找到 LLM 配置')
 */
import { BusinessCode } from '../constants/business-code';
export declare class BusinessException extends Error {
    readonly code: BusinessCode;
    constructor(code: BusinessCode, message: string);
}
//# sourceMappingURL=business.exception.d.ts.map