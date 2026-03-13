/**
 * 响应转换拦截器 — 将所有成功响应包装为统一格式 { code, data, message }
 * Response transform interceptor — wraps all successful responses into unified format { code, data, message }
 */
import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable, map } from 'rxjs';

/**
 * 统一响应包装接口
 * Unified response wrapper interface
 */
export interface ResponseWrapper<T> {
  code: number;     // 业务状态码（0 表示成功） / Business status code (0 means success)
  data: T;          // 响应数据 / Response data
  message: string;  // 响应消息 / Response message
}

@Injectable()
export class TransformInterceptor<T>
  implements NestInterceptor<T, ResponseWrapper<T>>
{
  intercept(
    context: ExecutionContext,
    next: CallHandler,
  ): Observable<ResponseWrapper<T>> {
    // 将原始响应数据包装为统一格式 / Wrap original response data into unified format
    return next.handle().pipe(
      map((data) => ({
        code: 0,
        data,
        message: 'success',
      })),
    );
  }
}
