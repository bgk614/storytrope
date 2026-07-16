import { Controller, Get, NotFoundException, Param, Query } from '@nestjs/common';

import { PaginationQueryDto } from '../common/pagination-query.dto';
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
}
