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
import { CreateTropeDto } from '../dtos/trope.dto';
import { AddBookToTropeDto } from '../dtos/work-trope.dto';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import { TropeService } from '../services/trope.service';
import { WorkTropeService } from '../services/work-trope.service';
import type { AuthenticatedUser } from '../strategies/jwt.strategy';

@Controller('tropes')
export class TropeController {
  constructor(
    private readonly tropeService: TropeService,
    private readonly workTropeService: WorkTropeService,
  ) {}

  @Post()
  async create(@Body() dto: CreateTropeDto) {
    return this.tropeService.createTrope(dto);
  }

  @Get()
  async findAll(@Query('topLevelOnly') topLevelOnly?: string) {
    return this.tropeService.tropes({ topLevelOnly: topLevelOnly === 'true' });
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    const trope = await this.tropeService.trope({ id });
    if (!trope) {
      throw new NotFoundException(`Trope ${id} not found`);
    }
    return trope;
  }

  @Get(':id/books')
  async findBooks(@Param('id') id: string) {
    return this.workTropeService.worksOfTrope(id);
  }

  @UseGuards(JwtAuthGuard)
  @Post(':id/books')
  async addBook(
    @Param('id') id: string,
    @Body() dto: AddBookToTropeDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.workTropeService.linkTropeToWork(dto.workId, id, user.userId);
  }
}
