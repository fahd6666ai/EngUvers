import { Module } from '@nestjs/common';
import { ExamsService } from './exams.service';
import { ExamsController } from './exams.controller';
import { ExamsAdminController } from './admin/exams-admin.controller';

@Module({
  controllers: [ExamsController, ExamsAdminController],
  providers: [ExamsService],
})
export class ExamsModule {}
