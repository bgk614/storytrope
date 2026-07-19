import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { IsEnum, IsOptional, IsString } from 'class-validator';
import { AdminGuard } from '../auth/admin.guard';
import { SessionAuthGuard } from '../auth/session-auth.guard';
import { WorkTropeSource } from '../../generated/prisma/client.js';
import { PaginationQueryDto } from '../common/pagination-query.dto';
import { WorkTropesService } from './work-tropes.service';

class ListWorkTropesQueryDto extends PaginationQueryDto {
  @IsOptional()
  @IsEnum(WorkTropeSource)
  source?: WorkTropeSource;

  @IsOptional()
  @IsString()
  workId?: string;
}

@Controller('admin/work-tropes')
@UseGuards(SessionAuthGuard, AdminGuard)
export class AdminWorkTropesController {
  constructor(private readonly workTropesService: WorkTropesService) {}

  @Get()
  async findAll(@Query() query: ListWorkTropesQueryDto) {
    return this.workTropesService.listAll({
      skip: query.skip,
      take: query.take ?? 50,
      source: query.source,
      workId: query.workId,
    });
  }
}
