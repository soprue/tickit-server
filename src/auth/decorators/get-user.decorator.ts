import { createParamDecorator, ExecutionContext } from '@nestjs/common';

/**
 * 현재 인증된 사용자 정보를 요청 객체에서 추출하는 커스텀 데코레이터입니다.
 * @param data (선택 사항) 사용자 객체의 특정 속성 이름
 * @param ctx ExecutionContext
 * @returns 사용자 객체 전체 또는 특정 속성
 */
export const GetUser = createParamDecorator(
  (data: string | undefined, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    const user = request.user;

    return data ? user?.[data] : user;
  },
);
