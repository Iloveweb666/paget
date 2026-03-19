/**
 * 响应转换拦截器 — 将所有成功响应包装为统一格式
 * Response transform interceptor — wraps all successful responses into unified format
 */
import { NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common';
import { Observable } from 'rxjs';
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
export declare class TransformInterceptor<T> implements NestInterceptor<T, UnifiedResponse<T>> {
    intercept(context: ExecutionContext, next: CallHandler): Observable<UnifiedResponse<T>>;
}
//# sourceMappingURL=transform.interceptor.d.ts.map