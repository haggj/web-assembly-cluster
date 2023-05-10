import {Body, Controller, Delete, Get, Post, StreamableFile, Header, Param} from '@nestjs/common';
import { AppService } from './app.service';
import { createReadStream } from 'fs';
import { join, resolve } from 'path';
import {WsGatewayGateway} from "./ws-gateway.gateway";

@Controller({
  path: '/api',
})
export class AppController {
  constructor(private readonly appService: AppService, private readonly appGateway: WsGatewayGateway) {}

  @Get('/hello-world')
  getHello(): string {
    return this.appService.getHello();
  }

  @Get('/jobs')
  getJobs(): any[] {
    //return this.appService.getJobs();
    return this.appService.getJobsInfo();
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
    return this.appService.stopJob(params.name)
  }

  @Post('/reset')
  resetJob(@Body() data): string {
    if (this.appService.resetJob(data.job)) {
      return `Reset Job ${data.job}`
    }
    return `ERROR: Job ${data.job} was not found!`
  }

  @Delete('/jobs/delete/:name')
  deleteJob(@Param() params: any): boolean {
    return this.appService.deleteJob(params.name)
  }

  @Post('/jobs/new')
  createNewJob(@Body() data) {
    this.appService.createNewJob(data)
  }

  @Header('Content-type', 'application/wasm')
  @Get('wasm/:file')
  getWasm(@Param('file') file): StreamableFile{
  let path = join(process.cwd(), 'wasm/' + file);
  const data = createReadStream(path);
  return new StreamableFile(data);
  }
}
