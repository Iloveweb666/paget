/**
 * 全局异常过滤器 — 捕获所有异常并返回统一的错误响应格式
 * Global exception filter — catches all exceptions and returns a unified error response format
 */
import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { Response } from 'express';

// 捕获所有类型的异常 / Catch all types of exceptions
@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    // 切换到 HTTP 上下文 / Switch to HTTP context
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();

    // 提取 HTTP 状态码，非 HttpException 默认 500 / Extract HTTP status code, default 500 for non-HttpException
    const status =
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;

    // 提取错误消息 / Extract error message
    const message =
      exception instanceof HttpException
        ? exception.message
        : 'Internal server error';

    // 返回统一格式的错误响应 / Return uniformly formatted error response
    response.status(status).json({
      statusCode: status,
      message,
      timestamp: new Date().toISOString(),
    });
  }
}
