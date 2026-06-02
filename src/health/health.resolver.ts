import { Query, Resolver } from '@nestjs/graphql';
import { HealthStatus } from './dto/health-status.object';
import { HealthService } from './health.service';

@Resolver(() => HealthStatus)
export class HealthResolver {
  constructor(private readonly healthService: HealthService) {}

  @Query(() => HealthStatus)
  health(): HealthStatus {
    return this.healthService.getStatus();
  }
}
