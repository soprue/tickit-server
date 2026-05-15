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
  ApiQuery,
} from '@nestjs/swagger';

@ApiTags('Reminders (리마인더)')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('reminders')
export class RemindersController {
  constructor(private readonly remindersService: RemindersService) {}

  @Post()
  @ApiOperation({ summary: '리마인더 생성' })
  create(
    @GetUser('id') userId: number,
    @Body() createReminderDto: CreateReminderDto,
  ) {
    return this.remindersService.create(userId, createReminderDto);
  }

  @Get()
  @ApiOperation({ summary: '나의 리마인더 목록 조회' })
  @ApiQuery({
    name: 'sectionId',
    required: false,
    description: '섹션별 필터링',
  })
  findAll(
    @GetUser('id') userId: number,
    @Query('sectionId') sectionId?: string,
  ) {
    return this.remindersService.findAll(userId, sectionId);
  }

  @Get(':id')
  @ApiOperation({ summary: '리마인더 상세 조회' })
  findOne(
    @GetUser('id') userId: number,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.remindersService.findOne(userId, id);
  }

  @Patch(':id')
  @ApiOperation({ summary: '리마인더 수정' })
  update(
    @GetUser('id') userId: number,
    @Param('id', ParseIntPipe) id: number,
    @Body() updateReminderDto: UpdateReminderDto,
  ) {
    return this.remindersService.update(userId, id, updateReminderDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: '리마인더 삭제' })
  remove(@GetUser('id') userId: number, @Param('id', ParseIntPipe) id: number) {
    return this.remindersService.remove(userId, id);
  }
}
