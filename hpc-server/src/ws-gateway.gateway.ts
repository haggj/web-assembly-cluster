import {
  SubscribeMessage,
  WebSocketGateway,
  OnGatewayInit,
  OnGatewayConnection,
  OnGatewayDisconnect,
  WebSocketServer,
} from '@nestjs/websockets';
import {AppService} from "./app.service";

@WebSocketGateway({
  path: '/api/ws',
  cors: { origin: '*' },
  pingInterval: 120000,
  pingTimeout: 120000,
})
export class WsGatewayGateway {

  constructor(private readonly appService: AppService,) {
  }

  allWorkers = []
  allMasters = []


  handleDisconnect(client: any) {
    console.log(`Client disconnected: ${client.id}`);
    this.allWorkers = this.allWorkers.filter(c => c.id != client.id)
    this.allMasters = this.allMasters.filter(m => m.id != client.id)
    this.broadcastWorkers()
  }

  handleConnection(client: any, ...args: any[]) {
    console.log(`Client connected: ${client.id}`);
  }

  broadcastWorkers(){
    // Send currently connected workers to master nodes
    let data = this.allWorkers.map(c => {return {details: c.client_details, id: c.id}})
    for (let m of this.allMasters) {
      m.emit('clientInfo', data)
    }
  }

  broadcastWasm(path: string) {
    for (let c of this.allWorkers) {
      console.log(`broadcast to ${c.id}`)
      c.emit('loadwasm', path)
    }
  }

  broadcastJobs(jobDefinition: any) {
    for (let c of this.allWorkers) {
      const job = jobDefinition.getJob()
      console.log(`send Job ${job.id} to ${c.id}`)
      c.emit('runwasm', JSON.stringify(job))
    }
  }

  // Send next Job
  sendWasm(client: any) {
    const wasm = this.appService.getWasmPath()
    if (wasm) {
      console.log(`send Wasm Path ${wasm} to ${client.id}`)
      client.emit('loadwasm', wasm)
    }
  }

  // Send next Job
  sendJob(client: any) {
    const job = this.appService.getNextJob()
    if (job) {
      console.log(`send Job ${job.id} to ${client.id}`)
      client.emit('runwasm', job)
    }
    for (let m of this.allMasters) {
      m.emit('jobInfo', this.appService.getJobsInfo())
      //console.log(this.appService.getJobsInfo())
    }
  }

  @SubscribeMessage('resultwasm')
  handleResult(client: any, payload: any) {
    console.log(`Recieved Result from Client: ${client.id}\t Message: ${payload}`);
    // Push result to running JobDefinition (if not initializing result)
    if (Object.keys(payload).length !== 0) {
      this.appService.handleResult(payload)
    }

    this.sendJob(client)
  }

  @SubscribeMessage('isMasterSocket')
  addMaster(client: any, payload: any) {
    console.log(`Registered new master ${client.id}`);
    this.allMasters.push(client)
    this.broadcastWorkers()
  }

  @SubscribeMessage('isWorkerSocket')
  clientInfo(client: any, payload: any) {
    console.log(`Registered new worker ${client.id}`);
    client.client_details = payload
    this.allWorkers.push(client)
    this.broadcastWorkers()

    // send WASM to worker, if available
    // -> this will result in the client to take part in the currently running job
    this.sendWasm(client)
  }

}

