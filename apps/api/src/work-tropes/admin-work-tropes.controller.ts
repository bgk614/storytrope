import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { IsEnum, IsOptional, IsString } from 'class-validator';
import { WorkTropeSource } from '../../generated/prisma/client.js';
import { AdminGuard } from '../auth/guards/admin.guard.js';
import { SessionAuthGuard } from '../auth/guards/session-auth.guard.js';
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
