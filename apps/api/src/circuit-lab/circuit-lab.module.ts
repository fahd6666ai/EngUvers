import { Module } from '@nestjs/common';
import { CircuitLabService } from './circuit-lab.service';
import { CircuitLabController } from './circuit-lab.controller';
import { ISE_ANALYSIS_PROVIDER } from './ise-analysis/ise-analysis-provider.interface';
import { UnavailableIseAnalysisProvider } from './ise-analysis/unavailable-ise-analysis.provider';

@Module({
  controllers: [CircuitLabController],
  providers: [
    CircuitLabService,
    { provide: ISE_ANALYSIS_PROVIDER, useClass: UnavailableIseAnalysisProvider },
  ],
})
export class CircuitLabModule {}
