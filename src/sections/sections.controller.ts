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
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiResponse,
} from '@nestjs/swagger';
import { SectionEntity } from './entities/section.entity';

@ApiTags('Sections (섹션)')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('sections')
export class SectionsController {
  constructor(private readonly sectionsService: SectionsService) {}

  @Post()
  @ApiOperation({ summary: '섹션 생성' })
  @ApiResponse({ status: 201, type: SectionEntity })
  async create(
    @GetUser('id') userId: number,
    @Body() createSectionDto: CreateSectionDto,
  ) {
    const section = await this.sectionsService.create(userId, createSectionDto);
    return new SectionEntity(section);
  }

  @Get()
  @ApiOperation({ summary: '나의 모든 섹션 조회' })
  @ApiResponse({ status: 200, type: [SectionEntity] })
  async findAll(@GetUser('id') userId: number) {
    const sections = await this.sectionsService.findAll(userId);
    return sections.map((section) => new SectionEntity(section));
  }

  @Get(':id')
  @ApiOperation({ summary: '특정 섹션 상세 조회' })
  @ApiResponse({ status: 200, type: SectionEntity })
  async findOne(@GetUser('id') userId: number, @Param('id') id: string) {
    const section = await this.sectionsService.findOne(userId, id);
    return new SectionEntity(section);
  }

  @Patch(':id')
  @ApiOperation({ summary: '섹션 수정 (기본 섹션 제외)' })
  @ApiResponse({ status: 200, type: SectionEntity })
  async update(
    @GetUser('id') userId: number,
    @Param('id') id: string,
    @Body() updateSectionDto: UpdateSectionDto,
  ) {
    const section = await this.sectionsService.update(
      userId,
      id,
      updateSectionDto,
    );
    return new SectionEntity(section);
  }

  @Delete(':id')
  @ApiOperation({ summary: '섹션 삭제 (기본 섹션 제외)' })
  @ApiResponse({ status: 200, type: SectionEntity })
  async remove(@GetUser('id') userId: number, @Param('id') id: string) {
    const section = await this.sectionsService.remove(userId, id);
    return new SectionEntity(section);
  }
}
