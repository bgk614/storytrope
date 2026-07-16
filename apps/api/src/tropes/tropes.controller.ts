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
import type { AuthenticatedUser } from '../auth/authenticated-user';
import { CurrentUser } from '../auth/decorator/current-user.decorator';
import { SessionAuthGuard } from '../auth/session-auth.guard';
import { VoteDto } from '../dtos/vote.dto';
import { AddWorkToTropeDto } from '../work-tropes/work-tropes.dto';
import { WorkTropesService } from '../work-tropes/work-tropes.service';
import { CreateTropeDto } from './dtos/create-trope.dto';
import { SetParentDto } from './dtos/set-parent.dto';
import { TropeService } from './tropes.service';

@Controller('tropes')
export class TropeController {
  constructor(
    private readonly tropeService: TropeService,
    private readonly workTropeService: WorkTropesService,
  ) {}

  @UseGuards(SessionAuthGuard)
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

  @Get(':id/works')
  async findWorks(@Param('id') id: string) {
    return this.workTropeService.worksOfTrope(id);
  }

  @Get(':id/children')
  async findChildren(@Param('id') id: string) {
    return this.tropeService.children(id);
  }

  @UseGuards(SessionAuthGuard)
  @Patch(':id/parent')
  async setParent(@Param('id') id: string, @Body() dto: SetParentDto) {
    return this.tropeService.setParent(id, dto.parentId);
  }

  @UseGuards(SessionAuthGuard)
  @Post(':id/works')
  async addWork(
    @Param('id') id: string,
    @Body() dto: AddWorkToTropeDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.workTropeService.linkTropeToWork(dto.workId, id, user.userId);
  }

  @UseGuards(SessionAuthGuard)
  @Post(':id/like')
  async like(@Param('id') id: string, @CurrentUser() user: AuthenticatedUser) {
    return this.tropeService.toggleLike(id, user.userId);
  }

  @UseGuards(SessionAuthGuard)
  @Post(':id/works/:workId/vote')
  async vote(
    @Param('id') id: string,
    @Param('workId') workId: string,
    @Body() dto: VoteDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.workTropeService.vote(workId, id, user.userId, dto.voteType);
  }
}
