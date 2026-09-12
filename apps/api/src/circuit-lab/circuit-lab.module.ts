import { Module } from '@nestjs/common';
import { CircuitLabService } from './circuit-lab.service';
import { CircuitLabController } from './circuit-lab.controller';

@Module({
  controllers: [CircuitLabController],
  providers: [CircuitLabService],
})
export class CircuitLabModule {}
