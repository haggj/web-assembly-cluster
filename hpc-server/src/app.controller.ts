import {Body, Controller, Delete, Get, Post, StreamableFile, Header} from '@nestjs/common';
import { AppService } from './app.service';
import { createReadStream } from 'fs';
import { join } from 'path';

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

  @Get('/main.wasm')
  @Header('Content-type', 'application/wasm')
  getWasm(): StreamableFile {
  let path = join(process.cwd(), 'main.wasm');
  const file = createReadStream(path);
  return new StreamableFile(file);
  }
}
