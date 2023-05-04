import { Body, Controller, Delete, Get, Post, StreamableFile, Header } from '@nestjs/common';
import { AppService } from './app.service';
import { createReadStream } from 'fs';
import { join } from 'path';
import {JobDefinitionDummy, WsGatewayGateway} from "./ws-gateway.gateway";

@Controller()
export class AppController {
  constructor(private readonly appService: AppService, private readonly appGateway: WsGatewayGateway) {}

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
    console.log(`Start Job ${data.job}...`)
    // TODO: Get suitable JobDefiniton Object
    const jobDefiniton: JobDefinitionDummy = {
      name: data.job,
      path: data.job,
      jobs: []
    }

    this.appGateway.broadcastWasm(jobDefiniton.path)
    this.appGateway.broadcastJobs(jobDefiniton)
    return `Started Job ${data.job}`
  }

  @Delete('/jobs')
  stopJob(@Body() data): string {
    console.log(`Stop Job ${data.job}...`)
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
