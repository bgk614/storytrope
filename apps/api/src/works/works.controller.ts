import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  NotFoundException,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';

import { AdminGuard } from '../auth/admin.guard';
import { SessionAuthGuard } from '../auth/session-auth.guard';
import { PaginationQueryDto } from '../common/pagination-query.dto';
import { CreateWorkDto } from './dto/create-work.dto';
import { UpdateWorkDto } from './dto/update-work.dto';
import { WorksService } from './works.service';

@Controller('works')
export class WorksController {
  constructor(private readonly worksService: WorksService) {}

  @Get()
  async findAll(@Query() query: PaginationQueryDto) {
    return this.worksService.works({
      skip: query.skip,
      take: query.take ?? 20,
    });
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    const work = await this.worksService.work({ id });
    if (!work) {
      throw new NotFoundException(`Work ${id} not found`);
    }
    return work;
  }

  @UseGuards(SessionAuthGuard, AdminGuard)
  @Post()
  async create(@Body() dto: CreateWorkDto) {
    return this.worksService.createWork(dto);
  }

  @UseGuards(SessionAuthGuard, AdminGuard)
  @Patch(':id')
  async update(@Param('id') id: string, @Body() dto: UpdateWorkDto) {
    return this.worksService.updateWork(id, dto);
  }

  @UseGuards(SessionAuthGuard, AdminGuard)
  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@Param('id') id: string) {
    await this.worksService.deleteWork(id);
  }
}
