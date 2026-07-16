import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { WorkTropesModule } from '../work-tropes/work-tropes.module';
import { TropesController } from './tropes.controller';
import { TropesService } from './tropes.service';

@Module({
  imports: [AuthModule, WorkTropesModule],
  controllers: [TropesController],
  providers: [TropesService],
})
export class TropesModule {}
