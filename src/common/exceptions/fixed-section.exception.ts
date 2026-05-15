import { ForbiddenException } from '@nestjs/common';

export class FixedSectionException extends ForbiddenException {
  constructor(action: '수정' | '삭제') {
    super(`기본 섹션은 ${action}할 수 없습니다.`);
  }
}
