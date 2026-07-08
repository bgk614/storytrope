import {
  Body,
  Controller,
  Get,
  NotFoundException,
  Param,
  Post,
  Query,
} from '@nestjs/common';
import { CreateTropeDto } from '../dtos/trope.dto';
import { TropeService } from '../services/trope.service';

@Controller('tropes')
export class TropeController {
  constructor(private readonly tropeService: TropeService) {}

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
}
