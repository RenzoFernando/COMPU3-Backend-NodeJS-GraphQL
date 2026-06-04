import { Controller, Get } from '@nestjs/common';

@Controller('health')
export class HealthController {
  @Get()
  getHealth() {
    return {
      ok: true,
      status: 'ok',
      message: 'COMPU3 GraphQL API running',
    };
  }
}
