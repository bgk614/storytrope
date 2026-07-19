import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { AdminWorkTropesController } from './admin-work-tropes.controller';
import { WorkTropesController } from './work-tropes.controller';
import { WorkTropesService } from './work-tropes.service';

@Module({
  imports: [AuthModule],
  controllers: [WorkTropesController, AdminWorkTropesController],
  providers: [WorkTropesService],
  exports: [WorkTropesService],
})
export class WorkTropesModule {}
