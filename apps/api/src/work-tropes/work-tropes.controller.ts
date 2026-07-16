import { Body, Controller, Get, Param, Post, Query, UseGuards } from '@nestjs/common';
import type { AuthenticatedUser } from '../auth/authenticated-user';
import { CurrentUser } from '../auth/decorator/current-user.decorator';
import { SessionAuthGuard } from '../auth/session-auth.guard';
import { PaginationQueryDto } from '../common/pagination-query.dto';
import { AddTropeToWorkDto } from './work-tropes.dto';
import { WorkTropesService } from './work-tropes.service';

@Controller('works')
export class WorkTropesController {
  constructor(private readonly workTropesService: WorkTropesService) {}

  @Get(':id/tropes')
  async findTropes(@Param('id') id: string, @Query() query: PaginationQueryDto) {
    return this.workTropesService.tropesOfWork(id, { skip: query.skip, take: query.take ?? 100 });
  }

  @UseGuards(SessionAuthGuard)
  @Post(':id/tropes')
  async addTrope(
    @Param('id') id: string,
    @Body() dto: AddTropeToWorkDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.workTropesService.linkTropeToWork(id, dto.tropeId, user.userId);
  }
}
