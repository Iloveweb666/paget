/**
 * 全局异常过滤器 — 捕获所有异常并返回统一的错误响应格式
 * Global exception filter — catches all exceptions and returns a unified error response format
 *
 * 处理策略 / Strategy:
 * - BusinessException:  HTTP 200 + 业务错误码 / HTTP 200 + business error code
 * - HttpException:      对应 HTTP 状态码 + code 使用 HTTP status / Corresponding HTTP status + code = HTTP status
 * - 未知异常:            HTTP 500 + INTERNAL_ERROR / Unknown: HTTP 500 + INTERNAL_ERROR
 */
import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Response } from 'express';
import { BusinessException } from '../exceptions/business.exception';
import { BusinessCode } from '../constants/business-code';
import type { UnifiedResponse } from '../interceptors/transform.interceptor';

// 捕获所有类型的异常 / Catch all types of exceptions
@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(GlobalExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    // 切换到 HTTP 上下文 / Switch to HTTP context
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();

    let httpStatus: number;
    let body: UnifiedResponse;

    if (exception instanceof BusinessException) {
      // 业务逻辑异常 — HTTP 始终 200，通过 code 区分错误 / Business error — always HTTP 200, differentiate by code
      httpStatus = HttpStatus.OK;
      body = {
        success: false,
        data: null,
        code: exception.code,
        message: exception.message,
      };
    } else if (exception instanceof HttpException) {
      // HTTP 异常 — 保留原始 HTTP 状态码 / HTTP exception — keep original HTTP status
      httpStatus = exception.getStatus();
      const exceptionResponse = exception.getResponse();
      // 提取消息（可能是字符串或对象）/ Extract message (may be string or object)
      const message =
        typeof exceptionResponse === 'string'
          ? exceptionResponse
          : (exceptionResponse as any).message || exception.message;
      body = {
        success: false,
        data: null,
        code: httpStatus,
        message: Array.isArray(message) ? message.join('; ') : message,
      };
    } else {
      // 未知异常 — 记录日志，返回 500 / Unknown exception — log and return 500
      this.logger.error('Unhandled exception', exception instanceof Error ? exception.stack : exception);
      httpStatus = HttpStatus.INTERNAL_SERVER_ERROR;
      body = {
        success: false,
        data: null,
        code: BusinessCode.INTERNAL_ERROR,
        message: 'Internal server error',
      };
    }

    response.status(httpStatus).json(body);
  }
}
