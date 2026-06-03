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

        if (res.headersSent) {
          return data;
        }

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
