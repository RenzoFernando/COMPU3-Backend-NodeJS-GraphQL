import { Injectable } from '@nestjs/common';
import { HealthStatus } from './dto/health-status.object';

@Injectable()
export class HealthService {
  getStatus(): HealthStatus {
    return {
      status: 'ok',
      message: 'COMPU3 GraphQL API is alive',
      timestamp: new Date(),
    };
  }
}
