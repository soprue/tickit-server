import { NotFoundException } from '@nestjs/common';

export class SectionNotFoundException extends NotFoundException {
  constructor() {
    super('섹션을 찾을 수 없습니다.');
  }
}
