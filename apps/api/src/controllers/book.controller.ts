import {
  Controller,
  Get,
  NotFoundException,
  Param,
  Query,
} from '@nestjs/common';
import { WorkService } from '../services/work.service';

@Controller('books')
export class BookController {
  constructor(private readonly workService: WorkService) {}

  @Get()
  async findAll(
    @Query('skip') skip?: string,
    @Query('take') take?: string,
  ) {
    return this.workService.works({
      skip: skip ? Number(skip) : undefined,
      take: take ? Number(take) : 20,
    });
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    const work = await this.workService.work({ id });
    if (!work) {
      throw new NotFoundException(`Book ${id} not found`);
    }
    return work;
  }
}
