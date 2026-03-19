/**
 * 全局异常过滤器 — 捕获所有异常并返回统一的错误响应格式
 * Global exception filter — catches all exceptions and returns a unified error response format
 *
 * 处理策略 / Strategy:
 * - BusinessException:  HTTP 200 + 业务错误码 / HTTP 200 + business error code
 * - HttpException:      对应 HTTP 状态码 + code 使用 HTTP status / Corresponding HTTP status + code = HTTP status
 * - 未知异常:            HTTP 500 + INTERNAL_ERROR / Unknown: HTTP 500 + INTERNAL_ERROR
 */
import { ExceptionFilter, ArgumentsHost } from '@nestjs/common';
export declare class GlobalExceptionFilter implements ExceptionFilter {
    private readonly logger;
    catch(exception: unknown, host: ArgumentsHost): void;
}
//# sourceMappingURL=http-exception.filter.d.ts.map