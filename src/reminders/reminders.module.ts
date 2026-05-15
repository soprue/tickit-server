import { Module } from '@nestjs/common';
import { RemindersService } from './reminders.service';
import { RemindersController } from './reminders.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { SectionsModule } from '../sections/sections.module';

@Module({
  imports: [PrismaModule, SectionsModule],
  controllers: [RemindersController],
  providers: [RemindersService],
})
export class RemindersModule {}
