import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { WsGatewayGateway } from "./ws-gateway.gateway";

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.enableCors({
    origin: '*',
  });
  const server = app.listen(3001);
  const wsGateway = app.get(WsGatewayGateway);
}
bootstrap();

