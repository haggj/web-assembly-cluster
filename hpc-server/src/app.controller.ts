import {Body, Controller, Delete, Get, Post, StreamableFile, Header, Param} from '@nestjs/common';
import { AppService } from './app.service';
import { createReadStream } from 'fs';
import { join, resolve } from 'path';
import {WsGatewayGateway} from "./ws-gateway.gateway";

@Controller()
export class AppController {
  constructor(private readonly appService: AppService, private readonly appGateway: WsGatewayGateway) {}

  @Get('/hello-world')
  getHello(): string {
    return this.appService.getHello();
  }

  @Get('/jobs')
  getJobs(): string[] {
    return this.appService.getJobs();
  }

  @Post('/jobs')
  runJob(@Body() data): string {
    const wasmPath = this.appService.runJob(data.job)
    if (wasmPath) {
      this.appGateway.broadcastWasm(wasmPath)
      //this.appGateway.broadcastJobs(this.appService.runningJob)
      return `Started Job ${data.job}`
    }
    return `ERROR: Job ${data.job} was not found!`
  }

  @Delete('/jobs/:name')
  stopJob(@Param() params: any): string {
    console.log('Stop job - controller')
    console.log(params.name)
    return this.appService.stopJob(params.name)
  }

  @Header('Content-type', 'application/wasm')
  @Get('wasm/:file')
  getWasm(@Param('file') file): StreamableFile{
  let path = join(process.cwd(), 'wasm/' + file);
  const data = createReadStream(path);
  return new StreamableFile(data);
  }
}
