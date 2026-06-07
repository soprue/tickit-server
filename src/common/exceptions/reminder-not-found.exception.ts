import { NotFoundException } from '@nestjs/common';

export class ReminderNotFoundException extends NotFoundException {
  constructor() {
    super('리마인더를 찾을 수 없습니다.');
  }
}
