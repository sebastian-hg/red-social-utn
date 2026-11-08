import { Controller, Get } from '@nestjs/common';

@Controller()
export class AppController {
  @Get('health')
  health() {
    return {
      estado: 'ok',
      servicio: 'arena-back',
      fecha: new Date().toISOString(),
    };
  }
}
