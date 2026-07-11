import {
  Body,
  Controller,
  Get,
  NotFoundException,
  Param,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { CurrentUser } from '../decorators/current-user.decorator';
import { ListBooksQueryDto } from '../dtos/book.dto';
import { AddTropeToBookDto } from '../dtos/work-trope.dto';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import { WorkService } from '../services/work.service';
import { WorkTropeService } from '../services/work-trope.service';
import type { AuthenticatedUser } from '../strategies/jwt.strategy';

@Controller('books')
export class BookController {
  constructor(
    private readonly workService: WorkService,
    private readonly workTropeService: WorkTropeService,
  ) {}

  @Get()
  async findAll(@Query() query: ListBooksQueryDto) {
    return this.workService.works({
      skip: query.skip,
      take: query.take ?? 20,
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

  @Get(':id/tropes')
  async findTropes(@Param('id') id: string) {
    return this.workTropeService.tropesOfWork(id);
  }

  @UseGuards(JwtAuthGuard)
  @Post(':id/tropes')
  async addTrope(
    @Param('id') id: string,
    @Body() dto: AddTropeToBookDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.workTropeService.linkTropeToWork(id, dto.tropeId, user.userId);
  }
}
