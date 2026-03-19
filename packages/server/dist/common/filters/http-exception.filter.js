"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var GlobalExceptionFilter_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.GlobalExceptionFilter = void 0;
/**
 * 全局异常过滤器 — 捕获所有异常并返回统一的错误响应格式
 * Global exception filter — catches all exceptions and returns a unified error response format
 *
 * 处理策略 / Strategy:
 * - BusinessException:  HTTP 200 + 业务错误码 / HTTP 200 + business error code
 * - HttpException:      对应 HTTP 状态码 + code 使用 HTTP status / Corresponding HTTP status + code = HTTP status
 * - 未知异常:            HTTP 500 + INTERNAL_ERROR / Unknown: HTTP 500 + INTERNAL_ERROR
 */
const common_1 = require("@nestjs/common");
const business_exception_1 = require("../exceptions/business.exception");
const business_code_1 = require("../constants/business-code");
// 捕获所有类型的异常 / Catch all types of exceptions
let GlobalExceptionFilter = GlobalExceptionFilter_1 = class GlobalExceptionFilter {
    logger = new common_1.Logger(GlobalExceptionFilter_1.name);
    catch(exception, host) {
        // 切换到 HTTP 上下文 / Switch to HTTP context
        const ctx = host.switchToHttp();
        const response = ctx.getResponse();
        let httpStatus;
        let body;
        if (exception instanceof business_exception_1.BusinessException) {
            // 业务逻辑异常 — HTTP 始终 200，通过 code 区分错误 / Business error — always HTTP 200, differentiate by code
            httpStatus = common_1.HttpStatus.OK;
            body = {
                success: false,
                data: null,
                code: exception.code,
                message: exception.message,
            };
        }
        else if (exception instanceof common_1.HttpException) {
            // HTTP 异常 — 保留原始 HTTP 状态码 / HTTP exception — keep original HTTP status
            httpStatus = exception.getStatus();
            const exceptionResponse = exception.getResponse();
            // 提取消息（可能是字符串或对象）/ Extract message (may be string or object)
            const message = typeof exceptionResponse === 'string'
                ? exceptionResponse
                : exceptionResponse.message || exception.message;
            body = {
                success: false,
                data: null,
                code: httpStatus,
                message: Array.isArray(message) ? message.join('; ') : message,
            };
        }
        else {
            // 未知异常 — 记录日志，返回 500 / Unknown exception — log and return 500
            this.logger.error('Unhandled exception', exception instanceof Error ? exception.stack : exception);
            httpStatus = common_1.HttpStatus.INTERNAL_SERVER_ERROR;
            body = {
                success: false,
                data: null,
                code: business_code_1.BusinessCode.INTERNAL_ERROR,
                message: 'Internal server error',
            };
        }
        response.status(httpStatus).json(body);
    }
};
exports.GlobalExceptionFilter = GlobalExceptionFilter;
exports.GlobalExceptionFilter = GlobalExceptionFilter = GlobalExceptionFilter_1 = __decorate([
    (0, common_1.Catch)()
], GlobalExceptionFilter);
//# sourceMappingURL=http-exception.filter.js.map