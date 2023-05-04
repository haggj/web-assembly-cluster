import {
  SubscribeMessage,
  WebSocketGateway,
  OnGatewayInit,
  OnGatewayConnection,
  OnGatewayDisconnect,
  WebSocketServer
} from '@nestjs/websockets';

interface JobDummy {
  id: number,
  data: string[]
}

export interface JobDefinitionDummy {
  name: string,
  path: string,
  jobs: JobDummy[]
}

@WebSocketGateway({
  cors: { origin: '*' },
  pingInterval: 120000,
  pingTimeout: 120000,
})
export class WsGatewayGateway {
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

  broadcastJobs(jodDefinition: JobDefinitionDummy) {
    let i: number = 0
    for (let c of this.allClients) {
      // TODO: getJob() here
      i = i + 1
      const jobDummy: JobDummy = {
        id: i,
        data: ['argA', 'argB', 'argC']
      }
      console.log(`send Job ${jobDummy.id} to ${c.id}`)
      c.emit('runwasm', JSON.stringify(jobDummy))
    }
  }

  @SubscribeMessage('resultwasm')
  handleResult(client: any, payload: any) {
    console.log(`Recieved Result from Client: ${client.id}\t Message: ${payload}`);
    // TODO: Hand result to Job Definition
    // TODO: If successful stop? Or just return 0 of next getJob() function

    // TODO: getJob() here
    const jobDummy: JobDummy = {
      id: 1,
      data: ['argA', 'argB', 'argC']
    }
    console.log(`send Job ${jobDummy.id} to ${client.id}`)
    client.emit('runwasm', jobDummy)
  }
}

