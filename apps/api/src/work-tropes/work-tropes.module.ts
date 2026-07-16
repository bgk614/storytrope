import { Module } from '@nestjs/common';
import { WorkTropesController } from './work-tropes.controller';
import { WorkTropesService } from './work-tropes.service';

@Module({
  controllers: [WorkTropesController],
  providers: [WorkTropesService],
})
export class WorkTropesModule {}
