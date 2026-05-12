import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

export interface Response<T> {
  success: true;
  message?: string;
  data: T;
}

@Injectable()
export class ResponseInterceptor<T> implements NestInterceptor<T, Response<T>> {
  intercept(
    context: ExecutionContext,
    next: CallHandler,
  ): Observable<Response<T>> {
    return next.handle().pipe(
      map((data) => {
        // 이미 형식이 맞춰져 있는 경우 (예: 커스텀 메시지가 포함된 경우) 대응
        if (data && typeof data === 'object' && 'success' in data && 'data' in data) {
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
