import { Controller, Get } from '@nestjs/common';

@Controller('health')
export class HealthController {
  @Get()
  getHealth() {
    return {
      ok: true,
      message: 'COMPU3 GraphQL API running',
    };
  }
}
