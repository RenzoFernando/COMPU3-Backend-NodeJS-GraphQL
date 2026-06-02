import { Controller, Get } from '@nestjs/common';
import { HealthStatus } from './dto/health-status.object';
import { HealthService } from './health.service';

@Controller('health')
export class HealthController {
  constructor(private readonly healthService: HealthService) {}

  @Get()
  getStatus(): HealthStatus {
    return this.healthService.getStatus();
  }
}
