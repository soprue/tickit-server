import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { Response as ExpressResponse } from 'express';

export interface ResponseFormat<T> {
  success: true;
  message?: string;
  data: T;
}

/**
 * 성공적인 응답을 일관된 형식({ success: true, data: ... })으로 래핑하는 인터셉터입니다.
 */
@Injectable()
export class ResponseInterceptor<T> implements NestInterceptor<
  T,
  ResponseFormat<T> | T
> {
  intercept(
    context: ExecutionContext,
    next: CallHandler,
  ): Observable<ResponseFormat<T> | T> {
    return next.handle().pipe(
      map((data: T) => {
        const res = context.switchToHttp().getResponse<ExpressResponse>();

        // 수동으로 응답을 보낸 경우(headersSent) 가로채지 않음
        if (res.headersSent) {
          return data;
        }

        // 이미 형식이 맞춰져 있는 경우 (예: 커스텀 메시지가 포함된 경우) 대응
        if (
          data &&
          typeof data === 'object' &&
          'success' in data &&
          'data' in data
        ) {
          return data;
        }

        return {
          success: true,
          data,
        };
      }),
    );
  }
}
