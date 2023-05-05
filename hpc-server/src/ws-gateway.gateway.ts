import {
  SubscribeMessage,
  WebSocketGateway,
  OnGatewayInit,
  OnGatewayConnection,
  OnGatewayDisconnect,
  WebSocketServer
} from '@nestjs/websockets';
import {AppService} from "./app.service";

@WebSocketGateway({
  cors: { origin: '*' },
  pingInterval: 120000,
  pingTimeout: 120000,
})
export class WsGatewayGateway {

  constructor(private readonly appService: AppService,) {
  }

  allClients = []

  @SubscribeMessage('message')
  handleMessage(client: any, payload: any): string {
    console.log(`Recieved Message from Client: ${client.id}\t Message: ${payload}`);
    return 'Hello world!';
  }

  handleDisconnect(client: any) {
    console.log(`Client disconnected: ${client.id}`);
    this.allClients = this.allClients.filter(c => c.id != client.id)
  }

  handleConnection(client: any, ...args: any[]) {
    console.log(`Client connected: ${client.id}`);
    this.allClients.push(client)
    client.emit('message', `A new client ${client.id} has connected`);
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

  @SubscribeMessage('resultwasm')
  handleResult(client: any, payload: any) {
    console.log(`Recieved Result from Client: ${client.id}\t Message: ${payload}`);
    // Push result to running JobDefinition (if not initializing result)
    if (Object.keys(payload).length !== 0) {
      this.appService.handleResult(payload)
    }

    // Send next Job
    const job = this.appService.getNextJob()
    if (job) {
      console.log(`send Job ${job.id} to ${client.id}`)
      client.emit('runwasm', job)
    }
  }
}

