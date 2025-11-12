import { Module } from '@nestjs/common';
import { socketConnectionModel } from './socket-connection.entities';
import { SocketConnectionModelService } from './socket-connection.service';

@Module({
  imports: [socketConnectionModel],
  controllers: [],
  providers: [SocketConnectionModelService],
  exports: [socketConnectionModel, SocketConnectionModelService],
})
export class SocketConnectionModelsModule {}
