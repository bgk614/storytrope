import {
  Body,
  Controller,
  Get,
  NotFoundException,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { CurrentUser } from '../decorators/current-user.decorator';
import { CreateTropeDto } from '../dtos/trope.dto';
import { AddBookToTropeDto } from '../dtos/work-trope.dto';
import { SetParentDto } from '../dtos/set-parent.dto';
import { VoteDto } from '../dtos/vote.dto';
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

  @UseGuards(JwtAuthGuard)
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

  @Get(':id/children')
  async findChildren(@Param('id') id: string) {
    return this.tropeService.children(id);
  }

  @UseGuards(JwtAuthGuard)
  @Patch(':id/parent')
  async setParent(@Param('id') id: string, @Body() dto: SetParentDto) {
    return this.tropeService.setParent(id, dto.parentId);
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

  @UseGuards(JwtAuthGuard)
  @Post(':id/like')
  async like(@Param('id') id: string, @CurrentUser() user: AuthenticatedUser) {
    return this.tropeService.toggleLike(id, user.userId);
  }

  @UseGuards(JwtAuthGuard)
  @Post(':id/books/:bookId/vote')
  async vote(
    @Param('id') id: string,
    @Param('bookId') bookId: string,
    @Body() dto: VoteDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.workTropeService.vote(bookId, id, user.userId, dto.voteType);
  }
}
