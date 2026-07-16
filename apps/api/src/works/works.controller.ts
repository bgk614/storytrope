import { Controller, Get, NotFoundException, Param, Query } from '@nestjs/common';

import { ListWorksQueryDto } from './works.dto';
import { WorksService } from './works.service';

@Controller('works')
export class WorksController {
  constructor(private readonly worksService: WorksService) {}

  @Get()
  async findAll(@Query() query: ListWorksQueryDto) {
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
