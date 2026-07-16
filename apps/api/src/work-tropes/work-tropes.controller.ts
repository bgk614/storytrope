import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import type { AuthenticatedUser } from '../auth/authenticated-user';
import { CurrentUser } from '../auth/decorator/current-user.decorator';
import { SessionAuthGuard } from '../auth/session-auth.guard';
import { AddTropeToWorkDto } from './work-tropes.dto';
import { WorkTropesService } from './work-tropes.service';

@Controller('works')
export class WorkTropesController {
  constructor(private readonly workTropesService: WorkTropesService) {}

  @Get(':id/tropes')
  async findTropes(@Param('id') id: string) {
    return this.workTropesService.tropesOfWork(id);
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
