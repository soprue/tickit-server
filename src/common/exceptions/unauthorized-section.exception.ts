import { ForbiddenException } from '@nestjs/common';

export class UnauthorizedSectionException extends ForbiddenException {
  constructor() {
    super('해당 섹션에 대한 권한이 없습니다.');
  }
}
