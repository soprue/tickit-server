import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
} from '@nestjs/common';
import { SectionsService } from './sections.service';
import { CreateSectionDto } from './dto/create-section.dto';
import { UpdateSectionDto } from './dto/update-section.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { GetUser } from '../auth/decorators/get-user.decorator';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';

@ApiTags('Sections (섹션)')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('sections')
export class SectionsController {
  constructor(private readonly sectionsService: SectionsService) {}

  @Post()
  @ApiOperation({ summary: '섹션 생성' })
  create(
    @GetUser('id') userId: number,
    @Body() createSectionDto: CreateSectionDto,
  ) {
    return this.sectionsService.create(userId, createSectionDto);
  }

  @Get()
  @ApiOperation({ summary: '나의 모든 섹션 조회' })
  findAll(@GetUser('id') userId: number) {
    return this.sectionsService.findAll(userId);
  }

  @Get(':id')
  @ApiOperation({ summary: '특정 섹션 상세 조회' })
  findOne(@GetUser('id') userId: number, @Param('id') id: string) {
    return this.sectionsService.findOne(userId, id);
  }

  @Patch(':id')
  @ApiOperation({ summary: '섹션 수정 (기본 섹션 제외)' })
  update(
    @GetUser('id') userId: number,
    @Param('id') id: string,
    @Body() updateSectionDto: UpdateSectionDto,
  ) {
    return this.sectionsService.update(userId, id, updateSectionDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: '섹션 삭제 (기본 섹션 제외)' })
  remove(@GetUser('id') userId: number, @Param('id') id: string) {
    return this.sectionsService.remove(userId, id);
  }
}
