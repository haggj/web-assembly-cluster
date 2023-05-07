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

  allClients = []
  allWorkers = []
  allMasters = []

  @SubscribeMessage('message')
  handleMessage(client: any, payload: any): string {
    console.log(`Recieved Message from Client: ${client.id}\t Message: ${payload}`);
    return 'Hello world!';
  }

  handleDisconnect(client: any) {
    console.log(`Client disconnected: ${client.id}`);
    this.allClients = this.allClients.filter(c => c.id != client.id)
    this.allMasters = this.allMasters.filter(m => m.id != client.id)

    for (let cl of this.allClients) {
      //console.log('Client: ' + JSON.stringify(cl.id))
      if (this.allMasters.filter(m => m.id == cl.id).length > 0) {
        this.allClients = this.allClients.filter(c => c.id != cl.id)
        console.log('Master: ' + JSON.stringify(cl.id))
      }
      else {
        console.log('Client: ' + JSON.stringify(cl.id))
      }
    }

    for (let m of this.allMasters) {
      m.emit('clientInfo', this.returnAllClientIDs())
    }
  }

  handleConnection(client: any, ...args: any[]) {
    console.log(`Client connected: ${client.id}`);
    this.allClients.push(client)
    client.emit('message', `A new client ${client.id} has connected`);

    for (let cl of this.allClients) {
      //console.log('Client: ' + JSON.stringify(cl.id))
      if (this.allMasters.filter(m => m.id == cl.id).length > 0) {
        this.allClients = this.allClients.filter(c => c.id != cl.id)
        console.log('Master: ' + JSON.stringify(cl.id))
      }
      else {
        console.log('Client: ' + JSON.stringify(cl.id))
      }
    }

    // send client ID to masters
    for (let m of this.allMasters) {
      m.emit('clientInfo', this.returnAllClientIDs())
    }

    // send WASM to client, if available
    // -> this will result in the client to take part in the currently running job
    this.sendWasm(client)
  }

  returnAllClientIDs() {
    this.allWorkers = this.allClients.filter(c => !this.allMasters.includes(c))
    for (let w of this.allWorkers) {
      console.log('Worker: ' + JSON.stringify(w.id))
    }
    return this.allWorkers.map(c => c.id)
  }

  broadcastWasm(path: string) {
    for (let c of this.allClients) {
      console.log(`broadcast to ${c.id}`)
      c.emit('loadwasm', path)
    }
  }

  broadcastJobs(jobDefinition: any) {
    for (let c of this.allClients) {
      const job = jobDefinition.getJob()
      console.log(`send Job ${job.id} to ${c.id}`)
      c.emit('runwasm', JSON.stringify(job))
    }
  }

  // Send next Job
  sendWasm(client: any): boolean {
    const wasm = this.appService.getWasmPath()
    if (wasm) {
      console.log(`send Wasm Path ${wasm} to ${client.id}`)
      client.emit('loadwasm', wasm)
      return true
    }
    return false
  }

  // Send next Job
  sendJob(client: any): boolean {
    const job = this.appService.getNextJob()
    if (job) {
      console.log(`send Job ${job.id} to ${client.id}`)
      client.emit('runwasm', job)
      for (let m of this.allMasters) {
        m.emit('jobInfo', this.appService.getJobsInfo())
      }
      return true
    }
    return false
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
    console.log(`Recieved Message from Client: ${client.id}\t Message: ${payload}`);
    this.allMasters.push(client)
    // remove master from clients
    this.allClients = this.allClients.filter(c => c.id != client.id)
    for (let m of this.allMasters) {
      m.emit('clientInfo', this.returnAllClientIDs())
    }
  }
}

