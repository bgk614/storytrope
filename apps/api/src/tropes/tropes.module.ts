import { Module } from '@nestjs/common';
import { TropesController } from './tropes.controller';
import { TropesService } from './tropes.service';

@Module({
  controllers: [TropesController],
  providers: [TropesService],
})
export class TropesModule {}
