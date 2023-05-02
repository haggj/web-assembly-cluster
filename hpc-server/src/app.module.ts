import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { WsGatewayGateway } from './ws-gateway.gateway';

@Module({
  imports: [],
  controllers: [AppController],
  providers: [AppService, WsGatewayGateway],
})
export class AppModule {}
