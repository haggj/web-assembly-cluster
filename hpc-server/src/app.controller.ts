import {Body, Controller, Delete, Get, Post} from '@nestjs/common';
import { AppService } from './app.service';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get('/hello-world')
  getHello(): string {
    return this.appService.getHello();
  }

  @Get('/jobs')
  getJobs(): string[] {
    return ['Hash-Cracker', 'Job #2', 'Prime calculator', '...']
  }

  @Post('/jobs')
  runJob(@Body() data): string {
    return `Started Job ${data.job}`
  }

  @Delete('/jobs')
  stopJob(@Body() data): string {
    return `Stopped Job ${data.job}`
  }
}
