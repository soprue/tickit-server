import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  UseGuards,
  ParseIntPipe,
} from '@nestjs/common';
import { RemindersService } from './reminders.service';
import { CreateReminderDto } from './dto/create-reminder.dto';
import { UpdateReminderDto } from './dto/update-reminder.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { GetUser } from '../auth/decorators/get-user.decorator';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiResponse,
} from '@nestjs/swagger';
import { ReminderEntity } from './entities/reminder.entity';
import { PaginationQueryDto } from '../common/dto/pagination-query.dto';

@ApiTags('Reminders (리마인더)')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('reminders')
export class RemindersController {
  constructor(private readonly remindersService: RemindersService) {}

  @Post()
  @ApiOperation({ summary: '리마인더 생성' })
  @ApiResponse({ status: 201, type: ReminderEntity })
  async create(
    @GetUser('id') userId: number,
    @Body() createReminderDto: CreateReminderDto,
  ) {
    const reminder = await this.remindersService.create(
      userId,
      createReminderDto,
    );
    return new ReminderEntity(reminder);
  }

  @Get()
  @ApiOperation({ summary: '나의 리마인더 목록 조회 (Cursor 기반 페이지네이션)' })
  @ApiResponse({ status: 200, type: [ReminderEntity] })
  async findAll(
    @GetUser('id') userId: number,
    @Query() query: PaginationQueryDto,
  ) {
    const reminders = await this.remindersService.findAll(userId, query);
    return reminders.map((reminder) => new ReminderEntity(reminder));
  }

  @Get(':id')
  @ApiOperation({ summary: '리마인더 상세 조회' })
  @ApiResponse({ status: 200, type: ReminderEntity })
  async findOne(
    @GetUser('id') userId: number,
    @Param('id', ParseIntPipe) id: number,
  ) {
    const reminder = await this.remindersService.findOne(userId, id);
    return new ReminderEntity(reminder);
  }

  @Patch(':id')
  @ApiOperation({ summary: '리마인더 수정' })
  @ApiResponse({ status: 200, type: ReminderEntity })
  async update(
    @GetUser('id') userId: number,
    @Param('id', ParseIntPipe) id: number,
    @Body() updateReminderDto: UpdateReminderDto,
  ) {
    const reminder = await this.remindersService.update(
      userId,
      id,
      updateReminderDto,
    );
    return new ReminderEntity(reminder);
  }

  @Delete(':id')
  @ApiOperation({ summary: '리마인더 삭제' })
  @ApiResponse({ status: 200, type: ReminderEntity })
  async remove(
    @GetUser('id') userId: number,
    @Param('id', ParseIntPipe) id: number,
  ) {
    const reminder = await this.remindersService.remove(userId, id);
    return new ReminderEntity(reminder);
  }
}
