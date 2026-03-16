/**
 * 响应转换拦截器 — 将所有成功响应包装为统一格式
 * Response transform interceptor — wraps all successful responses into unified format
 */
import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable, map } from 'rxjs';
import { BusinessCode } from '../constants/business-code';

/**
 * 统一响应结构（成功和失败共用）
 * Unified response structure (shared by success and error)
 */
export interface UnifiedResponse<T = unknown> {
  success: boolean;
  data: T | null;
  code: number;
  message: string;
}

@Injectable()
export class TransformInterceptor<T>
  implements NestInterceptor<T, UnifiedResponse<T>>
{
  intercept(
    context: ExecutionContext,
    next: CallHandler,
  ): Observable<UnifiedResponse<T>> {
    // 将原始响应数据包装为统一成功格式 / Wrap original response data into unified success format
    return next.handle().pipe(
      map((data) => ({
        success: true,
        data,
        code: BusinessCode.SUCCESS,
        message: 'success',
      })),
    );
  }
}
